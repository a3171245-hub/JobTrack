import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEV_EMAIL = 'a3171245@gmail.com'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const origin = new URL(request.url).origin
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEV_EMAIL,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data?.properties?.action_link) {
    console.error('[dev/login] generateLink failed:', error)
    return NextResponse.redirect(`${origin}/?error=dev_login_failed`)
  }

  // Redirect to Supabase magic link → Supabase verifies token → redirects to /auth/callback
  return NextResponse.redirect(data.properties.action_link)
}
