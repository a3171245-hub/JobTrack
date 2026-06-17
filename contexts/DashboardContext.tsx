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
import { createClient } from '@/lib/supabase/client'
import { readOverlay, writeOverlay } from '@/lib/status-overlay'
import { setApplicationActive } from '@/app/dashboard/actions'
import { toast } from 'sonner'

type Application = Database['public']['Tables']['applications']['Row']

const FREE_ACTIVE_LIMIT = 5

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
  plan: 'free' | 'premium'
  activeCount: number
  updateStatus: (id: string, newStatus: ApplicationStatus) => void
  addApplication: (app: Application) => void
  removeApplication: (id: string) => void
  toggleActive: (id: string, newIsActive: boolean) => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({
  initialApplications,
  initialTodayUpdates,
  plan = 'free',
  children,
}: {
  initialApplications: Application[]
  initialTodayUpdates: UpdateRecord[]
  plan?: 'free' | 'premium'
  children: ReactNode
}) {
  const [applications, setApplications] = useState(initialApplications)
  const [todayUpdates, setTodayUpdates] = useState<UpdateRecord[]>(initialTodayUpdates)
  const overlayRef = useRef<Record<string, ApplicationStatus>>({})

  const activeCount = applications.filter((a) => a.is_active !== false).length

  // マウント時：未確定の変更を復元してバックグラウンドで再送
  useEffect(() => {
    const overlay = readOverlay()
    overlayRef.current = overlay
    const ids = Object.keys(overlay)
    if (ids.length === 0) return

    setApplications((prev) =>
      prev.map((a) => (overlay[a.id] ? { ...a, status: overlay[a.id] } : a))
    )

    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return
      ids.forEach((id) => {
        supabase
          .from('applications')
          .update({
            status: overlay[id],
            updated_at: new Date().toISOString(),
            updated_by: 'manual',
          })
          .eq('id', id)
          .eq('user_id', session.user.id)
          .then(
            () => {
              delete overlayRef.current[id]
              writeOverlay(overlayRef.current)
            },
            () => { /* 失敗時はオーバーレイに残す（次回再送） */ }
          )
      })
    })
  }, [])

  const updateStatus = useCallback(
    async (id: string, newStatus: ApplicationStatus) => {
      const target = applications.find((a) => a.id === id)
      if (!target || target.status === newStatus) return

      const fromStatus = target.status as ApplicationStatus

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

      overlayRef.current[id] = newStatus
      writeOverlay(overlayRef.current)

      toast.success(`${target.company_name} のステータスを更新しました`)

      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (!user) throw new Error('no active session')

        const { data, error } = await supabase
          .from('applications')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            updated_by: 'manual',
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()

        if (error) throw error
        if (!data || data.length === 0) {
          console.warn('[DashboardContext] 0 rows updated', { id, userId: user.id }, authError)
          throw new Error('update matched 0 rows')
        }

        delete overlayRef.current[id]
        writeOverlay(overlayRef.current)
      } catch (err) {
        console.error('[DashboardContext] updateStatus failed:', err)
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: fromStatus } : a))
        )
        delete overlayRef.current[id]
        writeOverlay(overlayRef.current)
        toast.error(`${target.company_name} の保存に失敗しました`)
      }
    },
    [applications]
  )

  const toggleActive = useCallback(
    async (id: string, newIsActive: boolean) => {
      const target = applications.find((a) => a.id === id)
      if (!target) return

      // クライアント側でも上限チェック（楽観的更新前）
      if (newIsActive && plan === 'free') {
        const currentActiveCount = applications.filter((a) => a.is_active !== false).length
        if (currentActiveCount >= FREE_ACTIVE_LIMIT) {
          toast.error(`アクティブ枠の上限（${FREE_ACTIVE_LIMIT}社）に達しています。他の企業をピン留め解除してください。`)
          return
        }
      }

      // 楽観的更新
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: newIsActive } : a))
      )

      const result = await setApplicationActive(id, newIsActive)

      if ('limitReached' in result) {
        // ロールバック
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_active: !newIsActive } : a))
        )
        toast.error(`アクティブ枠の上限（${FREE_ACTIVE_LIMIT}社）に達しています。`)
        return
      }

      toast.success(
        newIsActive
          ? `${target.company_name} をピン留めしました`
          : `${target.company_name} のピン留めを解除しました`
      )
    },
    [applications, plan]
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
        plan,
        activeCount,
        updateStatus,
        addApplication,
        removeApplication,
        toggleActive,
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
