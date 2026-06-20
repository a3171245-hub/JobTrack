import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { companyInfoSchema, parseBody } from '@/lib/validate'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP (Groq quota protection)
  if (!checkRateLimit(req, { id: 'company-info', max: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  // Must be authenticated to prevent API key abuse
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawName = req.nextUrl.searchParams.get('name')
  const validation = parseBody(companyInfoSchema, { name: rawName })
  if (!validation.ok) return validation.response

  const { name } = validation.data

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const prompt = `「${name}」という企業について、就活生向けに以下のJSONで情報を教えてください。
存在しない企業や不明な場合は推測で回答してください。

{
  "industry": "業界（例: IT/SaaS、総合商社、コンサルティングなど）",
  "business": "事業内容（1〜2文で簡潔に）",
  "jobs": "採用職種（例: ソフトウェアエンジニア、営業職など）"
}

必ずJSON形式のみで返答してください。`

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Empty response')

    const parsed = JSON.parse(content) as {
      industry: string
      business: string
      jobs: string
    }

    const notes = `業界：${parsed.industry}\n事業内容：${parsed.business}\n採用職種：${parsed.jobs}`
    return NextResponse.json({ notes, ...parsed })
  } catch (err) {
    console.error('company-info error:', err)
    return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 })
  }
}
