export interface GmailPayload {
  mimeType?: string
  headers?: Array<{ name: string; value: string }>
  body?: { data?: string; size?: number }
  parts?: GmailPayload[]
}

export interface GmailMessage {
  id: string
  threadId: string
  payload?: GmailPayload
  internalDate?: string
  labelIds?: string[]
}

export interface GmailHistoryItem {
  id?: string
  messagesAdded?: Array<{ message: { id: string; threadId: string } }>
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

export async function gmailFetch(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
}

export function extractHeader(payload: GmailPayload, name: string): string {
  return (
    payload.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ''
  )
}

export function extractBody(payload: GmailPayload): string {
  // Direct body data
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }

  if (!payload.parts) return ''

  // Prefer text/plain
  for (const part of payload.parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64url').toString('utf-8')
    }
  }

  // Recurse into multipart/*
  for (const part of payload.parts) {
    if (part.mimeType?.startsWith('multipart/')) {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }

  // Fallback: HTML with tag stripping
  for (const part of payload.parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = Buffer.from(part.body.data, 'base64url').toString('utf-8')
      return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000)
    }
  }

  return ''
}
