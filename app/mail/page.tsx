import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import MailList from '@/components/MailList'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

const FREE_MAIL_LIMIT = 20

export default async function MailPage() {
  const authClient = await createClient()
  const { data: { user: sessionUser } } = await authClient.auth.getUser()

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

  const [logsResult, appsResult, profileResult] = await Promise.allSettled([
    supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', user.id)
      .neq('email_type', 'manual_update')
      .order('received_at', { ascending: false })
      .limit(FREE_MAIL_LIMIT + 1),
    supabase
      .from('applications')
      .select('id, company_name, interview_date, interview_date_candidates, event_date, is_active')
      .eq('user_id', user.id),
    supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const plan = (
    profileResult.status === 'fulfilled'
      ? (profileResult.value.data?.plan as 'free' | 'premium' | null) ?? 'free'
      : 'free'
  ) as 'free' | 'premium'

  const rawLogs =
    logsResult.status === 'fulfilled' && logsResult.value.data
      ? logsResult.value.data
      : []

  const freeLimitHit = plan === 'free' && rawLogs.length > FREE_MAIL_LIMIT
  const logs = plan === 'free' ? rawLogs.slice(0, FREE_MAIL_LIMIT) : rawLogs

  const apps =
    appsResult.status === 'fulfilled' && appsResult.value.data
      ? appsResult.value.data
      : []

  const companyMap = Object.fromEntries(apps.map((a) => [a.id, a.company_name]))
  const appDateMap = Object.fromEntries(
    apps.map((a) => [a.id, {
      interview_date: a.interview_date,
      interview_date_candidates: a.interview_date_candidates,
      event_date: a.event_date,
    }])
  )
  const activeCount = apps.filter((a) => a.is_active !== false).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900">
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">受信メール</h1>
          <p className="text-sm text-slate-500 dark:text-indigo-200/70 mt-1">
            専用アドレスに届いた企業からのメールが一覧で確認できます
          </p>
        </div>
        <MailList
          logs={logs}
          companyMap={companyMap}
          appDateMap={appDateMap}
          userId={user.id}
          freeLimitHit={freeLimitHit}
          plan={plan}
          activeCount={activeCount}
        />
      </main>
    </div>
  )
}
