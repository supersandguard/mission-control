import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
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
