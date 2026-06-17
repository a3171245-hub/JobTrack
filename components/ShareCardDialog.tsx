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

function drawCard(canvas: HTMLCanvasElement, apps: Application[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background gradient: indigo → violet
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#312e81')   // indigo-900
  grad.addColorStop(0.55, '#4c1d95') // violet-900
  grad.addColorStop(1, '#1e1b4b')   // indigo-950
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Subtle noise-style dots
  ctx.globalAlpha = 0.06
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = Math.random() * 2 + 0.5
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Glow circle top-right
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, 350)
  glow.addColorStop(0, 'rgba(139,92,246,0.35)')
  glow.addColorStop(1, 'rgba(139,92,246,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Glow circle bottom-left
  const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.85, 0, W * 0.1, H * 0.85, 280)
  glow2.addColorStop(0, 'rgba(99,102,241,0.3)')
  glow2.addColorStop(1, 'rgba(99,102,241,0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  // ── Stats ──────────────────────────────────────────────────
  const total = apps.length
  const docPass = apps.filter((a) =>
    ['document_passed', 'interview', 'gd', 'aptitude', 'offer', 'offered'].includes(a.status)
  ).length
  const interview = apps.filter((a) =>
    ['interview', 'gd', 'aptitude', 'offer', 'offered'].includes(a.status)
  ).length
  const offered = apps.filter((a) => ['offer', 'offered'].includes(a.status)).length

  const stats: { label: string; value: number; sub?: string }[] = [
    { label: '総エントリー', value: total, sub: '社' },
    { label: '書類通過', value: docPass, sub: '社' },
    { label: '面接実施', value: interview, sub: '社' },
    { label: '内定', value: offered, sub: '社' },
  ]

  // ── Top label ──────────────────────────────────────────────
  ctx.fillStyle = 'rgba(199,210,254,0.7)'
  ctx.font = '600 28px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('2025年卒　就活戦績', 88, 108)

  // ── Main headline ──────────────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 110px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  ctx.textAlign = 'left'
  const headline = total > 0
    ? `${offered}社内定 / ${total}社エントリー`
    : 'just getting started'
  ctx.fillText(headline, 88, 240, W - 176)

  // ── Stat cards ─────────────────────────────────────────────
  const cardW = 240
  const cardH = 170
  const gap = 24
  const totalCardsW = stats.length * cardW + (stats.length - 1) * gap
  const startX = (W - totalCardsW) / 2
  const cardY = H - cardH - 90

  stats.forEach((stat, i) => {
    const x = startX + i * (cardW + gap)
    const y = cardY

    // Card background
    ctx.save()
    ctx.globalAlpha = 0.22
    const cardGrad = ctx.createLinearGradient(x, y, x, y + cardH)
    cardGrad.addColorStop(0, '#ffffff')
    cardGrad.addColorStop(1, 'rgba(255,255,255,0.05)')
    roundRect(ctx, x, y, cardW, cardH, 20)
    ctx.fillStyle = cardGrad
    ctx.fill()
    ctx.restore()

    // Card border
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.strokeStyle = '#a5b4fc'
    ctx.lineWidth = 1.5
    roundRect(ctx, x, y, cardW, cardH, 20)
    ctx.stroke()
    ctx.restore()

    // Value
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 72px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(String(stat.value), x + cardW / 2, y + 95)

    // Sub
    if (stat.sub) {
      ctx.font = `500 26px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
      ctx.fillStyle = 'rgba(199,210,254,0.75)'
      const numWidth = ctx.measureText(String(stat.value)).width
      ctx.textAlign = 'left'
      ctx.fillText(stat.sub, x + cardW / 2 + numWidth / 2 - ctx.measureText(String(stat.value)).width / 6 + 4, y + 95)
    }

    // Label
    ctx.fillStyle = 'rgba(199,210,254,0.85)'
    ctx.font = `600 22px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(stat.label, x + cardW / 2, y + cardH - 24)
  })

  // ── Branding ───────────────────────────────────────────────
  // Logo pill
  const pillX = W - 88 - 200
  const pillY = 64
  const pillW = 200
  const pillH = 44
  ctx.save()
  ctx.globalAlpha = 0.25
  roundRect(ctx, pillX, pillY, pillW, pillH, 22)
  ctx.fillStyle = '#a5b4fc'
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#c7d2fe'
  ctx.font = `700 22px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('JobTrack', pillX + pillW / 2, pillY + 29)

  // URL
  ctx.fillStyle = 'rgba(165,180,252,0.55)'
  ctx.font = `400 20px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('job-track-tawny.vercel.app', W - 88, H - 40)
}

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50">
          <div className="rounded-xl overflow-hidden shadow-lg">
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
            1200 × 630 px — Twitter / Instagram に最適
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
