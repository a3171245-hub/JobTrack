'use client'

import { useState } from 'react'
import TodayUpdates from '@/components/TodayUpdates'
import type { TodayMailItem } from '@/components/TodayUpdates'
import UpcomingSchedule from '@/components/UpcomingSchedule'
import UnconfirmedScheduleBanner from '@/components/UnconfirmedScheduleBanner'
import CompanyTable from '@/components/CompanyTable'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import DedicatedEmailBanner from '@/components/DedicatedEmailBanner'
import ShareCardDialog from '@/components/ShareCardDialog'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import type { Database } from '@/types/database'
import type { UpdateRecord } from '@/contexts/DashboardContext'

type Application = Database['public']['Tables']['applications']['Row']

function Inner({
  applications,
  todayMails,
  dedicatedEmail,
  userEmail,
}: {
  applications: Application[]
  todayMails: TodayMailItem[]
  dedicatedEmail?: string | null
  userEmail?: string | null
}) {
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fade-in min-h-screen">
      {dedicatedEmail && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-indigo-300/60 uppercase tracking-wider mb-2">
            あなたの専用アドレス
          </p>
          <DedicatedEmailBanner email={dedicatedEmail} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayUpdates todayMails={todayMails} />
        <UpcomingSchedule />
      </div>
      <div className="mt-6">
        <UnconfirmedScheduleBanner />
      </div>

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
          <AddApplicationDialog />
        </div>
      </div>

      <CompanyTable />

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
      />
    </DashboardProvider>
  )
}
