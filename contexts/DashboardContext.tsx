'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import type { Database, ApplicationStatus } from '@/types/database'
import { updateApplicationStatus } from '@/app/dashboard/actions'
import { readOverlay, writeOverlay } from '@/lib/status-overlay'
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
  const [todayUpdates, setTodayUpdates] =
    useState<UpdateRecord[]>(initialTodayUpdates)
  const overlayRef = useRef<Record<string, ApplicationStatus>>({})

  // マウント時：未確定の変更を復元し、サーバーへ再送する
  useEffect(() => {
    const overlay = readOverlay()
    overlayRef.current = overlay
    const ids = Object.keys(overlay)
    if (ids.length === 0) return

    // 画面に未確定ステータスを反映（localStorage参照のためマウント後に実行）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApplications((prev) =>
      prev.map((a) => (overlay[a.id] ? { ...a, status: overlay[a.id] } : a))
    )

    // バックグラウンドで再送し、成功したものをオーバーレイから外す
    ids.forEach((id) => {
      updateApplicationStatus(id, overlay[id])
        .then(() => {
          delete overlayRef.current[id]
          writeOverlay(overlayRef.current)
        })
        .catch(() => {
          /* 失敗時はオーバーレイに残す（次回再送） */
        })
    })
  }, [])

  const updateStatus = useCallback(
    (id: string, newStatus: ApplicationStatus) => {
      const target = applications.find((a) => a.id === id)
      if (!target || target.status === newStatus) return

      const fromStatus = target.status as ApplicationStatus

      // 楽観的UI更新
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

      // まず localStorage に控える（保存失敗してもリロードで維持される）
      overlayRef.current[id] = newStatus
      writeOverlay(overlayRef.current)

      // Supabaseへ永続化。成功したらオーバーレイから外す
      updateApplicationStatus(id, newStatus)
        .then(() => {
          delete overlayRef.current[id]
          writeOverlay(overlayRef.current)
        })
        .catch(() => {
          toast.error('保存に失敗しました（変更は端末に保持されます）')
        })

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
    if (overlayRef.current[id]) {
      delete overlayRef.current[id]
      writeOverlay(overlayRef.current)
    }
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        applications,
        todayUpdates,
        updateStatus,
        addApplication,
        removeApplication,
      }}
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
