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

  // マウント時：未確定の変更を復元し、ブラウザクライアント経由で再送する
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

    // バックグラウンドで再送
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return
      ids.forEach((id) => {
        supabase
          .from('applications')
          .update({ status: overlay[id], updated_at: new Date().toISOString() })
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
      console.log('updateStatus called:', id, newStatus)
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

      toast.success(`${target.company_name} のステータスを更新しました`)

      // ブラウザクライアントで認証確認してから永続化
      try {
        const supabase = createClient()
        // getUser() はサーバーに検証リクエストを送るので getSession() より確実
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[DashboardContext] auth user:', user?.id, authError?.message)

        if (!user) {
          throw new Error('no active session')
        }

        console.log('[DashboardContext] updating app:', id, '→', newStatus, 'user:', user.id)

        const { data, error } = await supabase
          .from('applications')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()

        console.log('[DashboardContext] update result:', data, error)

        if (error) throw error

        // 0行更新 = RLS またはIDが不一致（サイレント失敗を検知）
        if (!data || data.length === 0) {
          console.warn('[DashboardContext] 0 rows updated — check RLS or user_id mismatch', { id, userId: user.id })
          throw new Error('update matched 0 rows')
        }

        // 保存成功 → オーバーレイを解除
        delete overlayRef.current[id]
        writeOverlay(overlayRef.current)
      } catch (err) {
        console.error('[DashboardContext] updateStatus failed:', err)
        // 保存失敗時: UIを元のステータスにロールバック
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
