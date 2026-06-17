import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { analyzeEmail } from '@/lib/gemini'
import type { ApplicationStatus } from '@/types/database'

export const maxDuration = 60
import type { Database } from '@/types/database'

function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): boolean {
  const value = timestamp + token
  const hmac = crypto
    .createHmac('sha256', signingKey)
    .update(value)
    .digest('hex')
  if (Buffer.byteLength(hmac) !== Buffer.byteLength(signature)) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
  } catch {
    return false
  }
}

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

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const timestamp = formData.get('timestamp') as string
  const token = formData.get('token') as string
  const signature = formData.get('signature') as string
  const signingKey = process.env.MAILGUN_SIGNING_KEY!

  if (!signingKey || !verifyMailgunSignature(signingKey, timestamp, token, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const tsNum = parseInt(timestamp, 10)
  if (!tsNum || Math.abs(Date.now() / 1000 - tsNum) > 300) {
    return NextResponse.json({ error: 'Request expired' }, { status: 401 })
  }

  const recipient = formData.get('recipient') as string
  const sender = formData.get('sender') as string
  const subject = formData.get('subject') as string
  const bodyPlain = (formData.get('body-plain') as string) ?? ''

  if (!recipient) {
    return NextResponse.json({ error: 'No recipient' }, { status: 400 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('dedicated_email', recipient.toLowerCase())
    .single()

  if (!user) {
    return NextResponse.json({ message: 'User not found, ignored' })
  }

  const senderDomain = extractSenderDomain(sender ?? '')

  // Check if sender domain is tracked
  const { data: trackedApp } = senderDomain
    ? await supabase
        .from('applications')
        .select('id, company_name, status')
        .eq('user_id', user.id)
        .eq('sender_domain', senderDomain)
        .maybeSingle()
    : { data: null }

  if (!trackedApp) {
    // Untracked → save without AI
    const { data: log } = await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        subject,
        body_text: bodyPlain.slice(0, 10000),
        email_type: 'other',
      })
      .select('id')
      .single()
    return NextResponse.json({ message: 'Saved untracked', log_id: log?.id })
  }

  // Tracked → AI analysis
  let analysis
  try {
    analysis = await analyzeEmail(subject, bodyPlain, sender ?? '')
  } catch (err) {
    console.error('Groq analysis failed:', err)
    await supabase.from('email_logs').insert({
      user_id: user.id,
      application_id: trackedApp.id,
      subject,
      body_text: bodyPlain.slice(0, 10000),
      email_type: 'other',
    })
    return NextResponse.json({ message: 'Saved without analysis', company: trackedApp.company_name })
  }

  const appStatus = mapToApplicationStatus(analysis.status, analysis.email_type)

  // Core update: status + dates (no updated_by — column may not exist yet)
  await supabase
    .from('applications')
    .update({
      status: appStatus,
      latest_email_subject: subject,
      ...(analysis.interview_date && { interview_date: analysis.interview_date }),
      ...(analysis.event_date && { event_date: analysis.event_date }),
    })
    .eq('id', trackedApp.id)

  // Optional: mark as AI-updated; no-op if updated_by column doesn't exist yet
  await supabase
    .from('applications')
    .update({ updated_by: 'ai' })
    .eq('id', trackedApp.id)

  await supabase.from('email_logs').insert({
    user_id: user.id,
    application_id: trackedApp.id,
    subject,
    body_text: bodyPlain.slice(0, 10000),
    email_type: analysis.email_type,
  })

  if (appStatus !== trackedApp.status) {
    await supabase.from('email_logs').insert({
      user_id: user.id,
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

  return NextResponse.json({ message: 'OK', company: trackedApp.company_name, status: appStatus })
}
