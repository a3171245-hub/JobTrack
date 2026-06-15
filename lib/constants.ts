import type { ApplicationStatus } from '@/types/database'

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: '応募済',
  document: '書類選考',
  test: '適性検査',
  gd: 'GD',
  interview_1: '1次面接',
  interview_2: '2次面接',
  final: '最終面接',
  offer: '内定',
  rejected: 'お祈り',
  event: 'イベント',
}

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  'applied',
  'document',
  'test',
  'gd',
  'interview_1',
  'interview_2',
  'final',
  'offer',
  'rejected',
]

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied:     'bg-slate-100 text-slate-600 border-slate-200',
  document:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  test:        'bg-amber-100 text-amber-700 border-amber-200',
  gd:          'bg-purple-100 text-purple-700 border-purple-200',
  interview_1: 'bg-blue-100 text-blue-700 border-blue-200',
  interview_2: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  final:       'bg-violet-100 text-violet-700 border-violet-200',
  offer:       'bg-green-100 text-green-700 border-green-200',
  rejected:    'bg-red-100 text-red-700 border-red-200',
  event:       'bg-teal-100 text-teal-700 border-teal-200',
}

export const COLUMN_COLORS: Record<ApplicationStatus, string> = {
  applied:     'border-t-slate-400',
  document:    'border-t-yellow-400',
  test:        'border-t-amber-400',
  gd:          'border-t-purple-400',
  interview_1: 'border-t-blue-400',
  interview_2: 'border-t-indigo-400',
  final:       'border-t-violet-400',
  offer:       'border-t-green-400',
  rejected:    'border-t-red-400',
  event:       'border-t-teal-400',
}

export const AFFILIATE_URL = 'https://px.a8.net/'
