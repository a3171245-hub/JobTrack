import NavBar from '@/components/NavBar'
import MailList from '@/components/MailList'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// DEV BYPASS: 固定ダミーユーザーID
const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

export default async function MailPage() {
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

  const [logsResult, appsResult] = await Promise.allSettled([
    supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', user.id)
      .neq('email_type', 'manual_update')
      .order('received_at', { ascending: false }),
    supabase
      .from('applications')
      .select('id, company_name')
      .eq('user_id', user.id),
  ])

  const logs =
    logsResult.status === 'fulfilled' && logsResult.value.data
      ? logsResult.value.data
      : []

  const apps =
    appsResult.status === 'fulfilled' && appsResult.value.data
      ? appsResult.value.data
      : []

  const companyMap = Object.fromEntries(apps.map((a) => [a.id, a.company_name]))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">受信メール</h1>
          <p className="text-sm text-slate-500 mt-1">
            専用アドレスに届いた企業からのメールが一覧で確認できます
          </p>
        </div>
        <MailList logs={logs} companyMap={companyMap} />
      </main>
    </div>
  )
}
