import { Link } from 'react-router-dom'
import { useTransactionsContext } from '../context/TransactionsContext'
import RiskBadge from '../components/RiskBadge'

export default function TxQueue() {
  const { transactions, loading, refresh } = useTransactionsContext()

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Cola de Transacciones ({transactions.length})
        </h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-emerald-400 hover:underline disabled:opacity-50"
        >
          {loading ? '⟳ Cargando...' : '↻ Refresh'}
        </button>
      </div>
      <div className="space-y-3">
        {transactions.map(tx => (
          <Link
            key={tx.id}
            to={`/tx/${tx.id}`}
            className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.explanation?.summary || tx.decoded?.functionName || 'Unknown TX'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Nonce #{tx.nonce} · {new Date(tx.submissionDate).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {tx.confirmations}/{tx.confirmationsRequired} firmas
                  </span>
                  {tx.decoded?.protocol && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      {tx.decoded.protocol.name}
                    </span>
                  )}
                  {tx.isExecuted && (
                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                      Ejecutada
                    </span>
                  )}
                </div>
              </div>
              {tx.risk && <RiskBadge level={tx.risk.score} size="sm" />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
