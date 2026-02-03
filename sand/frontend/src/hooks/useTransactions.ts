import { useState, useEffect, useCallback } from 'react'
import { Transaction } from '../types'

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

interface SafeConfig {
  address: string
  chainId: number
}

// Default: Alberto's Safe on Ethereum mainnet
const DEFAULT_CONFIG: SafeConfig = {
  address: '',
  chainId: 1,
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config] = useState<SafeConfig>(() => {
    const saved = localStorage.getItem('sand-config')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        address: parsed.address || DEFAULT_CONFIG.address,
        chainId: parsed.chainId || DEFAULT_CONFIG.chainId,
      }
    }
    return DEFAULT_CONFIG
  })

  const enrichTransaction = useCallback(async (rawTx: any): Promise<Transaction> => {
    const tx: Transaction = {
      id: rawTx.safeTxHash || rawTx.transactionHash || String(rawTx.nonce),
      to: rawTx.to || '',
      value: rawTx.value || '0',
      data: rawTx.data || '0x',
      nonce: rawTx.nonce,
      submissionDate: rawTx.submissionDate || rawTx.executionDate || new Date().toISOString(),
      confirmations: rawTx.confirmations?.length || 0,
      confirmationsRequired: rawTx.confirmationsRequired || 2,
      isExecuted: rawTx.isExecuted || false,
    }

    // Enrich: decode, simulate, explain, risk - all in parallel
    try {
      const [simRes, decodeRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: tx.to, value: tx.value, data: tx.data, chainId: config.chainId }),
        }).then(r => r.json()),
        fetch(`${API_BASE}/api/decode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calldata: tx.data, contractAddress: tx.to, chainId: config.chainId }),
        }).then(r => r.json()),
      ])

      if (simRes.status === 'fulfilled' && simRes.value.success) {
        tx.simulation = simRes.value.simulation
      }
      if (decodeRes.status === 'fulfilled' && decodeRes.value.success) {
        tx.decoded = decodeRes.value.decoded
      }

      // Now get explanation and risk (which may depend on decode/sim results)
      const [explainRes, riskRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decoded: tx.decoded, simulation: tx.simulation, chainId: config.chainId }),
        }).then(r => r.json()),
        fetch(`${API_BASE}/api/risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: tx.to, value: tx.value, data: tx.data,
            chainId: config.chainId,
            decoded: tx.decoded,
            simulation: tx.simulation,
          }),
        }).then(r => r.json()),
      ])

      if (explainRes.status === 'fulfilled' && explainRes.value.success) {
        tx.explanation = explainRes.value.explanation
      }
      if (riskRes.status === 'fulfilled' && riskRes.value.success) {
        tx.risk = riskRes.value.risk
      }
    } catch (e) {
      console.warn('Failed to enrich transaction:', e)
    }

    return tx
  }, [config.chainId])

  const fetchTransactions = useCallback(async () => {
    if (!config.address) {
      setTransactions([])
      setError('No Safe address configured. Go to Settings to add one.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/api/safe/${config.address}/transactions?chainId=${config.chainId}`
      )
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      // Enrich all transactions
      const enriched = await Promise.all(
        data.transactions.map((tx: any) => enrichTransaction(tx))
      )

      setTransactions(enriched)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      // Show empty state — never fall back to mock data
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [config.address, config.chainId, enrichTransaction])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return { transactions, loading, error, refresh: fetchTransactions }
}
