'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Search, X, Plus, Trash2, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

interface CalendarApp {
  id: string
  company_name: string
  status: string
  interview_date: string | null
  event_date: string | null
  test_date?: string | null
  es_deadline?: string | null
  gd_date?: string | null
}

type EventType = 'interview' | 'event' | 'test' | 'gd' | 'deadline' | 'other'
type FilterOption = 'all' | 'interview' | 'event' | 'test' | 'gd' | 'deadline'

interface DayEvent {
  id: string
  title: string
  type: EventType
  date: Date
  application_id?: string
  is_manual: boolean
  memo?: string
}

interface ManualEvent {
  id: string
  title: string
  date: string  // 'YYYY-MM-DD'
  type: 'interview' | 'gd' | 'test' | 'deadline' | 'event' | 'other'
  memo?: string
}

const MANUAL_EVENTS_KEY = 'jobtrack_calendar_events'

const EVENT_CONFIG: Record<EventType, { label: string; chipClass: string; iconClass: string; dotClass: string }> = {
  interview: {
    label: '面接',
    chipClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    iconClass: 'text-indigo-600',
    dotClass: 'bg-indigo-500',
  },
  event: {
    label: 'イベント',
    chipClass: 'bg-green-100 text-green-800 border-green-200',
    iconClass: 'text-green-600',
    dotClass: 'bg-green-500',
  },
  test: {
    label: '適性検査',
    chipClass: 'bg-orange-100 text-orange-800 border-orange-200',
    iconClass: 'text-orange-600',
    dotClass: 'bg-orange-500',
  },
  gd: {
    label: 'GD',
    chipClass: 'bg-purple-100 text-purple-800 border-purple-200',
    iconClass: 'text-purple-600',
    dotClass: 'bg-purple-500',
  },
  deadline: {
    label: 'ES締切',
    chipClass: 'bg-red-100 text-red-800 border-red-200',
    iconClass: 'text-red-600',
    dotClass: 'bg-red-500',
  },
  other: {
    label: 'その他',
    chipClass: 'bg-slate-100 text-slate-700 border-slate-200',
    iconClass: 'text-slate-500',
    dotClass: 'bg-slate-400',
  },
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'interview', label: '面接' },
  { value: 'event', label: 'イベント' },
  { value: 'test', label: '適性検査' },
  { value: 'gd', label: 'GD' },
  { value: 'deadline', label: 'ES締切' },
]

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function loadManualEvents(): ManualEvent[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(MANUAL_EVENTS_KEY) ?? '[]') as ManualEvent[]
  } catch {
    return []
  }
}

function saveManualEvents(events: ManualEvent[]) {
  localStorage.setItem(MANUAL_EVENTS_KEY, JSON.stringify(events))
}

// ── Add Event Modal ─────────────────────────────────────────
function AddEventModal({
  defaultDate,
  onClose,
  onSave,
}: {
  defaultDate: Date
  onClose: () => void
  onSave: (event: ManualEvent) => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(defaultDate, 'yyyy-MM-dd'))
  const [type, setType] = useState<ManualEvent['type']>('other')
  const [memo, setMemo] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    onSave({
      id: `manual-${Date.now()}`,
      title: title.trim(),
      date,
      type,
      memo: memo.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">予定を追加</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="予定名を入力..."
              required
              autoFocus
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">種類</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ManualEvent['type'])}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            >
              <option value="interview">面接</option>
              <option value="gd">GD</option>
              <option value="test">適性検査</option>
              <option value="deadline">ES締切</option>
              <option value="event">イベント</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
              メモ<span className="font-normal text-slate-400 dark:text-slate-500 ml-1">（任意）</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="補足情報..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm text-white font-medium transition-colors"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Event Detail Modal (manual events) ──────────────────────
function EventDetailModal({
  event,
  onClose,
  onDelete,
}: {
  event: DayEvent
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const cfg = EVENT_CONFIG[event.type]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.chipClass}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {format(event.date, 'M月d日(E)', { locale: ja })}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{event.title}</h3>
        {event.memo && (
          <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap mb-4 bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
            {event.memo}
          </p>
        )}
        <div className="flex justify-end">
          <button
            onClick={() => { onDelete(event.id); onClose() }}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DnD Sub-components ──────────────────────────────────────
const DraggableChip = memo(function DraggableChip({
  event,
  onEventClick,
}: {
  event: DayEvent
  onEventClick: (ev: DayEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: event.id })
  const cfg = EVENT_CONFIG[event.type]

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
      style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined}
      className={[
        'flex items-start gap-1 text-xs px-1.5 py-1 rounded-md border leading-tight cursor-grab active:cursor-grabbing select-none',
        cfg.chipClass,
        isDragging ? 'opacity-30' : 'hover:opacity-80 transition-opacity',
      ].join(' ')}
      title={`${event.title}（${cfg.label}）`}
    >
      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
      <span className="break-words">{event.title}</span>
    </div>
  )
})

function DroppableDay({
  date,
  children,
  className,
  onClick,
}: {
  date: Date
  children: React.ReactNode
  className: string
  onClick: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: format(date, 'yyyy-MM-dd') })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={`${className} ${isOver ? 'bg-indigo-100/50 dark:bg-indigo-900/50 ring-2 ring-indigo-300 dark:ring-indigo-600 ring-inset' : ''}`}
    >
      {children}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function CalendarView({ applications }: { applications: CalendarApp[] }) {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>(['all'])
  const [searchQuery, setSearchQuery] = useState('')
  const [manualEvents, setManualEvents] = useState<ManualEvent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [detailEvent, setDetailEvent] = useState<DayEvent | null>(null)
  const [draggingEvent, setDraggingEvent] = useState<DayEvent | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    // SSR/CSR の時刻差・localStorage 参照のためマウント後に初期化する
    const now = new Date()
    /* eslint-disable react-hooks/set-state-in-effect */
    setCurrentMonth(startOfMonth(now))
    setSelectedDay(now)
    setManualEvents(loadManualEvents())
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // イベント一覧をメモ化（applications・manualEventsが変わらない限り再計算しない）
  const allEvents = useMemo<DayEvent[]>(() => {
    const events: DayEvent[] = []

    for (const app of applications) {
      if (app.interview_date) {
        events.push({
          id: `interview-${app.id}`,
          title: app.company_name,
          type: 'interview',
          date: new Date(app.interview_date),
          application_id: app.id,
          is_manual: false,
        })
      }
      if (app.event_date) {
        events.push({
          id: `event-${app.id}`,
          title: app.company_name,
          type: 'event',
          date: new Date(app.event_date),
          application_id: app.id,
          is_manual: false,
        })
      }
      if (app.test_date) {
        events.push({
          id: `test-${app.id}`,
          title: app.company_name,
          type: 'test',
          date: new Date(app.test_date),
          application_id: app.id,
          is_manual: false,
        })
      }
      if (app.es_deadline) {
        events.push({
          id: `deadline-${app.id}`,
          title: app.company_name,
          type: 'deadline',
          date: new Date(app.es_deadline),
          application_id: app.id,
          is_manual: false,
        })
      }
      if (app.gd_date) {
        events.push({
          id: `gd-${app.id}`,
          title: app.company_name,
          type: 'gd',
          date: new Date(app.gd_date),
          application_id: app.id,
          is_manual: false,
        })
      }
    }

    for (const ev of manualEvents) {
      events.push({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        date: parseISO(ev.date),
        is_manual: true,
        memo: ev.memo,
      })
    }

    return events
  }, [applications, manualEvents])

  // フィルター・検索適用済みイベントをメモ化
  const visibleEvents = useMemo(() => {
    const isAllActive = activeFilters.includes('all')
    return allEvents.filter((e) => {
      const matchesFilter =
        isAllActive ||
        (e.type !== 'other' && activeFilters.includes(e.type as FilterOption)) ||
        (e.type === 'other' && isAllActive)
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [allEvents, activeFilters, searchQuery])

  function handleDragStart(event: DragStartEvent) {
    const found = manualEvents.find((e) => e.id === event.active.id)
    if (!found) return
    const dayEv: DayEvent = {
      id: found.id,
      title: found.title,
      type: found.type,
      date: parseISO(found.date),
      is_manual: true,
      memo: found.memo,
    }
    setDraggingEvent(dayEv)
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingEvent(null)
    const { active, over } = event
    if (!over) return
    const newDateStr = over.id as string
    const updated = manualEvents.map((e) =>
      e.id === active.id ? { ...e, date: newDateStr } : e
    )
    setManualEvents(updated)
    saveManualEvents(updated)
  }

  if (!currentMonth) {
    return (
      <div className="h-[500px] flex items-center justify-center text-slate-400">
        <span className="text-sm">読み込み中...</span>
      </div>
    )
  }

  const isAllActive = activeFilters.includes('all')

  function toggleFilter(f: FilterOption) {
    if (f === 'all') { setActiveFilters(['all']); return }
    setActiveFilters((prev) => {
      const without = prev.filter((x) => x !== 'all' && x !== f)
      const hadIt = prev.includes(f)
      const next = hadIt ? without : [...without, f]
      return next.length === 0 ? ['all'] : next
    })
  }

  function handleAddEvent(ev: ManualEvent) {
    const updated = [...manualEvents, ev]
    setManualEvents(updated)
    saveManualEvents(updated)
  }

  function handleDeleteManualEvent(id: string) {
    const updated = manualEvents.filter((e) => e.id !== id)
    setManualEvents(updated)
    saveManualEvents(updated)
  }

  // カレンダーグリッド生成
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(cursor); cursor = addDays(cursor, 1) }
    weeks.push(week)
  }

  const selectedEvents = selectedDay
    ? visibleEvents.filter((e) => isSameDay(e.date, selectedDay))
    : []

  const addModalDefaultDate = selectedDay ?? new Date()

  return (
    <div className="space-y-4">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {format(currentMonth, 'yyyy年M月', { locale: ja })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => (m ? subMonths(m, 1) : m))}
            aria-label="前月"
            className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            今月
          </button>
          <button
            onClick={() => setCurrentMonth((m) => (m ? addMonths(m, 1) : m))}
            aria-label="翌月"
            className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* 検索・フィルター・予定追加バー */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* 企業名検索 */}
        <div className="relative w-full sm:w-auto sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="企業名で検索..."
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* フィルターボタン（モバイル: 横スクロール / PC: 折り返し） */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto pb-0.5 md:pb-0 md:flex-wrap" style={{ scrollbarWidth: 'none' }}>
          {FILTER_OPTIONS.map(({ value, label }) => {
            const isActive = value === 'all' ? isAllActive : activeFilters.includes(value)
            const cfg = value !== 'all' ? EVENT_CONFIG[value as EventType] : null
            return (
              <button
                key={value}
                onClick={() => toggleFilter(value)}
                className={[
                  'h-9 px-3.5 rounded-xl text-sm font-medium border transition-all flex-shrink-0 whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-slate-600 hover:text-indigo-700 dark:hover:text-indigo-400',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* 予定追加ボタン（モバイル: h-11 で44px確保） */}
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 md:h-9 px-3.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          予定を追加
        </button>
      </div>

      {/* カレンダーグリッド */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {DOW.map((d, i) => (
              <div
                key={d}
                className={`py-3 text-center text-sm font-semibold select-none ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 週行 */}
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className={`grid grid-cols-7 ${wi < weeks.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
            >
              {week.map((d, di) => {
                const inMonth = isSameMonth(d, currentMonth)
                const isSelected = selectedDay ? isSameDay(d, selectedDay) : false
                const isCurrentDay = isToday(d)
                const dayEvents = visibleEvents.filter((e) => isSameDay(e.date, d))
                const isSun = di === 0
                const isSat = di === 6

                // 「今日」と「選択中」は別配色にする（同時に該当する日は今日の青地＋リングで両方を表す）
                const numberClass = isSelected && isCurrentDay
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-slate-400 dark:ring-slate-300 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                  : isSelected
                  ? 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 font-bold shadow-sm'
                  : isCurrentDay
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : !inMonth
                  ? 'text-slate-300 dark:text-slate-600'
                  : isSun
                  ? 'text-rose-500 font-medium'
                  : isSat
                  ? 'text-indigo-600 font-medium'
                  : 'text-slate-700 dark:text-slate-200 font-medium'

                return (
                  <DroppableDay
                    key={d.toISOString()}
                    date={d}
                    onClick={() => setSelectedDay(d)}
                    className={[
                      // モバイル: min-h-[52px] p-1 / PC: min-h-[104px] p-2
                      'min-h-[52px] md:min-h-[104px] p-1 md:p-2 text-left border-l border-slate-100 dark:border-slate-800 first:border-l-0 transition-colors select-none cursor-pointer',
                      isCurrentDay
                        ? 'bg-indigo-50/40 dark:bg-indigo-900/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/30'
                        : inMonth
                        ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                        : 'bg-slate-50/40 dark:bg-slate-800/20',
                    ].join(' ')}
                  >
                    {/* 日付番号: モバイル w-6 h-6 text-xs / PC w-7 h-7 text-sm */}
                    <div className="mb-1">
                      <span
                        className={`inline-flex w-6 h-6 md:w-7 md:h-7 items-center justify-center rounded-full text-xs md:text-sm transition-colors ${numberClass}`}
                      >
                        {format(d, 'd')}
                      </span>
                    </div>

                    {/* モバイル: カラードット（最大4件） */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap md:hidden">
                        {dayEvents.slice(0, 4).map((ev) => (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${EVENT_CONFIG[ev.type].dotClass}`}
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-[8px] leading-none text-slate-400">…</span>
                        )}
                      </div>
                    )}

                    {/* PC: フルチップ */}
                    <div className="hidden md:block space-y-1">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const cfg = EVENT_CONFIG[ev.type]
                        if (ev.is_manual) {
                          return (
                            <DraggableChip
                              key={ev.id}
                              event={ev}
                              onEventClick={setDetailEvent}
                            />
                          )
                        }
                        return (
                          <Link
                            key={ev.id}
                            href={`/dashboard/company/${ev.application_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-start gap-1 text-xs px-1.5 py-1 rounded-md border leading-tight ${cfg.chipClass} hover:opacity-80 transition-opacity`}
                            title={`${ev.title}（${cfg.label}）`}
                          >
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                            <span className="break-words">{ev.title}</span>
                          </Link>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 pl-1.5">
                          他{dayEvents.length - 3}件
                        </p>
                      )}
                    </div>
                  </DroppableDay>
                )
              })}
            </div>
          ))}
        </div>

        {/* ドラッグ中のゴースト */}
        <DragOverlay>
          {draggingEvent && (
            <div
              className={`text-xs px-1.5 py-0.5 rounded border truncate leading-4 shadow-lg cursor-grabbing ${EVENT_CONFIG[draggingEvent.type].chipClass}`}
            >
              {draggingEvent.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 凡例 */}
      <div className="flex items-center gap-3 flex-wrap">
        {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(
          ([, cfg]) => (
            <span
              key={cfg.label}
              className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.chipClass}`}
            >
              {cfg.label}
            </span>
          )
        )}
      </div>

      {/* 選択日の詳細 */}
      {selectedDay && (
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {format(selectedDay, 'M月d日(E)のスケジュール', { locale: ja })}
            {(searchQuery || !isAllActive) && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                （絞り込み中: {selectedEvents.length}件）
              </span>
            )}
          </h3>

          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
              <p className="text-sm">
                {searchQuery || !isAllActive
                  ? '絞り込み条件に一致する予定がありません'
                  : 'この日の予定はありません'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedEvents.map((event) => {
                const cfg = EVENT_CONFIG[event.type]
                const cardContent = (
                  <Card className="shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.chipClass}`}
                      >
                        <Building2 className={`w-5 h-5 ${cfg.iconClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.chipClass}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(event.date, 'HH:mm') !== '00:00'
                              ? format(event.date, 'HH:mm', { locale: ja })
                              : ''}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )

                if (event.is_manual) {
                  return (
                    <button
                      key={event.id}
                      onClick={() => setDetailEvent(event)}
                      className="text-left w-full"
                    >
                      {cardContent}
                    </button>
                  )
                }
                return (
                  <Link key={event.id} href={`/dashboard/company/${event.application_id}`}>
                    {cardContent}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* モーダル */}
      {showAddModal && (
        <AddEventModal
          defaultDate={addModalDefaultDate}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddEvent}
        />
      )}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onDelete={handleDeleteManualEvent}
        />
      )}
    </div>
  )
}
