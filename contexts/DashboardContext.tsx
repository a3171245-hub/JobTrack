'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Database, ApplicationStatus } from '@/types/database'
import { toast } from 'sonner'

type Application = Database['public']['Tables']['applications']['Row']

export interface UpdateRecord {
  id: string
  companyName: string
  fromStatus?: ApplicationStatus
  toStatus?: ApplicationStatus
  action?: string
  timestamp: string
}

// localStorage でステータス変更を永続化（デモモード）
const STATUS_STORAGE_KEY = 'jobtrack_status_overrides'

function loadStatusOverrides(): Record<string, ApplicationStatus> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveStatusOverride(id: string, status: ApplicationStatus) {
  if (typeof window === 'undefined') return
  const overrides = loadStatusOverrides()
  overrides[id] = status
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(overrides))
}

interface DashboardContextType {
  applications: Application[]
  todayUpdates: UpdateRecord[]
  updateStatus: (id: string, newStatus: ApplicationStatus) => void
  addApplication: (app: Application) => void
  removeApplication: (id: string) => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({
  initialApplications,
  initialTodayUpdates,
  children,
}: {
  initialApplications: Application[]
  initialTodayUpdates: UpdateRecord[]
  children: ReactNode
}) {
  const [applications, setApplications] = useState(initialApplications)
  const [todayUpdates, setTodayUpdates] = useState<UpdateRecord[]>(initialTodayUpdates)

  // ハイドレーション後にlocalStorageのオーバーライドを適用
  useEffect(() => {
    const overrides = loadStatusOverrides()
    if (Object.keys(overrides).length > 0) {
      setApplications((prev) =>
        prev.map((a) => (a.id in overrides ? { ...a, status: overrides[a.id] } : a))
      )
    }
  }, [])

  const updateStatus = useCallback(
    (id: string, newStatus: ApplicationStatus) => {
      const target = applications.find((a) => a.id === id)
      if (!target || target.status === newStatus) return

      const fromStatus = target.status as ApplicationStatus

      // ローカルstateを即時更新
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      )
      setTodayUpdates((prev) => [
        {
          id: crypto.randomUUID(),
          companyName: target.company_name,
          fromStatus,
          toStatus: newStatus,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])

      // localStorageに永続化（リロード後も変更を維持）
      saveStatusOverride(id, newStatus)

      toast.success(`${target.company_name} のステータスを更新しました`)
    },
    [applications]
  )

  const addApplication = useCallback((app: Application) => {
    setApplications((prev) => [app, ...prev])
    setTodayUpdates((prev) => [
      {
        id: crypto.randomUUID(),
        companyName: app.company_name,
        action: '新規追加',
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
  }, [])

  const removeApplication = useCallback((id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <DashboardContext.Provider
      value={{ applications, todayUpdates, updateStatus, addApplication, removeApplication }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
