import { Router, Request, Response } from 'express'
import { activateSubscription, getSubscriptionByAddress, getSubscriptionByApiKey } from '../services/db'

const router = Router()

const PAYMENT_WALLET = '0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84'
const MONTHLY_PRICE_USD = 20

// GET /api/payments/info - Public payment info
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    wallet: PAYMENT_WALLET,
    chain: 'base',
    chainId: 8453,
    monthlyPriceUsd: MONTHLY_PRICE_USD,
    acceptedTokens: ['ETH'],
    instructions: `Send $${MONTHLY_PRICE_USD} worth of ETH to ${PAYMENT_WALLET} on Base chain. Then call POST /api/payments/verify with your tx hash to activate your subscription.`
  })
})

// POST /api/payments/verify - Verify payment and issue API key
router.post('/verify', async (req: Request, res: Response) => {
  const { txHash, address } = req.body
  
  if (!txHash || !address) {
    return res.status(400).json({ error: 'txHash and address are required' })
  }

  try {
    // Check if already verified
    const existing = getSubscriptionByAddress(address)
    if (existing && existing.expires_at > Date.now()) {
      return res.json({
        status: 'active',
        apiKey: existing.api_key,
        expiresAt: new Date(existing.expires_at).toISOString(),
        message: 'Subscription already active'
      })
    }

    // Verify tx on Base using Basescan API
    const basescanUrl = `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
    const response = await fetch(basescanUrl)
    const data = await response.json()
    
    if (!data.result) {
      return res.status(400).json({ error: 'Transaction not found on Base chain' })
    }

    const tx = data.result
    const toAddress = tx.to?.toLowerCase()
    const fromAddress = tx.from?.toLowerCase()
    
    // Verify recipient is our wallet
    if (toAddress !== PAYMENT_WALLET.toLowerCase()) {
      return res.status(400).json({ error: 'Transaction recipient does not match payment wallet' })
    }

    // Verify sender matches claimed address
    if (fromAddress !== address.toLowerCase()) {
      return res.status(400).json({ error: 'Transaction sender does not match provided address' })
    }

    // Verify amount (at least ~0.003 ETH as minimum)
    const valueWei = BigInt(tx.value)
    const minWei = BigInt('3000000000000000') // ~0.003 ETH
    
    if (valueWei < minWei) {
      return res.status(400).json({ error: 'Payment amount too low. Minimum ~$20 in ETH required.' })
    }

    // Activate subscription with SQLite
    const { apiKey, expiresAt } = activateSubscription({
      address,
      paidTxHash: txHash,
      plan: 'pro',
    })

    return res.json({
      status: 'activated',
      apiKey,
      expiresAt: new Date(expiresAt).toISOString(),
      plan: 'pro',
      message: 'Subscription activated! Use your API key in the Authorization header.'
    })

  } catch (err) {
    console.error('Payment verification error:', err)
    return res.status(500).json({ error: 'Failed to verify payment' })
  }
})

// GET /api/payments/status/:address - Check subscription status
router.get('/status/:address', (req: Request, res: Response) => {
  const address = req.params.address.toLowerCase()
  const sub = getSubscriptionByAddress(address)
  
  if (!sub) {
    return res.json({ status: 'inactive', message: 'No active subscription' })
  }
  
  if (sub.expires_at < Date.now()) {
    return res.json({ status: 'expired', expiresAt: new Date(sub.expires_at).toISOString() })
  }
  
  return res.json({
    status: 'active',
    plan: sub.plan,
    expiresAt: new Date(sub.expires_at).toISOString(),
    apiKey: sub.api_key.slice(0, 8) + '...'
  })
})

// Middleware: validate API key
export function requireApiKey(req: Request, res: Response, next: Function) {
  // Allow demo mode without API key for /api/safe and /api/health
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer sg_')) {
    return res.status(401).json({ error: 'Valid API key required. Get one at supersandguard.com' })
  }
  
  const apiKey = authHeader.replace('Bearer ', '')
  const sub = getSubscriptionByApiKey(apiKey)
  
  if (!sub) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  
  if (sub.expires_at < Date.now()) {
    return res.status(403).json({ error: 'Subscription expired. Please renew.' })
  }
  
  ;(req as any).subscription = sub
  next()
}

// POST /api/payments/activate - Activate subscription after Daimo payment
router.post('/activate', async (req: Request, res: Response) => {
  const { address, paymentId } = req.body
  
  if (!address || !paymentId) {
    return res.status(400).json({ error: 'address and paymentId are required' })
  }

  try {
    // Check if already activated via this payment ID
    const existing = getSubscriptionByAddress(address)
    if (existing && existing.paid_tx_hash === paymentId && existing.expires_at > Date.now()) {
      return res.json({
        status: 'active',
        apiKey: existing.api_key,
        expiresAt: new Date(existing.expires_at).toISOString(),
        message: 'Subscription already active'
      })
    }

    // For Daimo payments, we expect the webhook to have already activated the subscription
    // This endpoint is just for the frontend to retrieve the API key after payment
    const subscription = getSubscriptionByAddress(address)
    
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found. Payment may still be processing.' })
    }
    
    if (subscription.expires_at <= Date.now()) {
      return res.status(403).json({ error: 'Subscription expired' })
    }
    
    return res.json({
      status: 'active',
      apiKey: subscription.api_key,
      expiresAt: new Date(subscription.expires_at).toISOString(),
      plan: subscription.plan,
      message: 'Subscription activated successfully'
    })

  } catch (err) {
    console.error('Payment activation error:', err)
    return res.status(500).json({ error: 'Failed to activate payment' })
  }
})

export default router
