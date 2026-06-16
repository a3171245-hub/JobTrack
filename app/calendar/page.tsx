import NavBar from '@/components/NavBar'
import CalendarView from '@/components/CalendarView'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// DEV BYPASS: 固定ダミーユーザーID
const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

export default async function CalendarPage() {
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

  const { data: dbApps } = await supabase
    .from('applications')
    .select(
      'id, company_name, status, interview_date, event_date, test_date, es_deadline, gd_date'
    )
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const applications = dbApps ?? []

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-indigo-950 via-[#1e1b4b] to-violet-900">
      <NavBar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">カレンダー</h1>
          <p className="text-sm text-indigo-200/70 mt-1">
            面接・説明会・ES締切などの予定をまとめて確認できます
          </p>
        </div>
        <CalendarView applications={applications} />
      </main>
    </div>
  )
}
