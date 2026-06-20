'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import TodayUpdates from '@/components/TodayUpdates'
import type { TodayMailItem } from '@/components/TodayUpdates'
import UpcomingSchedule from '@/components/UpcomingSchedule'
import UnconfirmedScheduleBanner from '@/components/UnconfirmedScheduleBanner'
import CompanyTable from '@/components/CompanyTable'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import DedicatedEmailBanner from '@/components/DedicatedEmailBanner'
import ShareCardDialog from '@/components/ShareCardDialog'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import type { Database } from '@/types/database'
import type { UpdateRecord } from '@/contexts/DashboardContext'

type Application = Database['public']['Tables']['applications']['Row']

const DashboardProvider = dynamic(
  () => import('@/contexts/DashboardContext').then((m) => m.DashboardProvider),
  {
    ssr: false,
    loading: () => (
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="skeleton h-24 rounded-2xl mb-8" />
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-3">
            <div className="skeleton w-24 h-6 rounded-lg" />
            <div className="skeleton w-8 h-4 rounded" />
          </div>
          <div className="skeleton w-28 h-9 rounded-xl" />
        </div>
        <div className="flex gap-3 mb-4">
          <div className="skeleton w-56 h-9 rounded-xl" />
          <div className="skeleton w-40 h-9 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
          <div className="h-12 skeleton rounded-none" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="skeleton w-40 h-4 rounded" />
              <div className="skeleton w-20 h-6 rounded-full ml-4" />
              <div className="skeleton w-48 h-4 rounded ml-auto hidden md:block" />
            </div>
          ))}
        </div>
      </main>
    ),
  }
)

function Inner({
  applications,
  todayMails,
  dedicatedEmail,
  userEmail,
  plan,
}: {
  applications: Application[]
  todayMails: TodayMailItem[]
  dedicatedEmail?: string | null
  userEmail?: string | null
  plan: 'free' | 'premium'
}) {
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fade-in min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayUpdates todayMails={todayMails} />
        <UpcomingSchedule />
      </div>
      <div className="mt-6">
        <UnconfirmedScheduleBanner />
      </div>

      {dedicatedEmail && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-indigo-300/60 uppercase tracking-wider mb-2">
            あなたの専用アドレス
          </p>
          <DedicatedEmailBanner email={dedicatedEmail} />
        </div>
      )}

      <div className="flex items-center justify-between mb-5 mt-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">選考管理</h1>
          <span className="text-sm text-slate-400 dark:text-indigo-300/60">
            {applications.length} 社
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5 h-11 md:h-9 px-3 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">結果をシェア</span>
          </Button>
          <AddApplicationDialog plan={plan} />
        </div>
      </div>

      <CompanyTable />

      {plan === 'free' && (
        <div className="mt-8 mb-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">広告</p>
            <div
              className="h-24 bg-slate-100 dark:bg-slate-800/40 rounded-xl flex items-center justify-center"
              data-ad-slot="dashboard-banner"
            >
              <span className="text-xs text-slate-400 dark:text-slate-600">広告スペース（AdSense）</span>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <ShareCardDialog
          applications={applications}
          userEmail={userEmail}
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  )
}

export default function DashboardShell({
  applications,
  initialTodayUpdates,
  todayMails = [],
  dedicatedEmail,
  userEmail,
  plan = 'free',
}: {
  applications: Application[]
  initialTodayUpdates: UpdateRecord[]
  todayMails?: TodayMailItem[]
  dedicatedEmail?: string | null
  userEmail?: string | null
  plan?: 'free' | 'premium'
}) {
  return (
    <DashboardProvider
      initialApplications={applications}
      initialTodayUpdates={initialTodayUpdates}
      plan={plan}
    >
      <Inner
        applications={applications}
        todayMails={todayMails}
        dedicatedEmail={dedicatedEmail}
        userEmail={userEmail}
        plan={plan}
      />
    </DashboardProvider>
  )
}
