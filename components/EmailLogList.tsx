import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Mail, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type EmailLog = Database['public']['Tables']['email_logs']['Row']

// Same semantic color rules as MailList.tsx
// selection=Violet / event=Amber / other=Slate / manual_update=Sky
const EMAIL_TYPE_CONFIG: Record<string, { label: string; badge: string }> = {
  selection: {
    label: '選考',
    badge: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-700/50',
  },
  event: {
    label: 'イベント',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50',
  },
  other: {
    label: 'その他',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600/50',
  },
  manual_update: {
    label: '手動更新',
    badge: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700/50',
  },
}

const FALLBACK_CONFIG = EMAIL_TYPE_CONFIG.other

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
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {logs.map((log) => {
        const cfg = EMAIL_TYPE_CONFIG[log.email_type] ?? FALLBACK_CONFIG
        return (
          <div key={log.id} className="py-4 flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
              <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-snug truncate">
                  {log.subject ?? '（件名なし）'}
                </p>
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-xs px-2 py-0 ${cfg.badge}`}
                >
                  {cfg.label}
                </Badge>
              </div>
              {log.body_text && (
                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                  {log.body_text}
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {format(new Date(log.received_at), 'yyyy年M月d日(E) HH:mm', { locale: ja })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
