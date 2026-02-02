import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// DB file lives alongside the backend
const DB_DIR = process.env.SANDGUARD_DATA_DIR || path.join(__dirname, '..', '..', 'data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const DB_PATH = path.join(DB_DIR, 'sandguard.db')
const db = new Database(DB_PATH)

// WAL mode for better concurrent reads
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL UNIQUE,
    email TEXT,
    api_key TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'pro',
    paid_tx_hash TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    paid_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_subs_api_key ON subscriptions(api_key);
  CREATE INDEX IF NOT EXISTS idx_subs_email ON subscriptions(email);
  CREATE INDEX IF NOT EXISTS idx_subs_stripe_customer ON subscriptions(stripe_customer_id);

  CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    response_ms INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_usage_key_ts ON api_usage(api_key, timestamp);

  CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'pro',
    duration_days INTEGER NOT NULL DEFAULT 90,
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS promo_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    address TEXT NOT NULL,
    redeemed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    UNIQUE(code, address)
  );

  -- Founders Program: The First 100
  CREATE TABLE IF NOT EXISTS founders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_number INTEGER NOT NULL UNIQUE CHECK(founder_number >= 1 AND founder_number <= 100),
    address TEXT NOT NULL UNIQUE,
    display_name TEXT,
    twitter_handle TEXT,
    moltbook_username TEXT,
    nft_minted INTEGER NOT NULL DEFAULT 0,
    nft_tx_hash TEXT,
    qualified_at INTEGER NOT NULL,
    is_genesis_10 INTEGER NOT NULL DEFAULT 0,
    umbra_allocated INTEGER NOT NULL DEFAULT 0,
    umbra_claimed INTEGER NOT NULL DEFAULT 0,
    referral_code TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_founders_address ON founders(address);
  CREATE INDEX IF NOT EXISTS idx_founders_number ON founders(founder_number);

  -- Track founder qualification progress
  CREATE TABLE IF NOT EXISTS founder_progress (
    address TEXT PRIMARY KEY,
    account_created_at INTEGER,
    safe_configured INTEGER NOT NULL DEFAULT 0,
    safe_address TEXT,
    txs_analyzed INTEGER NOT NULL DEFAULT 0,
    first_analysis_at INTEGER,
    days_active INTEGER NOT NULL DEFAULT 0,
    fast_tracked INTEGER NOT NULL DEFAULT 0,
    qualified INTEGER NOT NULL DEFAULT 0,
    qualified_at INTEGER,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`)

// Prepared statements
const stmts = {
  upsertSub: db.prepare(`
    INSERT INTO subscriptions (address, email, api_key, plan, paid_tx_hash, stripe_customer_id, stripe_subscription_id, paid_at, expires_at, updated_at)
    VALUES (@address, @email, @apiKey, @plan, @paidTxHash, @stripeCustomerId, @stripeSubscriptionId, @paidAt, @expiresAt, @updatedAt)
    ON CONFLICT(address) DO UPDATE SET
      api_key = @apiKey,
      plan = @plan,
      paid_tx_hash = COALESCE(@paidTxHash, paid_tx_hash),
      stripe_customer_id = COALESCE(@stripeCustomerId, stripe_customer_id),
      stripe_subscription_id = COALESCE(@stripeSubscriptionId, stripe_subscription_id),
      paid_at = @paidAt,
      expires_at = @expiresAt,
      updated_at = @updatedAt
  `),

  getByAddress: db.prepare('SELECT * FROM subscriptions WHERE address = ?'),
  getByApiKey: db.prepare('SELECT * FROM subscriptions WHERE api_key = ?'),
  getByEmail: db.prepare('SELECT * FROM subscriptions WHERE email = ?'),
  getByStripeCustomer: db.prepare('SELECT * FROM subscriptions WHERE stripe_customer_id = ?'),
  getByStripeSubscription: db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?'),

  deactivate: db.prepare('UPDATE subscriptions SET expires_at = ?, updated_at = ? WHERE stripe_subscription_id = ?'),

  logUsage: db.prepare('INSERT INTO api_usage (api_key, endpoint, timestamp, response_ms) VALUES (?, ?, ?, ?)'),
  
  getUsage: db.prepare('SELECT COUNT(*) as count FROM api_usage WHERE api_key = ? AND timestamp > ?'),

  getAllActive: db.prepare('SELECT * FROM subscriptions WHERE expires_at > ?'),

  // Promo codes
  insertPromo: db.prepare('INSERT OR IGNORE INTO promo_codes (code, plan, duration_days, max_uses) VALUES (?, ?, ?, ?)'),
  getPromo: db.prepare('SELECT * FROM promo_codes WHERE code = ? AND active = 1'),
  incrementPromoUse: db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?'),
  insertRedemption: db.prepare('INSERT INTO promo_redemptions (code, address, redeemed_at) VALUES (?, ?, ?)'),
  getRedemption: db.prepare('SELECT * FROM promo_redemptions WHERE code = ? AND address = ?'),
  getAllPromos: db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC'),

  // Founders program
  getFounderCount: db.prepare('SELECT COUNT(*) as count FROM founders'),
  getNextFounderNumber: db.prepare('SELECT COALESCE(MAX(founder_number), 0) + 1 as next FROM founders'),
  getFounderByAddress: db.prepare('SELECT * FROM founders WHERE address = ?'),
  getFounderByNumber: db.prepare('SELECT * FROM founders WHERE founder_number = ?'),
  getAllFounders: db.prepare('SELECT founder_number, address, display_name, twitter_handle, moltbook_username, is_genesis_10, nft_minted, qualified_at, created_at FROM founders ORDER BY founder_number ASC'),
  insertFounder: db.prepare(`
    INSERT INTO founders (founder_number, address, display_name, qualified_at, is_genesis_10, umbra_allocated, created_at)
    VALUES (@founderNumber, @address, @displayName, @qualifiedAt, @isGenesis10, @umbraAllocated, @createdAt)
  `),
  updateFounderProfile: db.prepare(`
    UPDATE founders SET display_name = @displayName, twitter_handle = @twitterHandle, moltbook_username = @moltbookUsername
    WHERE founder_number = @founderNumber AND address = @address
  `),
  updateFounderNft: db.prepare('UPDATE founders SET nft_minted = 1, nft_tx_hash = ? WHERE founder_number = ?'),

  // Founder progress tracking
  getFounderProgress: db.prepare('SELECT * FROM founder_progress WHERE address = ?'),
  upsertFounderProgress: db.prepare(`
    INSERT INTO founder_progress (address, account_created_at, safe_configured, safe_address, txs_analyzed, first_analysis_at, days_active, fast_tracked, qualified, qualified_at, updated_at)
    VALUES (@address, @accountCreatedAt, @safeConfigured, @safeAddress, @txsAnalyzed, @firstAnalysisAt, @daysActive, @fastTracked, @qualified, @qualifiedAt, @updatedAt)
    ON CONFLICT(address) DO UPDATE SET
      safe_configured = @safeConfigured,
      safe_address = COALESCE(@safeAddress, safe_address),
      txs_analyzed = @txsAnalyzed,
      first_analysis_at = COALESCE(@firstAnalysisAt, first_analysis_at),
      days_active = @daysActive,
      fast_tracked = @fastTracked,
      qualified = @qualified,
      qualified_at = COALESCE(@qualifiedAt, qualified_at),
      updated_at = @updatedAt
  `),
}

// Plan tiers
export type PlanTier = 'scout' | 'pro' | 'founder'

// Plan limits
export const PLAN_LIMITS: Record<PlanTier, { safes: number; dailyApiCalls: number; features: string[] }> = {
  scout: { safes: 1, dailyApiCalls: 10, features: ['decode'] },
  pro: { safes: 5, dailyApiCalls: 1000, features: ['decode', 'simulate', 'risk', 'explain', 'alerts'] },
  founder: { safes: 10, dailyApiCalls: 5000, features: ['decode', 'simulate', 'risk', 'explain', 'alerts', 'early_access', 'governance'] },
}

// Helper functions
const API_KEY_PREFIX = 'sg_'
function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let key = API_KEY_PREFIX
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  return key
}

export interface Subscription {
  id: number
  address: string
  email: string | null
  api_key: string
  plan: string
  paid_tx_hash: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  paid_at: number
  expires_at: number
  created_at: number
  updated_at: number
}

export function activateSubscription(opts: {
  address: string
  email?: string
  paidTxHash?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  plan?: string
  durationMs?: number
}): { apiKey: string; expiresAt: number } {
  const now = Date.now()
  const thirtyDays = opts.durationMs || 30 * 24 * 60 * 60 * 1000
  const expiresAt = now + thirtyDays
  
  // Check existing — reuse API key if active
  const existing = stmts.getByAddress.get(opts.address.toLowerCase()) as Subscription | undefined
  const apiKey = existing?.api_key || generateApiKey()

  stmts.upsertSub.run({
    address: opts.address.toLowerCase(),
    email: opts.email || null,
    apiKey,
    plan: opts.plan || 'pro',
    paidTxHash: opts.paidTxHash || null,
    stripeCustomerId: opts.stripeCustomerId || null,
    stripeSubscriptionId: opts.stripeSubscriptionId || null,
    paidAt: now,
    expiresAt,
    updatedAt: now,
  })

  return { apiKey, expiresAt }
}

export function getSubscriptionByAddress(address: string): Subscription | undefined {
  return stmts.getByAddress.get(address.toLowerCase()) as Subscription | undefined
}

export function getSubscriptionByApiKey(apiKey: string): Subscription | undefined {
  return stmts.getByApiKey.get(apiKey) as Subscription | undefined
}

export function getSubscriptionByEmail(email: string): Subscription | undefined {
  return stmts.getByEmail.get(email.toLowerCase()) as Subscription | undefined
}

export function getSubscriptionByStripeCustomer(customerId: string): Subscription | undefined {
  return stmts.getByStripeCustomer.get(customerId) as Subscription | undefined
}

export function deactivateByStripeSubscription(subscriptionId: string): void {
  const now = Date.now()
  stmts.deactivate.run(now, now, subscriptionId)
}

export function logApiUsage(apiKey: string, endpoint: string, responseMs?: number): void {
  stmts.logUsage.run(apiKey, endpoint, Date.now(), responseMs || null)
}

export function getApiUsageCount(apiKey: string, sinceMs: number): number {
  const result = stmts.getUsage.get(apiKey, sinceMs) as { count: number }
  return result.count
}

export function getAllActiveSubscriptions(): Subscription[] {
  return stmts.getAllActive.all(Date.now()) as Subscription[]
}

// Promo code functions
export interface PromoCode {
  code: string
  plan: string
  duration_days: number
  max_uses: number
  used_count: number
  created_at: number
  active: number
}

export function createPromoCode(code: string, durationDays = 90, maxUses = 1, plan = 'pro'): void {
  stmts.insertPromo.run(code, plan, durationDays, maxUses)
}

export function redeemPromoCode(code: string, address: string): { apiKey: string; expiresAt: number } | { error: string } {
  const promo = stmts.getPromo.get(code) as PromoCode | undefined
  if (!promo) return { error: 'Invalid or expired promo code' }
  if (promo.used_count >= promo.max_uses) return { error: 'Promo code has been fully redeemed' }
  
  // Check if already redeemed by this address
  const existing = stmts.getRedemption.get(code, address.toLowerCase())
  if (existing) return { error: 'You have already redeemed this code' }

  // Activate subscription
  const durationMs = promo.duration_days * 24 * 60 * 60 * 1000
  const result = activateSubscription({
    address,
    plan: promo.plan,
    paidTxHash: `promo:${code}`,
    durationMs,
  })

  // Record redemption
  stmts.incrementPromoUse.run(code)
  stmts.insertRedemption.run(code, address.toLowerCase(), Date.now())

  return result
}

export function getAllPromoCodes(): PromoCode[] {
  return stmts.getAllPromos.all() as PromoCode[]
}

// Free tier signup
export function createFreeSubscription(address: string): { apiKey: string; plan: string } {
  const addr = address.toLowerCase()
  // Check if already has active subscription
  const existing = stmts.getByAddress.get(addr) as Subscription | undefined
  if (existing && (existing.expires_at > Date.now() || existing.plan === 'scout')) {
    return { apiKey: existing.api_key, plan: existing.plan }
  }

  const apiKey = 'sg_' + crypto.randomUUID().replace(/-/g, '')
  stmts.upsertSub.run({
    address: addr,
    email: null,
    apiKey,
    plan: 'scout',
    paidTxHash: 'free:scout',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    paidAt: Date.now(),
    expiresAt: 9999999999999,
    updatedAt: Date.now(),
  })
  return { apiKey, plan: 'scout' }
}

// ─── Founders Program ──────────────────────────────────────────────────────

export const FOUNDER_CAP = 100
export const GENESIS_10_CAP = 10
const FOUNDER_LIFETIME_MS = 100 * 365 * 24 * 60 * 60 * 1000 // ~100 years

export interface Founder {
  id: number
  founder_number: number
  address: string
  display_name: string | null
  twitter_handle: string | null
  moltbook_username: string | null
  nft_minted: number
  nft_tx_hash: string | null
  qualified_at: number
  is_genesis_10: number
  umbra_allocated: number
  umbra_claimed: number
  referral_code: string | null
  created_at: number
}

export interface FounderProgress {
  address: string
  account_created_at: number | null
  safe_configured: number
  safe_address: string | null
  txs_analyzed: number
  first_analysis_at: number | null
  days_active: number
  fast_tracked: number
  qualified: number
  qualified_at: number | null
  updated_at: number
}

export interface FounderStatus {
  total: number
  remaining: number
  cap: number
  genesis10Remaining: number
  closed: boolean
}

export function getFounderStatus(): FounderStatus {
  const { count } = stmts.getFounderCount.get() as { count: number }
  const genesis10Count = (db.prepare('SELECT COUNT(*) as count FROM founders WHERE is_genesis_10 = 1').get() as { count: number }).count
  return {
    total: count,
    remaining: Math.max(0, FOUNDER_CAP - count),
    cap: FOUNDER_CAP,
    genesis10Remaining: Math.max(0, GENESIS_10_CAP - genesis10Count),
    closed: count >= FOUNDER_CAP,
  }
}

export function getFounderByAddress(address: string): Founder | undefined {
  return stmts.getFounderByAddress.get(address.toLowerCase()) as Founder | undefined
}

export function getFounderByNumber(num: number): Founder | undefined {
  return stmts.getFounderByNumber.get(num) as Founder | undefined
}

export function getAllFounders(): Partial<Founder>[] {
  return stmts.getAllFounders.all() as Partial<Founder>[]
}

export function getFounderProgress(address: string): FounderProgress | undefined {
  return stmts.getFounderProgress.get(address.toLowerCase()) as FounderProgress | undefined
}

export function updateFounderProgress(address: string, updates: Partial<{
  safeConfigured: boolean
  safeAddress: string
  txsAnalyzed: number
  daysActive: number
  fastTracked: boolean
}>): FounderProgress {
  const addr = address.toLowerCase()
  const existing = getFounderProgress(addr)
  const now = Date.now()

  const data = {
    address: addr,
    accountCreatedAt: existing?.account_created_at || now,
    safeConfigured: updates.safeConfigured !== undefined ? (updates.safeConfigured ? 1 : 0) : (existing?.safe_configured || 0),
    safeAddress: updates.safeAddress || existing?.safe_address || null,
    txsAnalyzed: updates.txsAnalyzed !== undefined ? updates.txsAnalyzed : (existing?.txs_analyzed || 0),
    firstAnalysisAt: existing?.first_analysis_at || ((updates.txsAnalyzed && updates.txsAnalyzed > 0) ? now : null),
    daysActive: updates.daysActive !== undefined ? updates.daysActive : (existing?.days_active || 0),
    fastTracked: updates.fastTracked !== undefined ? (updates.fastTracked ? 1 : 0) : (existing?.fast_tracked || 0),
    qualified: existing?.qualified || 0,
    qualifiedAt: existing?.qualified_at || null,
    updatedAt: now,
  }

  // Check qualification: safe configured + 3 txs + 7 days active (or fast-tracked)
  if (!data.qualified) {
    const meetsRequirements = data.safeConfigured === 1
      && data.txsAnalyzed >= 3
      && (data.daysActive >= 7 || data.fastTracked === 1)

    if (meetsRequirements) {
      data.qualified = 1
      data.qualifiedAt = now
    }
  }

  stmts.upsertFounderProgress.run(data)
  return stmts.getFounderProgress.get(addr) as FounderProgress
}

/**
 * Claim a founder spot. Returns the founder record or an error.
 * Requires payment verification (txHash) for fast-track, or the address
 * must already be qualified via the progress system.
 */
export function claimFounderSpot(opts: {
  address: string
  displayName?: string
  txHash?: string
  fastTrack?: boolean
}): { founder: Founder; apiKey: string } | { error: string } {
  const addr = opts.address.toLowerCase()
  const status = getFounderStatus()

  // Already a founder?
  const existingFounder = getFounderByAddress(addr)
  if (existingFounder) {
    const sub = getSubscriptionByAddress(addr)
    return { error: `Already a founder (#${existingFounder.founder_number})` }
  }

  // Program closed?
  if (status.closed) {
    return { error: 'The Founders Program is closed. All 100 spots have been claimed.' }
  }

  // Fast-track: payment provides instant qualification
  if (opts.fastTrack && opts.txHash) {
    updateFounderProgress(addr, { fastTracked: true })
  }

  // Check qualification
  const progress = getFounderProgress(addr)
  if (!progress || !progress.qualified) {
    return {
      error: 'Not yet qualified. Configure a Safe, analyze 3 transactions, and stay active for 7 days — or pay $20 for instant qualification.'
    }
  }

  // Assign next founder number (use a transaction for atomicity)
  const assignFounder = db.transaction(() => {
    const { next } = stmts.getNextFounderNumber.get() as { next: number }
    if (next > FOUNDER_CAP) {
      throw new Error('All 100 founder spots have been claimed')
    }

    const now = Date.now()
    const isGenesis10 = next <= GENESIS_10_CAP ? 1 : 0
    const umbraAllocation = isGenesis10 ? 100000 : 50000

    stmts.insertFounder.run({
      founderNumber: next,
      address: addr,
      displayName: opts.displayName || null,
      qualifiedAt: now,
      isGenesis10,
      umbraAllocated: umbraAllocation,
      createdAt: now,
    })

    // Activate lifetime founder subscription
    const subResult = activateSubscription({
      address: addr,
      plan: 'founder',
      paidTxHash: opts.txHash || `founder:${next}`,
      durationMs: FOUNDER_LIFETIME_MS,
    })

    return { founderNumber: next, apiKey: subResult.apiKey }
  })

  try {
    const result = assignFounder()
    const founder = getFounderByAddress(addr)!
    return { founder, apiKey: result.apiKey }
  } catch (err: any) {
    return { error: err.message || 'Failed to claim founder spot' }
  }
}

export function updateFounderProfileInfo(
  founderNumber: number,
  address: string,
  profile: { displayName?: string; twitterHandle?: string; moltbookUsername?: string }
): boolean {
  const result = stmts.updateFounderProfile.run({
    founderNumber,
    address: address.toLowerCase(),
    displayName: profile.displayName || null,
    twitterHandle: profile.twitterHandle || null,
    moltbookUsername: profile.moltbookUsername || null,
  })
  return result.changes > 0
}

// Seed F&F promo codes
const FF_CODES = [
  'SG-B8UK5ILU', 'SG-D5FKT83Y', 'SG-J3H2ZIRX', 'SG-ZNG01TRV', 'SG-E15I1NAD',
  'SG-CSMNWJ8Q', 'SG-VK4NK60X', 'SG-89599Z1I', 'SG-5KPE1GUQ', 'SG-M790M4BY',
  'SG-Z0AAWH7E', 'SG-1CTN5ZKX', 'SG-BZGL7LIO', 'SG-D0R7IJOD', 'SG-9MI8H4B6',
  'SG-KJD5O1TO', 'SG-ICGF1ADP', 'SG-H24EU1GO', 'SG-3SGU7G2N', 'SG-B34VFPD8',
]

for (const code of FF_CODES) {
  createPromoCode(code, 90, 1, 'pro') // 90 days, 1 use each
}

export default db
