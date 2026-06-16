import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCorsHeaders, corsPreflightResponse } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return corsPreflightResponse(origin)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'token is required' },
      { status: 400, headers: corsHeaders }
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
      { status: 401, headers: corsHeaders }
    )
  }

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
    { headers: corsHeaders }
  )
}
