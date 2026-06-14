import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { analyzeEmail } from '@/lib/gemini'
import type { ApplicationStatus } from '@/types/database'

export const maxDuration = 60
import type { Database } from '@/types/database'

// Mailgun署名を検証
function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): boolean {
  const value = timestamp + token
  const hmac = crypto
    .createHmac('sha256', signingKey)
    .update(value)
    .digest('hex')
  return hmac === signature
}

// OpenAIのstatusをApplicationStatusにマッピング
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

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const timestamp = formData.get('timestamp') as string
  const token = formData.get('token') as string
  const signature = formData.get('signature') as string
  const signingKey = process.env.MAILGUN_SIGNING_KEY!

  // 本番環境では署名を必ず検証
  if (process.env.NODE_ENV === 'production') {
    if (!verifyMailgunSignature(signingKey, timestamp, token, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const recipient = formData.get('recipient') as string
  const sender = formData.get('sender') as string
  const subject = formData.get('subject') as string
  const bodyPlain = (formData.get('body-plain') as string) ?? ''

  if (!recipient) {
    return NextResponse.json({ error: 'No recipient' }, { status: 400 })
  }

  // service_role で直接DBアクセス（Webhookはセッション外）
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // dedicated_emailから対象ユーザーを特定
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('dedicated_email', recipient.toLowerCase())
    .single()

  if (!user) {
    // 宛先が登録ユーザーでなければ無視（200を返してMailgunに再送させない）
    return NextResponse.json({ message: 'User not found, ignored' })
  }

  // OpenAIでメール解析
  let analysis
  try {
    analysis = await analyzeEmail(subject, bodyPlain, sender)
  } catch (err) {
    console.error('OpenAI analysis failed:', err)
    // 解析失敗でもメールログは保存
    const { data: log } = await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        subject,
        body_text: bodyPlain.slice(0, 10000),
        email_type: 'other',
      })
      .select('id')
      .single()

    return NextResponse.json({ message: 'Saved without analysis', log_id: log?.id })
  }

  const appStatus = mapToApplicationStatus(analysis.status, analysis.email_type)

  // applications をupsert（同一企業名なら更新）
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_name', analysis.company_name)
    .single()

  let applicationId: string

  if (existingApp) {
    await supabase
      .from('applications')
      .update({
        status: appStatus,
        latest_email_subject: subject,
        ...(analysis.interview_date && { interview_date: analysis.interview_date }),
        ...(analysis.event_date && { event_date: analysis.event_date }),
      })
      .eq('id', existingApp.id)
    applicationId = existingApp.id
  } else {
    const { data: newApp } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
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

  // email_logs に保存
  await supabase.from('email_logs').insert({
    user_id: user.id,
    application_id: applicationId,
    subject,
    body_text: bodyPlain.slice(0, 10000),
    email_type: analysis.email_type,
  })

  return NextResponse.json({ message: 'OK', company: analysis.company_name, status: appStatus })
}
