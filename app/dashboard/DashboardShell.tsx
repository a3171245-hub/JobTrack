'use client'

import dynamic from 'next/dynamic'
import TodayUpdates from '@/components/TodayUpdates'
import CompanyTable from '@/components/CompanyTable'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import DedicatedEmailBanner from '@/components/DedicatedEmailBanner'
import type { Database } from '@/types/database'
import type { UpdateRecord } from '@/contexts/DashboardContext'

type Application = Database['public']['Tables']['applications']['Row']

const DashboardProvider = dynamic(
  () => import('@/contexts/DashboardContext').then((m) => m.DashboardProvider),
  {
    ssr: false,
    loading: () => (
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* today widget skeleton */}
        <div className="skeleton h-24 rounded-2xl mb-8" />
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-3">
            <div className="skeleton w-24 h-6 rounded-lg" />
            <div className="skeleton w-8 h-4 rounded" />
          </div>
          <div className="skeleton w-28 h-9 rounded-xl" />
        </div>
        {/* filter row */}
        <div className="flex gap-3 mb-4">
          <div className="skeleton w-56 h-9 rounded-xl" />
          <div className="skeleton w-40 h-9 rounded-xl" />
        </div>
        {/* table */}
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

export default function DashboardShell({
  applications,
  initialTodayUpdates,
  dedicatedEmail,
}: {
  applications: Application[]
  initialTodayUpdates: UpdateRecord[]
  dedicatedEmail?: string | null
}) {
  return (
    <DashboardProvider
      initialApplications={applications}
      initialTodayUpdates={initialTodayUpdates}
    >
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fade-in min-h-screen">
        <TodayUpdates />

        {dedicatedEmail && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-indigo-300/60 uppercase tracking-wider mb-2">
              あなたの専用アドレス
            </p>
            <DedicatedEmailBanner email={dedicatedEmail} />
          </div>
        )}

        <div className="flex items-center justify-between mb-5 mt-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold text-white">選考管理</h1>
            <span className="text-sm text-indigo-300/60">
              {applications.length} 社
            </span>
          </div>
          <AddApplicationDialog />
        </div>

        <CompanyTable />
      </main>
    </DashboardProvider>
  )
}
