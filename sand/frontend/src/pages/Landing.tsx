import { Link } from 'react-router-dom'

const features = [
  {
    icon: '🔍',
    title: 'Decode',
    desc: 'Automatically decode calldata into human-readable function calls. Identifies known protocols like Aave, Uniswap, and Morpho.',
  },
  {
    icon: '⚡',
    title: 'Simulate',
    desc: 'Fork the chain and simulate every transaction before signing. See exact balance changes, gas costs, and state diffs.',
  },
  {
    icon: '🛡️',
    title: 'Risk Score',
    desc: 'AI-powered risk analysis flags unlimited approvals, unverified contracts, and suspicious patterns before you sign.',
  },
  {
    icon: '🔔',
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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
              🛡
            </div>
            <span className="text-lg font-semibold tracking-tight">SandGuard</span>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Works with Clawdbot
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Transaction Firewall
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            for Safe Multisig
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Don't trust, verify — without reading Solidity. SandGuard decodes, simulates, and scores every
          transaction before you sign. Know exactly what you're approving.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Get Started — $20/mo in any crypto
          </Link>
          <Link
            to="/app"
            className="px-8 py-3.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-base border border-slate-700 hover:border-slate-600 transition-colors"
          >
            Try Demo →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-12">
          What SandGuard does
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-12">
          How it works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {s.num}
              </div>
              <p className="text-sm text-slate-300">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-12">
          Simple pricing
        </h2>
        <div className="max-w-sm mx-auto bg-slate-900/50 rounded-2xl p-8 border border-slate-800/60 text-center">
          <p className="text-sm text-slate-400 mb-2">Pro</p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold">$20</span>
            <span className="text-slate-500">/month</span>
          </div>
          <p className="text-sm text-slate-400 mb-6">Pay with any crypto</p>
          <ul className="text-sm text-slate-400 space-y-3 mb-8 text-left">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Unlimited transactions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Tenderly simulation
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> AI-powered explanations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Risk scoring engine
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Multi-chain support
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Push notifications via Clawdbot
            </li>
          </ul>
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Connect Your Safe
          </Link>
          <p className="text-xs text-slate-600 mt-3">Pay with any crypto • Cancel anytime</p>
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

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>🛡️</span>
            <span>SandGuard</span>
            <span>·</span>
            <span>supersandguard.com</span>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} SandGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
