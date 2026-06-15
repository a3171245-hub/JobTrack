'use client'

import { useState } from 'react'
import { updateApplicationStatus } from '@/app/dashboard/actions'
import { setPendingStatus, clearPendingStatus } from '@/lib/status-overlay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS } from '@/lib/constants'
import type { ApplicationStatus } from '@/types/database'
import { toast } from 'sonner'
import PremiumModal from '@/components/PremiumModal'

export default function StatusSelector({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: ApplicationStatus
}) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus)
  const [showPremium, setShowPremium] = useState(false)

  function handleChange(value: string | null) {
    if (!value) return

    if (value === 'event') {
      setShowPremium(true)
      return
    }

    const newStatus = value as ApplicationStatus
    const prevStatus = status
    setStatus(newStatus)

    setPendingStatus(applicationId, newStatus)

    updateApplicationStatus(applicationId, newStatus)
      .then(() => clearPendingStatus(applicationId))
      .catch(() => {
        setStatus(prevStatus)
        clearPendingStatus(applicationId)
        toast.error('保存に失敗しました')
      })

    toast.success(`ステータスを「${STATUS_LABELS[newStatus]}」に変更しました`)
  }

  const allStatuses: ApplicationStatus[] = [...KANBAN_COLUMNS, 'event']

  return (
    <>
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger
          className={`w-36 font-medium ${STATUS_COLORS[status]}`}
        >
          <span className="flex-1 text-left text-sm">{STATUS_LABELS[status]}</span>
        </SelectTrigger>
        <SelectContent>
          {allStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'event' ? (
                <span className="flex items-center gap-1.5">
                  {STATUS_LABELS[s]}
                  <span className="text-xs text-amber-600 font-medium">Premium</span>
                </span>
              ) : (
                STATUS_LABELS[s]
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </>
  )
}
