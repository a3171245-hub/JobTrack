'use client'

import { useState } from 'react'
import { AlertCircle, AtSign, Check, CheckCircle2, Copy, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function SettingsClient({
  dedicatedEmail,
  plan = 'free',
  successMessage,
  errorMessage,
}: {
  dedicatedEmail: string | null
  plan?: 'free' | 'premium'
  successMessage?: string
  errorMessage?: string
}) {
  const [copied, setCopied] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

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

      {/* プランカード */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-100 dark:bg-violet-950/60">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">ご利用プラン</h2>
              <div className="flex items-center gap-2">
                {plan === 'premium' ? (
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    プレミアム
                  </span>
                ) : (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    フリー
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {plan === 'premium' ? '月額 ¥500' : '月額 ¥0'}
                </span>
              </div>
            </div>
          </div>
          {plan === 'free' && (
            <Button
              onClick={() => setUpgradeOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 h-8 text-xs font-semibold shadow-md shadow-indigo-600/20 border-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              アップグレード
            </Button>
          )}
        </div>

        {plan === 'free' && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              フリープランの制限
            </p>
            <ul className="space-y-1 text-xs text-slate-400 dark:text-slate-500">
              <li>・受信メールの保存: 最新20件まで</li>
              <li>・企業登録数: 最大5社まで</li>
            </ul>
          </div>
        )}
      </div>

      {/* 専用メールアドレスカード */}
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

      {/* アップグレードモーダル */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              プレミアムプランへのアップグレード
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                プレミアムプラン — 月額 ¥500
              </p>
              <ul className="text-xs text-indigo-700 dark:text-indigo-400 space-y-1.5">
                <li>・受信メール: 無制限</li>
                <li>・企業登録数: 無制限</li>
                <li>・広告非表示</li>
              </ul>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              決済システムは現在準備中です。近日公開予定です。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
