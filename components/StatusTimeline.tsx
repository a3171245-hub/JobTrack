import type { ApplicationStatus } from '@/types/database'
import { CheckCircle2, Circle, XCircle } from 'lucide-react'

const FLOW: { status: ApplicationStatus; label: string }[] = [
  { status: 'applied', label: '応募済' },
  { status: 'document', label: '書類選考' },
  { status: 'test', label: '適性検査' },
  { status: 'gd', label: 'GD' },
  { status: 'interview_1', label: '1次面接' },
  { status: 'interview_2', label: '2次面接' },
  { status: 'final', label: '最終面接' },
  { status: 'offer', label: '内定' },
]

const FLOW_ORDER: ApplicationStatus[] = [
  'applied', 'document', 'test', 'gd', 'interview_1', 'interview_2', 'final', 'offer',
]

export default function StatusTimeline({
  currentStatus,
  customFlow,
}: {
  currentStatus: ApplicationStatus
  customFlow?: string[] | null
}) {
  const isRejected = currentStatus === 'rejected'
  const isEvent = currentStatus === 'event'

  if (isEvent) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">
        イベント・説明会のため選考フローは対象外です
      </p>
    )
  }

  const currentIndex = FLOW_ORDER.indexOf(currentStatus)

  const displaySteps =
    customFlow && customFlow.length > 0
      ? customFlow.map((label) => ({ label }))
      : FLOW.map((s) => ({ label: s.label }))

  const displayCurrentIndex =
    currentIndex < 0
      ? -1
      : Math.min(currentIndex, displaySteps.length - 1)

  const minWidth = `${displaySteps.length * 80 + 80}px`

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="relative" style={{ minWidth }}>
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100" />

        <div className="relative flex justify-between">
          {displaySteps.map((step, i) => {
            const isPast = i < displayCurrentIndex
            const isCurrent = i === displayCurrentIndex && !isRejected

            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-100'
                      : isPast
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Circle className="w-5 h-5 fill-white" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs text-center leading-tight whitespace-nowrap ${
                    isCurrent
                      ? 'font-bold text-indigo-700'
                      : isPast
                      ? 'text-indigo-500 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}

          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                isRejected
                  ? 'bg-red-100 text-red-500 ring-4 ring-red-100'
                  : 'bg-slate-100 text-slate-300'
              }`}
            >
              <XCircle className="w-5 h-5" />
            </div>
            <span
              className={`text-xs text-center leading-tight whitespace-nowrap ${
                isRejected ? 'font-bold text-red-600' : 'text-slate-400'
              }`}
            >
              お祈り
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
