import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Zap, Shield, Bell, Check, X, Key, Users, Wallet, ArrowRight, ExternalLink, CheckCircle } from 'lucide-react'
import PrerequisiteChecklist from '../components/PrerequisiteChecklist'
import type { ReactNode } from 'react'

const features: { icon: ReactNode; title: string; desc: string }[] = [
  {
    icon: <Search size={24} className="text-emerald-400" />,
    title: 'Decode',
    desc: 'Automatically decode calldata into human-readable function calls. Identifies known protocols like Aave, Uniswap, and Morpho.',
  },
  {
    icon: <Zap size={24} className="text-cyan-400" />,
    title: 'Simulate',
    desc: 'Fork the chain and simulate every transaction before signing. See exact balance changes, gas costs, and state diffs.',
  },
  {
    icon: <Shield size={24} className="text-emerald-400" />,
    title: 'Risk Score',
    desc: 'AI-powered risk analysis flags unlimited approvals, unverified contracts, and suspicious patterns before you sign.',
  },
  {
    icon: <Bell size={24} className="text-cyan-400" />,
    title: 'Push Alerts',
    desc: 'Get notified instantly when new transactions hit your queue. Never miss a pending signature via Clawdbot.',
  },
]

const steps = [
  { num: '1', text: 'Connect your Safe multisig wallet' },
  { num: '2', text: 'Pending transactions are automatically analyzed' },
  { num: '3', text: 'Review decoded calldata, simulation results, and risk scores' },
  { num: '4', text: 'Sign with confidence — or reject with evidence' },
]

export default function Landing() {
  useEffect(() => { document.title = 'SandGuard — Transaction Firewall for Safe Multisig' }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SandGuard</span>
          </div>
          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="text-sm px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-medium"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Free tier available — no credit card required
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Transaction Firewall
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            for Safe Multisig
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Protect your Safe multisig. Decode, simulate, and risk-score every transaction before your team signs.
          No Solidity required — know exactly what you're approving.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
          <a
            href="#pricing"
            className="px-8 py-3.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-base border border-slate-700 hover:border-slate-600 transition-colors"
          >
            View Pricing →
          </a>
        </div>
        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-10 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Built on Safe — $100B+ secured
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            No wallet connection required
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Read-only — never touches your keys
          </span>
        </div>
      </section>

      {/* Analogy — Why You Need This */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-4">
          Imagine a bank vault with{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            three keys
          </span>
        </h2>
        <p className="text-center text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-14">
          A Safe multisig is like a shared vault. No single person can open it alone —
          you need multiple keyholders to approve. Sounds secure, right?
          There's a catch.
        </p>

        {/* 3-step visual analogy */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-14">
          {/* Step 1: The vault */}
          <div className="relative bg-slate-900/60 rounded-2xl p-6 md:p-8 border border-slate-800/60 text-center">
            <div className="text-5xl mb-5">🔐</div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-100">
              The Vault
            </h3>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              Your crypto lives in a <strong className="text-slate-200">Safe wallet</strong> — a vault that needs
              multiple keys (signers) to open.{' '}
              <span className="text-emerald-400">3 people must agree</span> before any money moves.
            </p>
          </div>

          {/* Step 2: Blind signing */}
          <div className="relative bg-slate-900/60 rounded-2xl p-6 md:p-8 border border-red-500/20 text-center">
            <div className="text-5xl mb-5">🙈</div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-100">
              The Problem
            </h3>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              Someone slides a paper under the door. It says <em className="text-slate-300">"routine transfer."</em>{' '}
              All 3 keyholders sign it — <strong className="text-red-400">without reading the actual contract.</strong>{' '}
              This is called <strong className="text-slate-200">blind signing.</strong>
            </p>
          </div>

          {/* Step 3: SandGuard */}
          <div className="relative bg-slate-900/60 rounded-2xl p-6 md:p-8 border border-emerald-500/30 text-center">
            <div className="text-5xl mb-5">🛡️</div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-100">
              The Fix
            </h3>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              SandGuard <strong className="text-emerald-400">reads</strong> the actual document,{' '}
              <strong className="text-emerald-400">simulates</strong> what would happen, and{' '}
              <strong className="text-emerald-400">warns you</strong> if something's wrong.
              Like a lawyer who reviews every contract before you sign.
            </p>
          </div>
        </div>

        {/* Real-world callout — ByBit */}
        <div className="max-w-2xl mx-auto bg-red-500/5 rounded-xl border border-red-500/20 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="text-sm md:text-base text-slate-300 font-medium mb-1">
                This isn't hypothetical.
              </p>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                In the <strong className="text-slate-200">ByBit hack</strong>, the paper said "transfer funds" — but the actual
                contract said <em className="text-red-400">"give everything to the attacker."</em>{' '}
                All signers approved because they trusted the summary, not the code.
                SandGuard would have caught this.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-lg md:text-xl font-bold text-slate-300 uppercase tracking-wider mb-12">
          What SandGuard does
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
            >
              <span className="mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What is Safe? — explainer for newcomers */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-b from-slate-900/80 to-slate-900/30 rounded-2xl border border-slate-800/60 p-8 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={20} className="text-emerald-400" />
            <h2 className="text-lg md:text-xl font-bold">New to Safe? Here's the quick version</h2>
          </div>
          <p className="text-base text-slate-400 leading-relaxed mb-5">
            A <strong className="text-slate-200">Safe</strong> (formerly Gnosis Safe) is the most widely-used smart contract wallet in crypto.
            It's like a shared bank account that requires <strong className="text-slate-200">multiple approvals</strong> (e.g., 2 of 3 team members) before any transaction goes through.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
              <p className="text-base font-medium text-slate-200 mb-1">👥 Multi-sig</p>
              <p className="text-sm text-slate-400">Multiple people must approve each transaction</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
              <p className="text-base font-medium text-slate-200 mb-1">🔐 Secure</p>
              <p className="text-sm text-slate-400">No single point of failure — lose one key, funds are still safe</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
              <p className="text-base font-medium text-slate-200 mb-1">🏗️ Trusted</p>
              <p className="text-sm text-slate-400">Used by Ethereum Foundation, DAOs, and major protocols</p>
            </div>
          </div>
          <p className="text-base text-slate-400 leading-relaxed mb-4">
            <strong className="text-slate-200">The problem:</strong> when a transaction hits your queue, you see raw hex data and contract addresses.
            SandGuard translates that into plain English so you know exactly what you're signing.
          </p>
          <a
            href="https://app.safe.global/new-safe/create"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Create your first Safe — it's free
            <ExternalLink size={14} />
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-lg md:text-xl font-bold text-slate-300 uppercase tracking-wider mb-12">
          How it works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {s.num}
              </div>
              <p className="text-sm md:text-base text-slate-300">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started — What You Need */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-center text-lg md:text-xl font-bold text-slate-300 uppercase tracking-wider mb-4">
          Getting Started
        </h2>
        <p className="text-center text-slate-400 text-base md:text-lg max-w-xl mx-auto mb-14">
          SandGuard works with Safe multisig wallets. Here's what you need to get up and running.
        </p>

        {/* 3-step cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {/* Step 1 */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/60 hover:border-emerald-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-5">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-emerald-400/60 uppercase tracking-wider">Step 1</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Create a Safe</h3>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-4">
              A Safe is a smart contract wallet that requires multiple approvals for every transaction.
              Think of it as a bank vault that needs 2 of 3 keys to open.
            </p>
            <a
              href="https://app.safe.global/new-safe/create"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Create a Safe on app.safe.global
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/60 hover:border-cyan-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-5">
              <Users size={20} className="text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-cyan-400/60 uppercase tracking-wider">Step 2</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Add Your Signers</h3>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-4">
              Each signer can use MetaMask, Ledger, Trezor, or any Ethereum-compatible wallet.
              Hardware wallets recommended for maximum security.
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">MetaMask</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Ledger</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Trezor</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Rabby</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/60 hover:border-emerald-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-5">
              <Key size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-emerald-400/60 uppercase tracking-wider">Step 3</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Connect to SandGuard</h3>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-4">
              Paste your Safe address and SandGuard monitors every transaction before you sign.
              Decode calldata, simulate outcomes, and get risk scores automatically.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Get started now
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Full Prerequisites Checklist */}
        <div className="max-w-xl mx-auto">
          <h3 className="text-lg md:text-xl font-bold text-slate-200 uppercase tracking-wider mb-6 text-center">
            Full Prerequisites Checklist
          </h3>
          <PrerequisiteChecklist />
        </div>
      </section>

      {/* Built for Safe */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/60 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          {/* Safe Logo */}
          <div className="flex-shrink-0">
            <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" rx="76" fill="#12FF80" fillOpacity="0.15" />
              <path d="M374.7 201.2H355.4V158.5C355.4 104 311.4 60 256.9 60H256C201.5 60 157.5 104 157.5 158.5V201.2H137.3C121.2 201.2 108.2 214.2 108.2 230.3V393.9C108.2 410 121.2 423 137.3 423H374.7C390.8 423 403.8 410 403.8 393.9V230.3C403.8 214.2 390.8 201.2 374.7 201.2ZM273.9 343.6V370.3C273.9 380.2 265.8 388.3 255.9 388.3C246 388.3 237.9 380.2 237.9 370.3V343.6C228.4 337 222.3 326.1 222.3 313.7C222.3 293.2 238.9 276.6 259.4 276.6C279.9 276.6 296.5 293.2 296.5 313.7C296.5 326.1 290.4 337 280.9 343.6H273.9ZM315.4 201.2H196.6V158.5C196.6 125.7 223.2 99.1 256 99.1C288.8 99.1 315.4 125.7 315.4 158.5V201.2Z" fill="#12FF80" />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              Built for{' '}
              <span className="text-[#12FF80]">Safe</span>
              <span className="text-slate-500">{'{Wallet}'}</span>
            </h3>
            <p className="text-base text-slate-400 leading-relaxed mb-4 max-w-lg">
              SandGuard integrates with Safe — the most trusted smart wallet infrastructure, securing over $100B+ in onchain assets.
              Used by Ethereum Foundation, Worldcoin, Vitalik Buterin, and thousands of DAOs worldwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href="https://app.safe.global/new-safe/create"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12FF80]/10 text-[#12FF80] text-sm font-medium border border-[#12FF80]/20 hover:bg-[#12FF80]/20 transition-colors"
              >
                Create a Safe
                <ExternalLink size={14} />
              </a>
              <a
                href="https://safe.global"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Learn about Safe
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 id="pricing" className="text-center text-lg md:text-xl font-bold text-slate-300 uppercase tracking-wider mb-12">
          Simple pricing
        </h2>
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Scout - FREE */}
          <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800/60 flex flex-col">
            <p className="text-base text-slate-400 mb-2">Scout</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-5xl font-bold">Free</span>
            </div>
            <p className="text-base text-slate-400 mb-6">No credit card required</p>
            <ul className="text-base text-slate-400 space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> 1 Safe monitored
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Transaction decoding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> 10 API calls/day
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-600" /> <span className="text-slate-600">Simulation</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-600" /> <span className="text-slate-600">Risk scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-600" /> <span className="text-slate-600">Alerts</span>
              </li>
            </ul>
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-center border border-slate-700 hover:border-emerald-500/50 transition-colors"
            >
              Start Free →
            </Link>
          </div>

          {/* Pro - $20/mo */}
          <div className="bg-slate-900/50 rounded-2xl p-8 border-2 border-emerald-500/40 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <p className="text-base text-slate-400 mb-2">Pro</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-5xl font-bold">$20</span>
              <span className="text-slate-500">/month</span>
            </div>
            <p className="text-base text-slate-400 mb-6">Pay with any crypto</p>
            <ul className="text-base text-slate-400 space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> 5 Safes monitored
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Transaction decoding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Simulation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> AI risk scoring
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> 1,000 API calls/day
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Push alerts via Clawdbot
              </li>
            </ul>
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-center hover:opacity-90 transition-opacity"
            >
              Go Pro →
            </Link>
            <p className="text-sm text-slate-500 mt-3 text-center">Pay with any crypto • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Stop signing blind
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Every transaction decoded, simulated, and scored before your signature touches it.
        </p>
        <Link
          to="/login"
          className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8">
        <div className="max-w-5xl mx-auto px-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield size={16} className="text-slate-500" />
              <span>SandGuard</span>
              <span>·</span>
              <span>supersandguard.com</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a
                href="https://supersandguard.github.io/sandguard/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
              >
                Blog
              </a>
              <a
                href="https://github.com/supersandguard/sandguard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://x.com/beto_neh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
              >
                𝕏 @beto_neh
              </a>
              <a
                href="https://safe.global"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M374.7 201.2H355.4V158.5C355.4 104 311.4 60 256.9 60H256C201.5 60 157.5 104 157.5 158.5V201.2H137.3C121.2 201.2 108.2 214.2 108.2 230.3V393.9C108.2 410 121.2 423 137.3 423H374.7C390.8 423 403.8 410 403.8 393.9V230.3C403.8 214.2 390.8 201.2 374.7 201.2ZM273.9 343.6V370.3C273.9 380.2 265.8 388.3 255.9 388.3C246 388.3 237.9 380.2 237.9 370.3V343.6C228.4 337 222.3 326.1 222.3 313.7C222.3 293.2 238.9 276.6 259.4 276.6C279.9 276.6 296.5 293.2 296.5 313.7C296.5 326.1 290.4 337 280.9 343.6H273.9ZM315.4 201.2H196.6V158.5C196.6 125.7 223.2 99.1 256 99.1C288.8 99.1 315.4 125.7 315.4 158.5V201.2Z" fill="currentColor" />
                </svg>
                Powered by Safe
              </a>
            </div>
          </div>
          <p className="text-sm text-slate-500 text-center sm:text-right">{new Date().getFullYear()} SandGuard</p>
        </div>
      </footer>
    </div>
  )
}
