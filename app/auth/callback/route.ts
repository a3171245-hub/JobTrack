import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const userId = data.session.user.id
  const dedicatedEmail = `${userId.slice(0, 8)}@jobtrack.jp`

  // Upsert user record — on conflict (existing user) do nothing to preserve existing dedicated_email
  const admin = createAdminClient()
  await admin
    .from('users')
    .upsert(
      { id: userId, dedicated_email: dedicatedEmail },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  return NextResponse.redirect(`${origin}${next}`)
}
