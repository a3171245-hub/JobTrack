import type { Metadata } from 'next'
import { Noto_Sans_JP, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Vercel のサーバーレス関数は未指定だと iad1（米国東部）で実行される。
// 利用者・Supabase ともに日本付近にあるため、米国東部との往復遅延が
// ページ遷移ごとに ~300-400ms 乗っていた（計測: 同一ルートへの
// ウォーム状態の連続リクエストでも一貫してこの遅延が出ており、
// クエリ内容やコールドスタートでは説明できなかった）。
// 全ページで共通して効く設定なのでルートレイアウトに置く。
export const preferredRegion = 'hnd1'

export const metadata: Metadata = {
  title: 'JobTrack - 就活メール自動追跡サービス',
  description:
    '専用メールアドレスを就活サイトに登録するだけで、企業からの選考メールをAIが自動解析し、選考状況を一元管理できます。',
  openGraph: {
    title: 'JobTrack - 就活メール自動追跡サービス',
    description: '企業からのメールをAIで自動解析してカンバン管理',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${notoSansJP.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* ダークモードのフラッシュを防ぐ — React hydration より前に実行 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
