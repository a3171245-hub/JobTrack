import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import CalendarView from '@/components/CalendarView'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DUMMY_APPLICATIONS } from '@/lib/dummy-data'

export default async function CalendarPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const supabase = createAdminClient()

  const { data: dbApps } = await supabase
    .from('applications')
    .select('id, company_name, status, interview_date, event_date, test_date, es_deadline, gd_date')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const applications =
    dbApps && dbApps.length > 0
      ? dbApps
      : DUMMY_APPLICATIONS.map((a) => ({
          id: a.id,
          company_name: a.company_name,
          status: a.status,
          interview_date: a.interview_date,
          event_date: a.event_date,
          test_date: a.test_date,
          es_deadline: a.es_deadline,
          gd_date: a.gd_date,
        }))

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar user={user} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">カレンダー</h1>
        <CalendarView applications={applications} />
      </main>
    </div>
  )
}
