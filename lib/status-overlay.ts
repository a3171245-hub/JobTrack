import type { ApplicationStatus } from '@/types/database'

/**
 * Supabaseへの保存に失敗してもステータス変更が消えないように、
 * 未確定の変更を localStorage に保持する共有ヘルパー。
 * { [applicationId]: ApplicationStatus }
 */
const OVERLAY_KEY = 'jobtrack_pending_status'

export function readOverlay(): Record<string, ApplicationStatus> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(OVERLAY_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function writeOverlay(overlay: Record<string, ApplicationStatus>) {
  if (typeof window === 'undefined') return
  try {
    if (Object.keys(overlay).length === 0) {
      localStorage.removeItem(OVERLAY_KEY)
    } else {
      localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlay))
    }
  } catch {}
}

export function setPendingStatus(id: string, status: ApplicationStatus) {
  const o = readOverlay()
  o[id] = status
  writeOverlay(o)
}

export function clearPendingStatus(id: string) {
  const o = readOverlay()
  if (o[id]) {
    delete o[id]
    writeOverlay(o)
  }
}
