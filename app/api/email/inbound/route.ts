import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeEmail } from '@/lib/gemini'
import { inboundEmailSchema, parseBody } from '@/lib/validate'
import type { ApplicationStatus } from '@/types/database'

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
  // timingSafeEqual requires equal-length buffers
  if (Buffer.byteLength(authHeader) !== Buffer.byteLength(expected)) return false
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  } catch {
    return false
  }
}

// ─── Status mapper ────────────────────────────────────────────────────
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

  // Extract address from "Name <addr@domain>" or plain "addr@domain"
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

  let analysis
  try {
    analysis = await analyzeEmail(subject, bodyText, from)
    console.log('[email/inbound] analysis:', JSON.stringify(analysis))
  } catch (err) {
    console.error('[email/inbound] AI analysis failed:', err)
    await supabase.from('email_logs').insert({
      user_id: userId,
      subject,
      body_text: bodyText.slice(0, 10000),
      email_type: 'other' as const,
    })
    return NextResponse.json({ ok: true, processed: false })
  }

  const companyName =
    typeof analysis?.company_name === 'string' && analysis.company_name.trim()
      ? analysis.company_name.trim()
      : subject.slice(0, 100)

  const appStatus = mapToApplicationStatus(
    analysis?.status ?? 'unknown',
    analysis?.email_type ?? 'other'
  )

  try {
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('company_name', companyName)
      .maybeSingle()

    let applicationId: string

    if (existingApp?.id) {
      await supabase
        .from('applications')
        .update({
          status: appStatus,
          latest_email_subject: subject,
          ...(analysis.interview_date ? { interview_date: analysis.interview_date } : {}),
          ...(analysis.event_date ? { event_date: analysis.event_date } : {}),
        })
        .eq('id', existingApp.id)
      applicationId = existingApp.id
    } else {
      const { data: newApp, error: insertError } = await supabase
        .from('applications')
        .insert({
          user_id: userId,
          company_name: companyName,
          status: appStatus,
          latest_email_subject: subject,
          interview_date: analysis.interview_date ?? null,
          event_date: analysis.event_date ?? null,
        })
        .select('id')
        .single()

      if (insertError || !newApp?.id) {
        console.error('[email/inbound] application insert failed:', insertError)
        await supabase.from('email_logs').insert({
          user_id: userId,
          subject,
          body_text: bodyText.slice(0, 10000),
          email_type: (analysis.email_type ?? 'other') as 'selection' | 'event' | 'other',
        })
        return NextResponse.json({ ok: true, processed: false })
      }

      applicationId = newApp.id
    }

    await supabase.from('email_logs').insert({
      user_id: userId,
      application_id: applicationId,
      subject,
      body_text: bodyText.slice(0, 10000),
      email_type: (analysis.email_type ?? 'other') as 'selection' | 'event' | 'other',
    })

    return NextResponse.json({ ok: true, processed: true })
  } catch (err) {
    console.error('[email/inbound] unexpected error during DB write:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
