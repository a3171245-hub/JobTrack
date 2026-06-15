'use client'

import { useState } from 'react'
import { Copy, Check, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function DedicatedEmailBanner({
  email,
}: {
  email: string | null
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!email) return
    await navigator.clipboard.writeText(email)
    setCopied(true)
    toast.success('コピーしました')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 shadow-sm transition-colors">
      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">メール自動取込用アドレス</p>
        <code className="text-sm font-mono text-slate-800 dark:text-slate-200 truncate block">
          {email ?? '生成中...'}
        </code>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="flex-shrink-0 gap-1.5 h-8"
        onClick={handleCopy}
        disabled={!email}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {copied ? 'コピー済' : 'コピー'}
      </Button>
    </div>
  )
}
