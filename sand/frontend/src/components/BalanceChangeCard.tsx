import { BalanceChange } from '../types'

export default function BalanceChangeCard({ change }: { change: BalanceChange }) {
  const isNegative = change.delta.startsWith('-')
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
      <div>
        <p className="font-medium text-sm">{change.token.symbol}</p>
        <p className="text-xs text-slate-500">{change.token.name}</p>
      </div>
      <div className="text-right">
        <p className={`font-mono text-sm font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
          {change.delta}
        </p>
        {change.deltaUsd && change.deltaUsd !== '0' && (
          <p className="text-xs text-slate-500">{change.deltaUsd} USD</p>
        )}
      </div>
    </div>
  )
}
