'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Inbox, LayoutDashboard, CalendarDays, Mail, LogOut, Check } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/calendar', label: 'カレンダー', icon: CalendarDays },
  { href: '/mail', label: 'メール', icon: Mail },
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
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* ロゴ（左） */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <Inbox className="h-4 w-4" />
          </span>
          <span className="font-bold text-slate-900">JobTrack</span>
        </Link>

        {/* ナビ（中央） */}
        <nav className="hidden sm:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ユーザー（右） */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 専用メールアドレス（Mailgun） */}
          {dedicatedEmail && (
            <div className="relative hidden md:block">
              <button
                onClick={copyDedicatedEmail}
                className="text-xs font-mono text-slate-400 hover:text-indigo-600 transition-colors"
                title="クリックしてコピー"
              >
                {copiedDedicated ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    コピーしました
                  </span>
                ) : (
                  <span className="truncate max-w-[200px] block">{dedicatedEmail}</span>
                )}
              </button>
            </div>
          )}

          {/* ユーザーメールアドレス（クリックでコピー） */}
          <div className="relative hidden sm:block">
            <button
              onClick={copyUserEmail}
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
              title="クリックしてコピー"
            >
              {user.email}
            </button>
            {copiedUser && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-10">
                コピーしました
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-slate-600"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
