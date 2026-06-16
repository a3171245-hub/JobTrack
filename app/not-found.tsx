import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-slate-400 dark:text-indigo-300" />
        </div>
        <p className="text-6xl font-black text-slate-200 dark:text-white/10 mb-2 leading-none">404</p>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          ページが見つかりません
        </h1>
        <p className="text-sm text-slate-500 dark:text-indigo-300/60 mb-8">
          お探しのページは移動または削除された可能性があります。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-indigo-600/25"
        >
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
