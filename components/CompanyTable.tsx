'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, KANBAN_COLUMNS } from '@/lib/constants'
import InlineStatusBadge from '@/components/InlineStatusBadge'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import { useDashboard } from '@/contexts/DashboardContext'
import { deleteApplication } from '@/app/dashboard/actions'
import { AFFILIATE_URL } from '@/lib/constants'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronRight,
  Building2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  X,
  Rocket,
  Pin,
  PinOff,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ApplicationStatus } from '@/types/database'

const AVATAR_COLORS = [
  'bg-gradient-to-br from-indigo-500 to-violet-500',
  'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-sky-500 to-indigo-500',
  'bg-gradient-to-br from-rose-500 to-pink-500',
]

function isDeadlineSoon(deadline: string | null | undefined): boolean {
  if (!deadline) return false
  const d = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const days = Math.ceil((d.getTime() - today.getTime()) / 86400000)
  return days >= 0 && days <= 3
}

const STATUS_FILTER_OPTIONS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべてのステータス' },
  ...KANBAN_COLUMNS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
]

function EsDeadlineCell({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>

  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const dateStr = format(new Date(deadline), 'M/d', { locale: ja })

  if (daysLeft < 0) return <span className="text-xs text-slate-400 dark:text-slate-600">{dateStr}</span>
  if (daysLeft === 0)
    return <span className="text-xs font-medium text-red-600 dark:text-red-400">{dateStr} <span className="text-red-400 dark:text-red-500">今日</span></span>
  if (daysLeft <= 3)
    return <span className="text-xs font-medium text-red-600 dark:text-red-400">{dateStr} <span className="text-red-400 dark:text-red-500">{daysLeft}日後</span></span>
  if (daysLeft <= 7)
    return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{dateStr} <span className="text-amber-400 dark:text-amber-500">{daysLeft}日後</span></span>
  return <span className="text-xs text-slate-500 dark:text-slate-500">{dateStr} <span className="text-slate-400 dark:text-slate-600">{daysLeft}日後</span></span>
}

function CompanyAvatar({ name }: { name: string }) {
  const initial = name.replace(/株式会社|合同会社|有限会社/g, '').trim()[0] ?? '?'
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0 ${color}`}>
      {initial}
    </div>
  )
}

export default function CompanyTable() {
  const { applications, plan, activeCount, removeApplication, toggleActive } = useDashboard()
  const [showRejected, setShowRejected] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // フリープランで非アクティブ企業を分離
  const activeApps = useMemo(
    () => applications.filter((a) => a.is_active !== false),
    [applications]
  )
  const inactiveApps = useMemo(
    () => (plan === 'free' ? applications.filter((a) => a.is_active === false) : []),
    [applications, plan]
  )

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return [...new Set(activeApps.map((a) => a.company_name))]
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 8)
  }, [searchQuery, activeApps])

  useEffect(() => { setHighlightedIndex(-1) }, [suggestions])

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!showSuggestions && suggestions.length > 0) { setShowSuggestions(true); return }
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Tab' && showSuggestions && highlightedIndex >= 0) {
      e.preventDefault()
      setSearchQuery(suggestions[highlightedIndex])
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    } else if (e.key === 'Enter') {
      if (showSuggestions && highlightedIndex >= 0) setSearchQuery(suggestions[highlightedIndex])
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} を削除しますか？`)) return
    removeApplication(id)
    await deleteApplication(id).catch(() => toast.error('削除に失敗しました'))
    toast.success('削除しました')
  }

  const filteredActive = activeApps
    .filter((a) => a.status !== 'event')
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => !searchQuery || a.company_name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteringRejected = statusFilter === 'rejected'
  const mainApps = filteringRejected ? filteredActive : filteredActive.filter((a) => a.status !== 'rejected')
  const collapsedRejectedApps = filteringRejected ? [] : filteredActive.filter((a) => a.status === 'rejected')

  if (activeApps.filter((a) => a.status !== 'event').length === 0 && inactiveApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-white dark:bg-slate-900/80 rounded-2xl ring-1 ring-slate-900/5 dark:ring-slate-700/60 shadow-sm animate-fade-in-up transition-colors">
        <div className="relative mb-6 animate-float">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/60 dark:to-violet-950/60 flex items-center justify-center">
            <Building2 className="w-9 h-9 text-indigo-500 dark:text-indigo-400" />
          </div>
          <span className="absolute -right-2 -bottom-2 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
            <Rocket className="w-4 h-4 text-white" />
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">最初の企業を追加しよう</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-7 leading-relaxed">
          応募した企業を登録すると、選考ステータスやES締切、面接日程をここで一元管理できます。
        </p>
        <AddApplicationDialog />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* フリープラン アクティブ枠インジケーター */}
      {plan === 'free' && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
          <Pin className="w-3.5 h-3.5 text-indigo-400" />
          <span>アクティブ枠: <span className={cn('font-semibold', activeCount >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400')}>{activeCount} / 5</span></span>
        </div>
      )}

      {/* 検索・フィルターバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleSearchKeyDown}
            placeholder="企業名で検索..."
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowSuggestions(false) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((name, i) => (
                <button
                  key={name}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSearchQuery(name)
                    setShowSuggestions(false)
                    setHighlightedIndex(-1)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm transition-colors',
                    i === highlightedIndex
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
          className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-colors appearance-none cursor-pointer"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
        >
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {(searchQuery || statusFilter !== 'all') && (
          <span className="text-xs text-slate-400 dark:text-slate-600">
            {mainApps.length + collapsedRejectedApps.length}件
          </span>
        )}
      </div>

      {/* アクティブ企業テーブル */}
      <TableBody
        apps={mainApps}
        onDelete={handleDelete}
        onToggleActive={plan === 'free' ? toggleActive : undefined}
        activeCount={activeCount}
        showAffiliate={filteringRejected}
      />

      {/* お祈り折りたたみ */}
      {collapsedRejectedApps.length > 0 && (
        <div>
          <button
            onClick={() => setShowRejected((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-4 mb-3"
          >
            {showRejected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            お祈り一覧を見る（{collapsedRejectedApps.length}社）
          </button>
          {showRejected && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <TableBody
                apps={collapsedRejectedApps}
                onDelete={handleDelete}
                onToggleActive={plan === 'free' ? toggleActive : undefined}
                activeCount={activeCount}
                showAffiliate
              />
            </div>
          )}
        </div>
      )}

      {/* 非アクティブ企業（フリープランのみ） */}
      {plan === 'free' && inactiveApps.length > 0 && (
        <div>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-4 mb-3"
          >
            {showInactive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <PinOff className="w-3.5 h-3.5 opacity-60" />
            非アクティブ（{inactiveApps.length}社）
          </button>
          {showInactive && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 opacity-60">
              <TableBody
                apps={inactiveApps}
                onDelete={handleDelete}
                onToggleActive={toggleActive}
                activeCount={activeCount}
                showAffiliate={false}
                isInactiveSection
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TableBody({
  apps,
  onDelete,
  onToggleActive,
  activeCount,
  showAffiliate,
  isInactiveSection = false,
}: {
  apps: ReturnType<typeof useDashboard>['applications']
  onDelete: (id: string, name: string) => void
  onToggleActive?: (id: string, isActive: boolean) => Promise<void>
  activeCount: number
  showAffiliate: boolean
  isInactiveSection?: boolean
}) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900/80 rounded-2xl ring-1 ring-slate-900/5 dark:ring-slate-700/60 transition-colors">
        <Building2 className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">条件に一致する企業がありません</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm transition-colors">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60">
            <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-[240px]">企業名</th>
            <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-[160px]">ステータス</th>
            <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">最終メール</th>
            <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell w-[170px]">面接日程</th>
            <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell w-[120px]">ES締切</th>
            <th className="px-5 py-3.5 w-[120px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {apps.map((app) => {
            const deadlineSoon = isDeadlineSoon(app.es_deadline)
            const isActive = app.is_active !== false

            return (
              <tr
                key={app.id}
                className={cn(
                  'group transition-all duration-150 border-l-[3px] border-l-transparent hover:border-l-indigo-500',
                  isInactiveSection
                    ? 'bg-slate-50/50 dark:bg-slate-900/30'
                    : deadlineSoon
                    ? 'bg-rose-50/60 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
                )}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={app.company_name} />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                      {app.company_name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <InlineStatusBadge
                    applicationId={app.id}
                    status={app.status}
                    updatedBy={app.updated_by ?? 'ai'}
                  />
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 truncate max-w-[280px]">
                      {app.latest_email_subject ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
                      {format(new Date(app.updated_at), 'M/d HH:mm', { locale: ja })}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  {app.interview_date ? (
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg px-2.5 py-1.5 w-fit">
                      <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        {format(new Date(app.interview_date), 'M/d(E) HH:mm', { locale: ja })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-4 hidden xl:table-cell">
                  <EsDeadlineCell deadline={app.es_deadline ?? null} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    {showAffiliate && (
                      <a
                        href={AFFILIATE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 mr-1"
                        title="エージェントに相談"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* ピン留め / ピン留め解除ボタン（フリープランのみ） */}
                    {onToggleActive && (
                      isActive ? (
                        <button
                          onClick={() => onToggleActive(app.id, false)}
                          className="text-slate-300 dark:text-slate-700 hover:text-amber-500 dark:hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          title="ピン留め解除（非アクティブにする）"
                        >
                          <PinOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleActive(app.id, true)}
                          className={cn(
                            'p-1 rounded transition-colors',
                            activeCount >= 5
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                          )}
                          title={activeCount >= 5 ? 'アクティブ枠が上限です（5/5）' : 'ピン留めしてアクティブにする'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}

                    <button
                      onClick={() => onDelete(app.id, app.company_name)}
                      className="text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      aria-label="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/dashboard/company/${app.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 px-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                      )}
                    >
                      詳細 <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
