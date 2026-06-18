'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { analyzeEmail } from '@/lib/gemini'
import { toISODateOrNull, sanitizeCandidates } from '@/lib/interview-dates'
import { countActiveCompanies, findGroupApps, findOrCreateSiblingProcess } from '@/lib/process-routing'
import type { ApplicationStatus, ProcessType } from '@/types/database'

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

  if (!emailLog) {
    console.error('[trackCompany] email log not found:', emailLogId)
    return { error: 'not_found' }
  }
  if (emailLog.application_id) return { error: 'already_tracked' }

  // Before migration 014 is applied, emailLog.sender is undefined at runtime → '' → no retroactive.
  const senderDomain = extractSenderDomain(emailLog.sender ?? '')

  // Existing processes (rows) at this same company, if any. A non-empty
  // group means this is a sibling process (e.g. fulltime alongside an
  // already-tracked internship) — it doesn't consume a new active slot.
  const group = await findGroupApps(supabase, user.id, senderDomain)

  // Free plan active-slot check only applies to brand-new companies.
  if (group.length === 0) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    if ((profile?.plan ?? 'free') === 'free') {
      const { data: activeApps } = await supabase
        .from('applications')
        .select('sender_domain, company_name, is_active')
        .eq('user_id', user.id)
      if (countActiveCompanies(activeApps ?? []) >= FREE_ACTIVE_LIMIT) return { limitReached: true }
    }
  }

  // AI-analyze the clicked email
  let analysis
  try {
    analysis = await analyzeEmail(
      emailLog.subject ?? '',
      emailLog.body_text ?? '',
      emailLog.sender ?? ''
    )
    console.log('[trackCompany] analysis:', JSON.stringify(analysis))
  } catch (err) {
    console.error('[trackCompany] AI analysis failed:', err)
    return { error: 'analysis_failed' }
  }

  const companyName = (
    typeof analysis.company_name === 'string' && analysis.company_name.trim()
      ? analysis.company_name.trim()
      : (emailLog.subject ?? '').slice(0, 100)
  )
  const appStatus = mapToApplicationStatus(analysis.status, analysis.email_type)
  const processType: ProcessType = analysis.process_type ?? 'other'

  // Sanitize all date values from AI
  const safeCandidates = sanitizeCandidates(analysis.interview_date_candidates)
  const safeInterviewDate = safeCandidates[0] ?? toISODateOrNull(analysis.interview_date)
  const safeEventDate = toISODateOrNull(analysis.event_date)

  let appId: string

  if (group.length > 0) {
    // Sibling process at an already-tracked company (or a re-match of an
    // existing process) — find or create the right row, then update it.
    const sibling = await findOrCreateSiblingProcess(
      supabase, user.id, senderDomain, companyName, processType, group
    )
    if (!sibling) {
      console.error('[trackCompany] sibling resolution unexpectedly failed for non-empty group')
      return { error: 'insert_failed' }
    }
    appId = sibling.id

    await supabase
      .from('applications')
      .update({
        status: appStatus,
        latest_email_subject: emailLog.subject,
        interview_date: safeInterviewDate,
        event_date: safeEventDate,
        updated_by: 'ai',
        ...(safeCandidates.length > 0
          ? { interview_date_candidates: safeCandidates, interview_date_confirmed: safeCandidates.length <= 1 }
          : {}),
      })
      .eq('id', appId)
  } else {
    // Brand-new company
    let insertResult = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        company_name: companyName,
        status: appStatus,
        latest_email_subject: emailLog.subject,
        interview_date: safeInterviewDate,
        event_date: safeEventDate,
        interview_date_confirmed: safeCandidates.length <= 1,
        process_type: processType,
      })
      .select('id')
      .single()

    // Retry without newer columns in case of schema mismatch (migration not yet applied)
    if (insertResult.error) {
      console.error('[trackCompany] insert attempt 1 failed:', JSON.stringify(insertResult.error))
      insertResult = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          company_name: companyName,
          status: appStatus,
          latest_email_subject: emailLog.subject,
        })
        .select('id')
        .single()
    }

    const { data: newApp, error: insertError } = insertResult
    if (insertError || !newApp) {
      console.error('[trackCompany] application insert failed (both attempts):', JSON.stringify(insertError))
      return { error: 'insert_failed' }
    }
    appId = newApp.id

    // Set columns that require migrations 013/014/016/017; errors ignored — no-op if columns don't exist yet
    await supabase
      .from('applications')
      .update({
        ...(senderDomain ? { sender_domain: senderDomain } : {}),
        updated_by: 'ai',
        ...(safeCandidates.length > 0 ? { interview_date_candidates: safeCandidates } : {}),
      })
      .eq('id', appId)
  }

  // Link the clicked email log to the application
  await supabase
    .from('email_logs')
    .update({
      application_id: appId,
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

  // Mutable view of the company's processes, grown as siblings get created below.
  const liveGroup: { id: string; process_type: ProcessType | null; is_active: boolean; company_name: string; status: ApplicationStatus }[] =
    group.length > 0 ? [...group] : [{ id: appId, process_type: processType, is_active: true, company_name: companyName, status: appStatus }]

  // Per-process aggregation of latest state (so each sibling gets its own update)
  const perProcess = new Map<string, {
    status: ApplicationStatus
    subject: string | null
    interviewDate: string | null
    eventDate: string | null
    candidates: string[]
  }>()
  perProcess.set(appId, {
    status: appStatus,
    subject: emailLog.subject ?? null,
    interviewDate: safeInterviewDate,
    eventDate: safeEventDate,
    candidates: safeCandidates,
  })

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
      const pType: ProcessType = a.process_type ?? 'other'

      const sibling = await findOrCreateSiblingProcess(
        supabase, user.id, senderDomain, companyName, pType, liveGroup
      )
      const targetId = sibling?.id ?? appId
      if (sibling?.isNew) {
        liveGroup.push({ id: sibling.id, process_type: pType, is_active: liveGroup[0]?.is_active ?? true, company_name: companyName, status: sibling.status })
      }

      await supabase
        .from('email_logs')
        .update({
          application_id: targetId,
          email_type: a.email_type as 'selection' | 'event' | 'other',
        })
        .eq('id', log.id)

      const retCandidates = sanitizeCandidates(a.interview_date_candidates)
      const d1 = retCandidates[0] ?? toISODateOrNull(a.interview_date)
      const d2 = toISODateOrNull(a.event_date)

      const prev = perProcess.get(targetId)
      perProcess.set(targetId, {
        status: s,
        subject: log.subject ?? prev?.subject ?? null,
        interviewDate: d1 ?? prev?.interviewDate ?? null,
        eventDate: d2 ?? prev?.eventDate ?? null,
        candidates: retCandidates.length > 0 ? retCandidates : prev?.candidates ?? [],
      })
      retroCount++
    } catch {
      // Link even if analysis fails
      await supabase
        .from('email_logs')
        .update({ application_id: appId })
        .eq('id', log.id)
      retroCount++
    }
  }

  // Apply aggregated per-process state
  for (const [id, agg] of perProcess) {
    await supabase
      .from('applications')
      .update({
        status: agg.status,
        latest_email_subject: agg.subject,
        ...(agg.interviewDate ? { interview_date: agg.interviewDate } : {}),
        ...(agg.eventDate ? { event_date: agg.eventDate } : {}),
        ...(agg.candidates.length > 0
          ? { interview_date_candidates: agg.candidates, interview_date_confirmed: agg.candidates.length <= 1 }
          : {}),
      })
      .eq('id', id)
  }

  return { ok: true, companyName, retroCount }
}
