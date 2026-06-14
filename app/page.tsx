'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Mail,
  BarChart3,
  CalendarDays,
  Zap,
  ArrowRight,
  Inbox,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Mail,
    title: '専用メールアドレスを発行',
    description:
      '就活サイトのサブメールアドレス欄に専用アドレスを登録するだけ。届いたメールを自動で解析します。',
  },
  {
    icon: Zap,
    title: 'AIが自動で選考状況を判断',
    description:
      'AIがメールの内容を解析し、書類選考・面接・内定など選考ステータスを自動で分類します。',
  },
  {
    icon: BarChart3,
    title: 'ステータス管理で一目瞭然',
    description:
      '応募企業の選考状況をステータス形式で管理。手動での変更も簡単です。',
  },
  {
    icon: CalendarDays,
    title: '面接日程を自動登録',
    description:
      'メールから面接・説明会の日程を抽出してカレンダーに自動追加。スケジュール管理が楽になります。',
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
              <Inbox className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold text-slate-900">JobTrack</span>
          </div>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 h-9"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-violet-50/60 to-white">
        <div
          className="absolute inset-0 -z-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(79,70,229,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(124,58,237,0.12), transparent 40%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-4xl mx-auto px-6 py-28 sm:py-32 text-center animate-fade-in-up">
          <Badge className="mb-6 bg-white text-indigo-700 ring-1 ring-indigo-200 shadow-sm px-3 py-1 text-sm font-medium">
            ✨ 就活生のための自動追跡ツール
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6 leading-[1.15] tracking-tight">
            就活の選考管理を、
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              メールから全自動で。
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            専用メールアドレスを就活サイトに登録するだけ。企業からの選考メールをAIが解析し、
            書類選考・面接・内定までのステータスをリアルタイムで管理します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-8 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/25"
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
                'gap-2 text-base px-8 h-12 bg-white'
              )}
            >
              使い方を見る <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-sm text-slate-400 mt-5">
            無料で始められます。クレジットカード不要。
          </p>
        </div>
      </section>

      {/* How it works — Timeline */}
      <section className="py-24" id="how-it-works">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              3ステップで自動追跡スタート
            </h2>
            <p className="text-slate-500">
              面倒な設定は不要。登録したその日から使えます。
            </p>
          </div>

          <ol className="relative space-y-10">
            {/* 縦のタイムライン線 */}
            <span
              className="absolute left-6 top-3 bottom-3 w-px bg-gradient-to-b from-indigo-300 via-violet-300 to-transparent"
              aria-hidden
            />
            {STEPS.map(({ step, title, desc }) => (
              <li key={step} className="relative flex gap-6 items-start">
                <span className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-base font-bold shadow-md shadow-indigo-600/20">
                  {step}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1.5">
                    {title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="text-center text-sm text-slate-400 mt-14">
            サブメールアドレス欄がある就活サイトならどこでも使えます
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              選考管理に必要な機能を、ぜんぶ
            </h2>
            <p className="text-slate-500">
              メールの受信からスケジュール管理まで、これひとつで完結します。
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-7 ring-1 ring-slate-900/5 shadow-sm flex gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">就活の管理を自動化しよう</h2>
          <p className="text-indigo-100 mb-9 text-lg leading-relaxed">
            今すぐ無料で始めて、選考状況を一元管理しましょう。
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 text-base px-8 h-12 bg-white text-indigo-700 hover:bg-indigo-50"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? 'ログイン中...' : 'Googleで無料スタート'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <Inbox className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-700">JobTrack</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <a href="/terms" className="hover:text-indigo-600 transition-colors">
              利用規約
            </a>
            <a href="/privacy" className="hover:text-indigo-600 transition-colors">
              プライバシーポリシー
            </a>
          </nav>
          <p className="text-sm text-slate-400">
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
