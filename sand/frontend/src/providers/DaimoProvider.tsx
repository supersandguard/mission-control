import { type ReactNode } from 'react'
import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DaimoPayProvider, getDefaultConfig } from '@daimo/pay'

const queryClient = new QueryClient()

const config = createConfig(
  getDefaultConfig({
    appName: 'SandGuard',
  }) as any
)

export function DaimoProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DaimoPayProvider mode="dark">
          {children}
        </DaimoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
