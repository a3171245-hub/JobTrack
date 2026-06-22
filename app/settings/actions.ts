'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_DISPLAY_NAME_LENGTH = 30

export async function updateDisplayName(displayName: string) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const trimmed = displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({ display_name: trimmed || null })
    .eq('id', user.id)

  if (error) {
    console.error('updateDisplayName error:', error)
    throw new Error(error.message)
  }
}
