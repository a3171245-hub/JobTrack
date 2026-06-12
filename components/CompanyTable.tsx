'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, KANBAN_COLUMNS } from '@/lib/constants'
import InlineStatusBadge from '@/components/InlineStatusBadge'
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
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ApplicationStatus } from '@/types/database'

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
]

const STATUS_FILTER_OPTIONS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべてのステータス' },
  ...KANBAN_COLUMNS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
]

function EsDeadlineCell({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-slate-300 text-xs">—</span>

  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return (
      <span className="text-xs text-slate-400">
        {format(new Date(deadline), 'M/d', { locale: ja })}
      </span>
    )
  }

  if (daysLeft <= 3) {
    return (
      <div className="flex items-center gap-1 text-red-600 bg-red-50 rounded-lg px-2 py-1 w-fit">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span className="text-xs font-medium">{format(new Date(deadline), 'M/d', { locale: ja })}</span>
        <span className="text-xs">({daysLeft}日)</span>
      </div>
    )
  }

  if (daysLeft <= 7) {
    return (
      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 rounded-lg px-2 py-1 w-fit">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span className="text-xs font-medium">{format(new Date(deadline), 'M/d', { locale: ja })}</span>
        <span className="text-xs">({daysLeft}日)</span>
      </div>
    )
  }

  return (
    <span className="text-xs text-slate-600">
      {format(new Date(deadline), 'M/d', { locale: ja })}
    </span>
  )
}

function CompanyAvatar({ name }: { name: string }) {
  const initial = name.replace(/株式会社|合同会社|有限会社/g, '').trim()[0] ?? '?'
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}
    >
      {initial}
    </div>
  )
}

export default function CompanyTable() {
  const { applications, removeApplication } = useDashboard()
  const [showRejected, setShowRejected] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} を削除しますか？`)) return
    removeApplication(id)
    await deleteApplication(id).catch(() => toast.error('削除に失敗しました'))
    toast.success('削除しました')
  }

  // フィルター適用（event除外、検索・ステータスで絞り込み）
  const filteredApps = applications
    .filter((a) => a.status !== 'event')
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter(
      (a) =>
        !searchQuery ||
        a.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // お祈りフィルター中は全件をメインに表示
  const filteringRejected = statusFilter === 'rejected'
  const mainApps = filteringRejected
    ? filteredApps
    : filteredApps.filter((a) => a.status !== 'rejected')
  const collapsedRejectedApps = filteringRejected
    ? []
    : filteredApps.filter((a) => a.status === 'rejected')

  return (
    <div className="space-y-4">
      {/* 検索・フィルターバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="企業名で検索..."
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
          className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors appearance-none cursor-pointer"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
        >
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {(searchQuery || statusFilter !== 'all') && (
          <span className="text-xs text-slate-400">
            {mainApps.length + collapsedRejectedApps.length}件
          </span>
        )}
      </div>

      <TableBody apps={mainApps} onDelete={handleDelete} showAffiliate={filteringRejected} />

      {collapsedRejectedApps.length > 0 && (
        <div>
          <button
            onClick={() => setShowRejected((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mt-4 mb-3"
          >
            {showRejected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            お祈り一覧を見る（{collapsedRejectedApps.length}社）
          </button>

          {showRejected && (
            <div className="border-t border-slate-100 pt-4">
              <TableBody apps={collapsedRejectedApps} onDelete={handleDelete} showAffiliate />
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
  showAffiliate,
}: {
  apps: ReturnType<typeof useDashboard>['applications']
  onDelete: (id: string, name: string) => void
  showAffiliate: boolean
}) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
        <Building2 className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">企業がありません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3.5 font-semibold text-slate-600 w-[240px]">
              企業名
            </th>
            <th className="text-left px-5 py-3.5 font-semibold text-slate-600 w-[160px]">
              ステータス
            </th>
            <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden md:table-cell">
              最終メール
            </th>
            <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden lg:table-cell w-[170px]">
              面接日程
            </th>
            <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden xl:table-cell w-[120px]">
              ES締切
            </th>
            <th className="px-5 py-3.5 w-[100px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {apps.map((app) => (
            <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <CompanyAvatar name={app.company_name} />
                  <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                    {app.company_name}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4">
                <InlineStatusBadge applicationId={app.id} status={app.status} />
              </td>
              <td className="px-5 py-4 hidden md:table-cell">
                <div>
                  <p className="text-slate-700 truncate max-w-[280px]">
                    {app.latest_email_subject ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(app.updated_at), 'M/d HH:mm', { locale: ja })}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 hidden lg:table-cell">
                {app.interview_date ? (
                  <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 rounded-lg px-2.5 py-1.5 w-fit">
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium">
                      {format(new Date(app.interview_date), 'M/d(E) HH:mm', { locale: ja })}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
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
                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 mr-1"
                      title="エージェントに相談"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => onDelete(app.id, app.company_name)}
                    className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                    aria-label="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/dashboard/company/${app.id}`}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    )}
                  >
                    詳細 <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
