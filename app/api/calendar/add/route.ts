import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calendarAddSchema, parseBody } from '@/lib/validate'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  if (!checkRateLimit(request, { id: 'calendar-add', max: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  // Verify session — never trust user_id from request body
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = parseBody(calendarAddSchema, rawBody)
  if (!validation.ok) return validation.response

  const { title, date, type } = validation.data

  const supabase = createAdminClient()

  // Per-user event cap to prevent storage DoS
  const { count } = await supabase
    .from('calendar_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 500) {
    return NextResponse.json({ error: 'Calendar event limit reached' }, { status: 429 })
  }

  const { error } = await supabase
    .from('calendar_events')
    .insert({ user_id: user.id, title, date, type })

  if (error) {
    console.error('[calendar/add] insert failed:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
