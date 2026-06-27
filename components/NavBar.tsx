'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import { Inbox, LayoutDashboard, CalendarDays, Mail, LogOut, Check, Settings } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/calendar', label: 'カレンダー', icon: CalendarDays },
  { href: '/mail', label: 'メール', icon: Mail },
  { href: '/settings', label: '設定', icon: Settings },
]

export default function NavBar({
  user,
  dedicatedEmail,
}: {
  user: User
  dedicatedEmail?: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [copiedUser, setCopiedUser] = useState(false)
  const [copiedDedicated, setCopiedDedicated] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function copyUserEmail() {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setCopiedUser(true)
    setTimeout(() => setCopiedUser(false), 1500)
  }

  async function copyDedicatedEmail() {
    if (!dedicatedEmail) return
    await navigator.clipboard.writeText(dedicatedEmail)
    setCopiedDedicated(true)
    setTimeout(() => setCopiedDedicated(false), 1500)
  }

  return (
    <>
    <header className="bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-50 transition-colors duration-200 drop-shadow-sm">
      {/* ── メインバー ──────────────────────────────────────── */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* ロゴ */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0 group">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <Inbox className="h-4 w-4" />
          </span>
          <span className="font-black text-lg bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            JobTrack
          </span>
        </Link>

        {/* ナビゲーション（PC: sm以上、中央固定） */}
        <nav className="hidden sm:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* 右側 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 専用メールアドレス (md以上) */}
          {dedicatedEmail && (
            <div className="hidden md:block">
              <button
                onClick={copyDedicatedEmail}
                className="text-xs font-mono text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="クリックしてコピー"
              >
                {copiedDedicated ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="w-3 h-3" />
                    コピーしました
                  </span>
                ) : (
                  <span className="truncate max-w-[200px] block">{dedicatedEmail}</span>
                )}
              </button>
            </div>
          )}

          {/* ユーザーメール (sm以上) */}
          <div className="relative hidden sm:block">
            <button
              onClick={copyUserEmail}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="クリックしてコピー"
            >
              {user.email}
            </button>
            {copiedUser && (
              <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-10">
                コピーしました
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45" />
              </div>
            )}
          </div>

          <ThemeToggle />

          {/* ログアウト（sm以上はテキスト付き、モバイルはアイコンのみ） */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 px-2 sm:px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="ログアウト"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>
    </header>

    {/* ── モバイル ボトムナビゲーション（sm未満のみ） ─────── */}
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
    </>
  )
}
