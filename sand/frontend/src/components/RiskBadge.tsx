import { RiskLevel } from '../types'

const config: Record<RiskLevel, { bg: string; text: string; label: string; icon: string }> = {
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Safe', icon: '🟢' },
  yellow: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Caution', icon: '🟡' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Danger', icon: '🔴' },
}

export default function RiskBadge({ level, size = 'md' }: { level: RiskLevel; size?: 'sm' | 'md' | 'lg' }) {
  const c = config[level]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${c.bg} ${c.text} ${sizeClass}`}>
      {c.icon} {c.label}
    </span>
  )
}
