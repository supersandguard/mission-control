import { DaimoPayButton } from '@daimo/pay'
import { DaimoProvider } from '../providers/DaimoProvider'

const PAYMENT_ADDRESS = '0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BASE_CHAIN_ID = 8453

interface DaimoCheckoutProps {
  onPaymentCompleted: (event: any) => void
}

export default function DaimoCheckout({ onPaymentCompleted }: DaimoCheckoutProps) {
  return (
    <DaimoProvider>
      <DaimoPayButton
        appId="sandguard"
        toAddress={PAYMENT_ADDRESS as `0x${string}`}
        toChain={BASE_CHAIN_ID}
        toToken={USDC_BASE as `0x${string}`}
        toUnits="20.00"
        intent="Subscribe to SandGuard Pro"
        onPaymentCompleted={onPaymentCompleted}
      />
    </DaimoProvider>
  )
}
