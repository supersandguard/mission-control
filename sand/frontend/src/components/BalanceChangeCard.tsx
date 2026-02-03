import { BalanceChange } from '../types'

export default function BalanceChangeCard({ change }: { change: BalanceChange }) {
  const delta = parseFloat(change.delta)
  const isNegative = delta < 0
  const isZero = Math.abs(delta) < 0.000001

  if (isZero) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
        <div>
          <p className="font-medium text-sm">{change.token.symbol}</p>
          <p className="text-sm text-slate-400">{change.token.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-slate-500">No change</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
      <div>
        <p className="font-medium text-sm">{change.token.symbol}</p>
        <p className="text-sm text-slate-400">{change.token.name}</p>
      </div>
      <div className="text-right">
        <p className={`font-mono text-sm font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
          {change.delta}
        </p>
        {change.deltaUsd && parseFloat(change.deltaUsd) !== 0 && (
          <p className="text-sm text-slate-400">${Math.abs(parseFloat(change.deltaUsd)).toFixed(2)} USD</p>
        )}
      </div>
    </div>
  )
}
