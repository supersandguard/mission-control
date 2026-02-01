import { Link } from 'react-router-dom'
import { useTransactionsContext } from '../context/TransactionsContext'

export default function Dashboard() {
  const { transactions, loading, error } = useTransactionsContext()
  const pending = transactions.filter(t => !t.isExecuted)

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Safe Info */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Safe Multisig</p>
        <p className="font-mono text-sm text-slate-300">Demo Mode (mock data)</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">2-of-3</span>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Base</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-2xl font-bold text-emerald-400">{pending.filter(t => t.risk?.score === 'green').length}</p>
          <p className="text-xs text-slate-500 mt-1">🟢 Seguro</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-2xl font-bold text-amber-400">{pending.filter(t => t.risk?.score === 'yellow').length}</p>
          <p className="text-xs text-slate-500 mt-1">🟡 Cuidado</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-2xl font-bold text-red-400">{pending.filter(t => t.risk?.score === 'red').length}</p>
          <p className="text-xs text-slate-500 mt-1">🔴 Peligro</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Pending */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Pendientes {loading && <span className="text-emerald-400 animate-pulse">⟳</span>}
          </h2>
          <Link to="/queue" className="text-xs text-emerald-400 hover:underline">Ver todas →</Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-8">No hay transacciones pendientes</p>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 5).map(tx => (
              <Link
                key={tx.id}
                to={`/tx/${tx.id}`}
                className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.explanation?.summary || tx.decoded?.functionName || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Nonce #{tx.nonce} · {tx.confirmations}/{tx.confirmationsRequired} firmas
                    </p>
                  </div>
                  <span className="text-lg ml-2">
                    {tx.risk?.score === 'green' ? '🟢' : tx.risk?.score === 'yellow' ? '🟡' : '🔴'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
