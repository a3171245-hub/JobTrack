'use client'

import { AlertCircle, CheckCircle2, Mail, RefreshCw, Wifi, WifiOff } from 'lucide-react'
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
          Gmail連携が完了しました。メール自動取込が有効になりました。
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          連携に失敗しました（{errorMessage}）。再度お試しください。
        </div>
      )}

      {/* Gmail section */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex items-start gap-4 mb-5">
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
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Gmail連携
              </h2>
              {isConnected ? (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    needsRenewal
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      : 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400'
                  }`}
                >
                  {needsRenewal ? (
                    <><WifiOff className="w-3 h-3" /> 期限切れ</>
                  ) : (
                    <><Wifi className="w-3 h-3" /> 連携中</>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  未連携
                </span>
              )}
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
                  {needsRenewal ? (
                    '通知設定が期限切れです。再連携してください。'
                  ) : (
                    <>
                      通知有効期限：
                      {watchExpiry
                        ? format(watchExpiry, 'yyyy年M月d日(E)', { locale: ja })
                        : '不明'}
                    </>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                就活用Gmailを連携すると、企業からのメールが自動でダッシュボードに反映されます。
              </p>
            )}
          </div>
        </div>

        <a
          href="/api/gmail/connect"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {needsRenewal ? (
            <><RefreshCw className="w-4 h-4" /> 通知を再設定する</>
          ) : isConnected ? (
            <><RefreshCw className="w-4 h-4" /> 別のGmailで再連携</>
          ) : (
            <><Mail className="w-4 h-4" /> 就活用Gmailを連携する</>
          )}
        </a>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
            連携の仕組み
          </h3>
          <ul className="space-y-1 text-xs text-slate-400 dark:text-slate-500">
            <li>・Gmailに届いた企業メールをリアルタイムで検知</li>
            <li>・AIが企業名・選考ステータスを自動判定</li>
            <li>・ダッシュボードとメール一覧に自動反映（要旨のみ保存）</li>
            <li>・通知設定は7日ごとに再連携が必要です</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
