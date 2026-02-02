import { Router, Request, Response } from 'express'
import {
  activateSubscription,
  getSubscriptionByAddress,
  getSubscriptionByApiKey,
  logApiUsage,
  getApiUsageCount,
  PLAN_LIMITS,
  PlanTier,
  Subscription
} from '../services/db'

const router = Router()

const PAYMENT_WALLET = '0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84'
const MONTHLY_PRICE_USD = 20
const FREE_TIER_DURATION_MS = 100 * 365 * 24 * 60 * 60 * 1000 // ~100 years (never expires)

// ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────────

// GET /api/payments/info
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    wallet: PAYMENT_WALLET,
    chain: 'base',
    chainId: 8453,
    monthlyPriceUsd: MONTHLY_PRICE_USD,
    acceptedTokens: ['ETH'],
    tiers: {
      scout: { price: 0, name: 'Scout (Free)' },
      pro: { price: 20, name: 'Pro' },
      founder: { price: 0, name: 'Founder (Lifetime)', note: 'Earned through the Founders Program — not purchasable directly' },
    },
    instructions: `Send $${MONTHLY_PRICE_USD} worth of ETH to ${PAYMENT_WALLET} on Base for Pro plan. Or start free at POST /api/payments/free.`
  })
})

// POST /api/payments/free — Create free Scout account
router.post('/free', (req: Request, res: Response) => {
  const { address, email } = req.body

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' })
  }

  if (!/^0x[a-fA-F0-9]{40}$/i.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' })
  }

  // If already has an active subscription, return it (don't downgrade Pro→Scout)
  const existing = getSubscriptionByAddress(address)
  if (existing && existing.expires_at > Date.now()) {
    return res.json({
      status: 'active',
      apiKey: existing.api_key,
      plan: existing.plan,
      planLimits: PLAN_LIMITS[(existing.plan || 'scout') as PlanTier] || PLAN_LIMITS.scout,
      expiresAt: new Date(existing.expires_at).toISOString(),
      message: existing.plan === 'scout'
        ? 'Free account already exists'
        : `You already have a ${existing.plan} subscription`
    })
  }

  const { apiKey, expiresAt } = activateSubscription({
    address,
    email,
    plan: 'scout',
    durationMs: FREE_TIER_DURATION_MS,
  })

  return res.json({
    status: 'activated',
    apiKey,
    plan: 'scout',
    planLimits: PLAN_LIMITS.scout,
    expiresAt: new Date(expiresAt).toISOString(),
    message: 'Free Scout account activated!'
  })
})

// GET /api/payments/me — Current plan info (requires API key in header)
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer sg_')) {
    return res.status(401).json({ error: 'API key required in Authorization header' })
  }

  const apiKey = authHeader.replace('Bearer ', '')
  const sub = getSubscriptionByApiKey(apiKey)

  if (!sub) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  if (sub.expires_at < Date.now()) {
    return res.status(403).json({ error: 'Subscription expired' })
  }

  const plan = (sub.plan || 'scout') as PlanTier
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.scout
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayUsage = getApiUsageCount(apiKey, todayStart.getTime())

  return res.json({
    plan,
    planLimits: limits,
    todayUsage,
    dailyLimit: limits.dailyApiCalls,
    expiresAt: new Date(sub.expires_at).toISOString(),
    address: sub.address,
  })
})

// POST /api/payments/verify — Verify on-chain payment and issue API key
router.post('/verify', async (req: Request, res: Response) => {
  const { txHash, address } = req.body

  if (!txHash || !address) {
    return res.status(400).json({ error: 'txHash and address are required' })
  }

  try {
    const existing = getSubscriptionByAddress(address)
    if (existing && existing.expires_at > Date.now()) {
      return res.json({
        status: 'active',
        apiKey: existing.api_key,
        plan: existing.plan,
        expiresAt: new Date(existing.expires_at).toISOString(),
        message: 'Subscription already active'
      })
    }

    const basescanUrl = `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
    const response = await fetch(basescanUrl)
    const data = await response.json()

    if (!data.result) {
      return res.status(400).json({ error: 'Transaction not found on Base chain' })
    }

    const tx = data.result
    const toAddress = tx.to?.toLowerCase()
    const fromAddress = tx.from?.toLowerCase()

    if (toAddress !== PAYMENT_WALLET.toLowerCase()) {
      return res.status(400).json({ error: 'Transaction recipient does not match payment wallet' })
    }

    if (fromAddress !== address.toLowerCase()) {
      return res.status(400).json({ error: 'Transaction sender does not match provided address' })
    }

    const valueWei = BigInt(tx.value)
    const minWei = BigInt('3000000000000000')

    if (valueWei < minWei) {
      return res.status(400).json({ error: 'Payment amount too low. Minimum ~$20 in ETH required.' })
    }

    const { apiKey, expiresAt } = activateSubscription({
      address,
      paidTxHash: txHash,
      plan: 'pro',
    })

    return res.json({
      status: 'activated',
      apiKey,
      plan: 'pro',
      expiresAt: new Date(expiresAt).toISOString(),
      message: 'Pro subscription activated!'
    })
  } catch (err) {
    console.error('Payment verification error:', err)
    return res.status(500).json({ error: 'Failed to verify payment' })
  }
})

// GET /api/payments/status/:address
router.get('/status/:address', (req: Request, res: Response) => {
  const address = req.params.address.toLowerCase()
  const sub = getSubscriptionByAddress(address)

  if (!sub) {
    return res.json({ status: 'inactive', message: 'No active subscription' })
  }

  if (sub.expires_at < Date.now()) {
    return res.json({ status: 'expired', expiresAt: new Date(sub.expires_at).toISOString() })
  }

  const plan = (sub.plan || 'scout') as PlanTier
  return res.json({
    status: 'active',
    plan,
    planLimits: PLAN_LIMITS[plan] || PLAN_LIMITS.scout,
    expiresAt: new Date(sub.expires_at).toISOString(),
    apiKey: sub.api_key.slice(0, 8) + '...'
  })
})

// POST /api/payments/recover
router.post('/recover', (req: Request, res: Response) => {
  const { address } = req.body

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' })
  }

  const sub = getSubscriptionByAddress(address.toLowerCase())

  if (!sub) {
    return res.status(404).json({ error: 'No subscription found for this address' })
  }

  if (sub.expires_at < Date.now()) {
    return res.status(403).json({ error: 'Subscription expired. Please renew.' })
  }

  return res.json({
    status: 'active',
    apiKey: sub.api_key,
    plan: sub.plan,
    planLimits: PLAN_LIMITS[(sub.plan || 'scout') as PlanTier] || PLAN_LIMITS.scout,
    expiresAt: new Date(sub.expires_at).toISOString(),
    message: 'Subscription recovered successfully'
  })
})

// POST /api/payments/activate — After Daimo payment
router.post('/activate', async (req: Request, res: Response) => {
  const { address, paymentId } = req.body

  if (!address || !paymentId) {
    return res.status(400).json({ error: 'address and paymentId are required' })
  }

  try {
    const existing = getSubscriptionByAddress(address)
    if (existing && existing.paid_tx_hash === paymentId && existing.expires_at > Date.now()) {
      return res.json({
        status: 'active',
        apiKey: existing.api_key,
        plan: existing.plan,
        expiresAt: new Date(existing.expires_at).toISOString(),
        message: 'Subscription already active'
      })
    }

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
      plan: subscription.plan,
      expiresAt: new Date(subscription.expires_at).toISOString(),
      message: 'Subscription activated successfully'
    })
  } catch (err) {
    console.error('Payment activation error:', err)
    return res.status(500).json({ error: 'Failed to activate payment' })
  }
})

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────

const PLAN_HIERARCHY: Record<string, number> = { scout: 0, pro: 1, founder: 2 }

/**
 * Track API usage and enforce plan-based daily rate limits.
 * No API key → pass through (demo / unauthenticated).
 */
export function trackApiUsage(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer sg_')) {
    return next() // No key = demo mode, let through
  }

  const apiKey = authHeader.replace('Bearer ', '')
  const sub = getSubscriptionByApiKey(apiKey)

  if (!sub) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  if (sub.expires_at < Date.now()) {
    return res.status(403).json({ error: 'Subscription expired. Renew at supersandguard.com' })
  }

  // Enforce daily rate limit
  const plan = (sub.plan || 'scout') as PlanTier
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.scout

  if (limits.dailyApiCalls !== -1) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const usageCount = getApiUsageCount(apiKey, todayStart.getTime())

    if (usageCount >= limits.dailyApiCalls) {
      return res.status(429).json({
        error: `Daily API limit reached (${limits.dailyApiCalls}/day on ${plan} plan).${plan === 'scout' ? ' Upgrade to Pro for 1,000 calls/day.' : ''}`,
        plan,
        limit: limits.dailyApiCalls,
        used: usageCount,
      })
    }
  }

  logApiUsage(apiKey, req.originalUrl || req.path)
  ;(req as any).subscription = sub
  next()
}

/**
 * Require a minimum plan level. Must come AFTER trackApiUsage.
 */
export function requirePlan(minPlan: string) {
  const minLevel = PLAN_HIERARCHY[minPlan] ?? 1

  return (req: Request, res: Response, next: Function) => {
    const sub = (req as any).subscription as Subscription | undefined

    if (!sub) {
      return res.status(401).json({
        error: 'API key required. Get a free key at supersandguard.com',
        upgradeUrl: 'https://supersandguard.com/login',
      })
    }

    const userLevel = PLAN_HIERARCHY[sub.plan] ?? 0

    if (userLevel < minLevel) {
      return res.status(403).json({
        error: `This feature requires the ${minPlan} plan. You're on the ${sub.plan} plan. Upgrade at supersandguard.com`,
        currentPlan: sub.plan,
        requiredPlan: minPlan,
      })
    }

    next()
  }
}

/**
 * Require any valid API key (backward compat).
 */
export function requireApiKey(req: Request, res: Response, next: Function) {
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

export default router