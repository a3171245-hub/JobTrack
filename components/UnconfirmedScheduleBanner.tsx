'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'

export default function UnconfirmedScheduleBanner() {
  const { applications } = useDashboard()

  const unconfirmed = useMemo(
    () =>
      applications.filter(
        (a) => (a.interview_date_candidates?.length ?? 0) > 1 && a.interview_date_confirmed === false
      ),
    [applications]
  )

  if (unconfirmed.length === 0) return null

  return (
    <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-5 py-4 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {unconfirmed.length}社の面接日程が未確定です
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
            複数の日程候補から選んでカレンダーに登録しましょう
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {unconfirmed.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/company/${a.id}#interview-date`}
                className="inline-flex items-center gap-1 text-xs font-medium bg-white dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 rounded-full px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              >
                {a.company_name}
                <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
