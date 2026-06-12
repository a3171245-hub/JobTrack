'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { STATUS_LABELS } from '@/lib/constants'
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
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
    <div className="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-semibold text-blue-800">
          今日の更新
          {totalCount > 0 && (
            <span className="ml-1 font-normal text-blue-600">({totalCount}件)</span>
          )}
        </span>
      </div>

      {totalCount === 0 ? (
        <p className="text-xs text-slate-400">今日の更新はまだありません</p>
      ) : (
        <div className="flex flex-col gap-1">
          {todayDeadlines.map((app) => (
            <div key={`deadline-${app.id}`} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium truncate max-w-[140px]">{app.company_name}</span>
              <span className="text-slate-500 text-xs">：</span>
              <span className="text-xs flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                ES締切 今日
              </span>
            </div>
          ))}
          {todayUpdates.map((update) => (
            <div key={update.id} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium truncate max-w-[140px]">{update.companyName}</span>
              <span className="text-slate-500 text-xs">：</span>
              <span className="text-xs text-slate-600 flex items-center gap-1">
                {update.action ? (
                  <span className="text-blue-700 font-medium">{update.action}</span>
                ) : (
                  <>
                    <span className="text-slate-500">{STATUS_LABELS[update.fromStatus!]}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="text-blue-700 font-medium">{STATUS_LABELS[update.toStatus!]}</span>
                  </>
                )}
              </span>
              <span className="text-slate-400 text-xs ml-auto flex-shrink-0">
                {format(new Date(update.timestamp), 'HH:mm', { locale: ja })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
