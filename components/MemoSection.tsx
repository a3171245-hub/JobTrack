'use client'

import { useState, useEffect } from 'react'
import { StickyNote } from 'lucide-react'

const STORAGE_KEY = (id: string) => `jobtrack_memo_${id}`

export default function MemoSection({ applicationId }: { applicationId: string }) {
  const [memo, setMemo] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      setMemo(localStorage.getItem(STORAGE_KEY(applicationId)) ?? '')
    } catch {}
  }, [applicationId])

  function handleChange(value: string) {
    setMemo(value)
    setSaved(false)
    try {
      localStorage.setItem(STORAGE_KEY(applicationId), value)
      setSaved(true)
    } catch {}
  }

  return (
    <section className="bg-white rounded-xl border shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="w-4 h-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-800">メモ</h2>
        {saved && (
          <span className="text-xs text-slate-400 ml-auto">保存済み</span>
        )}
      </div>
      <textarea
        value={memo}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="自由にメモを残せます（ローカルに保存されます）"
        rows={5}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y transition-colors"
      />
    </section>
  )
}
