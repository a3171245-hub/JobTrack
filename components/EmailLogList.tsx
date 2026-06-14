import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Mail, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type EmailLog = Database['public']['Tables']['email_logs']['Row']

const EMAIL_TYPE_LABELS: Record<string, string> = {
  selection: '選考結果',
  event: 'イベント',
  other: 'その他',
  manual_update: '手動更新',
}

const EMAIL_TYPE_COLORS: Record<string, string> = {
  selection: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  event: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  other: 'bg-slate-50 text-slate-600 border-slate-200',
  manual_update: 'bg-slate-50 text-slate-500 border-slate-200',
}

export default function EmailLogList({ logs }: { logs: EmailLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Inbox className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">受信メールがありません</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {logs.map((log) => (
        <div key={log.id} className="py-4 flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
            <Mail className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-slate-800 text-sm leading-snug truncate">
                {log.subject ?? '（件名なし）'}
              </p>
              <Badge
                variant="outline"
                className={`flex-shrink-0 text-xs px-2 py-0 ${EMAIL_TYPE_COLORS[log.email_type]}`}
              >
                {EMAIL_TYPE_LABELS[log.email_type]}
              </Badge>
            </div>
            {log.body_text && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {log.body_text}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {format(new Date(log.received_at), 'yyyy年M月d日(E) HH:mm', { locale: ja })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
