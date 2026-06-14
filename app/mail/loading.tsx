export default function MailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="skeleton w-28 h-6" />
          <div className="skeleton w-40 h-6" />
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="skeleton w-40 h-8 mb-6" />
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  )
}
