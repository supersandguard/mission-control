import { useState } from 'react'
import { RiskLevel, RiskReason } from '../types'

const config: Record<RiskLevel, { bg: string; text: string; border: string; label: string; icon: string }> = {
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Safe', icon: '🟢' },
  yellow: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Caution', icon: '🟡' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'HIGH RISK', icon: '🔴' },
}

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md' | 'lg'
  reasons?: RiskReason[]
}

export default function RiskBadge({ level, size = 'md', reasons }: RiskBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const c = config[level]

  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : size === 'lg'
      ? 'text-base px-4 py-2'
      : 'text-sm px-3 py-1'

  const redPulse = level === 'red' && size === 'lg' ? 'animate-pulse' : ''

  // Filter reasons to show only warnings (red/yellow)
  const warningReasons = reasons?.filter(r => r.level === 'red' || r.level === 'yellow') || []

  return (
    <div className="relative">
      <button
        className={`inline-flex items-center gap-1 rounded-full font-bold border ${c.bg} ${c.text} ${c.border} ${sizeClass} ${redPulse} cursor-pointer transition-transform hover:scale-105`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {c.icon} {c.label}
      </button>

      {/* Tooltip with reasons */}
      {showTooltip && warningReasons.length > 0 && (
        <div className="absolute z-50 top-full mt-2 right-0 w-72 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Why this risk level</p>
          <div className="space-y-1.5">
            {warningReasons.map((r, i) => (
              <div key={i} className={`text-xs flex items-start gap-1.5 ${
                r.level === 'red' ? 'text-red-300' : 'text-amber-300'
              }`}>
                <span className="mt-0.5 flex-shrink-0">{r.level === 'red' ? '🔴' : '🟡'}</span>
                <span>{r.message || r.messageEs}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
