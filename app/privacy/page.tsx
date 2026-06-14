import Link from 'next/link'
import { ArrowLeft, Inbox } from 'lucide-react'

export const metadata = { title: 'プライバシーポリシー | JobTrack' }

const SECTIONS = [
  {
    title: '1. 取得する情報',
    body: 'JobTrack（以下「本サービス」）は、Googleアカウントのメールアドレス・氏名、専用メールアドレス宛に届いたメールの内容、ユーザーが入力した企業情報・メモ・予定などを取得します。',
  },
  {
    title: '2. 利用目的',
    body: '取得した情報は、選考状況の自動解析・表示、スケジュール管理、本サービスの提供および改善のためにのみ利用します。',
  },
  {
    title: '3. 第三者提供',
    body: '法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者へ提供することはありません。AI解析にあたっては、必要最小限の範囲で外部のAIサービスを利用する場合があります。',
  },
  {
    title: '4. データの管理',
    body: 'ユーザーのデータは、行レベルセキュリティ（RLS）によりログインユーザー本人のみがアクセスできるよう保護されます。通信は暗号化されます。',
  },
  {
    title: '5. データの削除',
    body: 'ユーザーはいつでも自身の登録企業データを削除できます。アカウント削除のご希望は運営者までお問い合わせください。',
  },
  {
    title: '6. お問い合わせ',
    body: '本ポリシーに関するお問い合わせは、本サービス運営者までご連絡ください。',
  },
]

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          プライバシーポリシー
        </h1>
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
