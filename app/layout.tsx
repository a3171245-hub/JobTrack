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

export const metadata: Metadata = {
  title: 'JobTrack - 就活メール自動追跡サービス',
  description:
    '専用メールアドレスを就活サイトに登録するだけで、企業からの選考メールをAIが自動解析し、カンバンボードで選考状況を一元管理できます。',
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
      className={`${notoSansJP.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
