'use client'

import dynamic from 'next/dynamic'
import TodayUpdates from '@/components/TodayUpdates'
import CompanyTable from '@/components/CompanyTable'
import AddApplicationDialog from '@/components/AddApplicationDialog'
import type { Database } from '@/types/database'
import type { UpdateRecord } from '@/contexts/DashboardContext'

type Application = Database['public']['Tables']['applications']['Row']

// 'use client' コンポーネント内でのみ ssr: false が許可される
const DashboardProvider = dynamic(
  () => import('@/contexts/DashboardContext').then((m) => m.DashboardProvider),
  {
    ssr: false,
    loading: () => (
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="h-28 bg-white rounded-2xl animate-pulse mb-6" />
        <div className="h-10 w-48 bg-white rounded-xl animate-pulse mb-4" />
        <div className="h-80 bg-white rounded-2xl animate-pulse" />
      </main>
    ),
  }
)

export default function DashboardShell({
  applications,
  initialTodayUpdates,
}: {
  applications: Application[]
  initialTodayUpdates: UpdateRecord[]
}) {
  return (
    <DashboardProvider
      initialApplications={applications}
      initialTodayUpdates={initialTodayUpdates}
    >
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <TodayUpdates />

        <div className="flex items-center justify-between mb-5 mt-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold text-slate-900">選考管理</h1>
            <span className="text-sm text-slate-500">
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
