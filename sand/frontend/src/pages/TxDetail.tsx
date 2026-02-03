import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Coins, Search, ShieldCheck, Fuel, Package, X, Check, AlertTriangle, Copy, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react'
import { useTransactionsContext } from '../context/TransactionsContext'
import RiskBadge from '../components/RiskBadge'
import BalanceChangeCard from '../components/BalanceChangeCard'

// Etherscan base URLs by chain
const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  10: 'https://optimistic.etherscan.io',
  42161: 'https://arbiscan.io',
  137: 'https://polygonscan.com',
}

function getExplorerUrl(chainId: number): string {
  return EXPLORER_URLS[chainId] || EXPLORER_URLS[1]
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function CopyableAddress({ address, chainId }: { address: string; chainId: number }) {
  const [copied, setCopied] = useState(false)
  const explorer = getExplorerUrl(chainId)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!address || address.length < 10) return <span className="font-mono text-sm text-slate-300">{address}</span>

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={`${explorer}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
      >
        {shortenAddress(address)}
      </a>
      <button
        onClick={handleCopy}
        className="text-slate-500 hover:text-slate-300 transition-colors"
        title="Copy address"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
      <a
        href={`${explorer}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-500 hover:text-slate-300 transition-colors"
        title="View on explorer"
      >
        <ExternalLink size={12} />
      </a>
    </span>
  )
}

export default function TxDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTransaction, chainId } = useTransactionsContext()
  const tx = getTransaction(id || '')

  if (!tx) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center mx-auto mb-4">
          <Search size={24} className="text-slate-600" />
        </div>
        <p className="text-base font-medium text-slate-300 mb-1">Transaction not found</p>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          This transaction may have been executed or removed from the queue.
        </p>
        <button onClick={() => navigate('/app/queue')} className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
          ← Back to queue
        </button>
      </div>
    )
  }

  const isUnknownFunction = tx.decoded?.functionName.startsWith('Unknown') || tx.decoded?.functionSource === 'raw'
  const isUnverified = tx.decoded?.contractVerified === false
  const isHighRisk = tx.risk?.score === 'red'
  const is4byte = tx.decoded?.functionSource === '4byte'
  const isSafe = tx.decoded?.isSafeProxy === true

  return (
    <div className="px-4 py-6 space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-300">← Back</button>

      {/* Unverified Contract Banner */}
      {isUnverified && isUnknownFunction && (
        <div className="bg-red-500/15 border-2 border-red-500/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-300">Unverified Contract — Unknown Function</p>
            <p className="text-sm text-red-300/80 mt-1">
              This transaction calls an unidentified function on a contract with no verified source code.
              We cannot determine what it does. Review carefully before signing.
            </p>
          </div>
        </div>
      )}

      {/* Safe Proxy Banner */}
      {isSafe && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-300">Safe Multisig Wallet Detected</p>
            <p className="text-sm text-blue-300/80 mt-1">
              Target is a Safe multisig.
              {tx.decoded?.innerTransaction && (
                <> Inner call targets <CopyableAddress address={tx.decoded.innerTransaction.to} chainId={chainId} />
                {tx.decoded.innerTransaction.value !== '0' && (
                  <> with {(Number(BigInt(tx.decoded.innerTransaction.value)) / 1e18).toFixed(6)} ETH</>
                )}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{tx.explanation?.summary || tx.decoded?.functionName || 'Transaction'}</p>
            <p className="text-sm text-slate-400 mt-1">
              Nonce #{tx.nonce} · {tx.confirmations}/{tx.confirmationsRequired} signatures
            </p>
            <p className="text-sm text-slate-500 mt-1">
              To: <CopyableAddress address={tx.to} chainId={chainId} />
            </p>
          </div>
          {tx.risk && <RiskBadge level={tx.risk.score} size="lg" reasons={tx.risk.reasons} />}
        </div>
      </div>

      {/* What We Know / Don't Know */}
      {tx.decoded && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Assessment
          </h3>
          <div className="space-y-2">
            {/* Simulation */}
            <AssessmentRow
              ok={tx.simulation?.success ?? false}
              label={tx.simulation?.success ? 'Simulation succeeded' : tx.simulation ? 'Simulation failed' : 'Simulation not available'}
            />

            {/* Function identification */}
            <AssessmentRow
              ok={!isUnknownFunction}
              label={isUnknownFunction
                ? 'Function not identified'
                : is4byte
                  ? `Function identified via signature database: ${tx.decoded.functionName} (unverified)`
                  : `Function identified: ${tx.decoded.functionName}`
              }
            />

            {/* Contract verification */}
            <AssessmentRow
              ok={tx.decoded.contractVerified}
              label={tx.decoded.contractVerified
                ? 'Contract source code verified'
                : 'Contract NOT verified — source code unavailable'
              }
            />

            {/* Protocol recognition */}
            <AssessmentRow
              ok={!!tx.decoded.protocol}
              label={tx.decoded.protocol
                ? `Known protocol: ${tx.decoded.protocol.name} (${tx.decoded.protocol.category})`
                : 'Protocol not recognized'
              }
            />

            {/* Balance changes */}
            {tx.simulation && (
              <AssessmentRow
                ok={true}
                neutral={!tx.simulation.balanceChanges.some(c => Math.abs(parseFloat(c.delta)) > 0.000001)}
                label={tx.simulation.balanceChanges.some(c => Math.abs(parseFloat(c.delta)) > 0.000001)
                  ? `Balance changes detected`
                  : 'No balance changes detected'
                }
              />
            )}

            {/* Safe proxy */}
            {isSafe && (
              <AssessmentRow
                ok={true}
                label="Target is a Safe multisig wallet"
              />
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {tx.explanation && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Explanation
          </h3>
          <ul className="space-y-2">
            {tx.explanation.details.map((d, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-slate-600 mt-0.5">•</span>
                <span className="whitespace-pre-wrap">{d}</span>
              </li>
            ))}
          </ul>
          {tx.explanation.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              {tx.explanation.warnings.map((w, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance Changes */}
      {tx.simulation && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Coins className="w-4 h-4" /> Balance Changes</h3>
          {tx.simulation.balanceChanges.length > 0 ? (
            <div className="space-y-2">
              {tx.simulation.balanceChanges.map((bc, i) => (
                <BalanceChangeCard key={i} change={bc} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No balance changes detected in simulation</p>
          )}
        </div>
      )}

      {/* Decoded */}
      {tx.decoded && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Search className="w-4 h-4" /> Decoded Data</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Function</p>
              <div className="flex items-center gap-2">
                <p className={`font-mono text-sm ${isUnknownFunction ? 'text-red-400' : 'text-emerald-400'}`}>
                  {tx.decoded.functionSignature || tx.decoded.functionName}
                </p>
                {is4byte && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                    4byte.directory
                  </span>
                )}
                {tx.decoded.functionSource === 'sourcify' && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    Sourcify
                  </span>
                )}
              </div>
            </div>
            {tx.decoded.protocol && (
              <div>
                <p className="text-sm text-slate-400">Protocol</p>
                <p className="text-sm">{tx.decoded.protocol.name} <span className="text-slate-500">({tx.decoded.protocol.category})</span></p>
              </div>
            )}
            {!tx.decoded.contractVerified && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <p className="text-xs font-bold text-red-400">⛔ Contract not verified</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400 mb-2">Parameters</p>
              {tx.decoded.parameters.length > 0 ? (
                tx.decoded.parameters.map((p, i) => (
                  <div key={i} className="flex justify-between items-start py-1.5 border-t border-slate-800/50 gap-3">
                    <div className="min-w-0 flex-shrink-0">
                      <p className="text-sm font-mono text-slate-400">{p.name} <span className="text-slate-500">({p.type})</span></p>
                      {p.label && <p className="text-sm text-slate-500">{p.label}</p>}
                    </div>
                    <div className="text-right min-w-0 flex-1">
                      {p.type === 'address' ? (
                        <CopyableAddress address={p.value} chainId={chainId} />
                      ) : (
                        <p className="font-mono text-sm text-slate-300 truncate">{p.value}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No parameters decoded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk Details */}
      {tx.risk && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Risk Analysis</h3>
          <div className="space-y-2">
            {tx.risk.reasons.map((r, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm ${
                r.level === 'red' ? 'text-red-300' : r.level === 'yellow' ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                <span className="flex-shrink-0">{r.level === 'red' ? '🔴' : r.level === 'yellow' ? '🟡' : '🟢'}</span>
                <span>{r.message || r.messageEs}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation */}
      {tx.simulation && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Fuel className="w-4 h-4" /> Simulation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className="text-sm">{tx.simulation.success ? '✅ Succeeded' : '❌ Failed'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Estimated Gas</p>
              <p className="font-mono text-sm">{tx.simulation.gasUsed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data */}
      <details className="bg-slate-900 rounded-2xl border border-slate-800">
        <summary className="p-5 text-sm font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300">
          <span className="inline-flex items-center gap-1.5"><Package className="w-4 h-4" /> Raw Data</span>
        </summary>
        <div className="px-5 pb-5 space-y-2">
          <div>
            <p className="text-sm text-slate-400">To</p>
            <CopyableAddress address={tx.to} chainId={chainId} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Value</p>
            <p className="font-mono text-sm text-slate-300">{tx.value} wei</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Data</p>
            <p className="font-mono text-sm text-slate-300 break-all max-h-24 overflow-y-auto">{tx.data}</p>
          </div>
        </div>
      </details>

      {/* Action Buttons — Open in Safe{Wallet} */}
      {(() => {
        const savedConfig = localStorage.getItem('sand-config')
        const safeAddr = savedConfig ? JSON.parse(savedConfig).address : ''
        const chainPrefix = chainId === 1 ? 'eth' : chainId === 8453 ? 'base' : chainId === 10 ? 'oeth' : chainId === 42161 ? 'arb1' : 'eth'
        const safeWalletUrl = safeAddr
          ? `https://app.safe.global/transactions/tx?safe=${chainPrefix}:${safeAddr}&id=multisig_${safeAddr}_${tx.id}`
          : 'https://app.safe.global'
        return (
          <div className="space-y-3 pt-2">
            <a
              href={safeWalletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm border transition-colors active:scale-95 ${
                isHighRisk
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Open in Safe Wallet to Sign or Reject
            </a>
            <p className="text-xs text-slate-500 text-center">
              SandGuard analyzes transactions. Signing and rejection happen in Safe&#123;Wallet&#125;.
            </p>
          </div>
        )
      })()}
    </div>
  )
}

// Assessment row component for the "What we know" section
function AssessmentRow({ ok, label, neutral }: { ok: boolean; label: string; neutral?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {neutral ? (
        <span className="text-slate-500 flex-shrink-0 mt-0.5">ℹ️</span>
      ) : ok ? (
        <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <span className={neutral ? 'text-slate-400' : ok ? 'text-slate-300' : 'text-red-300'}>
        {label}
      </span>
    </div>
  )
}
