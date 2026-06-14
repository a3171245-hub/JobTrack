import Link from 'next/link'
import { ArrowLeft, Inbox } from 'lucide-react'

export const metadata = { title: '利用規約 | JobTrack' }

const SECTIONS = [
  {
    title: '第1条（適用）',
    body: '本規約は、JobTrack（以下「本サービス」）の利用に関する条件を、本サービスを利用するすべてのユーザーと運営者との間で定めるものです。',
  },
  {
    title: '第2条（利用登録）',
    body: 'ユーザーはGoogleアカウントによる認証を通じて本サービスを利用します。登録情報は正確かつ最新の内容を保つものとします。',
  },
  {
    title: '第3条（禁止事項）',
    body: '法令または公序良俗に違反する行為、本サービスの運営を妨害する行為、他者になりすます行為、その他運営者が不適切と判断する行為を禁止します。',
  },
  {
    title: '第4条（メールの取り扱い）',
    body: '本サービスは、ユーザーが発行を受けた専用メールアドレス宛に届いたメールを解析し、選考状況の管理に利用します。ユーザーは自身の責任において当該アドレスを各就活サイトへ登録するものとします。',
  },
  {
    title: '第5条（免責事項）',
    body: '本サービスはAIによる自動解析を行いますが、その正確性・完全性を保証するものではありません。本サービスの利用により生じた損害について、運営者は一切の責任を負いません。',
  },
  {
    title: '第6条（規約の変更）',
    body: '運営者は、必要と判断した場合には、ユーザーへの通知なく本規約を変更できるものとします。',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <Inbox className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">JobTrack</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          トップに戻る
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">利用規約</h1>
        <p className="text-sm text-slate-400 mb-10">最終更新日: 2026年6月15日</p>

        <div className="space-y-8 bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm p-8">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="font-bold text-slate-800 mb-2">{title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
