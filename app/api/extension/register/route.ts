import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'token is required' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  // Verify the JWT using the anon client (hits Supabase auth server)
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json(
      { error: 'invalid or expired token' },
      { status: 401, headers: CORS_HEADERS }
    )
  }

  // Use admin client for DB operations (bypasses RLS)
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('users')
    .select('dedicated_email')
    .eq('id', user.id)
    .maybeSingle()

  let dedicatedEmail = profile?.dedicated_email ?? null

  if (!dedicatedEmail) {
    dedicatedEmail = `${user.id.slice(0, 8)}@jobtrack.jp`
    await supabase
      .from('users')
      .update({ dedicated_email: dedicatedEmail })
      .eq('id', user.id)
  }

  return NextResponse.json(
    { dedicated_email: dedicatedEmail, user_id: user.id },
    { headers: CORS_HEADERS }
  )
}
