import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { Transaction } from '../types'
import { MOCK_TRANSACTIONS } from '../mockData'

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
const API_BASE = getApiBase()

const DEFAULT_SAFE_ADDRESS = ''
const DEFAULT_CHAIN_ID = 1

const POLL_INTERVAL = 30_000 // 30 seconds

interface SafeInfo {
  address: string
  threshold: number
  owners: string[]
  nonce: number
  version: string
}

interface TransactionsContextType {
  transactions: Transaction[]
  loading: boolean
  refreshing: boolean
  error: string | null
  lastUpdated: Date | null
  safeInfo: SafeInfo | null
  safeAddress: string
  chainId: number
  isDemo: boolean
  refresh: () => Promise<void>
  getTransaction: (id: string) => Transaction | undefined
}

const TransactionsContext = createContext<TransactionsContextType>({
  transactions: [],
  loading: false,
  refreshing: false,
  error: null,
  lastUpdated: null,
  safeInfo: null,
  safeAddress: '',
  chainId: 1,
  isDemo: true,
  refresh: async () => {},
  getTransaction: () => undefined,
})

function getConfig() {
  const saved = localStorage.getItem('sand-config')
  if (saved) {
    const parsed = JSON.parse(saved)
    return {
      address: parsed.address || DEFAULT_SAFE_ADDRESS,
      chainId: parsed.chainId || DEFAULT_CHAIN_ID,
    }
  }
  return { address: DEFAULT_SAFE_ADDRESS, chainId: DEFAULT_CHAIN_ID }
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null)
  const isFirstLoad = useRef(true)

  const config = getConfig()
  const isDemo = !config.address

  const fetchSafeInfo = useCallback(async () => {
    if (!config.address) return
    try {
      const res = await fetch(`${API_BASE}/api/safe/${config.address}/info?chainId=${config.chainId}`)
      const data = await res.json()
      if (data.success) {
        setSafeInfo({
          address: data.address,
          threshold: data.threshold,
          owners: data.owners || [],
          nonce: data.nonce,
          version: data.version,
        })
      }
    } catch {
      // Non-critical, don't block on this
    }
  }, [config.address, config.chainId])

  const fetchTransactions = useCallback(async () => {
    if (!config.address) {
      setTransactions(MOCK_TRANSACTIONS)
      setLoading(false)
      return
    }

    // Show loading on first load, refreshing on subsequent
    if (isFirstLoad.current) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/api/safe/${config.address}/transactions?chainId=${config.chainId}`
      )
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')

      // Enrich transactions with decode, simulate, explain, risk
      const enriched = await Promise.all(
        data.transactions.map(async (rawTx: any) => {
          const tx: Transaction = {
            id: rawTx.safeTxHash || rawTx.transactionHash || String(rawTx.nonce),
            to: rawTx.to || '',
            value: rawTx.value || '0',
            data: rawTx.data || '0x',
            nonce: rawTx.nonce,
            submissionDate: rawTx.submissionDate || new Date().toISOString(),
            confirmations: rawTx.confirmations?.length || 0,
            confirmationsRequired: rawTx.confirmationsRequired || 2,
            isExecuted: rawTx.isExecuted || false,
          }

          try {
            const [simRes, decodeRes] = await Promise.allSettled([
              fetch(`${API_BASE}/api/simulate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: tx.to, value: tx.value, data: tx.data, chainId: config.chainId }),
              }).then(r => r.json()),
              fetch(`${API_BASE}/api/decode`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calldata: tx.data, contractAddress: tx.to, chainId: config.chainId }),
              }).then(r => r.json()),
            ])

            if (simRes.status === 'fulfilled' && simRes.value.success) tx.simulation = simRes.value.simulation
            if (decodeRes.status === 'fulfilled' && decodeRes.value.success) tx.decoded = decodeRes.value.decoded

            const [explainRes, riskRes] = await Promise.allSettled([
              fetch(`${API_BASE}/api/explain`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decoded: tx.decoded, simulation: tx.simulation, chainId: config.chainId }),
              }).then(r => r.json()),
              fetch(`${API_BASE}/api/risk`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: tx.to, value: tx.value, data: tx.data, decoded: tx.decoded, simulation: tx.simulation }),
              }).then(r => r.json()),
            ])

            if (explainRes.status === 'fulfilled' && explainRes.value.success) tx.explanation = explainRes.value.explanation
            if (riskRes.status === 'fulfilled' && riskRes.value.success) tx.risk = riskRes.value.risk
          } catch { /* fallback: no enrichment */ }

          return tx
        })
      )

      setTransactions(enriched)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      // Only fall back to mock if we have no data yet
      if (transactions.length === 0) {
        setTransactions(MOCK_TRANSACTIONS)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      isFirstLoad.current = false
    }
  }, [config.address, config.chainId])

  // Initial fetch
  useEffect(() => {
    fetchSafeInfo()
    fetchTransactions()
  }, [fetchSafeInfo, fetchTransactions])

  // Auto-poll every 30s when visible
  useEffect(() => {
    if (!config.address) return

    let intervalId: ReturnType<typeof setInterval>

    const startPolling = () => {
      intervalId = setInterval(() => {
        if (!document.hidden) {
          fetchTransactions()
        }
      }, POLL_INTERVAL)
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        // Refresh immediately when tab becomes visible
        fetchTransactions()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [config.address, fetchTransactions])

  const getTransaction = useCallback(
    (id: string) => transactions.find(t => t.id === id),
    [transactions]
  )

  return (
    <TransactionsContext.Provider value={{
      transactions, loading, refreshing, error, lastUpdated,
      safeInfo, safeAddress: config.address, chainId: config.chainId, isDemo,
      refresh: fetchTransactions, getTransaction,
    }}>
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactionsContext() {
  return useContext(TransactionsContext)
}
