import { Shield, Users, HardDrive, Fuel, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react'

interface ChecklistItem {
  icon: React.ReactNode
  title: string
  description: string
  status: 'required' | 'recommended' | 'done'
  link?: { text: string; url: string }
}

const items: ChecklistItem[] = [
  {
    icon: <Shield size={20} className="text-emerald-400" />,
    title: 'Safe Multisig Wallet',
    description:
      'A Safe is a smart contract wallet requiring multiple approvals for every transaction. Create one with 2+ owners for security.',
    status: 'required',
    link: { text: 'Create a Safe', url: 'https://app.safe.global/new-safe/create' },
  },
  {
    icon: <Users size={20} className="text-cyan-400" />,
    title: 'Multiple Signers (2+)',
    description:
      'Each signer needs their own wallet — MetaMask, Rabby, Coinbase Wallet, or any Ethereum-compatible wallet.',
    status: 'required',
  },
  {
    icon: <HardDrive size={20} className="text-amber-400" />,
    title: 'Hardware Wallet',
    description:
      'A Ledger or Trezor adds an extra layer of protection. Your private keys never touch the internet.',
    status: 'recommended',
    link: { text: 'Learn more', url: 'https://safe.global/blog/hardware-wallet-safe' },
  },
  {
    icon: <Fuel size={20} className="text-violet-400" />,
    title: 'ETH for Gas',
    description:
      'You need a small amount of ETH (or the native gas token) on whichever chain your Safe is deployed to.',
    status: 'required',
  },
  {
    icon: <CheckCircle size={20} className="text-emerald-400" />,
    title: 'SandGuard Account',
    description: "You're here — sign up for free and paste your Safe address to start monitoring transactions.",
    status: 'done',
  },
]

export default function PrerequisiteChecklist() {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-semibold text-slate-200">{item.title}</h4>
              {item.status === 'done' && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Ready
                </span>
              )}
              {item.status === 'recommended' && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Recommended
                </span>
              )}
              {item.status === 'required' && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                  Required
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
            {item.link && (
              <a
                href={item.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {item.link.text}
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Compact inline version for the Login page */
export function PrerequisiteCheclistCompact() {
  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
      <p className="text-sm text-slate-400 uppercase tracking-wider mb-3 font-semibold">
        What you need
      </p>
      <ul className="space-y-2.5">
        <li className="flex items-start gap-2.5">
          <Shield size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-slate-400 leading-relaxed">
            A{' '}
            <a
              href="https://app.safe.global/new-safe/create"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Safe multisig wallet
            </a>{' '}
            with 2+ signers
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Users size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-slate-400 leading-relaxed">
            Each signer with their own wallet (MetaMask, Ledger, Rabby, etc.)
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Fuel size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-slate-400 leading-relaxed">
            ETH for gas on your Safe's network
          </span>
        </li>
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-800/60">
        <a
          href="https://safe.global"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-400 transition-colors"
        >
          New to Safe? Learn more
          <ArrowRight size={12} />
        </a>
      </div>
    </div>
  )
}
