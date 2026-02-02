# Founders Program — Backend Implementation Summary

**Commit:** `dd5a258` on `main`  
**Date:** 2025-07-18  
**Status:** ✅ Implemented, builds & loads cleanly, not pushed

---

## What Was Implemented

### 1. Database Schema (db.ts)

Two new tables added to SQLite:

**`founders`** — The 100 founders roster
- `founder_number` (1–100, unique, constrained)
- `address` (unique, lowercased)
- `display_name`, `twitter_handle`, `moltbook_username`
- `nft_minted`, `nft_tx_hash` (for future NFT tracking)
- `is_genesis_10` (auto-set for #1–#10)
- `umbra_allocated` (50K standard, 100K for Genesis 10)
- `qualified_at`, `created_at`

**`founder_progress`** — Tracks qualification journey per address
- `safe_configured`, `safe_address`
- `txs_analyzed`, `first_analysis_at`
- `days_active`, `fast_tracked`
- `qualified`, `qualified_at`

### 2. Founder Plan Tier (db.ts)

New `PlanTier` type exported: `'scout' | 'pro' | 'founder'`

```typescript
founder: {
  safes: 10,
  dailyApiCalls: 5000,
  features: ['decode', 'simulate', 'risk', 'explain', 'alerts', 'early_access', 'governance']
}
```

Plan hierarchy updated: `scout: 0, pro: 1, founder: 2`

### 3. API Endpoints (routes/founders.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/founders/status` | Public | Spots remaining, cap, genesis10 remaining, closed flag |
| GET | `/api/founders` | Public | Full roster + status (public info only) |
| GET | `/api/founders/:number` | Public | Single founder profile (truncated address) |
| GET | `/api/founders/progress/me` | API key | Check your qualification progress |
| POST | `/api/founders/claim` | API key | Claim a founder spot (must be qualified or fast-track) |
| PUT | `/api/founders/profile` | API key | Update display name, twitter, moltbook |
| GET | `/api/founders/metadata/:number` | Public | ERC-721 compatible NFT metadata JSON |

### 4. Core Functions (db.ts)

- `getFounderStatus()` → `{ total, remaining, cap, genesis10Remaining, closed }`
- `getFounderByAddress(addr)` / `getFounderByNumber(num)`
- `getAllFounders()` — public roster data
- `getFounderProgress(addr)` — qualification tracking
- `updateFounderProgress(addr, updates)` — auto-checks qualification criteria
- `claimFounderSpot(opts)` — atomic founder assignment with lifetime subscription
- `updateFounderProfileInfo(num, addr, profile)` — update display info

### 5. Qualification Logic

**Standard path (free):**
1. Account exists (has API key) ✓
2. Safe configured (`safe_configured = 1`)
3. 3+ transactions analyzed (`txs_analyzed >= 3`)
4. 7+ days active (`days_active >= 7`)

**Fast-track ($20 payment):**
- POST `/api/founders/claim` with `{ fastTrack: true, txHash: "0x..." }`
- Payment verified on Base chain (same logic as Pro verification)
- Instant qualification bypass

### 6. Lifetime Subscription

When a founder spot is claimed:
- Subscription plan set to `'founder'`
- Duration: ~100 years (effectively forever)
- `paid_tx_hash`: `founder:<number>` or actual tx hash
- All Pro features + `early_access` + `governance`

---

## Files Changed

| File | Changes |
|------|---------|
| `backend/src/services/db.ts` | +2 tables, +PlanTier type, +founder plan limits, +7 founder functions |
| `backend/src/routes/founders.ts` | **NEW** — 7 API endpoints, payment verification helper |
| `backend/src/index.ts` | Import + register `/api/founders` router |
| `backend/src/routes/payments.ts` | Add `founder` to PLAN_HIERARCHY + payment info tiers |
| `backend/src/types/index.ts` | Add FounderProfile, FounderProgressResponse, FounderClaimResponse types |

## What's NOT Implemented Yet

- **Frontend** — `/founders` page, FounderBadge component, landing page counter
- **Progress auto-tracking** — The `days_active` and `txs_analyzed` fields need to be incremented from the existing API middleware (when users call decode/simulate/risk endpoints)
- **NFT minting** — `nft_minted` and `nft_tx_hash` fields exist but the Solidity contract + minting flow is Phase 2
- **$UMBRA vesting** — `umbra_allocated` is tracked but no vesting/claim mechanism
- **Governance** — Snapshot integration is out of scope for this backend impl

## Testing

```bash
# Runtime verification (on Pi — takes ~15s to load tsx)
cd sand/backend
node --import=tsx --eval "
const db = await import('./src/services/db.ts');
console.log('Plans:', Object.keys(db.PLAN_LIMITS));
console.log('Status:', JSON.stringify(db.getFounderStatus()));
process.exit(0);
"
# Output:
# Plans: [ 'scout', 'pro', 'founder' ]  
# Status: {"total":0,"remaining":100,"cap":100,"genesis10Remaining":10,"closed":false}
```

## API Usage Examples

```bash
# Check spots remaining (public)
curl https://supersandguard.com/api/founders/status

# Check your progress (authenticated)
curl -H "Authorization: Bearer sg_yourkey" \
  https://supersandguard.com/api/founders/progress/me

# Claim a spot (after qualifying)
curl -X POST -H "Authorization: Bearer sg_yourkey" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "MaxUmbra"}' \
  https://supersandguard.com/api/founders/claim

# Fast-track with payment
curl -X POST -H "Authorization: Bearer sg_yourkey" \
  -H "Content-Type: application/json" \
  -d '{"fastTrack": true, "txHash": "0x...", "displayName": "MaxUmbra"}' \
  https://supersandguard.com/api/founders/claim

# Get NFT metadata
curl https://supersandguard.com/api/founders/metadata/1
```
