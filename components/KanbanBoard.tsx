'use client'

import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { deleteApplication } from '@/app/dashboard/actions'
import { useDashboard } from '@/contexts/DashboardContext'
import { KANBAN_COLUMNS, STATUS_LABELS, COLUMN_COLORS, AFFILIATE_URL } from '@/lib/constants'
import type { ApplicationStatus } from '@/types/database'
import type { Database } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'

type Application = Database['public']['Tables']['applications']['Row']

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
]

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitial(name: string) {
  return name.replace(/株式会社|合同会社|有限会社/g, '').trim()[0] ?? '?'
}

export default function KanbanBoard() {
  const { applications, updateStatus, removeApplication } = useDashboard()
  const [showRejected, setShowRejected] = useState(false)

  const activeApps = applications.filter((a) => a.status !== 'rejected' && a.status !== 'event')
  const rejectedApps = applications.filter((a) => a.status === 'rejected')

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId as ApplicationStatus
    updateStatus(draggableId, newStatus)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} を削除しますか？`)) return
    removeApplication(id)
    await deleteApplication(id).catch(() => toast.error('削除に失敗しました'))
    toast.success('削除しました')
  }

  const getColumnApps = (status: ApplicationStatus) =>
    activeApps.filter((a) => a.status === status)

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]">
          {KANBAN_COLUMNS.filter((s) => s !== 'rejected').map((status) => {
            const apps = getColumnApps(status)
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-64 bg-slate-50/80 rounded-xl border border-slate-200 border-t-4 ${COLUMN_COLORS[status]} shadow-sm`}
              >
                <div className="px-3.5 py-3 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-500 font-medium">
                    {apps.length}
                  </span>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`px-2.5 pb-2.5 min-h-24 rounded-b-xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {apps.map((app, index) => (
                        <Draggable key={app.id} draggableId={app.id} index={index}>
                          {(draggable, draggableSnapshot) => (
                            <div
                              ref={draggable.innerRef}
                              {...draggable.draggableProps}
                              {...draggable.dragHandleProps}
                            >
                              <ApplicationCard
                                app={app}
                                isDragging={draggableSnapshot.isDragging}
                                onDelete={handleDelete}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* お祈り一覧トグル */}
      {rejectedApps.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowRejected((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
          >
            {showRejected ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            お祈り一覧を見る（{rejectedApps.length}社）
          </button>

          {showRejected && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {rejectedApps.map((app) => (
                <RejectedCard key={app.id} app={app} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({
  app,
  isDragging,
  onDelete,
}: {
  app: Application
  isDragging: boolean
  onDelete: (id: string, name: string) => void
}) {
  return (
    <Card
      className={`mb-2.5 select-none group ${
        isDragging
          ? 'shadow-xl rotate-1 opacity-95 scale-[1.02]'
          : 'shadow-sm hover:shadow-md'
      } transition-all cursor-grab active:cursor-grabbing border-slate-200`}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(app.company_name)}`}
          >
            {getInitial(app.company_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                {app.company_name}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(app.id, app.company_name)
                }}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                aria-label="削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {app.latest_email_subject && (
              <p className="text-xs text-slate-400 truncate leading-tight">
                {app.latest_email_subject}
              </p>
            )}
          </div>
        </div>

        {app.interview_date && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1.5 font-medium">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{format(new Date(app.interview_date), 'M/d(E) HH:mm', { locale: ja })}</span>
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <Link
            href={`/dashboard/company/${app.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
          >
            詳細を見る →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function RejectedCard({
  app,
  onDelete,
}: {
  app: Application
  onDelete: (id: string, name: string) => void
}) {
  return (
    <Card className="shadow-sm border-red-100 bg-red-50/40">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(app.company_name)}`}
            >
              {getInitial(app.company_name)}
            </div>
            <span className="text-sm font-medium text-slate-700 truncate">
              {app.company_name}
            </span>
          </div>
          <button
            onClick={() => onDelete(app.id, app.company_name)}
            className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <a
          href={AFFILIATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          エージェントに相談
        </a>
      </CardContent>
    </Card>
  )
}
