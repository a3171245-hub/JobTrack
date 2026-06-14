import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import CalendarView from '@/components/CalendarView'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export default async function CalendarPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect('/')

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
    <div className="min-h-screen bg-slate-50">
      <NavBar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">カレンダー</h1>
          <p className="text-sm text-slate-500 mt-1">
            面接・説明会・ES締切などの予定をまとめて確認できます
          </p>
        </div>
        <CalendarView applications={applications} />
      </main>
    </div>
  )
}
