import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import DashboardShell from './DashboardShell'
import type { UpdateRecord } from '@/contexts/DashboardContext'
import type { ApplicationStatus } from '@/types/database'

export default async function DashboardPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const supabase = createAdminClient()

  const [applicationsResult, profileResult, logsResult] =
    await Promise.allSettled([
      supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('users')
        .select('dedicated_email')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('email_type', 'manual_update')
        .gte(
          'received_at',
          new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        )
        .order('received_at', { ascending: false }),
    ])

  const applications =
    applicationsResult.status === 'fulfilled' && applicationsResult.value.data
      ? applicationsResult.value.data
      : []

  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null

  const rawLogs =
    logsResult.status === 'fulfilled' && logsResult.value.data
      ? logsResult.value.data
      : []

  const initialTodayUpdates: UpdateRecord[] = rawLogs
    .map((log) => {
      try {
        const body = JSON.parse(log.body_text ?? '{}') as {
          company_name: string
          from_status: ApplicationStatus
          to_status: ApplicationStatus
        }
        return {
          id: log.id,
          companyName: body.company_name,
          fromStatus: body.from_status,
          toStatus: body.to_status,
          timestamp: log.received_at,
        }
      } catch {
        return null
      }
    })
    .filter(Boolean) as UpdateRecord[]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* NavBar はSSRで即時表示 */}
      <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />

      {/* DashboardProvider 以下は CSR のみ（DashboardShell 内で ssr:false）*/}
      <DashboardShell
        applications={applications}
        initialTodayUpdates={initialTodayUpdates}
      />
    </div>
  )
}
