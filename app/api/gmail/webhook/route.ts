import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeEmail } from '@/lib/gemini'
import { sanitizeCandidates, toISODateOrNull } from '@/lib/interview-dates'
import { findGroupApps, findOrCreateSiblingProcess } from '@/lib/process-routing'
import {
  refreshAccessToken,
  gmailFetch,
  extractBody,
  extractHeader,
} from '@/lib/gmail'
import type { GmailMessage, GmailHistoryItem } from '@/lib/gmail'
import type { ApplicationStatus, ProcessType } from '@/types/database'

export const maxDuration = 60

function verifyWebhookToken(provided: string, expected: string): boolean {
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected)) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}

function extractSenderDomain(from: string): string {
  const addr = (from.match(/<([^>]+)>/) ?? [])[1] ?? from
  return addr.trim().split('@')[1]?.toLowerCase() ?? ''
}

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
  const secret = process.env.GMAIL_WEBHOOK_SECRET
  const provided = request.nextUrl.searchParams.get('token') ?? ''
  if (!secret || !verifyWebhookToken(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = (body as { message?: { data?: string } }).message
  if (!message?.data) return NextResponse.json({ ok: true })

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

  let histRes = await gmailFetch(
    `/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
    accessToken
  )

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

      if (msg.labelIds?.includes('SENT')) continue

      const subject = extractHeader(msg.payload, 'subject') || '(件名なし)'
      const from = extractHeader(msg.payload, 'from')
      const bodyText = extractBody(msg.payload)

      if (!subject && !bodyText) continue

      const senderDomain = extractSenderDomain(from)

      // Check if sender domain has any tracked process for this company
      const group = senderDomain ? await findGroupApps(supabase, userRecord.id, senderDomain) : []

      if (group.length === 0) {
        // Untracked → save without AI
        await supabase.from('email_logs').insert({
          user_id: userRecord.id,
          subject,
          body_text: bodyText.slice(0, 10000),
          email_type: 'other' as const,
        })
        continue
      }

      // Tracked → AI analysis
      let analysis
      try {
        analysis = await analyzeEmail(subject, bodyText, from)
      } catch (err) {
        console.error(`Groq analysis failed for ${msgId}:`, err)
        await supabase.from('email_logs').insert({
          user_id: userRecord.id,
          application_id: group[0].id,
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
      const processType: ProcessType = analysis.process_type ?? 'other'

      const sibling = await findOrCreateSiblingProcess(
        supabase, userRecord.id, senderDomain, group[0].company_name, processType, group
      )
      const trackedApp = sibling
        ? { id: sibling.id, company_name: group[0].company_name, status: sibling.status }
        : group[0]

      const safeCandidates = sanitizeCandidates(analysis.interview_date_candidates)
      const safeInterviewDate = safeCandidates[0] ?? toISODateOrNull(analysis.interview_date)
      const safeEventDate = toISODateOrNull(analysis.event_date)

      // Core update: status + dates (no updated_by — column may not exist yet)
      await supabase
        .from('applications')
        .update({
          status: appStatus,
          latest_email_subject: subject,
          ...(safeInterviewDate ? { interview_date: safeInterviewDate } : {}),
          ...(safeEventDate ? { event_date: safeEventDate } : {}),
          ...(safeCandidates.length > 0
            ? { interview_date_candidates: safeCandidates, interview_date_confirmed: safeCandidates.length <= 1 }
            : {}),
        })
        .eq('id', trackedApp.id)

      // Optional: mark as AI-updated; no-op if updated_by column doesn't exist yet
      await supabase
        .from('applications')
        .update({ updated_by: 'ai' })
        .eq('id', trackedApp.id)

      await supabase.from('email_logs').insert({
        user_id: userRecord.id,
        application_id: trackedApp.id,
        subject,
        body_text: bodyText.slice(0, 10000),
        email_type: analysis.email_type as 'selection' | 'event' | 'other',
      })

      if (appStatus !== trackedApp.status) {
        await supabase.from('email_logs').insert({
          user_id: userRecord.id,
          application_id: trackedApp.id,
          subject: 'ステータス更新',
          body_text: JSON.stringify({
            company_name: trackedApp.company_name,
            from_status: trackedApp.status,
            to_status: appStatus,
          }),
          email_type: 'manual_update' as const,
        })
      }

      processed++
    } catch (err) {
      console.error(`Failed to process Gmail message ${msgId}:`, err)
    }
  }

  return NextResponse.json({ ok: true, processed })
}
