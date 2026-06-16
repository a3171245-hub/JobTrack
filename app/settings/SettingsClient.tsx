'use client'

import { useState } from 'react'
import { AlertCircle, AtSign, Check, CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsClient({
  dedicatedEmail,
  successMessage,
  errorMessage,
}: {
  dedicatedEmail: string | null
  successMessage?: string
  errorMessage?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!dedicatedEmail) return
    await navigator.clipboard.writeText(dedicatedEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {successMessage && (
        <div className="flex items-center gap-2.5 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          設定を更新しました。
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          エラーが発生しました（{errorMessage}）。
        </div>
      )}

      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-950/60">
            <AtSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">専用メールアドレス</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                {dedicatedEmail ?? '生成中...'}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 gap-1.5 h-7 text-xs"
                onClick={handleCopy}
                disabled={!dedicatedEmail}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'コピーしました' : 'コピー'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <ul className="space-y-1 text-xs text-slate-400 dark:text-slate-500">
            <li>・企業のマイページや採用サイトのサブメール欄に登録してください</li>
            <li>・このアドレスに届いた選考メールをAIが自動で解析します</li>
            <li>・Chrome拡張を使うとフォームへの自動入力が可能です</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
