import { useState, useEffect, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PrerequisiteCheclistCompact } from '../components/PrerequisiteChecklist'
const LazyDaimoCheckout = lazy(() => import('../components/DaimoCheckout'))
import { Shield, Check, X, Ticket, Info, ExternalLink, AlertCircle } from 'lucide-react'

const getApiBase = () => {
  const saved = localStorage.getItem('sand-config')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      if (config.apiUrl) return config.apiUrl
    } catch {}
  }
  return import.meta.env.VITE_API_URL || ''
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => { document.title = 'Get Started — SandGuard' }, [])

  const [step, setStep] = useState<'choose' | 'free' | 'promo' | 'recover'>('choose')
  const [promoCode, setPromoCode] = useState('')
  const [recoverAddress, setRecoverAddress] = useState('')
  const [freeAddress, setFreeAddress] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handlePaymentCompleted = async (event: any) => {
    setVerifying(true)
    setError('')
    try {
      const payment = event?.payment || event
      const payerAddress = payment?.source?.payerAddress || 'unknown'
      const paymentId = payment?.id || event?.paymentId || 'unknown'

      const API_BASE = getApiBase()
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
        setError(data.error || 'Payment activation failed. Your payment was received — please try recovering access with your wallet address.')
      }
    } catch {
      setError('Connection failed. Please check your internet connection and try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoverAddress.trim()) return
    if (recoverAddress.trim().length > 2 && !/^0x[a-fA-F0-9]{40}$/.test(recoverAddress.trim())) {
      setError('Please enter a valid Ethereum address (0x followed by 40 hex characters)')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const API_BASE = getApiBase()
      const response = await fetch(`${API_BASE}/api/payments/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: recoverAddress.trim() })
      })
      const data = await response.json()
      if (response.ok && data.apiKey) {
        login(data.apiKey, '')
        navigate('/app')
      } else {
        setError(data.error || 'No subscription found for this address. Make sure this is the wallet you originally paid with.')
      }
    } catch {
      setError('Connection failed. Please check your internet connection and try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleFreeSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!freeAddress.trim()) return
    if (!/^0x[a-fA-F0-9]{40}$/.test(freeAddress.trim())) {
      setError('Enter a valid Ethereum address starting with 0x (42 characters total)')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const API_BASE = getApiBase()
      const response = await fetch(`${API_BASE}/api/payments/free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: freeAddress.trim() })
      })
      const data = await response.json()
      if (response.ok && data.apiKey) {
        login(data.apiKey, '')
        navigate('/app')
      } else {
        setError(data.error || 'Something went wrong creating your account. Please try again.')
      }
    } catch {
      setError('Connection failed. Please check your internet connection and try again.')
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
      const API_BASE = getApiBase()
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
        setError(data.error || 'That code doesn\'t seem right. Double-check the spelling and try again.')
      }
    } catch {
      setError('Connection failed. Please check your internet connection and try again.')
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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={18} className="text-white" />
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2.5">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {error.includes('Connection failed') && (
                  <p className="text-xs text-red-400/70 mt-1">
                    Make sure you're connected to the internet. If the problem persists, try again in a minute.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step: Choose */}
          {step === 'choose' && !verifying && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Get Started</h1>
                <p className="text-base text-slate-400">
                  Protect your Safe multisig — start for free in 30 seconds
                </p>
              </div>

              {/* Start Free - Prominent */}
              <button
                onClick={() => { setStep('free'); setError('') }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-base hover:opacity-90 transition-opacity"
              >
                Start Free — No Payment Required
              </button>
              <p className="text-sm text-center text-slate-500 -mt-3">
                1 Safe • Transaction decoding • 10 API calls/day
              </p>

              {/* Go Pro with Daimo */}
              <div className="relative">
                <div className="absolute -top-2 right-3 px-2.5 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full uppercase tracking-wider z-10">
                  Most Popular
                </div>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-base">Go Pro — $20/month</p>
                      <p className="text-sm text-slate-500">5 Safes • All features • 1000 calls/day</p>
                    </div>
                  </div>
                  <Suspense fallback={<div className="text-center py-3 text-sm text-slate-500">Loading payment...</div>}>
                    <LazyDaimoCheckout onPaymentCompleted={handlePaymentCompleted} />
                  </Suspense>
                  <p className="text-sm text-center text-slate-500">
                    Pay with 1200+ tokens on 20+ chains
                  </p>
                </div>
              </div>

              {/* Promo Code */}
              <button
                onClick={() => { setStep('promo'); setError('') }}
                className="w-full py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-between px-5"
              >
                <div className="flex items-center gap-3">
                  <Ticket size={20} className="text-amber-400" />
                  <div className="text-left">
                    <p className="font-medium text-base">Have a promo code?</p>
                    <p className="text-sm text-slate-500">Friends & Family access</p>
                  </div>
                </div>
                <span className="text-sm text-amber-400 font-medium">FREE</span>
              </button>
            </>
          )}

          {/* Step: Free Signup */}
          {step === 'free' && !verifying && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Start Free</h1>
                <p className="text-base text-slate-400">
                  Enter your Safe multisig address to get started
                </p>
              </div>
              <form onSubmit={handleFreeSignup} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-slate-400">Safe Address</label>
                    <div className="group relative">
                      <Info size={14} className="text-slate-600 hover:text-slate-400 cursor-help" />
                      <div className="absolute right-0 bottom-6 w-56 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-400 leading-relaxed invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 shadow-xl">
                        A Safe address starts with <span className="font-mono text-emerald-400">0x</span> followed by 40 hex characters. Find it in your Safe dashboard at app.safe.global.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text" value={freeAddress}
                    onChange={(e) => setFreeAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none placeholder:text-slate-600 text-center transition-colors ${
                      freeAddress.trim() && !/^0x[a-fA-F0-9]{40}$/.test(freeAddress.trim())
                        ? 'border-red-500/50 focus:border-red-500'
                        : freeAddress.trim() && /^0x[a-fA-F0-9]{40}$/.test(freeAddress.trim())
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                  {freeAddress.trim() && !/^0x[a-fA-F0-9]{40}$/.test(freeAddress.trim()) && (
                    <p className="flex items-center gap-1 text-xs text-red-400 mt-1.5">
                      <AlertCircle size={12} />
                      Enter a valid Ethereum address (0x + 40 hex characters)
                    </p>
                  )}
                  {freeAddress.trim() && /^0x[a-fA-F0-9]{40}$/.test(freeAddress.trim()) && (
                    <p className="flex items-center gap-1 text-xs text-emerald-400 mt-1.5">
                      <Check size={12} />
                      We'll monitor all pending transactions on this Safe
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mt-1.5">
                    Don't have a Safe?{' '}
                    <a
                      href="https://app.safe.global/new-safe/create"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Create one free
                      <ExternalLink size={10} className="inline ml-0.5 -mt-0.5" />
                    </a>
                  </p>
                </div>
                <button type="submit" disabled={verifying || !freeAddress.trim() || (freeAddress.trim().length > 2 && !/^0x[a-fA-F0-9]{40}$/.test(freeAddress.trim()))}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifying ? 'Creating...' : 'Create Free Account'}
                </button>
              </form>

              {/* Prerequisites */}
              <PrerequisiteCheclistCompact />

              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-3 font-semibold">Scout Plan (Free)</p>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 1 Safe monitored
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Transaction decoding
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 10 API calls/day
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-slate-600" /> <span className="text-slate-600">Simulation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-slate-600" /> <span className="text-slate-600">Risk scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-slate-600" /> <span className="text-slate-600">Alerts</span>
                  </li>
                </ul>
              </div>
              <button onClick={() => setStep('choose')} className="w-full text-center text-sm text-slate-500 hover:text-slate-300">← Back</button>
            </>
          )}

          {/* Processing payment */}
          {verifying && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500"></div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {step === 'free' ? 'Creating Your Account' : step === 'recover' ? 'Looking Up Subscription' : step === 'promo' ? 'Activating Code' : 'Activating Subscription'}
              </h1>
              <p className="text-sm text-slate-400">
                {step === 'free' ? 'Setting up your free SandGuard account...' : step === 'recover' ? 'Searching for your subscription...' : step === 'promo' ? 'Validating your promo code...' : 'Processing your payment...'}
              </p>
              <p className="text-sm text-slate-500 mt-3">This usually takes a few seconds</p>
            </div>
          )}

          {/* Step: Promo Code */}
          {step === 'promo' && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Promo Code</h1>
                <p className="text-base text-slate-400">Enter your Friends & Family code</p>
              </div>
              <form onSubmit={handlePromoRedeem} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Code</label>
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
              <button onClick={() => setStep('choose')} className="w-full text-center text-sm text-slate-500 hover:text-slate-300">← Back</button>
            </>
          )}

          {/* Step: Recover */}
          {step === 'recover' && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Recover Access</h1>
                <p className="text-base text-slate-400">Enter the wallet address you originally paid with</p>
              </div>
              <form onSubmit={handleRecover} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Wallet Address</label>
                  <input
                    type="text" value={recoverAddress}
                    onChange={(e) => setRecoverAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none placeholder:text-slate-600 text-center transition-colors ${
                      recoverAddress.trim() && !/^0x[a-fA-F0-9]{40}$/.test(recoverAddress.trim())
                        ? 'border-red-500/50 focus:border-red-500'
                        : recoverAddress.trim() && /^0x[a-fA-F0-9]{40}$/.test(recoverAddress.trim())
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                  {recoverAddress.trim() && !/^0x[a-fA-F0-9]{40}$/.test(recoverAddress.trim()) && (
                    <p className="flex items-center gap-1 text-xs text-red-400 mt-1.5">
                      <AlertCircle size={12} />
                      Enter a valid Ethereum address (0x + 40 hex characters)
                    </p>
                  )}
                </div>
                <button type="submit" disabled={verifying || !recoverAddress.trim() || (recoverAddress.trim().length > 2 && !/^0x[a-fA-F0-9]{40}$/.test(recoverAddress.trim()))}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifying ? 'Checking...' : 'Recover Subscription'}
                </button>
              </form>
              <p className="text-sm text-slate-500 text-center">
                Can't remember which address you used? Check your wallet's transaction history for a $20 USDC payment.
              </p>
              <button onClick={() => setStep('choose')} className="w-full text-center text-sm text-slate-500 hover:text-slate-300">← Back</button>
            </>
          )}

          {/* Already paid link */}
          {step === 'choose' && (
            <div className="text-center pt-4 border-t border-slate-800/40">
              <button
                onClick={() => { setStep('recover'); setError('') }}
                className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors block w-full"
              >
                Already paid? Recover access →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
