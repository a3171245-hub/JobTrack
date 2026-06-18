'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { companyGroupKey, countActiveCompanies } from '@/lib/process-routing'
import type { ApplicationStatus, TestResult } from '@/types/database'

const FREE_ACTIVE_LIMIT = 5

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('unauthorized')

  const supabase = createAdminClient()

  // Try with updated_by; fall back without it if column doesn't exist yet (migration 013 pending)
  let { error } = await supabase
    .from('applications')
    .update({ status, updated_by: 'manual' })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    ;({ error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .eq('user_id', userId))
  }

  if (error) {
    console.error('updateStatus error:', error)
    throw new Error(error.message)
  }
}

export async function addApplication(
  companyName: string,
  notes?: string
): Promise<{ id: string; isActive: boolean } | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  const plan = profile?.plan ?? 'free'

  // Free plan: cap active count at 5 companies (multi-process companies count once);
  // new company added as inactive when at limit
  let isActive = true
  if (plan === 'free') {
    const { data: existingApps } = await supabase
      .from('applications')
      .select('sender_domain, company_name, is_active')
      .eq('user_id', userId)
    if (countActiveCompanies(existingApps ?? []) >= FREE_ACTIVE_LIMIT) isActive = false
  }

  const sanitizedName = companyName.trim().slice(0, 200)
  const sanitizedNotes = notes ? notes.trim().slice(0, 2000) : null

  // Try with is_active; fall back without it if column doesn't exist yet (migration 013 pending)
  let result = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company_name: sanitizedName,
      status: 'applied',
      notes: sanitizedNotes,
      is_active: isActive,
    })
    .select('id')
    .single()

  if (result.error) {
    result = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        company_name: sanitizedName,
        status: 'applied',
        notes: sanitizedNotes,
      })
      .select('id')
      .single()
  }

  if (result.error) {
    console.error('addApplication error:', result.error)
    return null
  }

  const data = result.data

  return { id: data.id, isActive }
}

// Pin/unpin operates per company, not per process row — toggling one
// process at a company toggles all sibling processes at that company too,
// since the active-slot limit is counted per company.
export async function setApplicationActive(
  applicationId: string,
  isActive: boolean
): Promise<{ ok: true } | { limitReached: true }> {
  const userId = await getCurrentUserId()
  if (!userId) return { limitReached: true }

  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from('applications')
    .select('sender_domain, company_name')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!target) return { limitReached: true }

  const { data: allApps } = await supabase
    .from('applications')
    .select('id, sender_domain, company_name, is_active')
    .eq('user_id', userId)

  const apps = allApps ?? []
  const targetKey = companyGroupKey(target)
  const siblingIds = apps.filter((a) => companyGroupKey(a) === targetKey).map((a) => a.id)

  if (isActive) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle()

    if ((profile?.plan ?? 'free') === 'free') {
      const othersActiveCount = countActiveCompanies(
        apps.filter((a) => companyGroupKey(a) !== targetKey)
      )
      if (othersActiveCount >= FREE_ACTIVE_LIMIT) return { limitReached: true }
    }
  }

  await supabase
    .from('applications')
    .update({ is_active: isActive })
    .in('id', siblingIds)
    .eq('user_id', userId)

  return { ok: true }
}

// Persists the user's explicit pick among multiple AI-extracted interview
// date candidates (clears the "日程未確定" dashboard notice for this process).
export async function confirmInterviewDate(
  applicationId: string,
  date: string
): Promise<{ ok: true } | { ok: false }> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ interview_date: date, interview_date_confirmed: true })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    console.error('confirmInterviewDate error:', error)
    return { ok: false }
  }
  return { ok: true }
}

export async function deleteApplication(applicationId: string) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('unauthorized')

  const supabase = createAdminClient()

  // Fetch company name for calendar cleanup
  const { data: app } = await supabase
    .from('applications')
    .select('company_name')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!app) throw new Error('not_found')

  // Null out email_logs.application_id (keep emails, remove link)
  await supabase
    .from('email_logs')
    .update({ application_id: null })
    .eq('application_id', applicationId)
    .eq('user_id', userId)

  // Delete calendar events associated with this company (title prefix match)
  await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .like('title', `${app.company_name} —%`)

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    console.error('deleteApplication error:', error)
    throw new Error(error.message)
  }
}

export async function updateAptitudeTest(
  applicationId: string,
  data: {
    test_type: string | null
    test_date: string | null
    test_result: TestResult | null
    notes?: string | null
  }
) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('unauthorized')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({
      test_type: data.test_type,
      test_date: data.test_date,
      test_result: data.test_result,
      notes: data.notes ?? null,
    })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    console.error('updateAptitudeTest error:', error)
    throw new Error(error.message)
  }
}

export async function fetchApplications() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  return data ?? null
}

export async function updateEsDeadline(
  applicationId: string,
  deadline: string | null
) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('unauthorized')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ es_deadline: deadline })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    console.error('updateEsDeadline error:', error)
    throw new Error(error.message)
  }
}

export async function updateCompanyUrl(
  applicationId: string,
  url: string | null
): Promise<{ ok: true } | { ok: false }> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false }

  const trimmed = url?.trim() || null
  // Only allow http(s) links — guards against javascript: URIs ending up in an href
  if (trimmed && !/^https?:\/\//i.test(trimmed)) return { ok: false }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ company_url: trimmed ? trimmed.slice(0, 2000) : null })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    console.error('updateCompanyUrl error:', error)
    return { ok: false }
  }
  return { ok: true }
}

const MEMO_MAX_LENGTH = 10_000

export async function updateMemo(applicationId: string, memo: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false as const }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ memo: memo.slice(0, MEMO_MAX_LENGTH) })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error) {
    console.error('updateMemo error:', error)
    return { ok: false as const }
  }
  return { ok: true as const }
}

export async function updateCustomFlow(
  applicationId: string,
  flow: string[]
) {
  const userId = await getCurrentUserId()
  if (!userId) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ custom_flow: flow })
    .eq('id', applicationId)
    .eq('user_id', userId)

  if (error && error.code !== 'PGRST116') console.error('updateCustomFlow error:', error)
}

export async function fetchTodayEmailLogs() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const supabase = createAdminClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('email_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('email_type', 'manual_update')
    .gte('received_at', todayStart.toISOString())
    .order('received_at', { ascending: false })

  return data ?? null
}
