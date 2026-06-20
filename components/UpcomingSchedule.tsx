'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { CalendarClock, Users, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

function daysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

function relativeLabel(days: number): string {
  if (days === 0) return '今日'
  if (days === 1) return '明日'
  return `${days}日後`
}

interface EventItem {
  id: string
  companyName: string
  date: Date
  kind: 'interview' | 'event'
}

interface DeadlineItem {
  id: string
  companyName: string
  date: Date
}

export default function UpcomingSchedule() {
  const { applications } = useDashboard()
  const now = new Date()

  const upcomingEvents: EventItem[] = applications
    .flatMap((a) => {
      const items: EventItem[] = []
      if (a.interview_date && new Date(a.interview_date) >= now) {
        items.push({ id: `interview-${a.id}`, companyName: a.company_name, date: new Date(a.interview_date), kind: 'interview' })
      }
      if (a.event_date && new Date(a.event_date) >= now) {
        items.push({ id: `event-${a.id}`, companyName: a.company_name, date: new Date(a.event_date), kind: 'event' })
      }
      return items
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const upcomingDeadlines: DeadlineItem[] = applications
    .filter((a) => {
      if (!a.es_deadline) return false
      const days = daysUntil(new Date(a.es_deadline))
      return days >= 0 && days <= 3
    })
    .map((a) => ({ id: `deadline-${a.id}`, companyName: a.company_name, date: new Date(a.es_deadline!) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const totalCount = upcomingEvents.length + upcomingDeadlines.length

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl ring-1 ring-slate-900/5 dark:ring-slate-700/60 shadow-sm overflow-hidden animate-fade-in-up transition-colors border-l-4 border-l-violet-500">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 border-b border-violet-100/70 dark:border-violet-800/30">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
          <CalendarClock className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">今後の予定</span>
        {totalCount > 0 && (
          <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-white/70 dark:bg-violet-950/60 rounded-full px-2 py-0.5 border border-violet-100 dark:border-violet-800/50">
            {totalCount}件
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {totalCount === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-600 py-1.5">直近の予定はありません</p>
        ) : (
          <ul className="space-y-2.5">
            {upcomingDeadlines.map((item) => {
              const days = daysUntil(item.date)
              return (
                <li key={item.id} className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] flex-1">
                    {item.companyName}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                    {format(item.date, 'M/d(E)', { locale: ja })}
                  </span>
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex-shrink-0">
                    ES締切 {relativeLabel(days)}
                  </span>
                </li>
              )
            })}
            {upcomingEvents.map((item) => {
              const days = daysUntil(item.date)
              return (
                <li key={item.id} className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 flex-shrink-0 ${item.kind === 'interview' ? 'text-indigo-500' : 'text-teal-500'}`} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] flex-1">
                    {item.companyName}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                    {format(item.date, 'M/d(E) HH:mm', { locale: ja })}
                  </span>
                  <span className={`text-xs font-medium flex-shrink-0 ${item.kind === 'interview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-teal-600 dark:text-teal-400'}`}>
                    {item.kind === 'interview' ? '面接' : '説明会'} {relativeLabel(days)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
