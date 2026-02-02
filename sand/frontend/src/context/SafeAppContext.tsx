import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useSafeApp } from '../hooks/useSafeApp'
import { useAuth } from './AuthContext'
import type SafeAppsSDK from '@safe-global/safe-apps-sdk'
import type { SafeInfo } from '@safe-global/safe-apps-sdk'

interface SafeAppContextType {
  isSafeApp: boolean
  safe: SafeInfo | null
  sdk: SafeAppsSDK | null
  loading: boolean
}

const SafeAppCtx = createContext<SafeAppContextType>({
  isSafeApp: false,
  safe: null,
  sdk: null,
  loading: true,
})

/**
 * When running inside Safe Wallet, auto-register with SandGuard
 * using the connected Safe address and skip the login flow.
 */
export function SafeAppProvider({ children }: { children: ReactNode }) {
  const safeApp = useSafeApp()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!safeApp.isSafeApp || !safeApp.safeAddress || safeApp.loading) return
    if (isAuthenticated) return // already logged in

    // Auto-register with free tier when inside Safe
    const autoRegister = async () => {
      try {
        const res = await fetch('/api/payments/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: safeApp.safeAddress }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.apiKey) {
            login(data.apiKey, safeApp.safeAddress!)
          }
        }
      } catch (err) {
        console.error('Safe App auto-register failed:', err)
      }
    }
    autoRegister()
  }, [safeApp.isSafeApp, safeApp.safeAddress, safeApp.loading, isAuthenticated, login])

  return (
    <SafeAppCtx.Provider value={{
      isSafeApp: safeApp.isSafeApp,
      safe: safeApp.safe,
      sdk: safeApp.sdk,
      loading: safeApp.loading,
    }}>
      {children}
    </SafeAppCtx.Provider>
  )
}

export function useSafeAppContext() {
  return useContext(SafeAppCtx)
}
