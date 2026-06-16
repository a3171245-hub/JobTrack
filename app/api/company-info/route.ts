import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  // Must be authenticated to prevent API key abuse
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const name = req.nextUrl.searchParams.get('name')
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  try {
    const result = await model.generateContent(`「${name}」という企業について、就活生向けに以下のJSONで情報を教えてください。
存在しない企業や不明な場合は推測で回答してください。

{
  "industry": "業界（例: IT/SaaS、総合商社、コンサルティングなど）",
  "business": "事業内容（1〜2文で簡潔に）",
  "jobs": "採用職種（例: ソフトウェアエンジニア、営業職など）"
}

JSONのみを返してください。`)

    const content = result.response.text()
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
