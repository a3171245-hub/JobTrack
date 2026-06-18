import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeEmail } from '@/lib/gemini'
import { sanitizeCandidates, toISODateOrNull } from '@/lib/interview-dates'
import { findGroupApps, findOrCreateSiblingProcess } from '@/lib/process-routing'
import { inboundEmailSchema, parseBody } from '@/lib/validate'
import type { ApplicationStatus, ProcessType } from '@/types/database'

export const maxDuration = 60

// ─── IP-based rate limiter (in-memory, per function instance) ─────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ─── Timing-safe Bearer token verification ────────────────────────────
function verifyBearer(authHeader: string, secret: string): boolean {
  const expected = `Bearer ${secret}`
  if (Buffer.byteLength(authHeader) !== Buffer.byteLength(expected)) return false
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  } catch {
    return false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────
function extractSenderDomain(from: string): string {
  const addr = (from.match(/<([^>]+)>/) ?? [])[1] ?? from
  return addr.trim().split('@')[1]?.toLowerCase() ?? ''
}

function mapToApplicationStatus(
  aiStatus: string,
  emailType: string
): ApplicationStatus {
  if (emailType === 'event') return 'event'
  const map: Record<string, ApplicationStatus> = {
    offer: 'offer',
    rejected: 'rejected',
    interview_1: 'interview_1',
    interview_2: 'interview_2',
    final: 'final',
    document: 'document',
    schedule: 'applied',
    unknown: 'applied',
  }
  return map[aiStatus] ?? 'applied'
}

// ─── Handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Rate limit
  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // 2. Timing-safe Bearer token verification
  const authHeader = request.headers.get('authorization') ?? ''
  const secret = process.env.JOBTRACK_API_SECRET
  if (!secret || !verifyBearer(authHeader, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse and validate body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = parseBody(inboundEmailSchema, rawBody)
  if (!validation.ok) return validation.response

  const { to, from, subject, body: emailBody } = validation.data

  const supabase = createAdminClient()

  const rawTo = to
  const toAddress = (rawTo.match(/<([^>]+)>/) ?? [, rawTo])[1]?.toLowerCase().trim() ?? ''
  console.log('[email/inbound] to (raw):', rawTo, '→ toAddress:', toAddress)

  if (!toAddress) {
    console.warn('[email/inbound] could not extract address from to field')
    return NextResponse.json({ ok: true, skipped: 'invalid_to' })
  }

  const { data: userRecord, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('dedicated_email', toAddress)
    .maybeSingle()

  if (lookupError) {
    console.error('[email/inbound] user lookup failed:', lookupError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!userRecord?.id) {
    console.warn('[email/inbound] no user found for dedicated_email:', toAddress)
    return NextResponse.json({ ok: true, skipped: 'unknown_recipient' })
  }

  const userId = userRecord.id
  const bodyText = emailBody
  const senderDomain = extractSenderDomain(from)

  // 4. Check if sender domain matches any tracked process for this company
  const group = senderDomain ? await findGroupApps(supabase, userId, senderDomain) : []

  if (group.length === 0) {
    // Untracked sender → save without AI analysis (tokens saved)
    console.log('[email/inbound] untracked sender domain:', senderDomain, '— saving without AI')
    await supabase.from('email_logs').insert({
      user_id: userId,
      subject,
      body_text: bodyText.slice(0, 10000),
      email_type: 'other' as const,
    })
    return NextResponse.json({ ok: true, processed: false, reason: 'untracked' })
  }

  // 5. Tracked application found → run AI analysis
  let analysis
  try {
    analysis = await analyzeEmail(subject, bodyText, from)
    console.log('[email/inbound] analysis:', JSON.stringify(analysis))
  } catch (err) {
    console.error('[email/inbound] AI analysis failed:', err)
    await supabase.from('email_logs').insert({
      user_id: userId,
      application_id: group[0].id,
      subject,
      body_text: bodyText.slice(0, 10000),
      email_type: 'other' as const,
    })
    return NextResponse.json({ ok: true, processed: false })
  }

  const appStatus = mapToApplicationStatus(
    analysis?.status ?? 'unknown',
    analysis?.email_type ?? 'other'
  )
  const processType: ProcessType = analysis?.process_type ?? 'other'

  const sibling = await findOrCreateSiblingProcess(
    supabase, userId, senderDomain, group[0].company_name, processType, group
  )
  const trackedApp = sibling
    ? { id: sibling.id, company_name: group[0].company_name, status: sibling.status }
    : group[0]

  const safeCandidates = sanitizeCandidates(analysis.interview_date_candidates)
  const safeInterviewDate = safeCandidates[0] ?? toISODateOrNull(analysis.interview_date)
  const safeEventDate = toISODateOrNull(analysis.event_date)

  try {
    // Core update: status + dates (no updated_by — column may not exist yet)
    await supabase
      .from('applications')
      .update({
        status: appStatus,
        latest_email_subject: subject,
        ...(safeInterviewDate ? { interview_date: safeInterviewDate } : {}),
        ...(safeEventDate ? { event_date: safeEventDate } : {}),
        ...(safeCandidates.length > 0
          ? { interview_date_candidates: safeCandidates, interview_date_confirmed: safeCandidates.length <= 1 }
          : {}),
      })
      .eq('id', trackedApp.id)

    // Optional: mark as AI-updated; no-op if updated_by column doesn't exist yet
    await supabase
      .from('applications')
      .update({ updated_by: 'ai' })
      .eq('id', trackedApp.id)

    await supabase.from('email_logs').insert({
      user_id: userId,
      application_id: trackedApp.id,
      subject,
      body_text: bodyText.slice(0, 10000),
      email_type: (analysis.email_type ?? 'other') as 'selection' | 'event' | 'other',
    })

    if (appStatus !== trackedApp.status) {
      await supabase.from('email_logs').insert({
        user_id: userId,
        application_id: trackedApp.id,
        subject: 'ステータス更新',
        body_text: JSON.stringify({
          company_name: trackedApp.company_name,
          from_status: trackedApp.status,
          to_status: appStatus,
        }),
        email_type: 'manual_update' as const,
      })
    }

    return NextResponse.json({ ok: true, processed: true })
  } catch (err) {
    console.error('[email/inbound] unexpected error during DB write:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
