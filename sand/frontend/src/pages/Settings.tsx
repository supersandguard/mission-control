import { useState } from 'react'

export default function Settings() {
  const [safeAddress, setSafeAddress] = useState('0x32B8...9EC7')
  const [chainId, setChainId] = useState('8453')
  const [maxApproval, setMaxApproval] = useState(true)
  const [largeTransfer, setLargeTransfer] = useState('10000')

  return (
    <div className="px-4 py-6 space-y-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configuración</h2>

      {/* Safe Config */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Safe Multisig</h3>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Dirección del Safe</label>
          <input
            type="text"
            value={safeAddress}
            onChange={e => setSafeAddress(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Red</label>
          <select
            value={chainId}
            onChange={e => setChainId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="1">Ethereum Mainnet</option>
            <option value="8453">Base</option>
            <option value="10">Optimism</option>
            <option value="42161">Arbitrum</option>
          </select>
        </div>
      </div>

      {/* Policy Rules */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Políticas de Seguridad</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Bloquear approvals ilimitados</p>
            <p className="text-xs text-slate-500">Rechazar automáticamente max uint256 approvals</p>
          </div>
          <button
            onClick={() => setMaxApproval(!maxApproval)}
            className={`w-11 h-6 rounded-full transition-colors ${maxApproval ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${maxApproval ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Umbral de transferencia grande (USD)</label>
          <input
            type="number"
            value={largeTransfer}
            onChange={e => setLargeTransfer(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Agent Key */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agente (Key 1/3)</h3>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">🤖</div>
          <div>
            <p className="text-sm font-mono">0xCc75...0B84</p>
            <p className="text-xs text-slate-500">Clawd · Solo propone, nunca firma</p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">APIs</h3>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Tenderly API Key</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Etherscan API Key</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}
