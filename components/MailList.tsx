'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Mail, X } from 'lucide-react'

type EmailLog = {
  id: string
  application_id: string | null
  subject: string | null
  body_text: string | null
  received_at: string
  email_type: string
}

const EMAIL_TYPE_LABELS: Record<
  string,
  { label: string; className: string; accent: string }
> = {
  selection: {
    label: '選考',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    accent: 'bg-indigo-500',
  },
  event: {
    label: 'イベント',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accent: 'bg-emerald-500',
  },
  other: {
    label: 'その他',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    accent: 'bg-slate-400',
  },
  manual_update: {
    label: '更新',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    accent: 'bg-violet-500',
  },
}

const READ_KEY = 'jobtrack_read_mails'

function loadRead(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function MailModal({
  log,
  companyName,
  onClose,
}: {
  log: EmailLog
  companyName: string
  onClose: () => void
}) {
  const typeCfg = EMAIL_TYPE_LABELS[log.email_type] ?? EMAIL_TYPE_LABELS.other
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${typeCfg.className}`}
              >
                {typeCfg.label}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {companyName}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">
              {log.subject ?? '（件名なし）'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {format(new Date(log.received_at), 'yyyy年M月d日(E) HH:mm', {
                locale: ja,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {log.body_text ?? '（本文なし）'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MailList({
  logs,
  companyMap,
}: {
  logs: EmailLog[]
  companyMap: Record<string, string>
}) {
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // 既読状態はマウント後に localStorage から読み込む
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReadIds(loadRead())
  }, [])

  function open(log: EmailLog) {
    setSelectedLog(log)
    if (!readIds.has(log.id)) {
      const next = new Set(readIds)
      next.add(log.id)
      setReadIds(next)
      try {
        localStorage.setItem(READ_KEY, JSON.stringify([...next]))
      } catch {}
    }
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-indigo-500" />
        </div>
        <p className="font-semibold text-slate-700 mb-1">
          受信メールはまだありません
        </p>
        <p className="text-sm text-slate-400 max-w-xs">
          専用メールアドレスを就活サイトに登録すると、ここに届いたメールが表示されます。
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5">
        {logs.map((log) => {
          const companyName = log.application_id
            ? companyMap[log.application_id] ?? '企業未紐付け'
            : '企業未紐付け'
          const typeCfg =
            EMAIL_TYPE_LABELS[log.email_type] ?? EMAIL_TYPE_LABELS.other
          const isRead = readIds.has(log.id)
          return (
            <button
              key={log.id}
              onClick={() => open(log)}
              className={`group w-full text-left bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm border-l-4 px-4 py-3.5 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                isRead
                  ? 'border-l-slate-200'
                  : log.email_type === 'selection'
                  ? 'border-l-blue-500'
                  : log.email_type === 'event'
                  ? 'border-l-green-500'
                  : log.email_type === 'manual_update'
                  ? 'border-l-violet-500'
                  : 'border-l-slate-400'
              }`}
            >
              {/* 未読ドット */}
              <span className="mt-1.5 flex-shrink-0">
                <span
                  className={`block w-2 h-2 rounded-full ${
                    isRead ? 'bg-transparent' : typeCfg.accent
                  }`}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeCfg.className}`}
                  >
                    {typeCfg.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                    {companyName}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.received_at), 'M/d HH:mm', {
                      locale: ja,
                    })}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${
                    isRead ? 'text-slate-500' : 'text-slate-900 font-medium'
                  }`}
                >
                  {log.subject ?? '（件名なし）'}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {selectedLog && (
        <MailModal
          log={selectedLog}
          companyName={
            selectedLog.application_id
              ? companyMap[selectedLog.application_id] ?? '企業未紐付け'
              : '企業未紐付け'
          }
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  )
}
