import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gmailFetch } from '@/lib/gmail'

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

  const { session } = data
  const providerToken = session.provider_token
  const providerRefreshToken = session.provider_refresh_token ?? null

  // Save Gmail tokens and set up Pub/Sub watch in the background
  if (providerToken) {
    try {
      // Get the Gmail address for this Google account
      const profileRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        { headers: { Authorization: `Bearer ${providerToken}` } }
      )
      const gmailProfile = (await profileRes.json()) as { emailAddress?: string }

      // Set up Gmail push notifications via Pub/Sub watch()
      const watchRes = await gmailFetch('/watch', providerToken, {
        method: 'POST',
        body: JSON.stringify({
          labelIds: ['INBOX'],
          topicName: process.env.GOOGLE_PUBSUB_TOPIC!,
        }),
      })
      const watchData = (await watchRes.json()) as {
        historyId?: string
        expiration?: string
      }

      const adminClient = createAdminClient()
      await adminClient
        .from('users')
        .update({
          gmail_access_token: providerToken,
          // Only overwrite refresh token if Google issued a new one
          ...(providerRefreshToken
            ? { gmail_refresh_token: providerRefreshToken }
            : {}),
          gmail_email: gmailProfile.emailAddress ?? null,
          gmail_history_id: watchData.historyId ?? null,
          gmail_watch_expiration: watchData.expiration
            ? new Date(Number(watchData.expiration)).toISOString()
            : null,
        })
        .eq('id', session.user.id)
    } catch (err) {
      // Don't block login if Gmail setup fails — log and continue
      console.error('[auth/callback] Gmail setup failed:', err)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
