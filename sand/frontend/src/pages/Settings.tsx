import { useState, useEffect } from 'react'
import { testConnection } from '../api'

interface Config {
  address: string
  chainId: number
  blockUnlimited: boolean
  largeThreshold: string
  tenderlyKey: string
  etherscanKey: string
  apiUrl: string
}

const DEFAULT_CONFIG: Config = {
  address: '',
  chainId: 1,
  blockUnlimited: true,
  largeThreshold: '10000',
  tenderlyKey: '',
  etherscanKey: '',
  apiUrl: '',
}

export default function Settings() {
  const [config, setConfig] = useState<Config>(() => {
    const saved = localStorage.getItem('sand-config')
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG
  })
  const [saved, setSaved] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [testingConnection, setTestingConnection] = useState(false)

  useEffect(() => {
    localStorage.setItem('sand-config', JSON.stringify(config))
    setSaved(false)
    // Reset connection status when URL changes
    setConnectionStatus('unknown')
  }, [config])

  // Test connection whenever API URL changes
  useEffect(() => {
    const testApiConnection = async () => {
      const apiUrl = config.apiUrl || ''
      if (apiUrl || !config.apiUrl) { // Test relative URL too when empty
        setTestingConnection(true)
        try {
          const isConnected = await testConnection(apiUrl)
          setConnectionStatus(isConnected ? 'connected' : 'error')
        } catch (error) {
          setConnectionStatus('error')
        } finally {
          setTestingConnection(false)
        }
      }
    }

    const timeoutId = setTimeout(testApiConnection, 500)
    return () => clearTimeout(timeoutId)
  }, [config.apiUrl])

  const handleSave = () => {
    localStorage.setItem('sand-config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Settings</h2>

      {/* Connection */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connection</h3>
        <div>
          <label className="text-xs text-slate-500 block mb-1">API URL</label>
          <input
            type="url"
            value={config.apiUrl}
            onChange={e => setConfig(c => ({ ...c, apiUrl: e.target.value }))}
            placeholder="Leave empty for relative /api"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
          />
          <p className="text-xs text-slate-600 mt-1">Custom API server URL (empty = relative /api)</p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {testingConnection ? (
              <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-slate-500'
              }`} />
            )}
            <span className="text-xs text-slate-500">
              {testingConnection ? 'Testing...' : 
               connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'error' ? 'Connection failed' : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Safe */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Safe Multisig</h3>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Safe Address</label>
          <input
            type="text"
            value={config.address}
            onChange={e => setConfig(c => ({ ...c, address: e.target.value }))}
            placeholder="0x..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
          />
          <p className="text-xs text-slate-600 mt-1">Leave empty to use demo data</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Network</label>
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
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Policies</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Block unlimited approvals</p>
            <p className="text-xs text-slate-500">Alert on max uint256 approvals</p>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, blockUnlimited: !c.blockUnlimited }))}
            className={`w-11 h-6 rounded-full transition-colors relative ${config.blockUnlimited ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.blockUnlimited ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Large transfer threshold (USD)</label>
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
        {saved ? '✓ Saved' : 'Save & Reload'}
      </button>

      {/* Info */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">About</h3>
        <div className="space-y-1 text-xs text-slate-500">
          <p>SandGuard v0.2 — Transaction Firewall PWA</p>
          <p>Backend: {import.meta.env.VITE_API_URL || '/api (relative)'}</p>
          <p>Mode: {config.address ? 'Live' : 'Demo (mock data)'}</p>
        </div>
      </div>
    </div>
  )
}
