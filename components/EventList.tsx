'use client'

import type { Database } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type Application = Database['public']['Tables']['applications']['Row']

export default function EventList({ events }: { events: Application[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <CalendarDays className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">イベント・説明会の予定はありません</p>
        <p className="text-xs mt-1">企業からイベント告知メールが届くと自動で表示されます</p>
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  })

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((event) => (
        <Card key={event.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">{event.company_name}</span>
            </div>

            {event.latest_email_subject && (
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                {event.latest_email_subject}
              </p>
            )}

            {event.event_date ? (
              <div className="flex items-center gap-1.5 text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-1.5">
                <CalendarDays className="w-4 h-4" />
                <span className="font-medium">
                  {format(new Date(event.event_date), 'M月d日(E) HH:mm', {
                    locale: ja,
                  })}
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs">
                日程未定
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
