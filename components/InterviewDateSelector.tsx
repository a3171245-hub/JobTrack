'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarDays, Check } from 'lucide-react'
import { confirmInterviewDate } from '@/app/dashboard/actions'
import { toast } from 'sonner'

export default function InterviewDateSelector({
  applicationId,
  companyName,
  candidates,
  userId,
}: {
  applicationId: string
  companyName: string
  candidates: string[]
  userId: string
}) {
  const hasCandidates = candidates.length > 0
  const [mode, setMode] = useState<'candidates' | 'manual'>(hasCandidates ? 'candidates' : 'manual')
  const [selectedDate, setSelectedDate] = useState(candidates[0] ?? '')
  const [manualDateTime, setManualDateTime] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  function fmt(d: string) {
    try { return format(parseISO(d), 'yyyy年M月d日(E) HH:mm', { locale: ja }) } catch { return d }
  }

  async function handleConfirm() {
    const isoDate = mode === 'candidates'
      ? selectedDate
      : (manualDateTime ? new Date(manualDateTime).toISOString() : null)

    if (!isoDate) {
      toast.error('日時を入力してください')
      return
    }

    setStatus('loading')
    try {
      const result = await confirmInterviewDate(applicationId, isoDate)
      if (!result.ok) {
        toast.error('日程の確定に失敗しました')
        setStatus('idle')
        return
      }
      await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: `${companyName} — 面接`, date: isoDate, type: 'interview' }),
      })
      setStatus('done')
      toast.success('面接日程を確定し、カレンダーに追加しました')
    } catch {
      setStatus('idle')
      toast.error('日程の確定に失敗しました')
    }
  }

  if (status === 'done') return null

  return (
    <section
      id="interview-date"
      className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-700/50 rounded-2xl p-5 sm:p-6 mb-6 scroll-mt-20"
    >
      <div className="flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">
            {hasCandidates
              ? `面接日程候補が${candidates.length}件あります — 1つ選んで確定してください`
              : '面接日程が未確定です — 日時を入力して確定してください'}
          </h2>
          {!hasCandidates && (
            <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-1">
              メールに日程の記載がなかったため、企業の応募者専用マイページ等で確認した日時を入力してください。
            </p>
          )}

          {hasCandidates && (
            <div className="flex gap-1.5 mt-3">
              <button
                onClick={() => setMode('candidates')}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                  mode === 'candidates'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60'
                }`}
              >
                候補から選ぶ
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                  mode === 'manual'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60'
                }`}
              >
                自分で入力する
              </button>
            </div>
          )}

          {mode === 'candidates' ? (
            <div className="mt-3 space-y-2">
              {candidates.map((d, i) => {
                const isSelected = selectedDate === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-700/50 text-indigo-900 dark:text-indigo-100 hover:border-indigo-400 dark:hover:border-indigo-500'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-white' : 'border-indigo-300 dark:border-indigo-600'
                    }`}>
                      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-sm font-medium">
                      候補{['A', 'B', 'C', 'D', 'E'][i] ?? i + 1}：{fmt(d)}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-3">
              <input
                type="datetime-local"
                value={manualDateTime}
                onChange={(e) => setManualDateTime(e.target.value)}
                className="h-11 px-3 rounded-lg border border-indigo-300 dark:border-indigo-700/60 bg-white dark:bg-indigo-950/40 text-sm text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600/40 w-full sm:w-auto"
              />
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={status === 'loading' || (mode === 'manual' && !manualDateTime)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {status === 'loading' ? '確定中…' : 'この日程で確定する'}
          </button>
        </div>
      </div>
    </section>
  )
}
