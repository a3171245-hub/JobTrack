'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row']
type CardFormat = 'landscape' | 'portrait'

interface Props {
  applications: Application[]
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

// ── Landscape card (1200 × 630) ──────────────────────────────────
function drawLandscapeCard(canvas: HTMLCanvasElement, apps: Application[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { total, docPass, interview, offered } = computeStats(apps)
  const F = `-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`

  // Background
  ctx.fillStyle = '#F7F6FF'
  ctx.fillRect(0, 0, LW, LH)
  ctx.strokeStyle = '#E4DFFA'
  ctx.lineWidth = 1.5
  ctx.strokeRect(0.75, 0.75, LW - 1.5, LH - 1.5)

  // Header (y=66)
  ctx.beginPath(); ctx.arc(80, 66, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#7C3AED'; ctx.fill()
  ctx.fillStyle = '#7C3AED'
  ctx.font = `700 24px ${F}`; ctx.textAlign = 'left'
  ctx.fillText('JobTrack', 103, 73)
  ctx.beginPath(); ctx.arc(253, 66, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = '#C4B5FD'; ctx.fill()
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `500 21px ${F}`
  ctx.fillText('就活戦績レポート', 268, 73)

  // Header divider
  ctx.strokeStyle = '#EDE9FE'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(60, 96); ctx.lineTo(LW - 60, 96); ctx.stroke()

  // Hero
  ctx.fillStyle = '#4C1D95'
  ctx.font = `900 152px ${F}`; ctx.textAlign = 'center'
  ctx.fillText(String(offered), LW / 2, 288)
  ctx.fillStyle = '#111827'
  ctx.font = `700 44px ${F}`; ctx.textAlign = 'center'
  ctx.fillText('社内定', LW / 2, 352)
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `400 19px ${F}`; ctx.textAlign = 'center'
  ctx.fillText(`全 ${total} 社にエントリー`, LW / 2, 390)

  // Mid divider
  ctx.strokeStyle = '#EDE9FE'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(60, 416); ctx.lineTo(LW - 60, 416); ctx.stroke()

  // Sub stat cards
  const cards = [
    { label: '総エントリー', value: total },
    { label: '書類通過',     value: docPass },
    { label: '面接実施',     value: interview },
  ]
  const cW = 296, cH = 128, cGap = 24
  const cX0 = (LW - (cW * 3 + cGap * 2)) / 2
  const cY  = 436

  cards.forEach((card, i) => {
    const x = cX0 + i * (cW + cGap)
    const y = cY
    rr(ctx, x, y, cW, cH, 16); ctx.fillStyle = '#FFFFFF'; ctx.fill()
    rr(ctx, x, y, cW, cH, 16); ctx.strokeStyle = '#EDE9FE'; ctx.lineWidth = 1.5; ctx.stroke()
    rr(ctx, x + 20, y + 16, 40, 4, 2); ctx.fillStyle = '#7C3AED'; ctx.fill()
    ctx.fillStyle = '#111827'
    ctx.font = `800 58px ${F}`; ctx.textAlign = 'center'
    ctx.fillText(String(card.value), x + cW / 2, y + 78)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = `500 17px ${F}`; ctx.textAlign = 'center'
    ctx.fillText(card.label, x + cW / 2, y + 107)
  })

  // Footer
  ctx.fillStyle = '#D1D5DB'
  ctx.font = `400 15px ${F}`; ctx.textAlign = 'right'
  ctx.fillText('job-track-tawny.vercel.app', LW - 60, LH - 22)
}

// ── Portrait card (1080 × 1920) ──────────────────────────────────
function drawPortraitCard(canvas: HTMLCanvasElement, apps: Application[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { total, docPass, interview, offered } = computeStats(apps)
  const F = `-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
  const PAD = 80

  // Background
  ctx.fillStyle = '#F7F6FF'
  ctx.fillRect(0, 0, PW, PH)
  ctx.strokeStyle = '#E4DFFA'; ctx.lineWidth = 1.5
  ctx.strokeRect(0.75, 0.75, PW - 1.5, PH - 1.5)

  // Header (center y = 180)
  ctx.beginPath(); ctx.arc(PAD, 180, 13, 0, Math.PI * 2)
  ctx.fillStyle = '#7C3AED'; ctx.fill()
  ctx.fillStyle = '#7C3AED'
  ctx.font = `700 30px ${F}`; ctx.textAlign = 'left'
  ctx.fillText('JobTrack', PAD + 24, 189)
  ctx.beginPath(); ctx.arc(PAD + 190, 178, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#C4B5FD'; ctx.fill()
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `500 24px ${F}`
  ctx.fillText('就活戦績レポート', PAD + 208, 189)

  // Top divider
  ctx.strokeStyle = '#EDE9FE'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(PAD, 222); ctx.lineTo(PW - PAD, 222); ctx.stroke()

  // Hero: offered count
  ctx.fillStyle = '#4C1D95'
  ctx.font = `900 200px ${F}`; ctx.textAlign = 'center'
  ctx.fillText(String(offered), PW / 2, 500)
  ctx.fillStyle = '#111827'
  ctx.font = `700 52px ${F}`; ctx.textAlign = 'center'
  ctx.fillText('社内定', PW / 2, 576)
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `400 24px ${F}`; ctx.textAlign = 'center'
  ctx.fillText(`全 ${total} 社にエントリー`, PW / 2, 626)

  // Mid divider
  ctx.strokeStyle = '#EDE9FE'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(PAD, 666); ctx.lineTo(PW - PAD, 666); ctx.stroke()

  // Sub stat cards (stacked, full width)
  const pCards = [
    { label: '総エントリー', value: total },
    { label: '書類通過',     value: docPass },
    { label: '面接実施',     value: interview },
  ]
  const pcW = PW - 2 * PAD   // 920
  const pcH = 210
  const pcGap = 50
  const pcX = PAD
  const pcY0 = 720

  pCards.forEach((card, i) => {
    const x = pcX
    const y = pcY0 + i * (pcH + pcGap)
    rr(ctx, x, y, pcW, pcH, 24); ctx.fillStyle = '#FFFFFF'; ctx.fill()
    rr(ctx, x, y, pcW, pcH, 24); ctx.strokeStyle = '#EDE9FE'; ctx.lineWidth = 1.5; ctx.stroke()
    rr(ctx, x + 28, y + 22, 56, 5, 2.5); ctx.fillStyle = '#7C3AED'; ctx.fill()
    ctx.fillStyle = '#111827'
    ctx.font = `800 96px ${F}`; ctx.textAlign = 'center'
    ctx.fillText(String(card.value), x + pcW / 2, y + 138)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = `500 24px ${F}`; ctx.textAlign = 'center'
    ctx.fillText(card.label, x + pcW / 2, y + 182)
  })

  // Footer
  ctx.fillStyle = '#D1D5DB'
  ctx.font = `400 22px ${F}`; ctx.textAlign = 'right'
  ctx.fillText('job-track-tawny.vercel.app', PW - PAD, PH - 40)
}

// ── Component ─────────────────────────────────────────────────────
export default function ShareCardDialog({ applications, onClose }: Props) {
  const [cardFormat, setCardFormat] = useState<CardFormat>('landscape')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // モバイル幅ならデフォルトを縦型にする
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCardFormat('portrait')
    }
  }, [])

  // フォーマット or データ変更時に再描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (cardFormat === 'portrait') {
      drawPortraitCard(canvas, applications)
    } else {
      drawLandscapeCard(canvas, applications)
    }
  }, [applications, cardFormat])

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
            onClick={() => setCardFormat('landscape')}
            className={`flex-1 h-9 rounded-xl text-sm font-medium border transition-all ${
              !isPortrait
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
            }`}
          >
            横長 PC向け
            <span className="ml-1.5 text-[10px] opacity-60">1200×630</span>
          </button>
          <button
            onClick={() => setCardFormat('portrait')}
            className={`flex-1 h-9 rounded-xl text-sm font-medium border transition-all ${
              isPortrait
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
            }`}
          >
            縦長 スマホ向け
            <span className="ml-1.5 text-[10px] opacity-60">1080×1920</span>
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
                  ? { height: '400px', width: 'auto' }
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
