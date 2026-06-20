'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row']
type CardFormat = 'landscape' | 'portrait'

interface Props {
  applications: Application[]
  userEmail?: string | null
  onClose: () => void
}

// ── Canvas sizes ─────────────────────────────────────────────────
const LW = 1200  // landscape width
const LH = 630   // landscape height
const PW = 1080  // portrait width
const PH = 1920  // portrait height

// ── Aggregation ──────────────────────────────────────────────────
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

function todayLabel() {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// ── Canvas helpers ────────────────────────────────────────────────
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

function brandGradient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h)
  g.addColorStop(0, '#7C3AED')    // violet-600
  g.addColorStop(0.45, '#4C1D95') // violet-900
  g.addColorStop(1, '#1E1B4B')    // indigo-950 (dark navy)
  return g
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.beginPath()
  ctx.arc(x, y, 11 * scale, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `700 ${24 * scale}px -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('JobTrack', x + 22 * scale, y + 1)
}

// ── Sub stats (horizontal row, glassmorphism chips) ────────────────
function drawSubStats(
  ctx: CanvasRenderingContext2D,
  centerX: number, y: number, totalW: number,
  stats: { label: string; value: number }[],
  scale: number,
  F: string
) {
  const gap = 14 * scale
  const cW = (totalW - gap * (stats.length - 1)) / stats.length
  const cH = 150 * scale
  const x0 = centerX - totalW / 2

  stats.forEach((s, i) => {
    const x = x0 + i * (cW + gap)
    rr(ctx, x, y, cW, cH, 18 * scale)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()
    rr(ctx, x, y, cW, cH, 18 * scale)
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = `800 ${48 * scale}px ${F}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(String(s.value), x + cW / 2, y + cH * 0.56)

    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = `500 ${20 * scale}px ${F}`
    ctx.fillText(s.label, x + cW / 2, y + cH * 0.82)
  })
}

// ── Portrait card (1080 × 1920, moomoo-style) ──────────────────────
function drawPortraitCard(canvas: HTMLCanvasElement, apps: Application[], userEmail?: string | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { total, docPass, interview, offered } = computeStats(apps)
  const F = `-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  const cx = PW / 2

  ctx.fillStyle = brandGradient(ctx, PW, PH)
  ctx.fillRect(0, 0, PW, PH)

  // Top: logo
  drawLogo(ctx, 80, 150, 1.3)

  // Hero: huge offer count, vertically centered
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 380px ${F}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(String(offered), cx, 880)

  ctx.font = `800 72px ${F}`
  ctx.fillText('社内定', cx, 980)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `500 30px ${F}`
  ctx.fillText(`全 ${total} 社にエントリー`, cx, 1040)

  // Sub stats row
  drawSubStats(
    ctx, cx, 1280, PW - 160,
    [
      { label: '総エントリー', value: total },
      { label: '書類通過', value: docPass },
      { label: '面接実施', value: interview },
    ],
    1,
    F
  )

  // Bottom: divider + username/date
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(80, 1660); ctx.lineTo(PW - 80, 1660); ctx.stroke()

  const username = userEmail?.split('@')[0] ?? 'ゲスト'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = `600 28px ${F}`
  ctx.textAlign = 'left'
  ctx.fillText(username, 80, 1720)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `400 24px ${F}`
  ctx.textAlign = 'right'
  ctx.fillText(todayLabel(), PW - 80, 1720)

  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = `400 20px ${F}`
  ctx.textAlign = 'center'
  ctx.fillText('job-track-tawny.vercel.app', cx, 1840)
}

// ── Landscape card (1200 × 630, moomoo-style) ──────────────────────
function drawLandscapeCard(canvas: HTMLCanvasElement, apps: Application[], userEmail?: string | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { total, docPass, interview, offered } = computeStats(apps)
  const F = `-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  const cx = LW / 2

  ctx.fillStyle = brandGradient(ctx, LW, LH)
  ctx.fillRect(0, 0, LW, LH)

  // Top: logo
  drawLogo(ctx, 60, 64, 1)

  // Hero: huge offer count, centered
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 168px ${F}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(String(offered), cx, 318)

  ctx.font = `800 38px ${F}`
  ctx.fillText('社内定', cx, 360)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `500 18px ${F}`
  ctx.fillText(`全 ${total} 社にエントリー`, cx, 396)

  // Sub stats row
  drawSubStats(
    ctx, cx, 432, LW - 160,
    [
      { label: '総エントリー', value: total },
      { label: '書類通過', value: docPass },
      { label: '面接実施', value: interview },
    ],
    0.62,
    F
  )

  // Bottom: username/date
  const username = userEmail?.split('@')[0] ?? 'ゲスト'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = `600 17px ${F}`
  ctx.textAlign = 'left'
  ctx.fillText(username, 60, LH - 22)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `400 15px ${F}`
  ctx.fillText(todayLabel(), 60 + ctx.measureText(username).width + 16, LH - 22)

  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = `400 14px ${F}`
  ctx.textAlign = 'right'
  ctx.fillText('job-track-tawny.vercel.app', LW - 60, LH - 22)
}

// ── Component ─────────────────────────────────────────────────────
export default function ShareCardDialog({ applications, userEmail, onClose }: Props) {
  const [cardFormat, setCardFormat] = useState<CardFormat>('portrait')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // フォーマット or データ変更時に再描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (cardFormat === 'portrait') {
      drawPortraitCard(canvas, applications, userEmail)
    } else {
      drawLandscapeCard(canvas, applications, userEmail)
    }
  }, [applications, userEmail, cardFormat])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = cardFormat === 'portrait' ? 'jobtrack-result-story.png' : 'jobtrack-result.png'
    a.click()
  }, [cardFormat])

  const isPortrait = cardFormat === 'portrait'
  const cw = isPortrait ? PW : LW
  const ch = isPortrait ? PH : LH

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

        {/* フォーマット切り替え */}
        <div className="flex items-center gap-2 px-5 pt-4">
          <button
            onClick={() => setCardFormat('portrait')}
            className={`flex-1 h-9 rounded-xl text-sm font-medium border transition-all ${
              isPortrait
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
            }`}
          >
            スマホ用
            <span className="ml-1.5 text-[10px] opacity-60">1080×1920</span>
          </button>
          <button
            onClick={() => setCardFormat('landscape')}
            className={`flex-1 h-9 rounded-xl text-sm font-medium border transition-all ${
              !isPortrait
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
            }`}
          >
            PC用
            <span className="ml-1.5 text-[10px] opacity-60">1200×630</span>
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 mt-4">
          <div className="rounded-xl overflow-hidden shadow-md ring-1 ring-slate-200 dark:ring-slate-700 flex justify-center">
            <canvas
              ref={canvasRef}
              width={cw}
              height={ch}
              className="block rounded-xl"
              style={
                isPortrait
                  ? { height: '460px', width: 'auto' }
                  : { width: '100%', height: 'auto' }
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700/60">
          <p className="text-xs text-slate-400">
            {isPortrait ? '1080 × 1920 px — Stories / TikTok' : '1200 × 630 px — X (Twitter) / Facebook'}
          </p>
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
