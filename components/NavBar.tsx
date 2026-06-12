'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Inbox, LayoutDashboard, CalendarDays, LogOut, Check } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function NavBar({
  user,
  dedicatedEmail,
}: {
  user: User
  dedicatedEmail?: string | null
}) {
  const router = useRouter()
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
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900">JobTrack</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}
            >
              <LayoutDashboard className="w-4 h-4" />
              ダッシュボード
            </Link>
            <Link
              href="/calendar"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}
            >
              <CalendarDays className="w-4 h-4" />
              カレンダー
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* 専用メールアドレス（Mailgun） */}
          {dedicatedEmail && (
            <div className="relative hidden md:block">
              <button
                onClick={copyDedicatedEmail}
                className="text-xs font-mono text-slate-400 hover:text-blue-600 transition-colors"
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
              className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
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
