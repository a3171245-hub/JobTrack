import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calendarAddSchema, parseBody } from '@/lib/validate'

export async function POST(request: NextRequest) {
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
  const { error } = await supabase
    .from('calendar_events')
    .insert({ user_id: user.id, title, date, type })

  if (error) {
    console.error('[calendar/add] insert failed:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
