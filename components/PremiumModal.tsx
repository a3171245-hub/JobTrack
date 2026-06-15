'use client'

import { X, Crown } from 'lucide-react'

export default function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">プレミアム機能</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          「イベント」機能はプレミアムプランでご利用いただけます。
          説明会・会社見学などの選考外イベントを一元管理できます。
        </p>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
          <p className="text-sm font-semibold text-amber-700 mb-0.5">🚀 近日公開予定</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            プレミアムプランの詳細は現在準備中です。リリースまでしばらくお待ちください。
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm text-white font-medium transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
