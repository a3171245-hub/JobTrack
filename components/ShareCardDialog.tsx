'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row']

interface Props {
  applications: Application[]
  onClose: () => void
}

const W = 1200
const H = 630

// ────────────────────────────────────────────────────────────────
// Status progression order (from constants.ts)
// applied → document → test → gd → interview_1 → interview_2 → final → offer
// rejected = 落選, event = イベント
//
// 書類通過以降 = test, gd, interview_1, interview_2, final, offer
// 面接実施以降 = interview_1, interview_2, final, offer
// 内定          = offer
// ────────────────────────────────────────────────────────────────
const DOC_PASS_STATUSES = new Set(['test', 'gd', 'interview_1', 'interview_2', 'final', 'offer'])
const INTERVIEW_STATUSES = new Set(['interview_1', 'interview_2', 'final', 'offer'])
const OFFER_STATUSES = new Set(['offer'])

function computeStats(apps: Application[]) {
  const total = apps.length
  const docPass = apps.filter((a) => DOC_PASS_STATUSES.has(a.status)).length
  const interview = apps.filter((a) => INTERVIEW_STATUSES.has(a.status)).length
  const offered = apps.filter((a) => OFFER_STATUSES.has(a.status)).length
  return { total, docPass, interview, offered }
}

// ────────────────────────────────────────────────────────────────
// Canvas helpers
// ────────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawCard(canvas: HTMLCanvasElement, apps: Application[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { total, docPass, interview, offered } = computeStats(apps)

  // ── Background ─────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0,    '#0f0c29')
  bg.addColorStop(0.45, '#302b63')
  bg.addColorStop(1,    '#24243e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Glow — top-right violet
  const g1 = ctx.createRadialGradient(W * 0.88, H * 0.08, 0, W * 0.88, H * 0.08, 420)
  g1.addColorStop(0, 'rgba(167,139,250,0.28)')
  g1.addColorStop(1, 'rgba(167,139,250,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, W, H)

  // Glow — bottom-left indigo
  const g2 = ctx.createRadialGradient(W * 0.08, H * 0.92, 0, W * 0.08, H * 0.92, 360)
  g2.addColorStop(0, 'rgba(99,102,241,0.32)')
  g2.addColorStop(1, 'rgba(99,102,241,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, W, H)

  // Subtle star-dots
  ctx.save()
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = Math.random() * 1.5 + 0.3
    const a = Math.random() * 0.45 + 0.05
    ctx.globalAlpha = a
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = '#c4b5fd'
    ctx.fill()
  }
  ctx.restore()

  // Thin horizontal accent line
  const lineGrad = ctx.createLinearGradient(80, 0, W - 80, 0)
  lineGrad.addColorStop(0,   'rgba(167,139,250,0)')
  lineGrad.addColorStop(0.3, 'rgba(167,139,250,0.7)')
  lineGrad.addColorStop(0.7, 'rgba(99,102,241,0.7)')
  lineGrad.addColorStop(1,   'rgba(99,102,241,0)')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(80, 130)
  ctx.lineTo(W - 80, 130)
  ctx.stroke()

  // ── JobTrack badge (top-left) ────────────────────────────────
  const font = `-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`

  // pill bg
  ctx.save()
  roundRect(ctx, 80, 52, 168, 44, 22)
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#a78bfa'
  ctx.fill()
  ctx.restore()
  // pill border
  ctx.save()
  roundRect(ctx, 80, 52, 168, 44, 22)
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = '#c4b5fd'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = '#e0d7ff'
  ctx.font = `700 22px ${font}`
  ctx.textAlign = 'center'
  ctx.fillText('JobTrack', 80 + 84, 52 + 29)

  // ── Title ────────────────────────────────────────────────────
  ctx.fillStyle = '#c4b5fd'
  ctx.font = `600 26px ${font}`
  ctx.textAlign = 'left'
  ctx.fillText('就活戦績レポート', 80, 104)

  // ── Hero: offer count ─────────────────────────────────────────
  // Large offered number
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 148px ${font}`
  ctx.textAlign = 'left'
  const heroNum = String(offered)
  ctx.fillText(heroNum, 80, 290)

  const heroNumW = ctx.measureText(heroNum).width

  // "社内定" suffix
  ctx.fillStyle = '#c4b5fd'
  ctx.font = `700 46px ${font}`
  ctx.textAlign = 'left'
  ctx.fillText('社内定', 80 + heroNumW + 8, 274)

  // "/" separator
  ctx.fillStyle = 'rgba(196,181,253,0.4)'
  ctx.font = `300 38px ${font}`
  ctx.fillText(`/ ${total}社エントリー`, 80 + heroNumW + 8, 322)

  // ── Stat cards ────────────────────────────────────────────────
  const statData = [
    { label: '総エントリー', value: total,     accent: '#818cf8' },  // indigo
    { label: '書類通過',     value: docPass,   accent: '#34d399' },  // emerald
    { label: '面接実施',     value: interview, accent: '#60a5fa' },  // blue
    { label: '内定',         value: offered,   accent: '#a78bfa' },  // violet
  ]

  const cardW = 230
  const cardH = 172
  const cardGap = 20
  const totalCardsW = statData.length * cardW + (statData.length - 1) * cardGap
  const cardsStartX = (W - totalCardsW) / 2
  const cardsY = H - cardH - 56

  statData.forEach((stat, i) => {
    const cx = cardsStartX + i * (cardW + cardGap)
    const cy = cardsY

    // Card glass background
    ctx.save()
    roundRect(ctx, cx, cy, cardW, cardH, 18)
    ctx.globalAlpha = 0.14
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.restore()

    // Card border
    ctx.save()
    roundRect(ctx, cx, cy, cardW, cardH, 18)
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = stat.accent
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    // Top accent bar
    ctx.save()
    const barGrad = ctx.createLinearGradient(cx, cy, cx + cardW, cy)
    barGrad.addColorStop(0, stat.accent)
    barGrad.addColorStop(1, 'rgba(0,0,0,0)')
    roundRect(ctx, cx + 18, cy + 14, 56, 3, 2)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = barGrad
    ctx.fill()
    ctx.restore()

    // Value
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 78px ${font}`
    ctx.textAlign = 'center'
    ctx.fillText(String(stat.value), cx + cardW / 2, cy + 102)

    // "社" unit
    ctx.fillStyle = stat.accent
    ctx.font = `600 22px ${font}`
    const valW = ctx.measureText(String(stat.value)).width
    ctx.textAlign = 'left'
    ctx.fillText('社', cx + cardW / 2 + valW / 2 + 4, cy + 94)

    // Label
    ctx.fillStyle = 'rgba(196,181,253,0.8)'
    ctx.font = `600 20px ${font}`
    ctx.textAlign = 'center'
    ctx.fillText(stat.label, cx + cardW / 2, cy + cardH - 20)
  })

  // ── Footer URL ────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(148,163,184,0.45)'
  ctx.font = `400 18px ${font}`
  ctx.textAlign = 'right'
  ctx.fillText('job-track-tawny.vercel.app', W - 80, H - 22)
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
export default function ShareCardDialog({ applications, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      drawCard(canvasRef.current, applications)
    }
  }, [applications])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'jobtrack-result.png'
    a.click()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              戦績シェア画像
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              SNSにシェアしたり、画像として保存できます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-slate-950/60">
          <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="w-full h-auto block"
              style={{ aspectRatio: `${W} / ${H}` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700/60">
          <p className="text-xs text-slate-400">
            1200 × 630 px — X (Twitter) / Instagram に最適
          </p>
          <Button
            onClick={handleDownload}
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Download className="w-4 h-4" />
            ダウンロード
          </Button>
        </div>
      </div>
    </div>
  )
}
