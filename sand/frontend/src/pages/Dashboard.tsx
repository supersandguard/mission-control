import { Link } from 'react-router-dom'
import { MOCK_TRANSACTIONS } from '../mockData'

export default function Dashboard() {
  const pending = MOCK_TRANSACTIONS.filter(t => !t.isExecuted)

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Safe Info */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Safe Multisig</p>
        <p className="font-mono text-sm text-slate-300">0x32B8...9EC7</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">2-of-3</span>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Base</span>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { symbol: 'USDC', amount: '45,230.00', usd: '$45,230', icon: '💵' },
          { symbol: 'ETH', amount: '12.45', usd: '$39,840', icon: '⟠' },
          { symbol: 'WBTC', amount: '0.85', usd: '$85,000', icon: '₿' },
          { symbol: 'aUSDC', amount: '10,000.00', usd: '$10,000', icon: '🏦' },
        ].map(b => (
          <div key={b.symbol} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <span>{b.icon}</span>
              <span className="text-xs text-slate-500">{b.symbol}</span>
            </div>
            <p className="font-mono text-sm font-bold">{b.amount}</p>
            <p className="text-xs text-slate-500">{b.usd}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pendientes</h2>
          <Link to="/queue" className="text-xs text-emerald-400 hover:underline">Ver todas →</Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-8">No hay transacciones pendientes</p>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 3).map(tx => (
              <Link
                key={tx.id}
                to={`/tx/${tx.id}`}
                className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.explanation?.summary || tx.decoded?.functionName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 mt-1">Nonce #{tx.nonce} · {tx.confirmations}/{tx.confirmationsRequired} firmas</p>
                  </div>
                  {tx.risk && (
                    <span className={`text-lg ${tx.risk.score === 'green' ? '' : tx.risk.score === 'yellow' ? '' : ''}`}>
                      {tx.risk.score === 'green' ? '🟢' : tx.risk.score === 'yellow' ? '🟡' : '🔴'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
