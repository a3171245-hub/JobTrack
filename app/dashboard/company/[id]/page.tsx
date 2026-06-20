import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import EsDeadlineEditor from '@/components/EsDeadlineEditor'
import CompanyUrlEditor from '@/components/CompanyUrlEditor'
import EmailLogList from '@/components/EmailLogList'
import StatusSelector from '@/components/StatusSelector'
import InterviewDateSelector from '@/components/InterviewDateSelector'
import AptitudeTestSection from '@/components/AptitudeTestSection'
import MemoSection from '@/components/MemoSection'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AFFILIATE_URL } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, CalendarClock, Mail } from 'lucide-react'
import type { TestResult } from '@/types/database'

const AVATAR_COLORS = [
  'bg-gradient-to-br from-indigo-500 to-violet-500',
  'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-sky-500 to-indigo-500',
  'bg-gradient-to-br from-rose-500 to-pink-500',
]

// 認証クッキーに依存するため常に動的レンダリング（ユーザーごとに内容が異なる）
export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const supabase = createAdminClient()

  const [appResult, logsResult, profileResult] = await Promise.allSettled([
    supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('email_logs')
      .select('*')
      .eq('application_id', id)
      .eq('user_id', user.id)
      .order('received_at', { ascending: false }),
    supabase
      .from('users')
      .select('dedicated_email')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const application =
    appResult.status === 'fulfilled' && appResult.value.data
      ? appResult.value.data
      : null

  if (!application) notFound()

  const emailLogs =
    logsResult.status === 'fulfilled' && logsResult.value.data
      ? logsResult.value.data
      : []

  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null

  const initial =
    application.company_name.replace(/株式会社|合同会社|有限会社/g, '').trim()[0] ?? '?'
  const avatarColor =
    AVATAR_COLORS[application.company_name.charCodeAt(0) % AVATAR_COLORS.length]

  const receivedMails = emailLogs.filter((l) => l.email_type !== 'manual_update')

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5 mb-5 -ml-2 text-slate-500'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        {/* 企業ヘッダー */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm p-6 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-sm flex-shrink-0 ${avatarColor}`}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-1.5 truncate">
                {application.company_name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  登録日 {new Date(application.created_at).toLocaleDateString('ja-JP')}
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  受信メール {receivedMails.length}件
                </span>
              </div>
            </div>
            <StatusSelector
              applicationId={application.id}
              currentStatus={application.status}
            />
          </div>
        </div>

        {/* お祈りバナー */}
        {application.status === 'rejected' && (
          <div className="mb-6 bg-rose-50 ring-1 ring-rose-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-rose-700 mb-0.5">
                残念ながら今回はご縁がありませんでした
              </p>
              <p className="text-sm text-rose-500">
                エージェントに相談して、次のチャンスを一緒に見つけましょう。
              </p>
            </div>
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'flex-shrink-0 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white'
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              エージェントに相談
            </a>
          </div>
        )}

        {/* 面接日程の確認・入力UI
            - 候補が複数あり未確定の場合: 候補から選ぶ
            - 面接段階だが日程が一切わからない場合（マイページ参照等）: 自分で入力する */}
        {(
          (!application.interview_date_confirmed && (application.interview_date_candidates?.length ?? 0) > 1) ||
          (['interview_1', 'interview_2', 'final'].includes(application.status) && !application.interview_date)
        ) && (
          <InterviewDateSelector
            applicationId={application.id}
            companyName={application.company_name}
            candidates={application.interview_date_candidates ?? []}
            userId={user.id}
          />
        )}

        {/* マイページ */}
        <section className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">マイページ</h2>
          <CompanyUrlEditor
            applicationId={application.id}
            initialUrl={application.company_url ?? null}
          />
        </section>

        {/* ES締切日 */}
        <section className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">ES締切日</h2>
          <EsDeadlineEditor
            applicationId={application.id}
            initialDeadline={application.es_deadline ?? null}
          />
        </section>

        {/* メモ（Supabaseに保存） */}
        <MemoSection
          applicationId={application.id}
          initialMemo={application.memo ?? null}
        />

        {/* 適性検査セクション */}
        <div className="mb-6">
          <AptitudeTestSection
            applicationId={application.id}
            initialTestType={application.test_type ?? null}
            initialTestDate={application.test_date ?? null}
            initialTestResult={
              (application.test_result as TestResult | null) ?? null
            }
          />
        </div>

        {/* 受信メール一覧 */}
        <section className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            受信メール
            <span className="ml-2 text-sm font-normal text-slate-400">
              {receivedMails.length}件
            </span>
          </h2>
          <EmailLogList logs={receivedMails} />
        </section>
      </main>
    </div>
  )
}
