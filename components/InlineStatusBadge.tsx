'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS } from '@/lib/constants'
import type { ApplicationStatus } from '@/types/database'
import { useDashboard } from '@/contexts/DashboardContext'
import PremiumModal from '@/components/PremiumModal'

interface InlineStatusBadgeProps {
  applicationId: string
  status: ApplicationStatus
}

export default function InlineStatusBadge({
  applicationId,
  status,
}: InlineStatusBadgeProps) {
  const [editing, setEditing] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const { updateStatus } = useDashboard()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editing) return
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const allStatuses: ApplicationStatus[] = [...KANBAN_COLUMNS, 'event']

  return (
    <>
      <div ref={containerRef} onClick={(e) => e.stopPropagation()}>
        <Select
          value={status}
          onValueChange={(val) => {
            if (!val) return
            if (val === 'event') {
              setEditing(false)
              setShowPremium(true)
              return
            }
            updateStatus(applicationId, val as ApplicationStatus)
            setEditing(false)
          }}
          open
        >
          <SelectTrigger className="h-7 text-xs w-32">
            <span className="flex-1 text-left text-xs">{STATUS_LABELS[status]}</span>
          </SelectTrigger>
          <SelectContent>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s === 'event' ? (
                  <span className="flex items-center gap-1.5">
                    {STATUS_LABELS[s]}
                    <span className="text-amber-600 font-medium">Premium</span>
                  </span>
                ) : (
                  STATUS_LABELS[s]
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </>
  )
}
