import { Router, Request, Response } from 'express'
import { activateSubscription } from '../services/db'

const router = Router()

interface DaimoWebhookEvent {
  id: string
  type: 'payment_completed' | 'payment_failed' | 'payment_pending'
  payment: {
    id: string
    status: 'completed' | 'failed' | 'pending'
    fromAddress: string
    toAddress: string
    toChain: number
    toToken: string
    toUnits: string
    fromToken?: string
    fromChain?: number
    fromUnits?: string
    timestamp: number
  }
}

// POST /api/webhooks/daimo - Receive Daimo Pay webhook events
router.post('/daimo', async (req: Request, res: Response) => {
  try {
    // Verify webhook auth token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.warn('Daimo webhook: Missing or invalid Authorization header')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // TODO: In production, verify the token against a known webhook secret
    // For now, we'll accept any Basic auth token during prototyping
    
    const event: DaimoWebhookEvent = req.body
    
    console.log('Daimo webhook received:', {
      eventId: event.id,
      type: event.type,
      paymentId: event.payment?.id,
      status: event.payment?.status,
      fromAddress: event.payment?.fromAddress
    })

    // Only process completed payments
    if (event.type === 'payment_completed' && event.payment.status === 'completed') {
      const { payment } = event
      
      // Validate payment details
      if (payment.toAddress.toLowerCase() !== '0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84'.toLowerCase()) {
        console.warn('Daimo webhook: Invalid toAddress', payment.toAddress)
        return res.status(400).json({ error: 'Invalid payment recipient' })
      }
      
      if (payment.toChain !== 8453) {
        console.warn('Daimo webhook: Invalid toChain', payment.toChain)
        return res.status(400).json({ error: 'Invalid payment chain' })
      }
      
      if (payment.toToken.toLowerCase() !== '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase()) {
        console.warn('Daimo webhook: Invalid toToken', payment.toToken)
        return res.status(400).json({ error: 'Invalid payment token' })
      }
      
      // Check amount - should be $20 USDC (allowing for small variations due to fees/slippage)
      const toAmount = parseFloat(payment.toUnits)
      if (toAmount < 19.0 || toAmount > 21.0) {
        console.warn('Daimo webhook: Invalid amount', toAmount)
        return res.status(400).json({ error: 'Invalid payment amount' })
      }

      try {
        // Activate subscription
        const { apiKey, expiresAt } = activateSubscription({
          address: payment.fromAddress,
          paidTxHash: payment.id, // Store Daimo payment ID as tx hash
          plan: 'pro',
        })

        console.log('Subscription activated via Daimo:', {
          address: payment.fromAddress,
          paymentId: payment.id,
          apiKey: apiKey.slice(0, 8) + '...',
          expiresAt: new Date(expiresAt).toISOString()
        })

        res.json({ 
          status: 'processed',
          subscription: {
            address: payment.fromAddress,
            plan: 'pro',
            expiresAt: new Date(expiresAt).toISOString()
          }
        })
      } catch (dbError) {
        console.error('Failed to activate subscription:', dbError)
        return res.status(500).json({ error: 'Failed to activate subscription' })
      }
    } else {
      // Non-completed payments - just acknowledge receipt
      console.log('Daimo webhook: Non-completed payment, ignoring', {
        type: event.type,
        status: event.payment?.status
      })
      res.json({ status: 'acknowledged' })
    }
  } catch (error) {
    console.error('Daimo webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router