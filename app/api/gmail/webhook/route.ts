import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeEmail } from '@/lib/gemini'
import {
  refreshAccessToken,
  gmailFetch,
  extractBody,
  extractHeader,
} from '@/lib/gmail'
import type { GmailMessage, GmailHistoryItem } from '@/lib/gmail'
import type { ApplicationStatus } from '@/types/database'

export const maxDuration = 60

function mapToApplicationStatus(
  aiStatus: string,
  emailType: string
): ApplicationStatus {
  if (emailType === 'event') return 'event'
  const map: Record<string, ApplicationStatus> = {
    offer: 'offer',
    rejected: 'rejected',
    interview_1: 'interview_1',
    interview_2: 'interview_2',
    final: 'final',
    document: 'document',
    schedule: 'applied',
    unknown: 'applied',
  }
  return map[aiStatus] ?? 'applied'
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = (body as { message?: { data?: string } }).message
  if (!message?.data) return NextResponse.json({ ok: true })

  // Decode Pub/Sub notification
  let notification: { emailAddress?: string; historyId?: string }
  try {
    const decoded = Buffer.from(message.data, 'base64').toString('utf-8')
    notification = JSON.parse(decoded) as {
      emailAddress?: string
      historyId?: string
    }
  } catch {
    return NextResponse.json({ ok: true })
  }

  const { emailAddress, historyId } = notification
  if (!emailAddress || !historyId) return NextResponse.json({ ok: true })

  const supabase = createAdminClient()

  // Find user by their linked Gmail address
  const { data: userRecord } = await supabase
    .from('users')
    .select(
      'id, gmail_access_token, gmail_refresh_token, gmail_history_id'
    )
    .eq('gmail_email', emailAddress)
    .maybeSingle()

  if (!userRecord?.gmail_access_token) return NextResponse.json({ ok: true })

  let accessToken = userRecord.gmail_access_token
  const startHistoryId = userRecord.gmail_history_id ?? historyId

  // Fetch new messages via history.list
  let histRes = await gmailFetch(
    `/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
    accessToken
  )

  // Refresh token on 401
  if (histRes.status === 401 && userRecord.gmail_refresh_token) {
    const newToken = await refreshAccessToken(userRecord.gmail_refresh_token)
    if (newToken) {
      accessToken = newToken
      await supabase
        .from('users')
        .update({ gmail_access_token: newToken })
        .eq('id', userRecord.id)
      histRes = await gmailFetch(
        `/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
        accessToken
      )
    }
  }

  // Always advance the stored historyId to avoid reprocessing
  await supabase
    .from('users')
    .update({ gmail_history_id: historyId })
    .eq('id', userRecord.id)

  if (!histRes.ok) return NextResponse.json({ ok: true })

  const histData = (await histRes.json()) as { history?: GmailHistoryItem[] }
  const messageIds = [
    ...new Set(
      (histData.history ?? []).flatMap(
        (h) => h.messagesAdded?.map((m) => m.message.id) ?? []
      )
    ),
  ]

  let processed = 0

  for (const msgId of messageIds) {
    try {
      const msgRes = await gmailFetch(
        `/messages/${msgId}?format=full`,
        accessToken
      )
      if (!msgRes.ok) continue

      const msg = (await msgRes.json()) as GmailMessage
      if (!msg.payload) continue

      // Skip sent mail
      if (msg.labelIds?.includes('SENT')) continue

      const subject = extractHeader(msg.payload, 'subject') || '(件名なし)'
      const from = extractHeader(msg.payload, 'from')
      const bodyText = extractBody(msg.payload)

      // Skip emails with no content to analyze
      if (!subject && !bodyText) continue

      let analysis
      try {
        analysis = await analyzeEmail(subject, bodyText, from)
      } catch (err) {
        console.error(`Gemini analysis failed for ${msgId}:`, err)
        // Save as-is without status change
        await supabase.from('email_logs').insert({
          user_id: userRecord.id,
          subject,
          body_text: bodyText.slice(0, 10000),
          email_type: 'other' as const,
        })
        continue
      }

      const appStatus = mapToApplicationStatus(
        analysis.status,
        analysis.email_type
      )

      // Upsert application (match by company name)
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userRecord.id)
        .eq('company_name', analysis.company_name)
        .maybeSingle()

      let applicationId: string

      if (existingApp) {
        await supabase
          .from('applications')
          .update({
            status: appStatus,
            latest_email_subject: subject,
            ...(analysis.interview_date
              ? { interview_date: analysis.interview_date }
              : {}),
            ...(analysis.event_date
              ? { event_date: analysis.event_date }
              : {}),
          })
          .eq('id', existingApp.id)
        applicationId = existingApp.id
      } else {
        const { data: newApp } = await supabase
          .from('applications')
          .insert({
            user_id: userRecord.id,
            company_name: analysis.company_name,
            status: appStatus,
            latest_email_subject: subject,
            interview_date: analysis.interview_date ?? null,
            event_date: analysis.event_date ?? null,
          })
          .select('id')
          .single()
        applicationId = newApp!.id
      }

      await supabase.from('email_logs').insert({
        user_id: userRecord.id,
        application_id: applicationId,
        subject,
        body_text: bodyText.slice(0, 10000),
        email_type: analysis.email_type as 'selection' | 'event' | 'other',
      })

      processed++
    } catch (err) {
      console.error(`Failed to process Gmail message ${msgId}:`, err)
    }
  }

  return NextResponse.json({ ok: true, processed })
}
