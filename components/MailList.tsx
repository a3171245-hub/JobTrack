'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Mail, X, CalendarDays, Check, Search, BookmarkPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { trackCompany } from '@/app/mail/actions'
import { confirmInterviewDate } from '@/app/dashboard/actions'

type EmailLog = {
  id: string
  application_id: string | null
  subject: string | null
  body_text: string | null
  sender: string | null
  received_at: string
  email_type: string
}

type TrackFilter = 'all' | 'tracked' | 'untracked'
type TypeFilter = 'all' | 'selection' | 'event' | 'other'
type ReadFilter = 'all' | 'unread'

// ─── Badge config ─────────────────────────────────────────────────
const EMAIL_TYPE_CONFIG: Record<string, {
  label: string
  badge: string
  dot: string
  stripe: string
}> = {
  selection: {
    label: '選考',
    badge: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-700/50',
    dot: 'bg-violet-500',
    stripe: 'border-l-violet-400',
  },
  event: {
    label: 'イベント',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50',
    dot: 'bg-amber-500',
    stripe: 'border-l-amber-400',
  },
  other: {
    label: 'その他',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600/50',
    dot: 'bg-slate-400 dark:bg-slate-500',
    stripe: 'border-l-slate-300 dark:border-l-slate-600',
  },
  manual_update: {
    label: '更新',
    badge: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700/50',
    dot: 'bg-sky-500',
    stripe: 'border-l-sky-400',
  },
}
const FALLBACK_CONFIG = EMAIL_TYPE_CONFIG.other

const READ_KEY = 'jobtrack_read_mails'
const CALENDAR_HANDLED_KEY = 'jobtrack_calendar_handled'

function loadSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')) } catch { return new Set() }
}
function saveSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])) } catch {}
}

// ─── Calendar Prompt ──────────────────────────────────────────────
function CalendarPrompt({
  companyName, candidates, dateType, userId, applicationId, onDone,
}: {
  companyName: string
  candidates: string[]  // may be empty (e.g. "see company mypage for schedule" emails)
  dateType: 'interview' | 'event'
  userId: string
  applicationId: string | null
  onDone: () => void
}) {
  const hasCandidates = candidates.length > 0
  const [mode, setMode] = useState<'candidates' | 'manual'>(hasCandidates ? 'candidates' : 'manual')
  const [selectedDate, setSelectedDate] = useState(candidates[0] ?? '')
  const [manualDateTime, setManualDateTime] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const label = dateType === 'interview' ? '面接' : '説明会・イベント'
  const isMultiple = candidates.length > 1

  function fmt(d: string) {
    try { return format(parseISO(d), 'yyyy年M月d日(E) HH:mm', { locale: ja }) } catch { return d }
  }

  async function handleAdd() {
    const isoDate = mode === 'candidates'
      ? selectedDate
      : (manualDateTime ? new Date(manualDateTime).toISOString() : null)
    if (!isoDate) {
      toast.error('日時を入力してください')
      return
    }

    setStatus('loading')
    try {
      await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: `${companyName} — ${label}`, date: isoDate, type: dateType }),
      })
      // Persist the user's pick so the dashboard's "日程未確定" notice clears
      if (dateType === 'interview' && applicationId) {
        await confirmInterviewDate(applicationId, isoDate)
      }
      setStatus('done')
      setTimeout(onDone, 800)
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700/50 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm">
        <Check className="w-4 h-4 flex-shrink-0" />
        カレンダーに追加しました
      </div>
    )
  }

  return (
    <div className="mx-5 mt-4 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-700/50 rounded-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            {hasCandidates
              ? (isMultiple ? `${label}の日程候補が${candidates.length}件あります` : `${label}の日程が見つかりました`)
              : `${label}の日程が未確定です`}
          </p>
          {!hasCandidates && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400/80 mt-0.5">
              メールに日程の記載がなかったため、企業のマイページ等で確認した日時を入力してください。
            </p>
          )}

          {hasCandidates && (
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => setMode('candidates')}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                  mode === 'candidates'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60'
                }`}
              >
                候補から選ぶ
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                  mode === 'manual'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60'
                }`}
              >
                自分で入力する
              </button>
            </div>
          )}

          {mode === 'candidates' ? (
            <div className="mt-2 space-y-1.5">
              {candidates.map((d, i) => (
                <label key={d} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="interview-date"
                    value={d}
                    checked={selectedDate === d}
                    onChange={() => setSelectedDate(d)}
                    className="w-3.5 h-3.5 accent-indigo-600"
                  />
                  <span className={`text-sm transition-colors ${selectedDate === d ? 'text-indigo-800 dark:text-indigo-200 font-medium' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    候補{['A','B','C','D','E'][i] ?? i + 1}：{fmt(d)}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-2">
              <input
                type="datetime-local"
                value={manualDateTime}
                onChange={(e) => setManualDateTime(e.target.value)}
                className="h-9 px-3 rounded-lg border border-indigo-300 dark:border-indigo-700/60 bg-white dark:bg-indigo-950/40 text-sm text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700/40"
              />
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={status === 'loading' || (mode === 'manual' && !manualDateTime)}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? '追加中…' : 'カレンダーに追加'}
            </button>
            <button
              onClick={onDone}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
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
  log, companyName, calendarCandidates, calendarType, showCalendarPrompt, userId, onClose,
}: {
  log: EmailLog
  companyName: string
  calendarCandidates: string[]
  calendarType: 'interview' | 'event'
  showCalendarPrompt: boolean
  userId: string
  onClose: () => void
}) {
  const [calendarHandled, setCalendarHandled] = useState(false)
  const cfg = EMAIL_TYPE_CONFIG[log.email_type] ?? FALLBACK_CONFIG

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{companyName}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
              {log.subject ?? '（件名なし）'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {format(new Date(log.received_at), 'yyyy年M月d日(E) HH:mm', { locale: ja })}
            </p>
            {log.sender && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                送信元: {log.sender}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showCalendarPrompt && !calendarHandled && (
          <CalendarPrompt
            companyName={companyName}
            candidates={calendarCandidates}
            dateType={calendarType}
            userId={userId}
            applicationId={log.application_id}
            onDone={handleCalendarDone}
          />
        )}

        <div className="overflow-y-auto p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {log.body_text ?? '（本文なし）'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Pill ──────────────────────────────────────────────────
function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'h-8 px-3 rounded-full border text-xs font-medium whitespace-nowrap transition-all',
        active
          ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
          : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export default function MailList({
  logs,
  companyMap,
  appDateMap = {},
  userId = '',
  activeCount = 0,
}: {
  logs: EmailLog[]
  companyMap: Record<string, string>
  appDateMap?: Record<string, { status?: string; interview_date: string | null; interview_date_candidates?: string[] | null; event_date: string | null }>
  userId?: string
  activeCount?: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [trackingId, setTrackingId] = useState<string | null>(null)

  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [trackFilter, setTrackFilter] = useState<TrackFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')

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

  function handleTrack(e: React.MouseEvent, logId: string) {
    e.stopPropagation()
    if (activeCount >= 5) {
      toast.error('無料でご利用いただける枠（5社）に達しています。', {
        description: '追跡を解除して空きを作るか、しばらくお待ちください。',
      })
      return
    }
    setTrackingId(logId)
    startTransition(async () => {
      try {
        const result = await trackCompany(logId)
        if ('limitReached' in result) {
          toast.error('無料でご利用いただける枠（5社）に達しています。', {
            description: '追跡を解除して空きを作るか、しばらくお待ちください。',
          })
          return
        }
        if ('error' in result) {
          toast.error('追跡の開始に失敗しました')
          return
        }
        toast.success(`${result.companyName} の追跡を開始しました`, {
          description: result.retroCount > 0
            ? `過去 ${result.retroCount} 件のメールを遡って解析しました`
            : undefined,
        })
        router.refresh()
      } finally {
        setTrackingId(null)
      }
    })
  }

  // ── Client-side filtering ─────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return logs.filter((log) => {
      // Track filter
      if (trackFilter === 'tracked' && !log.application_id) return false
      if (trackFilter === 'untracked' && log.application_id) return false

      // Type filter
      if (typeFilter !== 'all' && log.email_type !== typeFilter) return false

      // Read filter
      if (readFilter === 'unread' && readIds.has(log.id)) return false

      // Search
      if (q) {
        const companyName = log.application_id
          ? (companyMap[log.application_id] ?? '').toLowerCase()
          : ''
        const subject = (log.subject ?? '').toLowerCase()
        const sender = (log.sender ?? '').toLowerCase()
        if (!companyName.includes(q) && !subject.includes(q) && !sender.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [logs, trackFilter, typeFilter, readFilter, searchQuery, readIds, companyMap])

  const hasActiveFilters = searchQuery || trackFilter !== 'all' || typeFilter !== 'all' || readFilter !== 'all'

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
      {/* ── Search & Filters ────────────────────────────────── */}
      <div className="space-y-2.5 mb-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="件名・企業名・送信元で検索..."
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-wrap">
          {/* Track filter */}
          <FilterPill active={trackFilter === 'all'} onClick={() => setTrackFilter('all')}>すべて</FilterPill>
          <FilterPill active={trackFilter === 'tracked'} onClick={() => setTrackFilter('tracked')}>追跡中</FilterPill>
          <FilterPill active={trackFilter === 'untracked'} onClick={() => setTrackFilter('untracked')}>未追跡</FilterPill>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 self-center mx-1" />

          {/* Type filter */}
          <FilterPill active={typeFilter === 'selection'} onClick={() => setTypeFilter(typeFilter === 'selection' ? 'all' : 'selection')}>選考</FilterPill>
          <FilterPill active={typeFilter === 'event'} onClick={() => setTypeFilter(typeFilter === 'event' ? 'all' : 'event')}>イベント</FilterPill>
          <FilterPill active={typeFilter === 'other'} onClick={() => setTypeFilter(typeFilter === 'other' ? 'all' : 'other')}>その他</FilterPill>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 self-center mx-1" />

          {/* Read filter */}
          <FilterPill active={readFilter === 'unread'} onClick={() => setReadFilter(readFilter === 'unread' ? 'all' : 'unread')}>未読のみ</FilterPill>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(''); setTrackFilter('all'); setTypeFilter('all'); setReadFilter('all') }}
              className="h-8 px-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              クリア
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <p className="text-xs text-slate-400 dark:text-slate-600">
            {filteredLogs.length} / {logs.length} 件
          </p>
        )}
      </div>

      {/* ── Mail list ───────────────────────────────────────── */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
          <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">該当するメールが見つかりません</p>
          <button
            onClick={() => { setSearchQuery(''); setTrackFilter('all'); setTypeFilter('all'); setReadFilter('all') }}
            className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            フィルターをクリア
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => {
            const companyName = log.application_id
              ? companyMap[log.application_id] ?? '企業未紐付け'
              : '企業未紐付け'
            const isTracked = !!log.application_id
            const cfg = EMAIL_TYPE_CONFIG[log.email_type] ?? FALLBACK_CONFIG
            const isRead = readIds.has(log.id)
            const isThisTracking = trackingId === log.id

            return (
              <div
                key={log.id}
                className={[
                  'group relative rounded-xl border-l-4 transition-all duration-200 hover:-translate-y-0.5',
                  isRead
                    ? 'bg-white dark:bg-white/5 border border-slate-100 dark:border-white/8 border-l-transparent hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-md'
                    : `bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-700/40 ${cfg.stripe} hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:shadow-lg hover:shadow-indigo-100/50`,
                ].join(' ')}
              >
                <button
                  onClick={() => open(log)}
                  className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0 pr-16">
                    {/* Row 1 */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className={`text-sm truncate max-w-[180px] ${
                        isRead
                          ? 'font-medium text-slate-500 dark:text-white/50'
                          : 'font-bold text-slate-900 dark:text-white'
                      }`}>
                        {companyName}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                        {!isRead && (
                          <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white leading-none">
                            未読
                          </span>
                        )}
                        <span className={`text-xs whitespace-nowrap ${
                          isRead
                            ? 'text-slate-300 dark:text-white/25'
                            : 'text-slate-500 dark:text-indigo-300/80'
                        }`}>
                          {format(new Date(log.received_at), 'M/d HH:mm', { locale: ja })}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: subject */}
                    <p className={`text-sm truncate ${
                      isRead
                        ? 'text-slate-400 dark:text-white/35'
                        : 'font-semibold text-slate-800 dark:text-white/95'
                    }`}>
                      {log.subject ?? '（件名なし）'}
                    </p>

                    {/* Row 3: sender (untracked only) */}
                    {!isTracked && log.sender && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {log.sender}
                      </p>
                    )}
                  </div>
                </button>

                {/* 追跡ボタン (untracked only) */}
                {!isTracked && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <button
                      onClick={(e) => handleTrack(e, log.id)}
                      disabled={isThisTracking || isPending}
                      className={[
                        'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-all',
                        isThisTracking
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-400 border-indigo-200 dark:border-indigo-700 cursor-wait'
                          : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400',
                      ].join(' ')}
                      title="この企業を追跡する"
                    >
                      {isThisTracking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {isThisTracking ? '解析中…' : '追跡する'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 処理中オーバーレイ表示 */}
      {isPending && trackingId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>過去のメールを遡って解析中…（数秒かかる場合があります）</span>
        </div>
      )}

      {/* Mail modal */}
      {selectedLog && (() => {
        const appId = selectedLog.application_id
        const dates = appId ? appDateMap[appId] : null
        const isInterviewStage = ['interview_1', 'interview_2', 'final'].includes(dates?.status ?? '')
        // Build candidate list: prefer candidates array, fall back to single dates
        const calendarCandidates: string[] = (() => {
          const c = dates?.interview_date_candidates?.filter(Boolean) ?? []
          if (c.length > 0) return c
          if (dates?.interview_date) return [dates.interview_date]
          if (!isInterviewStage && dates?.event_date) return [dates.event_date]
          return []
        })()
        const calendarType: 'interview' | 'event' =
          isInterviewStage || (dates?.interview_date_candidates?.length ?? 0) > 0 || dates?.interview_date
            ? 'interview' : 'event'
        // Show even with zero candidates when the company is mid-interview but no date was ever captured
        // (e.g. "see our applicant mypage for the schedule" emails) — lets the user enter it manually.
        const showCalendarPrompt =
          calendarCandidates.length > 0 || (calendarType === 'interview' && isInterviewStage && !dates?.interview_date)
        const companyName = appId ? companyMap[appId] ?? '企業未紐付け' : '企業未紐付け'
        return (
          <MailModal
            log={selectedLog}
            companyName={companyName}
            calendarCandidates={calendarCandidates}
            calendarType={calendarType}
            showCalendarPrompt={showCalendarPrompt}
            userId={userId}
            onClose={() => setSelectedLog(null)}
          />
        )
      })()}
    </>
  )
}
