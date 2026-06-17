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

// Canvas dimensions — 1200 × 630 (standard OGP)
const W = 1200
const H = 630

// ── Aggregation ─────────────────────────────────────────────────────────────
// Status order: applied → document → test → gd →
//               interview_1 → interview_2 → final → offer
// rejected / event are terminal states not counted as progression
const DOC_PASS   = new Set(['test', 'gd', 'interview_1', 'interview_2', 'final', 'offer'])
const INTERVIEW  = new Set(['interview_1', 'interview_2', 'final', 'offer'])
const OFFER_ONLY = new Set(['offer'])

function computeStats(apps: Application[]) {
  return {
    total:     apps.length,
    docPass:   apps.filter((a) => DOC_PASS.has(a.status)).length,
    interview: apps.filter((a) => INTERVIEW.has(a.status)).length,
    offered:   apps.filter((a) => OFFER_ONLY.has(a.status)).length,
  }
}

// ── Canvas helper ─────────────────────────────────────────────────────────
function rr(
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

// ── Draw function ─────────────────────────────────────────────────────────
function drawCard(canvas: HTMLCanvasElement, apps: Application[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { total, docPass, interview, offered } = computeStats(apps)

  // System font stack (macOS / iOS renders Japanese cleanly)
  const F = `-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`

  // ── 1. Background ────────────────────────────────────────────
  //    #F7F6FF — near-white with a hair of violet warmth
  ctx.fillStyle = '#F7F6FF'
  ctx.fillRect(0, 0, W, H)

  // Outer frame — 1.5 px muted violet border (inset by half lineWidth to avoid clipping)
  ctx.strokeStyle = '#E4DFFA'
  ctx.lineWidth = 1.5
  ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5)

  // ── 2. Header (y centre ≈ 66) ───────────────────────────────
  // Logo dot
  ctx.beginPath()
  ctx.arc(80, 66, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#7C3AED'   // violet-600
  ctx.fill()

  // "JobTrack"
  ctx.fillStyle = '#7C3AED'
  ctx.font = `700 24px ${F}`
  ctx.textAlign = 'left'
  ctx.fillText('JobTrack', 103, 73)

  // Separator dot
  ctx.beginPath()
  ctx.arc(253, 66, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = '#C4B5FD'   // violet-300
  ctx.fill()

  // Sub-title
  ctx.fillStyle = '#9CA3AF'   // gray-400
  ctx.font = `500 21px ${F}`
  ctx.fillText('就活戦績レポート', 268, 73)

  // ── 3. Header divider (y=96) ─────────────────────────────────
  ctx.strokeStyle = '#EDE9FE'   // violet-100
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, 96)
  ctx.lineTo(W - 60, 96)
  ctx.stroke()

  // ── 4. Hero — offered count (centred in y=96..416) ───────────
  //    Number baseline  y=288   font=152px
  //    "社内定"          y=352   font=44px
  //    Context line     y=390   font=19px

  // Big number
  ctx.fillStyle = '#4C1D95'   // violet-900 — strong, readable
  ctx.font = `900 152px ${F}`
  ctx.textAlign = 'center'
  ctx.fillText(String(offered), W / 2, 288)

  // "社内定"
  ctx.fillStyle = '#111827'   // gray-900
  ctx.font = `700 44px ${F}`
  ctx.textAlign = 'center'
  ctx.fillText('社内定', W / 2, 352)

  // Context line
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `400 19px ${F}`
  ctx.textAlign = 'center'
  ctx.fillText(`全 ${total} 社にエントリー`, W / 2, 390)

  // ── 5. Mid divider (y=416) ───────────────────────────────────
  ctx.strokeStyle = '#EDE9FE'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, 416)
  ctx.lineTo(W - 60, 416)
  ctx.stroke()

  // ── 6. Sub-stat cards (3 × equal, y=436) ────────────────────
  //    Each card: 296 × 128 px, 24 px gap
  //    Total width: 296×3 + 24×2 = 936 px → startX = 132
  const cards = [
    { label: '総エントリー', value: total },
    { label: '書類通過',     value: docPass },
    { label: '面接実施',     value: interview },
  ]
  const cW = 296
  const cH = 128
  const cGap = 24
  const cX0 = (W - (cW * 3 + cGap * 2)) / 2   // = 132
  const cY  = 436

  cards.forEach((card, i) => {
    const x = cX0 + i * (cW + cGap)
    const y = cY

    // Card fill
    rr(ctx, x, y, cW, cH, 16)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    // Card border — violet-100
    rr(ctx, x, y, cW, cH, 16)
    ctx.strokeStyle = '#EDE9FE'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Top accent stripe (4 px, violet-600)
    rr(ctx, x + 20, y + 16, 40, 4, 2)
    ctx.fillStyle = '#7C3AED'
    ctx.fill()

    // Value
    ctx.fillStyle = '#111827'
    ctx.font = `800 58px ${F}`
    ctx.textAlign = 'center'
    ctx.fillText(String(card.value), x + cW / 2, y + 78)

    // Label
    ctx.fillStyle = '#9CA3AF'
    ctx.font = `500 17px ${F}`
    ctx.textAlign = 'center'
    ctx.fillText(card.label, x + cW / 2, y + 107)
  })

  // ── 7. Footer URL (bottom-right) ─────────────────────────────
  ctx.fillStyle = '#D1D5DB'   // gray-300
  ctx.font = `400 15px ${F}`
  ctx.textAlign = 'right'
  ctx.fillText('job-track-tawny.vercel.app', W - 60, H - 22)
}

// ── Component ─────────────────────────────────────────────────────────────
export default function ShareCardDialog({ applications, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) drawCard(canvasRef.current, applications)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
              ダウンロードして X (Twitter) や Instagram にシェアできます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview — light bg so the white card is visible */}
        <div className="p-5 bg-slate-100 dark:bg-slate-800/60">
          <div className="rounded-xl overflow-hidden shadow-md ring-1 ring-slate-200 dark:ring-slate-700">
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
          <p className="text-xs text-slate-400">1200 × 630 px</p>
          <Button
            onClick={handleDownload}
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Download className="w-4 h-4" />
            ダウンロード
          </Button>
        </div>
      </div>
    </div>
  )
}
