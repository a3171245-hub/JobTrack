'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import {
  Mail,
  BarChart3,
  CalendarDays,
  Zap,
  ArrowRight,
  Inbox,
  Shield,
  Clock,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Mail,
    title: '専用メールを自動受信',
    description:
      '就活サイトのサブメールアドレス欄に専用アドレスを登録するだけ。届いたメールを自動で解析します。',
    color: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: Zap,
    title: 'AIが選考状況を判断',
    description:
      'AIがメールの内容を解析し、書類選考・面接・内定など選考ステータスを自動で分類します。',
    color: 'from-violet-500 to-fuchsia-500',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: BarChart3,
    title: 'ステータス一覧で管理',
    description:
      '応募企業の選考状況をステータス形式で管理。手動での変更も簡単です。',
    color: 'from-sky-500 to-indigo-500',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
  },
  {
    icon: CalendarDays,
    title: '面接日程を自動登録',
    description:
      'メールから面接・説明会の日程を抽出してカレンダーに自動追加します。',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Shield,
    title: 'セキュアな管理',
    description:
      'Googleアカウントでサインイン。あなたのデータは暗号化されて安全に保存されます。',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: Clock,
    title: '設定は3分で完了',
    description:
      '面倒な初期設定は不要。ログインして専用アドレスを取得するだけですぐ使えます。',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Googleでログイン',
    desc: 'ワンクリックでアカウント作成。あなた専用のメールアドレスが自動で発行されます。',
  },
  {
    step: '02',
    title: '企業のマイページに登録',
    desc: '各企業のマイページのサブメールアドレス欄に、発行された専用アドレスを入力するだけ。',
  },
  {
    step: '03',
    title: 'あとは自動でおまかせ',
    desc: '企業からメールが届くたびにAIが解析し、選考ステータスが自動で更新されていきます。',
  },
]

export default function LandingPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] transition-colors duration-200">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-slate-100 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
              <Inbox className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">JobTrack</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 h-9 shadow-sm shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0f1117]">
        {/* Gradient blobs */}
        <div
          className="pointer-events-none absolute inset-0 -z-0"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(79,70,229,0.13) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 10%, rgba(124,58,237,0.1) 0%, transparent 55%)',
          }}
        />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 -z-0 opacity-[0.025] dark:opacity-[0.04]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-32 sm:pt-36 sm:pb-40 text-center">
          <div className="animate-fade-in-up">
            <Badge className="mb-7 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm px-3.5 py-1 text-sm font-medium">
              ✨ 就活生のための自動追跡ツール
            </Badge>
          </div>

          <h1 className="animate-fade-in-up delay-1 text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white mb-7 leading-[1.1] tracking-tight">
            就活の選考管理を、
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient">
              メールから全自動で。
            </span>
          </h1>

          <p className="animate-fade-in-up delay-2 text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-11 max-w-2xl mx-auto leading-relaxed">
            専用メールアドレスを就活サイトに登録するだけ。
            企業からの選考メールを AI が解析し、書類選考・面接・内定までの
            ステータスをリアルタイムで管理します。
          </p>

          <div className="animate-fade-in-up delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2.5 text-base px-8 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon />
              {loading ? 'ログイン中...' : 'Googleで無料で始める'}
            </Button>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'gap-2 text-base px-8 h-12 border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              使い方を見る <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <p className="animate-fade-in-up delay-4 text-sm text-slate-400 dark:text-slate-600 mt-6">
            無料で始められます。クレジットカード不要。
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section
        className="py-28 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/60"
        id="how-it-works"
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              3ステップで自動追跡スタート
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              面倒な設定は不要。登録したその日から使えます。
            </p>
          </div>

          <ol className="relative space-y-10">
            <span
              className="absolute left-6 top-3 bottom-3 w-px bg-gradient-to-b from-indigo-400 via-violet-400 to-transparent dark:from-indigo-600 dark:via-violet-700"
              aria-hidden
            />
            {STEPS.map(({ step, title, desc }) => (
              <li key={step} className="relative flex gap-6 items-start">
                <span className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-base font-bold shadow-md shadow-indigo-600/25">
                  {step}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1.5">
                    {title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="text-center text-sm text-slate-400 dark:text-slate-600 mt-14">
            サブメールアドレス欄がある就活サイトならどこでも使えます
          </p>
        </div>
      </section>

      {/* ── Features (3-column) ────────────────────────────── */}
      <section className="py-28 bg-white dark:bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              選考管理に必要な機能を、ぜんぶ
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              メールの受信からスケジュール管理まで、これひとつで完結します。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description, bg, text }) => (
              <div
                key={title}
                className="group bg-white dark:bg-slate-900/70 rounded-2xl p-6 ring-1 ring-slate-900/5 dark:ring-slate-700/60 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/60 hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className={`inline-flex w-11 h-11 rounded-xl ${bg} items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${text}`} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 animate-gradient"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-10" aria-hidden
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-2xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">就活の管理を自動化しよう</h2>
          <p className="text-indigo-100 mb-10 text-lg leading-relaxed">
            今すぐ無料で始めて、選考状況を一元管理しましょう。
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2.5 text-base px-8 h-12 bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl shadow-black/20 hover:scale-[1.03] active:scale-[0.98]"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? 'ログイン中...' : 'Googleで無料スタート'}
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <Inbox className="h-3.5 w-3.5" />
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">JobTrack</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-500">
            <a href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              利用規約
            </a>
            <a href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              プライバシーポリシー
            </a>
          </nav>
          <p className="text-sm text-slate-400 dark:text-slate-600">
            © 2026 JobTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
