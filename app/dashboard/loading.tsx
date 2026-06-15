export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* nav skeleton */}
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

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="skeleton h-24 rounded-2xl mb-8" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-3">
            <div className="skeleton w-24 h-6 rounded-lg" />
            <div className="skeleton w-8 h-4 rounded" />
          </div>
          <div className="skeleton w-28 h-9 rounded-xl" />
        </div>

        <div className="flex gap-3 mb-4">
          <div className="skeleton w-56 h-9 rounded-xl" />
          <div className="skeleton w-40 h-9 rounded-xl" />
        </div>

        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
          <div className="skeleton h-12 rounded-none" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="skeleton w-36 h-4 rounded" />
              <div className="skeleton w-20 h-6 rounded-full ml-4" />
              <div className="skeleton w-48 h-4 rounded ml-auto hidden md:block" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
