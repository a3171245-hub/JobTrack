export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* nav skeleton */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="skeleton w-8 h-8 rounded-xl" />
            <div className="skeleton w-20 h-4" />
          </div>
          <div className="skeleton w-24 h-8 rounded-lg" />
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* today widget */}
        <div className="skeleton h-28 rounded-2xl mb-8" />

        <div className="flex items-center justify-between mb-5">
          <div className="skeleton w-32 h-6" />
          <div className="skeleton w-28 h-9 rounded-lg" />
        </div>

        {/* filter bar */}
        <div className="flex gap-3 mb-4">
          <div className="skeleton w-64 h-9 rounded-xl" />
          <div className="skeleton w-44 h-9 rounded-xl" />
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-9 h-9 rounded-xl" />
              <div className="skeleton w-40 h-4" />
              <div className="skeleton w-20 h-6 rounded-full ml-4" />
              <div className="skeleton w-48 h-4 ml-auto hidden md:block" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
