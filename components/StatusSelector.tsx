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

export default function StatusSelector({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: ApplicationStatus
}) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus)

  function handleChange(value: string | null) {
    if (!value) return
    const newStatus = value as ApplicationStatus
    setStatus(newStatus)

    // 保存失敗時に備えてローカルへ控える
    setPendingStatus(applicationId, newStatus)

    updateApplicationStatus(applicationId, newStatus)
      .then(() => clearPendingStatus(applicationId))
      .catch(() =>
        toast.error('保存に失敗しました（変更は端末に保持されます）')
      )

    toast.success(`ステータスを「${STATUS_LABELS[newStatus]}」に変更しました`)
  }

  const allStatuses: ApplicationStatus[] = [...KANBAN_COLUMNS, 'event']

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger
        className={`w-36 font-medium ${STATUS_COLORS[status]}`}
      >
        <span className="flex-1 text-left text-sm">{STATUS_LABELS[status]}</span>
      </SelectTrigger>
      <SelectContent>
        {allStatuses.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
