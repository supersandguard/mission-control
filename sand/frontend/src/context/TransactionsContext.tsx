import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Transaction } from '../types'
import { MOCK_TRANSACTIONS } from '../mockData'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface TransactionsContextType {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getTransaction: (id: string) => Transaction | undefined
}

const TransactionsContext = createContext<TransactionsContextType>({
  transactions: [],
  loading: false,
  error: null,
  refresh: async () => {},
  getTransaction: () => undefined,
})

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const savedConfig = localStorage.getItem('sand-config')
  const config = savedConfig ? JSON.parse(savedConfig) : { address: '', chainId: 8453 }

  const fetchTransactions = useCallback(async () => {
    if (!config.address) {
      setTransactions(MOCK_TRANSACTIONS)
      return
    }

    setLoading(true)
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setTransactions(MOCK_TRANSACTIONS)
    } finally {
      setLoading(false)
    }
  }, [config.address, config.chainId])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const getTransaction = useCallback(
    (id: string) => transactions.find(t => t.id === id),
    [transactions]
  )

  return (
    <TransactionsContext.Provider value={{ transactions, loading, error, refresh: fetchTransactions, getTransaction }}>
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactionsContext() {
  return useContext(TransactionsContext)
}
