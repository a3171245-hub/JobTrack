'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { analyzeEmail } from '@/lib/gemini'
import type { ApplicationStatus } from '@/types/database'

const FREE_ACTIVE_LIMIT = 5
const RETROACTIVE_LIMIT = 10    // max past emails to re-analyze
const ANALYSIS_INTERVAL_MS = 600 // rate-limit delay between Groq calls

function extractSenderDomain(from: string): string {
  const addr = (from.match(/<([^>]+)>/) ?? [])[1] ?? from
  return addr.trim().split('@')[1]?.toLowerCase() ?? ''
}

function mapToApplicationStatus(aiStatus: string, emailType: string): ApplicationStatus {
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

type TrackResult =
  | { ok: true; companyName: string; retroCount: number }
  | { limitReached: true }
  | { error: string }

export async function trackCompany(emailLogId: string): Promise<TrackResult> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const supabase = createAdminClient()

  // Fetch the email log to track.
  // select('*') is safe even when 'sender' column doesn't exist yet:
  // PostgREST simply omits missing columns, so emailLog.sender is undefined → '' fallback.
  const { data: emailLog } = await supabase
    .from('email_logs')
    .select('*')
    .eq('id', emailLogId)
    .eq('user_id', user.id)
    .single()

  if (!emailLog) return { error: 'not_found' }
  if (emailLog.application_id) return { error: 'already_tracked' }

  // Check free plan active limit
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile?.plan ?? 'free') === 'free') {
    const { count } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
    if ((count ?? 0) >= FREE_ACTIVE_LIMIT) return { limitReached: true }
  }

  // AI-analyze the clicked email
  let analysis
  try {
    analysis = await analyzeEmail(
      emailLog.subject ?? '',
      emailLog.body_text ?? '',
      emailLog.sender ?? ''
    )
  } catch (err) {
    console.error('[trackCompany] AI analysis failed:', err)
    return { error: 'analysis_failed' }
  }

  // Before migration 014 is applied, emailLog.sender is undefined at runtime → '' → no retroactive.
  const senderDomain = extractSenderDomain(emailLog.sender ?? '')
  const companyName = (
    typeof analysis.company_name === 'string' && analysis.company_name.trim()
      ? analysis.company_name.trim()
      : (emailLog.subject ?? '').slice(0, 100)
  )
  const appStatus = mapToApplicationStatus(analysis.status, analysis.email_type)

  // Create application (omit columns that may not exist yet; set them in a follow-up UPDATE)
  const { data: newApp, error: insertError } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company_name: companyName,
      status: appStatus,
      latest_email_subject: emailLog.subject,
      interview_date: analysis.interview_date ?? null,
      event_date: analysis.event_date ?? null,
    })
    .select('id')
    .single()

  if (insertError || !newApp) return { error: 'insert_failed' }

  // Set columns that require migration 014/013; errors ignored — no-op if columns don't exist yet
  await supabase
    .from('applications')
    .update({
      ...(senderDomain ? { sender_domain: senderDomain } : {}),
      updated_by: 'ai',
    })
    .eq('id', newApp.id)

  // Link the clicked email log to the new application
  await supabase
    .from('email_logs')
    .update({
      application_id: newApp.id,
      email_type: analysis.email_type as 'selection' | 'event' | 'other',
    })
    .eq('id', emailLogId)

  if (!senderDomain) {
    return { ok: true, companyName, retroCount: 0 }
  }

  // Find other untracked emails from the same sender domain (retroactive)
  const { data: untrackedLogs } = await supabase
    .from('email_logs')
    .select('id, subject, body_text, sender')
    .eq('user_id', user.id)
    .is('application_id', null)
    .ilike('sender', `%@${senderDomain}`)
    .neq('id', emailLogId)
    .order('received_at', { ascending: true })
    .limit(RETROACTIVE_LIMIT)

  if (!untrackedLogs || untrackedLogs.length === 0) {
    return { ok: true, companyName, retroCount: 0 }
  }

  // Re-analyze past emails with rate limiting
  let latestStatus: ApplicationStatus = appStatus
  let latestSubject: string | null = emailLog.subject ?? null
  let latestInterviewDate: string | null = analysis.interview_date ?? null
  let latestEventDate: string | null = analysis.event_date ?? null
  let retroCount = 0

  for (const log of untrackedLogs) {
    await new Promise((r) => setTimeout(r, ANALYSIS_INTERVAL_MS))
    try {
      const a = await analyzeEmail(
        log.subject ?? '',
        log.body_text ?? '',
        log.sender ?? ''
      )
      const s = mapToApplicationStatus(a.status, a.email_type)

      await supabase
        .from('email_logs')
        .update({
          application_id: newApp.id,
          email_type: a.email_type as 'selection' | 'event' | 'other',
        })
        .eq('id', log.id)

      latestStatus = s
      latestSubject = log.subject ?? latestSubject
      if (a.interview_date) latestInterviewDate = a.interview_date
      if (a.event_date) latestEventDate = a.event_date
      retroCount++
    } catch {
      // Link even if analysis fails
      await supabase
        .from('email_logs')
        .update({ application_id: newApp.id })
        .eq('id', log.id)
      retroCount++
    }
  }

  // Update application with latest aggregated state
  await supabase
    .from('applications')
    .update({
      status: latestStatus,
      latest_email_subject: latestSubject,
      ...(latestInterviewDate ? { interview_date: latestInterviewDate } : {}),
      ...(latestEventDate ? { event_date: latestEventDate } : {}),
    })
    .eq('id', newApp.id)

  return { ok: true, companyName, retroCount }
}
