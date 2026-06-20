export default function CalendarLoading() {
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="skeleton w-40 h-8 mb-1.5 rounded" />
        <div className="skeleton w-72 h-4 mb-6 rounded" />

        {/* 月送り + 予定追加ボタン */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="skeleton w-28 h-6 rounded" />
            <div className="skeleton w-8 h-8 rounded-lg" />
          </div>
          <div className="skeleton w-32 h-9 rounded-xl" />
        </div>

        {/* フィルターピル */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton w-16 h-9 rounded-xl" />
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="py-2.5 flex justify-center">
                <div className="skeleton w-4 h-3 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square border-b border-r border-slate-100 dark:border-slate-800 p-1.5"
              >
                <div className="skeleton w-5 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
