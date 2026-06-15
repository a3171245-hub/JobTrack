import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NavBar from '@/components/NavBar'
import SettingsClient from './SettingsClient'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('users')
    .select(
      'dedicated_email, gmail_email, gmail_watch_expiration'
    )
    .eq('id', user.id)
    .maybeSingle()

  const { success, error } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          設定
        </h1>
        <SettingsClient
          gmailEmail={profile?.gmail_email ?? null}
          gmailWatchExpiration={profile?.gmail_watch_expiration ?? null}
          successMessage={success}
          errorMessage={error}
        />
      </main>
    </div>
  )
}
