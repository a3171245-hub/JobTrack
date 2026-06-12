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
      'GPT-4o-miniがメールの内容を解析し、書類選考・面接・内定など選考ステータスを自動で分類します。',
  },
  {
    icon: BarChart3,
    title: 'カンバンボードで一目瞭然',
    description:
      '応募企業の選考状況をカンバン形式で管理。ドラッグ&ドロップで手動変更も可能です。',
  },
  {
    icon: CalendarDays,
    title: '面接日程を自動登録',
    description:
      'メールから面接・説明会の日程を抽出してカレンダーに自動追加。スケジュール管理が楽になります。',
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">JobTrack</span>
          </div>
          <Button onClick={handleGoogleLogin} disabled={loading} size="sm">
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4 text-sm">
          就活生のための自動追跡ツール
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          企業からのメールを
          <br />
          <span className="text-blue-600">自動でカンバン管理</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          専用メールアドレスを就活サイトに登録するだけ。企業からの選考メールをAIが解析し、
          書類選考・面接・内定などのステータスをリアルタイムで更新します。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="gap-2 text-base px-8"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? 'ログイン中...' : 'Googleでログイン'}
          </Button>
          <a
            href="#how-it-works"
            className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'gap-2 text-base px-8')}
          >
            使い方を見る <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <p className="text-sm text-slate-400 mt-4">無料で始められます。クレジットカード不要。</p>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20" id="how-it-works">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            3ステップで自動追跡スタート
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                step: '01',
                title: 'Googleでログイン',
                desc: 'あなた専用のメールアドレスが発行されます',
              },
              {
                step: '02',
                title: '就活サイトに登録',
                desc: 'リクナビ・マイナビ等のサブメール欄に専用アドレスを入力',
              },
              {
                step: '03',
                title: 'あとは自動',
                desc: '企業からメールが届くたびにカンバンが自動更新されます',
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>

          {/* サービス対応メモ */}
          <p className="text-center text-sm text-slate-400 mb-16">
            サブメールアドレス欄がある就活サイトならどこでも使えます
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 shadow-sm border flex gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">就活の管理を自動化しよう</h2>
          <p className="text-blue-100 mb-8 text-lg">
            今すぐ無料で始めて、選考状況を一元管理しましょう。
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 text-base px-8"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? 'ログイン中...' : 'Googleで無料スタート'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Inbox className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-slate-600">JobTrack</span>
        </div>
        <p>© 2026 JobTrack. All rights reserved.</p>
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
