'use client'

import { useState, useEffect } from 'react'
import { CalendarX2, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { updateEsDeadline } from '@/app/dashboard/actions'

const STORAGE_KEY = (id: string) => `jobtrack_es_deadline_${id}`

interface Props {
  applicationId: string
  initialDeadline: string | null
}

export default function EsDeadlineEditor({ applicationId, initialDeadline }: Props) {
  const [deadline, setDeadline] = useState<string | null>(initialDeadline)
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(applicationId))
    if (stored !== null) {
      setDeadline(stored || null)
    }
  }, [applicationId])

  function startEditing() {
    setInputValue(deadline ? format(parseISO(deadline), 'yyyy-MM-dd') : '')
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    const newDeadline = inputValue ? new Date(inputValue + 'T00:00:00').toISOString() : null
    setDeadline(newDeadline)
    localStorage.setItem(STORAGE_KEY(applicationId), newDeadline ?? '')
    updateEsDeadline(applicationId, newDeadline).catch(() => {})
    setSaving(false)
    setEditing(false)
  }

  function handleClear() {
    setDeadline(null)
    localStorage.setItem(STORAGE_KEY(applicationId), '')
    updateEsDeadline(applicationId, null).catch(() => {})
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          保存
        </button>
        {deadline && (
          <button
            onClick={handleClear}
            className="h-9 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm transition-colors"
          >
            削除
          </button>
        )}
        <button
          onClick={() => setEditing(false)}
          className="h-9 w-9 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {deadline ? (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
          <CalendarX2 className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-700">
            {format(parseISO(deadline), 'yyyy年M月d日(E)', { locale: ja })}
          </span>
        </div>
      ) : (
        <span className="text-sm text-slate-400">未設定</span>
      )}
      <button
        onClick={startEditing}
        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors"
      >
        {deadline ? '変更' : '設定する'}
      </button>
    </div>
  )
}
