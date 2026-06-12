import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import EsDeadlineEditor from '@/components/EsDeadlineEditor'
import EmailLogList from '@/components/EmailLogList'
import StatusSelector from '@/components/StatusSelector'
import AptitudeTestSection from '@/components/AptitudeTestSection'
import MemoSection from '@/components/MemoSection'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AFFILIATE_URL } from '@/lib/constants'
import { DUMMY_APPLICATIONS, DUMMY_EMAIL_LOGS } from '@/lib/dummy-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { TestResult } from '@/types/database'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const supabase = createAdminClient()

  const [appResult, logsResult, profileResult] = await Promise.allSettled([
    supabase.from('applications').select('*').eq('id', id).single(),
    supabase
      .from('email_logs')
      .select('*')
      .eq('application_id', id)
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
      : DUMMY_APPLICATIONS.find((a) => a.id === id)

  if (!application) notFound()

  const emailLogs =
    logsResult.status === 'fulfilled' && logsResult.value.data?.length
      ? logsResult.value.data
      : DUMMY_EMAIL_LOGS.filter((l) => l.application_id === id).sort(
          (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
        )

  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null

  const initial =
    application.company_name.replace(/株式会社|合同会社|有限会社/g, '').trim()[0] ?? '?'

  const avatarColors = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-cyan-100 text-cyan-700',
    'bg-pink-100 text-pink-700',
  ]
  const avatarColor =
    avatarColors[application.company_name.charCodeAt(0) % avatarColors.length]

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar user={user} dedicatedEmail={profile?.dedicated_email ?? null} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5 mb-6 -ml-2 text-slate-500'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        {/* 企業ヘッダー */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${avatarColor}`}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {application.company_name}
            </h1>
            <p className="text-sm text-slate-500">
              応募日: {new Date(application.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <StatusSelector
            applicationId={application.id}
            currentStatus={application.status}
          />
        </div>

        {/* お祈りバナー */}
        {application.status === 'rejected' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-red-700 mb-0.5">残念ながら不採用でした</p>
              <p className="text-sm text-red-500">
                就活エージェントに相談して次の企業探しをサポートしてもらいましょう。
              </p>
            </div>
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'flex-shrink-0 gap-1.5 bg-red-600 hover:bg-red-700'
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              エージェントに相談
            </a>
          </div>
        )}

        {/* 企業情報メモ（AI取得） */}
        {application.notes && (
          <section className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-xs font-semibold text-blue-600 mb-1.5">企業情報メモ</p>
            <p className="text-sm text-slate-700 whitespace-pre-line">{application.notes}</p>
          </section>
        )}

        {/* ES締切日 */}
        <section className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">ES締切日</h2>
          <EsDeadlineEditor
            applicationId={application.id}
            initialDeadline={application.es_deadline ?? null}
          />
        </section>

        {/* メモ */}
        <MemoSection applicationId={application.id} />

        {/* 適性検査セクション */}
        <div className="mb-6">
          <AptitudeTestSection
            applicationId={application.id}
            initialTestType={application.test_type ?? null}
            initialTestDate={application.test_date ?? null}
            initialTestResult={(application.test_result as TestResult | null) ?? null}
          />
        </div>

        {/* 受信メール一覧 */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            受信メール
            <span className="ml-2 text-sm font-normal text-slate-400">
              {emailLogs.filter((l) => l.email_type !== 'manual_update').length}件
            </span>
          </h2>
          <EmailLogList logs={emailLogs.filter((l) => l.email_type !== 'manual_update')} />
        </section>
      </main>
    </div>
  )
}
