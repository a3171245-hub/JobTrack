import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeEmail } from '@/lib/gemini'
import type { ApplicationStatus } from '@/types/database'

export const maxDuration = 60

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

export async function POST(request: NextRequest) {
  // Verify shared secret
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.JOBTRACK_API_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { to?: string; from?: string; subject?: string; body?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, from, subject, body: emailBody } = body
  if (!to || !from || !subject) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Strip display name: "Name <addr@domain>" → "addr@domain"
  const toAddress = (to.match(/<([^>]+)>/) ?? [, to])[1]!.toLowerCase().trim()
  console.log('[email/inbound] searching dedicated_email:', toAddress)

  // Use .eq() (not .ilike()) — email addresses with @ can confuse PostgREST URL parsing
  const { data: userRecord, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('dedicated_email', toAddress)
    .maybeSingle()

  console.log('[email/inbound] userRecord:', userRecord, 'lookupError:', lookupError)

  if (lookupError) {
    console.error('[email/inbound] user lookup failed:', lookupError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!userRecord) {
    console.warn('[email/inbound] no user found for dedicated_email:', toAddress)
    return NextResponse.json({ ok: true, skipped: 'unknown_recipient' })
  }

  const userId = userRecord.id
  const bodyText = emailBody ?? ''

  // Analyze with Gemini
  let analysis
  try {
    analysis = await analyzeEmail(subject, bodyText, from)
  } catch (err) {
    console.error('[email/inbound] Gemini analysis failed:', err)
    await supabase.from('email_logs').insert({
      user_id: userId,
      subject,
      body_text: bodyText.slice(0, 10000),
      email_type: 'other' as const,
    })
    return NextResponse.json({ ok: true, processed: false })
  }

  const appStatus = mapToApplicationStatus(analysis.status, analysis.email_type)

  // Upsert application (match by user_id + company_name)
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', userId)
    .eq('company_name', analysis.company_name)
    .maybeSingle()

  let applicationId: string

  if (existingApp) {
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
        company_name: analysis.company_name,
        status: appStatus,
        latest_email_subject: subject,
        interview_date: analysis.interview_date ?? null,
        event_date: analysis.event_date ?? null,
      })
      .select('id')
      .single()

    if (insertError || !newApp) {
      console.error('[email/inbound] application insert failed:', insertError)
      await supabase.from('email_logs').insert({
        user_id: userId,
        subject,
        body_text: bodyText.slice(0, 10000),
        email_type: analysis.email_type as 'selection' | 'event' | 'other',
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
    email_type: analysis.email_type as 'selection' | 'event' | 'other',
  })

  return NextResponse.json({ ok: true, processed: true })
}
