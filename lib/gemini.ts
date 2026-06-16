import Groq from 'groq-sdk'

export interface EmailAnalysis {
  company_name: string
  email_type: 'selection' | 'event' | 'other'
  status: 'offer' | 'rejected' | 'interview_1' | 'interview_2' | 'final' | 'document' | 'schedule' | 'unknown'
  interview_date: string | null
  event_date: string | null
}

export async function analyzeEmail(
  subject: string,
  body: string,
  fromEmail: string
): Promise<EmailAnalysis> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const prompt = `以下は日本の就活生に届いた企業からのメールです。
JSON形式で情報を抽出してください。

From: ${fromEmail}
件名: ${subject}

本文:
${body.slice(0, 3000)}

抽出するJSON:
- company_name: 企業名（メールのFromや本文から判断）
- email_type: selection（選考通過/お祈り/面接案内）またはevent（説明会/インターン/イベント告知）またはother
- status: offer/rejected/interview_1/interview_2/final/document/schedule/unknown
- interview_date: 面接日程がある場合ISO8601形式、なければnull
- event_date: イベント日程がある場合ISO8601形式、なければnull

必ずJSON形式のみで返答してください。`

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const text = completion.choices[0].message.content ?? '{}'
  return JSON.parse(text) as EmailAnalysis
}
