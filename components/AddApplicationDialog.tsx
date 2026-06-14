'use client'

import { useState } from 'react'
import { addApplication } from '@/app/dashboard/actions'
import { useDashboard } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Sparkles, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row']

export default function AddApplicationDialog() {
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addApplication: addToContext } = useDashboard()

  async function fetchCompanyInfo() {
    if (!company.trim()) return
    setFetching(true)
    try {
      const res = await fetch(`/api/company-info?name=${encodeURIComponent(company.trim())}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as { notes: string }
      setNotes(data.notes)
      toast.success('企業情報を取得しました')
    } catch {
      toast.error('企業情報の取得に失敗しました')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim()) return
    setSaving(true)
    try {
      const result = await addApplication(company.trim(), notes || undefined)

      // 楽観的に画面に追加
      const newApp: Application = {
        id: result?.id ?? crypto.randomUUID(),
        user_id: '00000000-0000-0000-0000-000000000000',
        company_name: company.trim(),
        status: 'applied',
        latest_email_subject: null,
        interview_date: null,
        event_date: null,
        test_type: null,
        test_date: null,
        test_result: null,
        notes: notes || null,
        memo: null,
        es_deadline: null,
        custom_flow: null,
        gd_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      addToContext(newApp)
      toast.success(`${company} を追加しました`)
      reset()
    } catch {
      toast.error('追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setCompany('')
    setNotes('')
    setOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5 h-9 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-600/20"
      >
        <Plus className="w-4 h-4" />
        企業を追加
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else setOpen(true) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>企業を手動追加</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="company" className="mb-2 block">企業名</Label>
                <div className="flex gap-2">
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="例: 株式会社○○"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        fetchCompanyInfo()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchCompanyInfo}
                    disabled={!company.trim() || fetching}
                    className="flex-shrink-0 gap-1.5"
                    title="AIで企業情報を自動取得"
                  >
                    {fetching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI取得
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Enterキーを押すとAIが企業情報を自動入力します
                </p>
              </div>

              {notes && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs text-slate-600">AI取得情報</Label>
                    <button
                      type="button"
                      onClick={() => setNotes('')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-line">
                    {notes}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset}>
                キャンセル
              </Button>
              <Button type="submit" disabled={saving || !company.trim()}>
                {saving ? '追加中...' : '追加する'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
