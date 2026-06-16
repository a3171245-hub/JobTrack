'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400 dark:text-red-400" />
        </div>
        <p className="text-6xl font-black text-slate-200 dark:text-white/10 mb-2 leading-none">500</p>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          エラーが発生しました
        </h1>
        <p className="text-sm text-slate-500 dark:text-indigo-300/60 mb-8">
          予期しないエラーが発生しました。しばらくしてからもう一度お試しください。
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-indigo-600/25"
          >
            <RefreshCw className="w-4 h-4" />
            再試行
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-semibold text-sm transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
