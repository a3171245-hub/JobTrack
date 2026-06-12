'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ApplicationStatus, TestResult } from '@/types/database'

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    if (error.code !== 'PGRST116') console.error('updateStatus error:', error)
  }
}

export async function addApplication(
  companyName: string,
  notes?: string
): Promise<{ id: string } | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: DUMMY_USER_ID,
      company_name: companyName,
      status: 'applied',
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('addApplication error:', error)
    return null
  }

  revalidatePath('/dashboard')
  return { id: data.id }
}

export async function deleteApplication(applicationId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)

  if (error) console.error('deleteApplication error:', error)
  revalidatePath('/dashboard')
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
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update(data)
    .eq('id', applicationId)

  if (error) {
    console.error('updateAptitudeTest error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}

export async function fetchApplications() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', DUMMY_USER_ID)
    .order('updated_at', { ascending: false })

  return data ?? null
}

export async function updateEsDeadline(
  applicationId: string,
  deadline: string | null
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ es_deadline: deadline })
    .eq('id', applicationId)

  if (error && error.code !== 'PGRST116') console.error('updateEsDeadline error:', error)
  revalidatePath('/dashboard')
}

export async function updateCustomFlow(
  applicationId: string,
  flow: string[]
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('applications')
    .update({ custom_flow: flow })
    .eq('id', applicationId)

  if (error && error.code !== 'PGRST116') console.error('updateCustomFlow error:', error)
}

export async function fetchTodayEmailLogs() {
  const supabase = createAdminClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('email_logs')
    .select('*')
    .eq('user_id', DUMMY_USER_ID)
    .eq('email_type', 'manual_update')
    .gte('received_at', todayStart.toISOString())
    .order('received_at', { ascending: false })

  return data ?? null
}
