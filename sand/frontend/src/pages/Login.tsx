import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DaimoPayButton } from '@daimo/pay'

const PAYMENT_ADDRESS = '0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BASE_CHAIN_ID = 8453

export default function Login() {
  const navigate = useNavigate()
  const { login, setDemoMode } = useAuth()
  const [step, setStep] = useState<'choose' | 'promo'>('choose')
  const [promoCode, setPromoCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handlePaymentCompleted = async (event: any) => {
    setVerifying(true)
    setError('')
    try {
      const payment = event?.payment || event
      const payerAddress = payment?.source?.payerAddress || 'unknown'
      const paymentId = payment?.id || event?.paymentId || 'unknown'

      const API_BASE = JSON.parse(localStorage.getItem('sand-config') || '{}').apiUrl || ''
      const response = await fetch(`${API_BASE}/api/payments/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: payerAddress,
          paymentId: paymentId
        })
      })
      const data = await response.json()
      if (response.ok && data.apiKey) {
        login(data.apiKey, '')
        navigate('/app')
      } else {
        setError(data.error || 'Payment activation failed')
      }
    } catch {
      setError('Connection failed. Check your API URL in Settings.')
    } finally {
      setVerifying(false)
    }
  }

  const handlePromoRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoCode.trim()) return
    setVerifying(true)
    setError('')
    try {
      const API_BASE = JSON.parse(localStorage.getItem('sand-config') || '{}').apiUrl || ''
      const response = await fetch(`${API_BASE}/api/promo/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), address: `promo:${promoCode.trim()}` })
      })
      const data = await response.json()
      if (response.ok && data.apiKey) {
        login(data.apiKey, '')
        navigate('/app')
      } else {
        setError(data.error || 'Invalid promo code')
      }
    } catch {
      setError('Connection failed. Check your API URL in Settings.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
              🛡
            </div>
            <span className="text-lg font-semibold tracking-tight">SandGuard</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step: Choose */}
          {step === 'choose' && !verifying && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Get Started</h1>
                <p className="text-sm text-slate-400">
                  Protect your Safe multisig — $20/month
                </p>
              </div>

              {/* Daimo Pay Button */}
              <div className="w-full">
                <DaimoPayButton
                  appId="pay-demo"
                  toAddress={PAYMENT_ADDRESS as `0x${string}`}
                  toChain={BASE_CHAIN_ID}
                  toToken={USDC_BASE as `0x${string}`}
                  toUnits="20.00"
                  intent="Subscribe to SandGuard"
                  onPaymentCompleted={handlePaymentCompleted}
                />
              </div>

              <p className="text-xs text-center text-slate-600">
                Pay with 1200+ tokens on 20+ chains
              </p>

              {/* Promo Code */}
              <button
                onClick={() => { setStep('promo'); setError('') }}
                className="w-full py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-between px-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎟️</span>
                  <div className="text-left">
                    <p className="font-medium text-sm">Have a promo code?</p>
                    <p className="text-xs text-slate-500">Friends & Family access</p>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-medium">FREE</span>
              </button>

              {/* What you get */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">What's included</p>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> Unlimited transactions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> All chains (Ethereum, Base, Optimism, Arbitrum)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> Transaction simulation & decoding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> AI risk scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> API access + Web dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> Clawdbot integration
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Processing payment */}
          {verifying && (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Activating Subscription</h1>
              <p className="text-sm text-slate-400">Processing your payment...</p>
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            </div>
          )}

          {/* Step: Promo Code */}
          {step === 'promo' && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Promo Code</h1>
                <p className="text-sm text-slate-400">Enter your Friends & Family code</p>
              </div>
              <form onSubmit={handlePromoRedeem} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Code</label>
                  <input
                    type="text" value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="SG-XXXXXXXX"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none focus:border-amber-500 placeholder:text-slate-600 uppercase tracking-wider text-center text-lg"
                  />
                </div>
                <button type="submit" disabled={verifying || !promoCode.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifying ? 'Activating...' : 'Activate Free Access'}
                </button>
              </form>
              <button onClick={() => setStep('choose')} className="w-full text-center text-xs text-slate-600 hover:text-slate-400">← Back</button>
            </>
          )}

          {/* Demo link */}
          <div className="text-center pt-4 border-t border-slate-800/40">
            <button
              onClick={() => { setDemoMode(); navigate('/app') }}
              className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
            >
              Skip — try the demo →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
