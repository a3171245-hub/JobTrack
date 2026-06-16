import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import DashboardShell from './DashboardShell'
import type { UpdateRecord } from '@/contexts/DashboardContext'
import type { ApplicationStatus } from '@/types/database'
import type { User } from '@supabase/supabase-js'

// DEV BYPASS: 固定ダミーユーザーID
const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

export default async function DashboardPage() {
  const authClient = await createClient()
  const {
    data: { user: sessionUser },
  } = await authClient.auth.getUser()

  // DEV BYPASS: セッションがなければ固定IDのダミーユーザーにフォールバック
  const user: User = sessionUser ?? {
    id: DEV_USER_ID,
    email: 'a3171245@gmail.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

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
    <div className="dark min-h-screen bg-gradient-to-br from-indigo-950 via-[#1e1b4b] to-violet-900">
      <NavBar user={user} dedicatedEmail={dedicatedEmail} />

      {/* DashboardProvider 以下は CSR のみ（DashboardShell 内で ssr:false）*/}
      <DashboardShell
        applications={applications}
        initialTodayUpdates={initialTodayUpdates}
        dedicatedEmail={dedicatedEmail}
      />
    </div>
  )
}
