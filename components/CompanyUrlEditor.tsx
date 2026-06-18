'use client'

import { useState } from 'react'
import { ExternalLink, Check, X } from 'lucide-react'
import { updateCompanyUrl } from '@/app/dashboard/actions'
import { toast } from 'sonner'

interface Props {
  applicationId: string
  initialUrl: string | null
}

export default function CompanyUrlEditor({ applicationId, initialUrl }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setInputValue(url ?? '')
    setEditing(true)
  }

  async function handleSave() {
    const trimmed = inputValue.trim()
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error('http:// または https:// から始まるURLを入力してください')
      return
    }
    setSaving(true)
    const result = await updateCompanyUrl(applicationId, trimmed || null)
    setSaving(false)
    if (!result.ok) {
      toast.error('URLの保存に失敗しました')
      return
    }
    setUrl(trimmed || null)
    setEditing(false)
  }

  async function handleClear() {
    setUrl(null)
    await updateCompanyUrl(applicationId, null).catch(() => {})
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="https://mypage.example.com/..."
          autoFocus
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 min-w-0 flex-1"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" />
          保存
        </button>
        {url && (
          <button
            onClick={handleClear}
            className="h-9 px-3 rounded-lg border border-red-200 dark:border-red-800/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm transition-colors"
          >
            削除
          </button>
        )}
        <button
          onClick={() => setEditing(false)}
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          マイページを開く
        </a>
      ) : (
        <span className="text-sm text-slate-400 dark:text-slate-500">未設定</span>
      )}
      <button
        onClick={startEditing}
        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 border border-indigo-200 dark:border-indigo-700/60 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition-colors"
      >
        {url ? '変更' : '設定する'}
      </button>
    </div>
  )
}
