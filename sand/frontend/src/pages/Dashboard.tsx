import { Link } from 'react-router-dom'
import { useTransactionsContext } from '../context/TransactionsContext'

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  10: 'Optimism',
  42161: 'Arbitrum',
  137: 'Polygon',
}

function shortenAddress(addr: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTime(date: Date | null) {
  if (!date) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function Dashboard() {
  const {
    transactions, loading, refreshing, error,
    lastUpdated, safeInfo, safeAddress, chainId, isDemo, refresh,
  } = useTransactionsContext()
  const pending = transactions.filter(t => !t.isExecuted)

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Safe Info */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Safe Multisig</p>
            {isDemo ? (
              <p className="font-mono text-sm text-slate-300">Demo Mode (mock data)</p>
            ) : (
              <p className="font-mono text-sm text-slate-300">{shortenAddress(safeAddress)}</p>
            )}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {safeInfo ? (
                <>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {safeInfo.threshold}-of-{safeInfo.owners.length}
                  </span>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    {CHAIN_NAMES[chainId] || `Chain ${chainId}`}
                  </span>
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                    v{safeInfo.version}
                  </span>
                </>
              ) : !isDemo ? (
                <>
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full animate-pulse">
                    Loading...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">2-of-3</span>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Demo</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={loading || refreshing}
            className="text-slate-500 hover:text-emerald-400 transition-colors disabled:opacity-40 p-1"
            title="Refresh"
          >
            <span className={`text-lg ${refreshing ? 'animate-spin inline-block' : ''}`}>↻</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-600 mt-3">
            Updated: {formatTime(lastUpdated)}
            {refreshing && <span className="text-emerald-400 ml-2 animate-pulse">refreshing...</span>}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-2xl font-bold text-emerald-400">{pending.filter(t => t.risk?.score === 'green').length}</p>
          <p className="text-xs text-slate-500 mt-1">🟢 Safe</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-2xl font-bold text-amber-400">{pending.filter(t => t.risk?.score === 'yellow').length}</p>
          <p className="text-xs text-slate-500 mt-1">🟡 Caution</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-2xl font-bold text-red-400">{pending.filter(t => t.risk?.score === 'red').length}</p>
          <p className="text-xs text-slate-500 mt-1">🔴 Danger</p>
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
            Pending {loading && <span className="text-emerald-400 animate-pulse">⟳</span>}
          </h2>
          <Link to="/app/queue" className="text-xs text-emerald-400 hover:underline">View all →</Link>
        </div>
        {loading && pending.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl animate-pulse">⟳</p>
            <p className="text-sm text-slate-500 mt-2">Loading transactions...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 py-12 px-6 text-center">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="text-sm font-medium text-slate-300 mb-1">No pending transactions</p>
            <p className="text-xs text-slate-500">Your Safe is secure</p>
            {lastUpdated && (
              <p className="text-xs text-slate-600 mt-3">
                Last checked: {formatTime(lastUpdated)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 5).map(tx => (
              <Link
                key={tx.id}
                to={`/app/tx/${tx.id}`}
                className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.explanation?.summary || tx.decoded?.functionName || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Nonce #{tx.nonce} · {tx.confirmations}/{tx.confirmationsRequired} signatures
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
