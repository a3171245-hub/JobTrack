import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import CompanyTable from '@/components/CompanyTable'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import TodayUpdates from '@/components/TodayUpdates'
import NavBar from '@/components/NavBar'
import { DashboardProvider, type UpdateRecord } from '@/contexts/DashboardContext'
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

  // ログインユーザー自身のデータのみ（ダミーは使わない）
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
    <DashboardProvider
      initialApplications={applications}
      initialTodayUpdates={initialTodayUpdates}
    >
      <div className="min-h-screen bg-slate-50">
        <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
          <TodayUpdates />

          <div className="flex items-center justify-between mb-5 mt-8">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-bold text-slate-900">選考管理</h1>
              <span className="text-sm text-slate-500">
                {applications.length} 社
              </span>
            </div>
            <AddApplicationDialog />
          </div>

          <CompanyTable />
        </main>
      </div>
    </DashboardProvider>
  )
}
