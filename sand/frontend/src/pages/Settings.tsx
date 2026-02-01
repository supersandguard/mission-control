import { useState, useEffect } from 'react'

interface Config {
  address: string
  chainId: number
  blockUnlimited: boolean
  largeThreshold: string
  tenderlyKey: string
  etherscanKey: string
}

const DEFAULT_CONFIG: Config = {
  address: '',
  chainId: 8453,
  blockUnlimited: true,
  largeThreshold: '10000',
  tenderlyKey: '',
  etherscanKey: '',
}

export default function Settings() {
  const [config, setConfig] = useState<Config>(() => {
    const saved = localStorage.getItem('sand-config')
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem('sand-config', JSON.stringify(config))
    setSaved(false)
  }, [config])

  const handleSave = () => {
    localStorage.setItem('sand-config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configuración</h2>

      {/* Safe */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Safe Multisig</h3>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Dirección del Safe</label>
          <input
            type="text"
            value={config.address}
            onChange={e => setConfig(c => ({ ...c, address: e.target.value }))}
            placeholder="0x..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
          />
          <p className="text-xs text-slate-600 mt-1">Dejar vacío para usar datos mock</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Red</label>
          <select
            value={config.chainId}
            onChange={e => setConfig(c => ({ ...c, chainId: parseInt(e.target.value) }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value={1}>Ethereum Mainnet</option>
            <option value={8453}>Base</option>
            <option value={10}>Optimism</option>
            <option value={42161}>Arbitrum</option>
          </select>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Políticas de Seguridad</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Bloquear approvals ilimitados</p>
            <p className="text-xs text-slate-500">Alertar en max uint256 approvals</p>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, blockUnlimited: !c.blockUnlimited }))}
            className={`w-11 h-6 rounded-full transition-colors relative ${config.blockUnlimited ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.blockUnlimited ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Umbral de transferencia grande (USD)</label>
          <input
            type="number"
            value={config.largeThreshold}
            onChange={e => setConfig(c => ({ ...c, largeThreshold: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* APIs */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Keys</h3>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Tenderly Access Key</label>
          <input
            type="password"
            value={config.tenderlyKey}
            onChange={e => setConfig(c => ({ ...c, tenderlyKey: e.target.value }))}
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Etherscan/Basescan API Key</label>
          <input
            type="password"
            value={config.etherscanKey}
            onChange={e => setConfig(c => ({ ...c, etherscanKey: e.target.value }))}
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-semibold text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors active:scale-95"
      >
        {saved ? '✓ Guardado' : 'Guardar y Recargar'}
      </button>

      {/* Info */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Acerca de</h3>
        <div className="space-y-1 text-xs text-slate-500">
          <p>Sand v0.1 — Transaction Firewall PWA</p>
          <p>Backend: {import.meta.env.VITE_API_URL || 'http://localhost:3001'}</p>
          <p>Modo: {config.address ? 'Live' : 'Demo (mock data)'}</p>
        </div>
      </div>
    </div>
  )
}
