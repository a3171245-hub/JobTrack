'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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

  // Free plan: cap active count at 5; new company added as inactive when at limit
  let isActive = true
  if (plan === 'free') {
    const { count } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
    if ((count ?? 0) >= FREE_ACTIVE_LIMIT) isActive = false
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

export async function setApplicationActive(
  applicationId: string,
  isActive: boolean
): Promise<{ ok: true } | { limitReached: true }> {
  const userId = await getCurrentUserId()
  if (!userId) return { limitReached: true }

  const supabase = createAdminClient()

  if (isActive) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle()

    if ((profile?.plan ?? 'free') === 'free') {
      const { count } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)
      if ((count ?? 0) >= FREE_ACTIVE_LIMIT) return { limitReached: true }
    }
  }

  await supabase
    .from('applications')
    .update({ is_active: isActive })
    .eq('id', applicationId)
    .eq('user_id', userId)

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
