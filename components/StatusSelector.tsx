'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { STATUS_LABELS, KANBAN_COLUMNS } from '@/lib/constants'
import type { ApplicationStatus } from '@/types/database'
import { toast } from 'sonner'

const STORAGE_KEY = 'jobtrack_status_overrides'

function readOverride(id: string): ApplicationStatus | null {
  try {
    const overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, ApplicationStatus>
    return overrides[id] ?? null
  } catch {
    return null
  }
}

function writeOverride(id: string, status: ApplicationStatus) {
  try {
    const overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, ApplicationStatus>
    overrides[id] = status
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {}
}

export default function StatusSelector({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: ApplicationStatus
}) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus)

  // Sync with localStorage on mount (overrides server-rendered value)
  useEffect(() => {
    const override = readOverride(applicationId)
    if (override) setStatus(override)
  }, [applicationId])

  function handleChange(value: string | null) {
    if (!value) return
    const newStatus = value as ApplicationStatus

    setStatus(newStatus)
    writeOverride(applicationId, newStatus)
    toast.success(`ステータスを「${STATUS_LABELS[newStatus]}」に変更しました`)
  }

  const allStatuses: ApplicationStatus[] = [...KANBAN_COLUMNS, 'event']

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-36">
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
