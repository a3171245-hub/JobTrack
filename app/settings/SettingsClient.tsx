'use client'

import { AlertCircle, CheckCircle2, Mail, Wifi, WifiOff } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function SettingsClient({
  gmailEmail,
  gmailWatchExpiration,
  successMessage,
  errorMessage,
}: {
  gmailEmail: string | null
  gmailWatchExpiration: string | null
  successMessage?: string
  errorMessage?: string
}) {
  const isConnected = !!gmailEmail
  const watchExpiry = gmailWatchExpiration ? new Date(gmailWatchExpiration) : null
  const isWatchExpired = watchExpiry ? watchExpiry < new Date() : true
  const needsRenewal = isConnected && isWatchExpired

  return (
    <div className="space-y-5">
      {successMessage === 'gmail_connected' && (
        <div className="flex items-center gap-2.5 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Gmail連携が完了しました。
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
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isConnected
                ? needsRenewal
                  ? 'bg-amber-100 dark:bg-amber-950/60'
                  : 'bg-green-100 dark:bg-green-950/60'
                : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Mail
              className={`w-5 h-5 ${
                isConnected
                  ? needsRenewal
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
                  : 'text-slate-400'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Gmail連携</h2>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  !isConnected
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    : needsRenewal
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400'
                }`}
              >
                {!isConnected ? (
                  '未連携'
                ) : needsRenewal ? (
                  <><WifiOff className="w-3 h-3" /> 期限切れ</>
                ) : (
                  <><Wifi className="w-3 h-3" /> 連携中</>
                )}
              </span>
            </div>

            {isConnected ? (
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <code className="font-mono text-slate-800 dark:text-slate-200">
                    {gmailEmail}
                  </code>{' '}
                  で受信監視中
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {needsRenewal
                    ? '通知が期限切れです。ログアウトして再ログインすると更新されます。'
                    : `通知有効期限：${
                        watchExpiry
                          ? format(watchExpiry, 'yyyy年M月d日(E)', { locale: ja })
                          : '不明'
                      }`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Googleログイン時にGmail連携が自動的に設定されます。
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <ul className="space-y-1 text-xs text-slate-400 dark:text-slate-500">
            <li>・Gmailに届いた企業メールをリアルタイムで検知</li>
            <li>・AIが企業名・選考ステータスを自動判定</li>
            <li>・通知設定は7日ごとに再ログインで更新されます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
