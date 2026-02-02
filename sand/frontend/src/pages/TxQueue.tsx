import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useTransactionsContext } from '../context/TransactionsContext'
import RiskBadge from '../components/RiskBadge'

function formatTime(date: Date | null) {
  if (!date) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function TxQueue() {
  const { transactions, loading, refreshing, lastUpdated, refresh } = useTransactionsContext()

  useEffect(() => { document.title = 'TX Queue — SandGuard' }, [])

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-300 uppercase tracking-wider">
          Transaction Queue ({transactions.length})
          {refreshing && <span className="text-emerald-400 animate-pulse ml-1">⟳</span>}
        </h2>
        <button
          onClick={refresh}
          disabled={loading || refreshing}
          className="text-sm text-emerald-400 hover:underline disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">{loading ? <><RefreshCw className="w-3 h-3 animate-spin" /> Loading...</> : <><RefreshCw className="w-3 h-3" /> Refresh</>}</span>
        </button>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl animate-pulse">⟳</p>
          <p className="text-sm text-slate-500 mt-2">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 py-16 px-6 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-base font-medium text-slate-300 mb-2">No pending transactions</p>
          <p className="text-sm text-slate-500 mb-4">Your Safe is secure</p>
          {lastUpdated && (
            <p className="text-xs text-slate-500">
              Last checked: {formatTime(lastUpdated)}
            </p>
          )}
          <button
            onClick={refresh}
            className="mt-4 text-xs text-emerald-400 hover:underline"
          >
            <span className="inline-flex items-center gap-1">Check again <RefreshCw className="w-3 h-3" /></span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <Link
              key={tx.id}
              to={`/app/tx/${tx.id}`}
              className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.explanation?.summary || tx.decoded?.functionName || 'Unknown TX'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Nonce #{tx.nonce} · {new Date(tx.submissionDate).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {tx.confirmations}/{tx.confirmationsRequired} signatures
                    </span>
                    {tx.decoded?.protocol && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                        {tx.decoded.protocol.name}
                      </span>
                    )}
                    {tx.isExecuted && (
                      <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                        Executed
                      </span>
                    )}
                  </div>
                </div>
                {tx.risk && <RiskBadge level={tx.risk.score} size="sm" />}
              </div>
            </Link>
          ))}
        </div>
      )}

      {lastUpdated && transactions.length > 0 && (
        <p className="text-xs text-slate-500 text-center mt-4">
          Updated: {formatTime(lastUpdated)}
        </p>
      )}
    </div>
  )
}
