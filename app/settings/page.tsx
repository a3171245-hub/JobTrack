import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NavBar from '@/components/NavBar'
import SettingsClient from './SettingsClient'
import type { User } from '@supabase/supabase-js'

const DEV_USER_ID = 'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
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
  // display_name 列がまだ無い環境でもクエリ全体を落とさないよう select('*') を使う
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { success, error } = await searchParams

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900">
      <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          設定
        </h1>
        <SettingsClient
          dedicatedEmail={profile?.dedicated_email ?? null}
          displayName={profile?.display_name ?? null}
          userEmail={user.email ?? null}
          successMessage={success}
          errorMessage={error}
        />
      </main>
    </div>
  )
}
