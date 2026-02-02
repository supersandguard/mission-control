import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Coins, Search, ShieldCheck, Fuel, Package, X, Check } from 'lucide-react'
import { useTransactionsContext } from '../context/TransactionsContext'
import RiskBadge from '../components/RiskBadge'
import BalanceChangeCard from '../components/BalanceChangeCard'

export default function TxDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTransaction } = useTransactionsContext()
  const tx = getTransaction(id || '')

  if (!tx) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center mx-auto mb-4">
          <Search size={24} className="text-slate-600" />
        </div>
        <p className="text-base font-medium text-slate-300 mb-1">Transaction not found</p>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          This transaction may have been executed or removed from the queue.
        </p>
        <button onClick={() => navigate('/app/queue')} className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
          ← Back to queue
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-300">← Back</button>

      {/* Summary */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold">{tx.explanation?.summary || tx.decoded?.functionName || 'Transaction'}</p>
            <p className="text-sm text-slate-400 mt-1">Nonce #{tx.nonce} · {tx.confirmations}/{tx.confirmationsRequired} signatures</p>
          </div>
          {tx.risk && <RiskBadge level={tx.risk.score} size="lg" />}
        </div>
      </div>

      {/* Explanation */}
      {tx.explanation && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Explanation</h3>
          <ul className="space-y-2">
            {tx.explanation.details.map((d, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-slate-600 mt-0.5">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
          {tx.explanation.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              {tx.explanation.warnings.map((w, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance Changes */}
      {tx.simulation && tx.simulation.balanceChanges.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Coins className="w-4 h-4" /> Balance Changes</h3>
          <div className="space-y-2">
            {tx.simulation.balanceChanges.map((bc, i) => (
              <BalanceChangeCard key={i} change={bc} />
            ))}
          </div>
        </div>
      )}

      {/* Decoded */}
      {tx.decoded && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Search className="w-4 h-4" /> Decoded Data</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Function</p>
              <p className="font-mono text-sm text-emerald-400">{tx.decoded.functionSignature}</p>
            </div>
            {tx.decoded.protocol && (
              <div>
                <p className="text-sm text-slate-400">Protocol</p>
                <p className="text-sm">{tx.decoded.protocol.name} <span className="text-slate-500">({tx.decoded.protocol.category})</span></p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400 mb-2">Parameters</p>
              {tx.decoded.parameters.map((p, i) => (
                <div key={i} className="flex justify-between items-start py-1.5 border-t border-slate-800/50">
                  <div>
                    <p className="text-sm font-mono text-slate-400">{p.name} <span className="text-slate-500">({p.type})</span></p>
                    {p.label && <p className="text-sm text-slate-500">{p.label}</p>}
                  </div>
                  <p className="font-mono text-sm text-slate-300 max-w-[180px] truncate text-right">{p.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Details */}
      {tx.risk && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Risk Analysis</h3>
          <div className="space-y-2">
            {tx.risk.reasons.map((r, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm ${
                r.level === 'red' ? 'text-red-300' : r.level === 'yellow' ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                <span>{r.level === 'red' ? '🔴' : r.level === 'yellow' ? '🟡' : '🟢'}</span>
                <span>{r.message || r.messageEs}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation */}
      {tx.simulation && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Fuel className="w-4 h-4" /> Simulation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className="text-sm">{tx.simulation.success ? '✅ Succeeded' : '❌ Failed'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Estimated Gas</p>
              <p className="font-mono text-sm">{tx.simulation.gasUsed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data */}
      <details className="bg-slate-900 rounded-2xl border border-slate-800">
        <summary className="p-5 text-sm font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300">
          <span className="inline-flex items-center gap-1.5"><Package className="w-4 h-4" /> Raw Data</span>
        </summary>
        <div className="px-5 pb-5 space-y-2">
          <div>
            <p className="text-sm text-slate-400">To</p>
            <p className="font-mono text-sm text-slate-300 break-all">{tx.to}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Value</p>
            <p className="font-mono text-sm text-slate-300">{tx.value} wei</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Data</p>
            <p className="font-mono text-sm text-slate-300 break-all max-h-24 overflow-y-auto">{tx.data}</p>
          </div>
        </div>
      </details>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button className="flex-1 py-3.5 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors active:scale-95">
          <span className="inline-flex items-center gap-1"><X className="w-4 h-4" /> Reject</span>
        </button>
        <button className="flex-1 py-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-semibold text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors active:scale-95">
          <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Sign</span>
        </button>
      </div>
    </div>
  )
}
