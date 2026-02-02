import { Router, Request, Response } from 'express'
import {
  getFounderStatus,
  getFounderByAddress,
  getFounderByNumber,
  getAllFounders,
  getFounderProgress,
  updateFounderProgress,
  claimFounderSpot,
  updateFounderProfileInfo,
  getSubscriptionByApiKey,
  getSubscriptionByAddress,
  FOUNDER_CAP,
  GENESIS_10_CAP,
  type Founder,
  type FounderProgress,
  type Subscription,
} from '../services/db'

const router = Router()

// ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────────

/**
 * GET /api/founders/status
 * Public: How many spots remain?
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = getFounderStatus()
  return res.json(status)
})

/**
 * GET /api/founders
 * Public: The founders roster (public info only)
 */
router.get('/', (_req: Request, res: Response) => {
  const founders = getAllFounders()
  const status = getFounderStatus()
  return res.json({
    ...status,
    founders: founders.map(f => ({
      number: f.founder_number,
      displayName: f.display_name || `Founder #${f.founder_number}`,
      twitterHandle: f.twitter_handle || null,
      moltbookUsername: f.moltbook_username || null,
      isGenesis10: !!f.is_genesis_10,
      nftMinted: !!f.nft_minted,
      joinedAt: f.qualified_at ? new Date(f.qualified_at).toISOString() : null,
    })),
  })
})

/**
 * GET /api/founders/:number
 * Public: Single founder profile
 */
router.get('/:number', (req: Request, res: Response) => {
  const num = parseInt(req.params.number, 10)
  if (isNaN(num) || num < 1 || num > FOUNDER_CAP) {
    return res.status(400).json({ error: 'Invalid founder number. Must be 1-100.' })
  }

  const founder = getFounderByNumber(num)
  if (!founder) {
    return res.status(404).json({ error: `Founder #${num} has not been claimed yet.` })
  }

  return res.json({
    number: founder.founder_number,
    displayName: founder.display_name || `Founder #${founder.founder_number}`,
    address: founder.address.slice(0, 6) + '...' + founder.address.slice(-4),
    twitterHandle: founder.twitter_handle || null,
    moltbookUsername: founder.moltbook_username || null,
    isGenesis10: !!founder.is_genesis_10,
    nftMinted: !!founder.nft_minted,
    umbraAllocated: founder.umbra_allocated,
    joinedAt: new Date(founder.qualified_at).toISOString(),
  })
})

// ─── AUTHENTICATED ENDPOINTS ────────────────────────────────────────────────

/**
 * Extract subscription from Authorization header
 */
function getAuthSub(req: Request): Subscription | null {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer sg_')) return null
  const apiKey = authHeader.replace('Bearer ', '')
  const sub = getSubscriptionByApiKey(apiKey)
  if (!sub || sub.expires_at < Date.now()) return null
  return sub
}

/**
 * GET /api/founders/progress/me
 * Authenticated: Check your qualification progress
 */
router.get('/progress/me', (req: Request, res: Response) => {
  const sub = getAuthSub(req)
  if (!sub) {
    return res.status(401).json({ error: 'API key required in Authorization header' })
  }

  const progress = getFounderProgress(sub.address)
  const existingFounder = getFounderByAddress(sub.address)

  if (existingFounder) {
    return res.json({
      status: 'founder',
      founderNumber: existingFounder.founder_number,
      isGenesis10: !!existingFounder.is_genesis_10,
      message: `You are Founder #${existingFounder.founder_number}!`,
    })
  }

  if (!progress) {
    return res.json({
      status: 'not_started',
      requirements: {
        accountCreated: true, // they have an API key so account exists
        safeConfigured: false,
        txsAnalyzed: { current: 0, required: 3 },
        daysActive: { current: 0, required: 7 },
      },
      qualified: false,
      spotsRemaining: getFounderStatus().remaining,
    })
  }

  return res.json({
    status: progress.qualified ? 'qualified' : 'in_progress',
    requirements: {
      accountCreated: true,
      safeConfigured: !!progress.safe_configured,
      txsAnalyzed: { current: progress.txs_analyzed, required: 3 },
      daysActive: { current: progress.days_active, required: 7 },
      fastTracked: !!progress.fast_tracked,
    },
    qualified: !!progress.qualified,
    qualifiedAt: progress.qualified_at ? new Date(progress.qualified_at).toISOString() : null,
    spotsRemaining: getFounderStatus().remaining,
  })
})

/**
 * POST /api/founders/claim
 * Authenticated: Claim a founder spot (must be qualified or provide payment)
 */
router.post('/claim', async (req: Request, res: Response) => {
  const sub = getAuthSub(req)
  if (!sub) {
    return res.status(401).json({ error: 'API key required in Authorization header' })
  }

  const { displayName, txHash, fastTrack } = req.body || {}

  // If fast-tracking with payment, verify the tx on Base
  if (fastTrack && txHash) {
    try {
      const verified = await verifyPaymentTx(txHash, sub.address)
      if (!verified.ok) {
        return res.status(400).json({ error: verified.error })
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to verify payment transaction' })
    }
  }

  const result = claimFounderSpot({
    address: sub.address,
    displayName,
    txHash,
    fastTrack: !!fastTrack,
  })

  if ('error' in result) {
    return res.status(400).json({ error: result.error })
  }

  return res.json({
    status: 'claimed',
    founderNumber: result.founder.founder_number,
    isGenesis10: !!result.founder.is_genesis_10,
    umbraAllocated: result.founder.umbra_allocated,
    apiKey: result.apiKey,
    plan: 'founder',
    message: `🛡️ Welcome, Founder #${result.founder.founder_number}! You now have lifetime Pro access.`,
  })
})

/**
 * PUT /api/founders/profile
 * Authenticated: Update your founder profile
 */
router.put('/profile', (req: Request, res: Response) => {
  const sub = getAuthSub(req)
  if (!sub) {
    return res.status(401).json({ error: 'API key required in Authorization header' })
  }

  const founder = getFounderByAddress(sub.address)
  if (!founder) {
    return res.status(403).json({ error: 'You are not a founder' })
  }

  const { displayName, twitterHandle, moltbookUsername } = req.body || {}

  const updated = updateFounderProfileInfo(founder.founder_number, sub.address, {
    displayName,
    twitterHandle,
    moltbookUsername,
  })

  if (!updated) {
    return res.status(500).json({ error: 'Failed to update profile' })
  }

  return res.json({
    status: 'updated',
    founderNumber: founder.founder_number,
    message: 'Founder profile updated successfully',
  })
})

/**
 * GET /api/founders/metadata/:number
 * Public: ERC-721 compatible NFT metadata endpoint
 */
router.get('/metadata/:number', (req: Request, res: Response) => {
  const num = parseInt(req.params.number, 10)
  if (isNaN(num) || num < 1 || num > FOUNDER_CAP) {
    return res.status(400).json({ error: 'Invalid founder number' })
  }

  const founder = getFounderByNumber(num)
  if (!founder) {
    return res.status(404).json({ error: 'Token does not exist' })
  }

  // ERC-721 metadata standard
  return res.json({
    name: `SandGuard Founder #${num}`,
    description: `One of ${FOUNDER_CAP} founding members of SandGuard — the transaction firewall for Safe multisig wallets. This pass grants lifetime Pro access, governance rights, and permanent Founder status.`,
    image: `https://supersandguard.com/founders/nft/${num}.png`,
    external_url: `https://supersandguard.com/founders/${num}`,
    attributes: [
      { trait_type: 'Founder Number', value: num, display_type: 'number' },
      { trait_type: 'Tier', value: founder.is_genesis_10 ? 'Genesis 10' : 'Founder' },
      { trait_type: 'Genesis 10', value: founder.is_genesis_10 ? 'Yes' : 'No' },
      { trait_type: 'Join Date', value: new Date(founder.qualified_at).toISOString().split('T')[0] },
      { trait_type: 'UMBRA Allocated', value: founder.umbra_allocated, display_type: 'number' },
    ],
  })
})

// ─── HELPERS ────────────────────────────────────────────────────────────────

const PAYMENT_WALLET = '0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84'
const MIN_PAYMENT_WEI = BigInt('3000000000000000') // ~$20 at ~$6k ETH

/**
 * Verify a payment transaction on Base chain for fast-track qualification
 */
async function verifyPaymentTx(txHash: string, address: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const basescanUrl = `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
    const response = await fetch(basescanUrl)
    const data = await response.json() as { result?: { to?: string; from?: string; value: string } }

    if (!data.result) {
      return { ok: false, error: 'Transaction not found on Base chain' }
    }

    const tx = data.result
    const toAddress = tx.to?.toLowerCase()
    const fromAddress = tx.from?.toLowerCase()

    if (toAddress !== PAYMENT_WALLET.toLowerCase()) {
      return { ok: false, error: 'Transaction recipient does not match payment wallet' }
    }

    if (fromAddress !== address.toLowerCase()) {
      return { ok: false, error: 'Transaction sender does not match your address' }
    }

    const valueWei = BigInt(tx.value)
    if (valueWei < MIN_PAYMENT_WEI) {
      return { ok: false, error: 'Payment amount too low. Minimum ~$20 in ETH required.' }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'Failed to verify transaction on Base chain' }
  }
}

export default router
