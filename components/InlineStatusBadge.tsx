'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS } from '@/lib/constants'
import type { ApplicationStatus } from '@/types/database'
import { useDashboard } from '@/contexts/DashboardContext'
import PremiumModal from '@/components/PremiumModal'

interface InlineStatusBadgeProps {
  applicationId: string
  status: ApplicationStatus
}

const ALL_STATUSES: ApplicationStatus[] = [...KANBAN_COLUMNS, 'event' as ApplicationStatus]

export default function InlineStatusBadge({
  applicationId,
  status,
}: InlineStatusBadgeProps) {
  const [editing, setEditing] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const { updateStatus } = useDashboard()
  const selectRef = useRef<HTMLSelectElement>(null)

  // editing=true になった直後にネイティブドロップダウンを開く
  useEffect(() => {
    if (!editing || !selectRef.current) return
    try {
      // showPicker() はユーザー操作直後のみ呼べる（Chrome/Firefox/Safari 対応）
      ;(selectRef.current as HTMLSelectElement & { showPicker?: () => void }).showPicker?.()
    } catch {
      selectRef.current.focus()
    }
  }, [editing])

  if (!editing) {
    return (
      <>
        <Badge
          variant="outline"
          className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[status]}`}
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
          title="クリックして変更"
        >
          {STATUS_LABELS[status]}
        </Badge>
        {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      </>
    )
  }

  return (
    <>
      <select
        ref={selectRef}
        defaultValue={status}
        onChange={(e) => {
          const val = e.target.value
          console.log('badge clicked', applicationId, val)
          if (val === 'event') {
            setEditing(false)
            setShowPremium(true)
            return
          }
          updateStatus(applicationId, val as ApplicationStatus)
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
        onClick={(e) => e.stopPropagation()}
        className="h-7 w-32 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 cursor-pointer transition-colors"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
            {s === 'event' ? ' ✦' : ''}
          </option>
        ))}
      </select>
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </>
  )
}
