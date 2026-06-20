import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import DashboardShell from './DashboardShell'
import type { UpdateRecord } from '@/contexts/DashboardContext'
import type { TodayMailItem } from '@/components/TodayUpdates'
import type { ApplicationStatus } from '@/types/database'
import type { User } from '@supabase/supabase-js'

const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

export default async function DashboardPage() {
  const authClient = await createClient()
  const {
    data: { user: sessionUser },
  } = await authClient.auth.getUser()

  let user: User
  if (sessionUser) {
    user = sessionUser
  } else if (process.env.NODE_ENV === 'development') {
    user = {
      id: DEV_USER_ID,
      email: 'a3171245@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
  } else {
    redirect('/')
  }

  const supabase = createAdminClient()
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [applicationsResult, profileResult, logsResult, mailsResult] =
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
        .gte('received_at', todayStart)
        .order('received_at', { ascending: false }),
      supabase
        .from('email_logs')
        .select('id, application_id, subject, received_at')
        .eq('user_id', user.id)
        .neq('email_type', 'manual_update')
        .gte('received_at', todayStart)
        .order('received_at', { ascending: false }),
    ])

  const applications =
    applicationsResult.status === 'fulfilled' && applicationsResult.value.data
      ? applicationsResult.value.data
      : []

  const rawProfile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null

  // Auto-generate dedicated email for new users (fire-and-forget)
  let dedicatedEmail = rawProfile?.dedicated_email ?? null
  if (!dedicatedEmail) {
    dedicatedEmail = `${user.id.slice(0, 8)}@jobtrack.jp`
    void supabase
      .from('users')
      .update({ dedicated_email: dedicatedEmail })
      .eq('id', user.id)
  }

  // `plan` 列は実テーブルに存在しないため、常に 'free' として扱う
  const plan: 'free' | 'premium' = 'free'

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

  const companyNameById = new Map(applications.map((a) => [a.id, a.company_name]))
  const rawMails =
    mailsResult.status === 'fulfilled' && mailsResult.value.data
      ? mailsResult.value.data
      : []

  const todayMails: TodayMailItem[] = rawMails.map((log) => ({
    id: log.id,
    companyName: log.application_id
      ? companyNameById.get(log.application_id) ?? '企業未紐付け'
      : '企業未紐付け',
    subject: log.subject ?? '(件名なし)',
    receivedAt: log.received_at,
  }))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900">
      <NavBar user={user} dedicatedEmail={dedicatedEmail} />

      {/* DashboardProvider 以下は CSR のみ（DashboardShell 内で ssr:false）*/}
      <DashboardShell
        applications={applications}
        initialTodayUpdates={initialTodayUpdates}
        todayMails={todayMails}
        dedicatedEmail={dedicatedEmail}
        userEmail={user.email ?? null}
        plan={plan}
      />
    </div>
  )
}
