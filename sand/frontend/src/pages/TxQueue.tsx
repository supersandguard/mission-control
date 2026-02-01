import { Link } from 'react-router-dom'
import { MOCK_TRANSACTIONS } from '../mockData'
import RiskBadge from '../components/RiskBadge'

export default function TxQueue() {
  return (
    <div className="px-4 py-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Cola de Transacciones ({MOCK_TRANSACTIONS.length})
      </h2>
      <div className="space-y-3">
        {MOCK_TRANSACTIONS.map(tx => (
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
