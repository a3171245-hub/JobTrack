'use client'

import { useState, useEffect, useRef } from 'react'
import { StickyNote, Check, Loader2 } from 'lucide-react'
import { updateMemo } from '@/app/dashboard/actions'

const BACKUP_KEY = (id: string) => `jobtrack_memo_${id}`

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function MemoSection({
  applicationId,
  initialMemo,
}: {
  applicationId: string
  initialMemo: string | null
}) {
  const [memo, setMemo] = useState(initialMemo ?? '')
  const [state, setState] = useState<SaveState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // マウント後：保存に失敗してローカルに残っている下書きがあれば復元
  useEffect(() => {
    try {
      const backup = localStorage.getItem(BACKUP_KEY(applicationId))
      if (backup !== null && backup !== (initialMemo ?? '')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMemo(backup)
      }
    } catch {}
    // applicationId 単位で一度だけ復元
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  function persist(value: string) {
    setState('saving')
    updateMemo(applicationId, value)
      .then((res) => {
        if (res.ok) {
          setState('saved')
          try {
            localStorage.removeItem(BACKUP_KEY(applicationId))
          } catch {}
        } else {
          setState('error')
        }
      })
      .catch(() => setState('error'))
  }

  function handleChange(value: string) {
    setMemo(value)
    setState('idle')
    // 失敗時に備え常にローカルへ控える
    try {
      localStorage.setItem(BACKUP_KEY(applicationId), value)
    } catch {}
    // デバウンスして Supabase へ保存
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => persist(value), 800)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <section className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="w-4 h-4 text-indigo-500" />
        <h2 className="text-base font-semibold text-slate-800">メモ</h2>
        <span className="ml-auto text-xs flex items-center gap-1">
          {state === 'saving' && (
            <span className="text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> 保存中
            </span>
          )}
          {state === 'saved' && (
            <span className="text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> 保存しました
            </span>
          )}
          {state === 'error' && (
            <span className="text-rose-500">保存失敗（端末に保持中）</span>
          )}
        </span>
      </div>
      <textarea
        value={memo}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="面接の感想、企業研究のメモ、選考の振り返りなど自由に記入できます"
        rows={6}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-y transition-colors"
      />
    </section>
  )
}
