import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(`${origin}/settings?error=oauth_failed`)
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/settings?error=token_exchange_failed`)
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string
    refresh_token?: string
    error?: string
  }

  if (!tokens.access_token || tokens.error) {
    return NextResponse.redirect(`${origin}/settings?error=token_exchange_failed`)
  }

  // Get the Gmail address for this token
  const profileRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const gmailProfile = (await profileRes.json()) as { emailAddress?: string }

  // Set up Pub/Sub push notifications via Gmail watch()
  const watchRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/watch',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labelIds: ['INBOX'],
        topicName: process.env.GOOGLE_PUBSUB_TOPIC!,
      }),
    }
  )
  const watchData = (await watchRes.json()) as {
    historyId?: string
    expiration?: string
    error?: { message: string }
  }

  const supabase = createAdminClient()
  await supabase
    .from('users')
    .update({
      gmail_access_token: tokens.access_token,
      gmail_refresh_token: tokens.refresh_token ?? null,
      gmail_email: gmailProfile.emailAddress ?? null,
      gmail_history_id: watchData.historyId ?? null,
      gmail_watch_expiration: watchData.expiration
        ? new Date(Number(watchData.expiration)).toISOString()
        : null,
    })
    .eq('id', userId)

  return NextResponse.redirect(`${origin}/settings?success=gmail_connected`)
}
