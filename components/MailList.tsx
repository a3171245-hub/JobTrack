'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Mail, X, CalendarDays, Check } from 'lucide-react'

type EmailLog = {
  id: string
  application_id: string | null
  subject: string | null
  body_text: string | null
  received_at: string
  email_type: string
}

const EMAIL_TYPE_LABELS: Record<string, { label: string; className: string; accent: string }> = {
  selection: { label: '選考', className: 'bg-indigo-100 text-indigo-700 border-indigo-200', accent: 'bg-indigo-500' },
  event: { label: 'イベント', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', accent: 'bg-emerald-500' },
  other: { label: 'その他', className: 'bg-slate-100 text-slate-600 border-slate-200', accent: 'bg-slate-400' },
  manual_update: { label: '更新', className: 'bg-violet-100 text-violet-700 border-violet-200', accent: 'bg-violet-500' },
}

const READ_KEY = 'jobtrack_read_mails'
const CALENDAR_HANDLED_KEY = 'jobtrack_calendar_handled'

function loadSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')) } catch { return new Set() }
}
function saveSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])) } catch {}
}

// ─── Calendar Prompt ─────────────────────────────────────────────
function CalendarPrompt({
  companyName,
  date,
  dateType,
  userId,
  onDone,
}: {
  companyName: string
  date: string
  dateType: 'interview' | 'event'
  userId: string
  onDone: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const label = dateType === 'interview' ? '面接' : '説明会・イベント'
  const formatted = (() => {
    try { return format(parseISO(date), 'yyyy年M月d日(E) HH:mm', { locale: ja }) } catch { return date }
  })()

  async function handleAdd() {
    setStatus('loading')
    try {
      await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: `${companyName} — ${label}`,
          date,
          type: dateType,
        }),
      })
      setStatus('done')
      setTimeout(onDone, 800)
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700 text-sm">
        <Check className="w-4 h-4 flex-shrink-0" />
        カレンダーに追加しました
      </div>
    )
  }

  return (
    <div className="mx-5 mt-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900">{label}の日程が見つかりました</p>
          <p className="text-sm text-indigo-700 mt-0.5">{formatted} · {companyName}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={status === 'loading'}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? '追加中…' : 'カレンダーに追加'}
            </button>
            <button
              onClick={onDone}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              スキップ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mail Modal ───────────────────────────────────────────────────
function MailModal({
  log,
  companyName,
  calendarDate,
  calendarType,
  userId,
  onClose,
}: {
  log: EmailLog
  companyName: string
  calendarDate: string | null
  calendarType: 'interview' | 'event'
  userId: string
  onClose: () => void
}) {
  const [calendarHandled, setCalendarHandled] = useState(false)
  const typeCfg = EMAIL_TYPE_LABELS[log.email_type] ?? EMAIL_TYPE_LABELS.other

  useEffect(() => {
    setCalendarHandled(loadSet(CALENDAR_HANDLED_KEY).has(log.id))
  }, [log.id])

  function handleCalendarDone() {
    const handled = loadSet(CALENDAR_HANDLED_KEY)
    handled.add(log.id)
    saveSet(CALENDAR_HANDLED_KEY, handled)
    setCalendarHandled(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${typeCfg.className}`}>
                {typeCfg.label}
              </span>
              <span className="text-sm font-semibold text-slate-700">{companyName}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">
              {log.subject ?? '（件名なし）'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {format(new Date(log.received_at), 'yyyy年M月d日(E) HH:mm', { locale: ja })}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar prompt */}
        {calendarDate && !calendarHandled && (
          <CalendarPrompt
            companyName={companyName}
            date={calendarDate}
            dateType={calendarType}
            userId={userId}
            onDone={handleCalendarDone}
          />
        )}

        {/* Body */}
        <div className="overflow-y-auto p-6">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {log.body_text ?? '（本文なし）'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export default function MailList({
  logs,
  companyMap,
  appDateMap = {},
  userId = '',
  freeLimitHit = false,
}: {
  logs: EmailLog[]
  companyMap: Record<string, string>
  appDateMap?: Record<string, { interview_date: string | null; event_date: string | null }>
  userId?: string
  freeLimitHit?: boolean
}) {
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setReadIds(loadSet(READ_KEY))
  }, [])

  function open(log: EmailLog) {
    setSelectedLog(log)
    if (!readIds.has(log.id)) {
      const next = new Set(readIds)
      next.add(log.id)
      setReadIds(next)
      saveSet(READ_KEY, next)
    }
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-indigo-400 dark:text-indigo-300" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-white mb-1">受信メールはまだありません</p>
        <p className="text-sm text-slate-500 dark:text-indigo-200/60 max-w-xs">
          専用メールアドレスを就活サイトに登録すると、ここに届いたメールが表示されます。
        </p>
      </div>
    )
  }

  return (
    <>
      {freeLimitHit && (
        <div className="mb-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          フリープランでは最新20件まで表示されます。プレミアムプランで制限が解除されます。
        </div>
      )}
      <div className="space-y-2.5">
        {logs.map((log) => {
          const companyName = log.application_id
            ? companyMap[log.application_id] ?? '企業未紐付け'
            : '企業未紐付け'
          const typeCfg = EMAIL_TYPE_LABELS[log.email_type] ?? EMAIL_TYPE_LABELS.other
          const isRead = readIds.has(log.id)
          return (
            <button
              key={log.id}
              onClick={() => open(log)}
              className={`group w-full text-left bg-white dark:bg-white/8 hover:bg-slate-50 dark:hover:bg-white/12 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-xl px-4 py-3.5 flex items-start gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-l-4 ${
                isRead
                  ? 'border-l-slate-200 dark:border-l-white/20'
                  : log.email_type === 'selection'
                  ? 'border-l-indigo-400'
                  : log.email_type === 'event'
                  ? 'border-l-emerald-400'
                  : log.email_type === 'manual_update'
                  ? 'border-l-violet-400'
                  : 'border-l-slate-300 dark:border-l-white/30'
              }`}
            >
              <span className="mt-1.5 flex-shrink-0">
                <span className={`block w-2 h-2 rounded-full ${isRead ? 'bg-transparent' : typeCfg.accent}`} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeCfg.className}`}>
                    {typeCfg.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {companyName}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-indigo-300/70 whitespace-nowrap">
                    {format(new Date(log.received_at), 'M/d HH:mm', { locale: ja })}
                  </span>
                </div>
                <p className={`text-sm truncate ${isRead ? 'text-slate-400 dark:text-white/50' : 'text-slate-800 dark:text-white/90 font-medium'}`}>
                  {log.subject ?? '（件名なし）'}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {selectedLog && (() => {
        const appId = selectedLog.application_id
        const dates = appId ? appDateMap[appId] : null
        const calendarDate = dates?.interview_date ?? dates?.event_date ?? null
        const calendarType: 'interview' | 'event' = dates?.interview_date ? 'interview' : 'event'
        const companyName = appId ? companyMap[appId] ?? '企業未紐付け' : '企業未紐付け'
        return (
          <MailModal
            log={selectedLog}
            companyName={companyName}
            calendarDate={calendarDate}
            calendarType={calendarType}
            userId={userId}
            onClose={() => setSelectedLog(null)}
          />
        )
      })()}
    </>
  )
}
