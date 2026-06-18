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
  const [selectedDate, setSelectedDate] = useState(candidates[0])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  function fmt(d: string) {
    try { return format(parseISO(d), 'yyyy年M月d日(E) HH:mm', { locale: ja }) } catch { return d }
  }

  async function handleConfirm() {
    setStatus('loading')
    try {
      const result = await confirmInterviewDate(applicationId, selectedDate)
      if (!result.ok) {
        toast.error('日程の確定に失敗しました')
        setStatus('idle')
        return
      }
      await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: `${companyName} — 面接`, date: selectedDate, type: 'interview' }),
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
      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 mb-6 scroll-mt-20"
    >
      <div className="flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-100">
            面接日程候補が{candidates.length}件あります — 1つ選んで確定してください
          </h2>
          <div className="mt-3 space-y-2">
            {candidates.map((d, i) => (
              <label key={d} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="interview-date-detail"
                  value={d}
                  checked={selectedDate === d}
                  onChange={() => setSelectedDate(d)}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className={`text-sm ${selectedDate === d ? 'text-amber-900 dark:text-amber-100 font-medium' : 'text-amber-700 dark:text-amber-300'}`}>
                  候補{['A', 'B', 'C', 'D', 'E'][i] ?? i + 1}：{fmt(d)}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleConfirm}
            disabled={status === 'loading'}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {status === 'loading' ? '確定中…' : 'この日程で確定する'}
          </button>
        </div>
      </div>
    </section>
  )
}
