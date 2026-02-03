import { useState } from 'react'

export type PolicySeverity = 'LOW' | 'MEDIUM' | 'WARNING' | 'HIGH' | 'CRITICAL'

export interface PolicyResult {
  policyId: string
  name: string
  severity: PolicySeverity
  triggered: boolean
  message: string
}

const config: Record<PolicySeverity, { 
  bg: string
  text: string
  border: string
  icon: string
  label: string
}> = {
  CRITICAL: { bg: 'bg-red-600/30', text: 'text-red-300', border: 'border-red-600/50', icon: '🚨', label: 'CRITICAL' },
  HIGH: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: '🔴', label: 'HIGH' },
  WARNING: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: '⚠️', label: 'WARNING' },
  MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '🟡', label: 'MEDIUM' },
  LOW: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: '🔵', label: 'LOW' },
}

interface PolicyBadgesProps {
  policies: PolicyResult[]
  size?: 'sm' | 'md' | 'lg'
  maxVisible?: number
}

export default function PolicyBadges({ policies, size = 'md', maxVisible = 3 }: PolicyBadgesProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Only show triggered policies
  const triggeredPolicies = policies.filter(p => p.triggered)
  
  // Sort by severity (most severe first)
  const severityOrder: PolicySeverity[] = ['CRITICAL', 'HIGH', 'WARNING', 'MEDIUM', 'LOW']
  const sortedPolicies = [...triggeredPolicies].sort((a, b) => 
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  )
  
  const visiblePolicies = sortedPolicies.slice(0, maxVisible)
  const hiddenCount = Math.max(0, sortedPolicies.length - maxVisible)
  
  if (triggeredPolicies.length === 0) {
    return null
  }

  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : size === 'lg'
      ? 'text-sm px-3 py-1.5'
      : 'text-xs px-2 py-1'

  const animationClass = visiblePolicies.some(p => p.severity === 'CRITICAL') 
    ? 'animate-pulse' 
    : ''

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visiblePolicies.map((policy, index) => {
        const c = config[policy.severity]
        
        return (
          <div key={`${policy.policyId}-${index}`} className="relative">
            <button
              className={`inline-flex items-center gap-1 rounded-full font-bold border transition-all hover:scale-105 cursor-pointer ${c.bg} ${c.text} ${c.border} ${sizeClass} ${animationClass}`}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <span className="leading-none">{c.icon}</span>
              <span className="leading-none">{c.label}</span>
            </button>

            {/* Individual tooltip for this badge */}
            {showTooltip && (
              <div className="absolute z-50 top-full mt-2 left-1/2 transform -translate-x-1/2 w-72 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{policy.name}</p>
                <div className={`text-sm ${c.text}`}>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0">{c.icon}</span>
                    <span>{policy.message}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
      
      {/* Show count badge if there are hidden policies */}
      {hiddenCount > 0 && (
        <div className="relative">
          <button
            className={`inline-flex items-center gap-1 rounded-full font-bold border bg-slate-700/50 text-slate-400 border-slate-600/50 transition-all hover:scale-105 cursor-pointer ${sizeClass}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <span className="leading-none">+{hiddenCount}</span>
          </button>
          
          {/* Tooltip showing all hidden policies */}
          {showTooltip && (
            <div className="absolute z-50 top-full mt-2 right-0 w-80 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                All Policy Violations ({triggeredPolicies.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sortedPolicies.map((policy, i) => {
                  const c = config[policy.severity]
                  return (
                    <div key={`${policy.policyId}-tooltip-${i}`} className={`text-xs flex items-start gap-2 ${c.text}`}>
                      <span className="mt-0.5 flex-shrink-0">{c.icon}</span>
                      <div>
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{policy.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}