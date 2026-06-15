import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import MailList from '@/components/MailList'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export default async function MailPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect('/')

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
