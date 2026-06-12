import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import CompanyTable from '@/components/CompanyTable'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import TodayUpdates from '@/components/TodayUpdates'
import NavBar from '@/components/NavBar'
import { DashboardProvider, type UpdateRecord } from '@/contexts/DashboardContext'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/types/database'
import { DUMMY_APPLICATIONS, DUMMY_EMAIL_LOGS } from '@/lib/dummy-data'

export default async function DashboardPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const supabase = createAdminClient()

  const [applicationsResult, profileResult, logsResult] = await Promise.allSettled([
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
      .gte('received_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order('received_at', { ascending: false }),
  ])

  const dbApps =
    applicationsResult.status === 'fulfilled' && applicationsResult.value.data?.length
      ? applicationsResult.value.data
      : null

  const applications = dbApps ?? DUMMY_APPLICATIONS
  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null
  const dbLogs =
    logsResult.status === 'fulfilled' && logsResult.value.data?.length
      ? logsResult.value.data
      : null

  const rawLogs = dbLogs ?? DUMMY_EMAIL_LOGS.filter((l) => {
    const logDate = new Date(l.received_at)
    const today = new Date()
    return (
      l.email_type === 'manual_update' &&
      logDate.getFullYear() === today.getFullYear() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getDate() === today.getDate()
    )
  })

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

  if (initialTodayUpdates.length === 0) {
    const demoTime = new Date()
    demoTime.setHours(9, 15, 0, 0)
    initialTodayUpdates.push({
      id: 'demo-initial',
      companyName: '株式会社テックスタート',
      fromStatus: 'interview_1',
      toStatus: 'interview_2',
      timestamp: demoTime.toISOString(),
    })
  }

  return (
    <DashboardProvider
      initialApplications={applications}
      initialTodayUpdates={initialTodayUpdates}
    >
      <div className="min-h-screen bg-slate-50">
        <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />

        <main className="max-w-[1400px] mx-auto px-4 py-6">
          <TodayUpdates />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">選考管理</h1>
              <span className="text-sm text-slate-500">{applications.length} 社</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/calendar"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <CalendarDays className="w-4 h-4" />
                カレンダー
              </Link>
              <AddApplicationDialog />
            </div>
          </div>

          <CompanyTable />
        </main>
      </div>
    </DashboardProvider>
  )
}
