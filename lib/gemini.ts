import Groq from 'groq-sdk'

export interface EmailAnalysis {
  company_name: string
  email_type: 'selection' | 'event' | 'other'
  status: 'offer' | 'rejected' | 'interview_1' | 'interview_2' | 'final' | 'document' | 'schedule' | 'unknown'
  // First candidate only (or null if none). Always derived from interview_date_candidates[0].
  interview_date: string | null
  // All interview date candidates. May be 0, 1, or many (e.g. 候補A/B/C emails).
  interview_date_candidates: string[]
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
- interview_date_candidates: 面接日程候補を全てISO8601形式の配列で返す（候補A/B/C形式の場合は全て含める）。日程がない場合は空配列[]
- event_date: イベント日程がある場合ISO8601形式、なければnull

必ずJSON形式のみで返答してください。`

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const text = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(text) as Record<string, unknown>

  // Normalize candidates: always an array of strings
  const rawCandidates = parsed.interview_date_candidates
  const candidates: string[] = Array.isArray(rawCandidates)
    ? rawCandidates.filter((d): d is string => typeof d === 'string' && d !== 'null')
    : typeof parsed.interview_date === 'string' && parsed.interview_date !== 'null'
      ? [parsed.interview_date as string]
      : []

  return {
    company_name: typeof parsed.company_name === 'string' ? parsed.company_name : '',
    email_type: (['selection', 'event', 'other'].includes(parsed.email_type as string)
      ? parsed.email_type : 'other') as EmailAnalysis['email_type'],
    status: (['offer','rejected','interview_1','interview_2','final','document','schedule','unknown']
      .includes(parsed.status as string) ? parsed.status : 'unknown') as EmailAnalysis['status'],
    interview_date_candidates: candidates,
    interview_date: candidates[0] ?? null,
    event_date: typeof parsed.event_date === 'string' && parsed.event_date !== 'null'
      ? parsed.event_date : null,
  }
}
