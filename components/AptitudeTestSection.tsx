'use client'

import { useState, useTransition } from 'react'
import { updateAptitudeTest } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ClipboardCheck, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { TestResult } from '@/types/database'

const TEST_TYPES = ['玉手箱', 'SPI', 'TGWEB', 'CBAT', 'SCOA'] as const
const TEST_RESULT_LABELS: Record<TestResult, string> = {
  '通過': '通過',
  '不通過': '不通過',
  '未受検': '未受検',
}
const TEST_RESULT_COLORS: Record<TestResult, string> = {
  '通過': 'bg-green-50 text-green-700 border-green-200',
  '不通過': 'bg-red-50 text-red-700 border-red-200',
  '未受検': 'bg-slate-50 text-slate-600 border-slate-200',
}

interface Props {
  applicationId: string
  initialTestType: string | null
  initialTestDate: string | null
  initialTestResult: TestResult | null
}

export default function AptitudeTestSection({
  applicationId,
  initialTestType,
  initialTestDate,
  initialTestResult,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [testType, setTestType] = useState(initialTestType ?? '')
  const [customType, setCustomType] = useState(
    initialTestType && !(TEST_TYPES as readonly string[]).includes(initialTestType)
      ? initialTestType
      : ''
  )
  const [isCustom, setIsCustom] = useState(
    !!initialTestType && !(TEST_TYPES as readonly string[]).includes(initialTestType)
  )
  const [testDate, setTestDate] = useState(
    initialTestDate ? initialTestDate.split('T')[0] : ''
  )
  const [testResult, setTestResult] = useState<TestResult | null>(initialTestResult)
  const [isPending, startTransition] = useTransition()

  const displayType = isCustom ? customType : testType

  function handleTypeChange(val: string | null) {
    if (!val) return
    if (val === '__custom__') {
      setIsCustom(true)
      setTestType('')
    } else {
      setIsCustom(false)
      setTestType(val)
    }
  }

  function handleSave() {
    const finalType = isCustom ? customType : testType
    startTransition(async () => {
      try {
        await updateAptitudeTest(applicationId, {
          test_type: finalType || null,
          test_date: testDate ? new Date(testDate).toISOString() : null,
          test_result: testResult,
        })
        toast.success('適性検査情報を保存しました')
        setEditing(false)
      } catch {
        toast.error('保存に失敗しました')
      }
    })
  }

  function handleCancel() {
    setTestType(initialTestType ?? '')
    setTestDate(initialTestDate ? initialTestDate.split('T')[0] : '')
    setTestResult(initialTestResult)
    setCustomType('')
    setIsCustom(
      !!initialTestType && !(TEST_TYPES as readonly string[]).includes(initialTestType)
    )
    setEditing(false)
  }

  return (
    <section className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-800">適性検査</h2>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            編集
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-1">検査種別</p>
            <p className="font-medium text-slate-800">{displayType || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">受検日</p>
            <p className="font-medium text-slate-800">
              {testDate
                ? new Date(testDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">結果</p>
            {testResult ? (
              <Badge
                variant="outline"
                className={`text-xs ${TEST_RESULT_COLORS[testResult]}`}
              >
                {TEST_RESULT_LABELS[testResult]}
              </Badge>
            ) : (
              <p className="text-slate-400">—</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1.5 block text-xs">検査種別</Label>
              <Select
                value={isCustom ? '__custom__' : (testType || undefined)}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">新規追加（テキスト入力）</SelectItem>
                </SelectContent>
              </Select>
              {isCustom && (
                <Input
                  className="mt-2"
                  placeholder="検査名を入力"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">受検日</Label>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">結果</Label>
              <Select
                value={testResult ?? undefined}
                onValueChange={(v) => setTestResult(v as TestResult | null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="未受検">未受検</SelectItem>
                  <SelectItem value="通過">通過</SelectItem>
                  <SelectItem value="不通過">不通過</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              キャンセル
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {isPending ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
