import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import CalendarView from '@/components/CalendarView'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

export default async function CalendarPage() {
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

  const { data: dbApps } = await supabase
    .from('applications')
    .select(
      'id, company_name, status, interview_date, event_date, test_date, es_deadline, gd_date'
    )
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const applications = dbApps ?? []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900">
      <NavBar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">カレンダー</h1>
          <p className="text-sm text-slate-500 dark:text-indigo-200/70 mt-1">
            面接・説明会・ES締切などの予定をまとめて確認できます
          </p>
        </div>
        <CalendarView applications={applications} />
      </main>
    </div>
  )
}
