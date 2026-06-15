'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { STATUS_LABELS } from '@/lib/constants'
import { ArrowRight, Sparkles, AlertCircle, PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function TodayUpdates() {
  const { todayUpdates, applications } = useDashboard()

  const today = new Date()
  const todayDeadlines = applications.filter((a) => {
    if (!a.es_deadline) return false
    return isSameDate(new Date(a.es_deadline), today)
  })

  const totalCount = todayUpdates.length + todayDeadlines.length

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl ring-1 ring-slate-900/5 dark:ring-slate-700/60 shadow-sm overflow-hidden animate-fade-in-up transition-colors">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border-b border-indigo-100/70 dark:border-indigo-800/30">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">今日の更新</span>
        {totalCount > 0 && (
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-indigo-950/60 rounded-full px-2 py-0.5 border border-indigo-100 dark:border-indigo-800/50">
            {totalCount}件
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {totalCount === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-600 py-1.5">今日の更新はまだありません</p>
        ) : (
          <ol className="relative">
            {todayDeadlines.map((app, i) => (
              <TimelineRow
                key={`deadline-${app.id}`}
                last={i === todayDeadlines.length - 1 && todayUpdates.length === 0}
                dotClass="bg-rose-500"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {app.company_name}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  ES締切 今日まで
                </span>
              </TimelineRow>
            ))}
            {todayUpdates.map((update, i) => (
              <TimelineRow
                key={update.id}
                last={i === todayUpdates.length - 1}
                dotClass={update.action ? 'bg-emerald-500' : 'bg-indigo-500'}
                time={format(new Date(update.timestamp), 'HH:mm', { locale: ja })}
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {update.companyName}
                </span>
                {update.action ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <PlusCircle className="w-3.5 h-3.5" />
                    {update.action}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 dark:text-slate-500">
                      {STATUS_LABELS[update.fromStatus!]}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {STATUS_LABELS[update.toStatus!]}
                    </span>
                  </span>
                )}
              </TimelineRow>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function TimelineRow({
  children,
  time,
  dotClass,
  last,
}: {
  children: React.ReactNode
  time?: string
  dotClass: string
  last?: boolean
}) {
  return (
    <li className="relative flex items-center gap-3 pl-6 py-2">
      {!last && (
        <span className="absolute left-[5px] top-1/2 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
      )}
      <span className="absolute left-0 top-1/2 -translate-y-1/2">
        <span className={`block w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${dotClass}`} />
      </span>
      <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
        {children}
      </div>
      {time && (
        <span className="text-xs text-slate-400 dark:text-slate-600 flex-shrink-0 tabular-nums">
          {time}
        </span>
      )}
    </li>
  )
}
