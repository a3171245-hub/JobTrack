import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ProcessType } from '@/types/database'

type AppRow = Database['public']['Tables']['applications']['Row']
type GroupAppRow = Pick<AppRow, 'id' | 'process_type' | 'is_active' | 'company_name' | 'status'>

export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  internship: 'インターン',
  fulltime: '本選考',
  other: 'その他',
}

// Companies are grouped by sender_domain when known (AI-tracked), or by
// company_name for manual entries that have no sender_domain.
export function companyGroupKey(app: Pick<AppRow, 'sender_domain' | 'company_name'>): string {
  return app.sender_domain ? `domain:${app.sender_domain}` : `name:${app.company_name}`
}

// Active-slot accounting is per company, not per process_type row —
// two processes at the same company (internship + fulltime) count as one.
export function countActiveCompanies(apps: Pick<AppRow, 'sender_domain' | 'company_name' | 'is_active'>[]): number {
  const keys = new Set(
    apps.filter((a) => a.is_active !== false).map((a) => companyGroupKey(a))
  )
  return keys.size
}

// Fetch all applications sharing a sender_domain for this user (the "process group").
export async function findGroupApps(
  supabase: SupabaseClient<Database>,
  userId: string,
  senderDomain: string
): Promise<GroupAppRow[]> {
  if (!senderDomain) return []
  const { data } = await supabase
    .from('applications')
    .select('id, process_type, is_active, company_name, status')
    .eq('user_id', userId)
    .eq('sender_domain', senderDomain)
  return data ?? []
}

// Finds the application matching processType within an already-tracked
// company group, or creates a minimal sibling row for a new process at
// that same company (reusing the group's is_active so it doesn't consume
// another active slot). Returns null if the group is empty — caller is
// responsible for the "brand new company" creation path (which needs the
// free-plan active-limit check).
export async function findOrCreateSiblingProcess(
  supabase: SupabaseClient<Database>,
  userId: string,
  senderDomain: string,
  companyName: string,
  processType: ProcessType,
  group: GroupAppRow[]
): Promise<{ id: string; status: AppRow['status']; isNew: boolean } | null> {
  if (group.length === 0) return null

  const match = group.find((a) => (a.process_type ?? 'other') === processType)
  if (match) return { id: match.id, status: match.status, isNew: false }

  const { data: newApp, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company_name: companyName,
      sender_domain: senderDomain,
      process_type: processType,
      status: 'applied',
      is_active: group[0].is_active,
    })
    .select('id, status')
    .single()

  if (error || !newApp) {
    console.error('[findOrCreateSiblingProcess] sibling insert failed:', JSON.stringify(error))
    // Fall back to the first app in the group rather than dropping the email entirely
    return { id: group[0].id, status: group[0].status, isNew: false }
  }

  return { id: newApp.id, status: newApp.status, isNew: true }
}
