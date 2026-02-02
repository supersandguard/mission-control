import { useState, useEffect } from 'react'
import SafeAppsSDK, { type SafeInfo } from '@safe-global/safe-apps-sdk'

interface SafeAppContext {
  /** True when the app is running inside an iframe (likely Safe App Store) */
  isInsideIframe: boolean
  /** Whether we confirmed this is a Safe App context via SDK */
  isSafeApp: boolean
  /** Connected Safe info from SDK */
  safe: SafeInfo | null
  /** Safe address */
  safeAddress: string | null
  /** Chain ID */
  chainId: number | null
  /** SDK instance for further calls */
  sdk: SafeAppsSDK | null
  /** Loading state while SDK connects */
  loading: boolean
}

/**
 * Connect to Safe Apps SDK when running inside Safe Wallet iframe.
 * Falls back gracefully when running standalone.
 */
export function useSafeApp(): SafeAppContext {
  const [context, setContext] = useState<SafeAppContext>({
    isInsideIframe: false,
    isSafeApp: false,
    safe: null,
    safeAddress: null,
    chainId: null,
    sdk: null,
    loading: true,
  })

  useEffect(() => {
    const isInsideIframe = window.self !== window.top

    if (!isInsideIframe) {
      setContext({
        isInsideIframe: false,
        isSafeApp: false,
        safe: null,
        safeAddress: null,
        chainId: null,
        sdk: null,
        loading: false,
      })
      return
    }

    // Initialize Safe Apps SDK
    const sdk = new SafeAppsSDK({
      allowedDomains: [/safe\.global$/, /app\.safe\.global$/],
    })

    // Try to get Safe info — times out after 2s if not in Safe context
    const timeout = setTimeout(() => {
      // If we haven't gotten Safe info in 2s, we're probably not in Safe
      setContext(prev => prev.loading ? {
        isInsideIframe: true,
        isSafeApp: false,
        safe: null,
        safeAddress: null,
        chainId: null,
        sdk: null,
        loading: false,
      } : prev)
    }, 2000)

    sdk.safe.getInfo().then((safeInfo) => {
      clearTimeout(timeout)
      setContext({
        isInsideIframe: true,
        isSafeApp: true,
        safe: safeInfo,
        safeAddress: safeInfo.safeAddress,
        chainId: safeInfo.chainId,
        sdk,
        loading: false,
      })
    }).catch(() => {
      clearTimeout(timeout)
      setContext({
        isInsideIframe: true,
        isSafeApp: false,
        safe: null,
        safeAddress: null,
        chainId: null,
        sdk: null,
        loading: false,
      })
    })

    return () => clearTimeout(timeout)
  }, [])

  return context
}
