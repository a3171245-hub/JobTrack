export default function MailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-[#1e1b4b] dark:to-violet-900">
      <div className="border-b border-slate-100 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="skeleton w-8 h-8 rounded-xl" />
            <div className="skeleton w-20 h-4 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="skeleton w-24 h-9 rounded-lg" />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="skeleton w-32 h-8 mb-1.5 rounded" />
        <div className="skeleton w-72 h-4 mb-6 rounded" />

        {/* 検索バー */}
        <div className="skeleton h-10 rounded-xl mb-2.5" />

        {/* フィルターピル */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton w-16 h-8 rounded-full" />
          ))}
        </div>

        {/* メール一覧 */}
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  )
}
