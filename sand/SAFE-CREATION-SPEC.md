# SandGuard: Auto-Create Safe Multisig Wallets

> **Prepared:** February 2, 2026
> **Product:** SandGuard — Transaction Firewall for Safe Multisig Wallets
> **URL:** https://supersandguard.com
> **Status:** DRAFT — Technical Specification

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Proposed Solution](#2-proposed-solution)
3. [User Flow](#3-user-flow)
4. [Technical Architecture](#4-technical-architecture)
5. [Safe Deployment Details](#5-safe-deployment-details)
6. [Owner Handoff Protocol](#6-owner-handoff-protocol)
7. [Security Considerations](#7-security-considerations)
8. [Backend Integration](#8-backend-integration)
9. [Frontend Changes](#9-frontend-changes)
10. [Gas Costs & Economics](#10-gas-costs--economics)
11. [Implementation Phases](#11-implementation-phases)
12. [Open Questions](#12-open-questions)

---

## 1. Problem Statement

**Current state:** SandGuard requires users to already have a Safe multisig wallet. The onboarding flow asks for a "Wallet Address" and expects a valid Safe contract address.

**The problem:**
- Many new users (especially non-crypto-native) don't know what Safe is
- Creating a Safe requires navigating to app.safe.global, connecting a wallet, configuring owners/threshold, and paying gas
- This is a **massive friction point** — users who hear about SandGuard's value prop drop off because they don't have the prerequisite
- SandGuard's agent-first model (Clawdbot manages a Safe for you) means the agent should be able to bootstrap the Safe itself

**The goal:** A new user should go from "I want a secure multisig" to "SandGuard is monitoring my Safe" in under 2 minutes, with zero prior Safe knowledge.

---

## 2. Proposed Solution

SandGuard deploys a Safe programmatically on behalf of the user, then guides them through adding their own hardware wallet signers. The process:

1. **SandGuard creates the Safe** — deploys via Safe's `SafeProxyFactory` on Base (chain ID 8453)
2. **Initial config:** 1-of-1 with SandGuard's deployer as sole owner (temporary)
3. **User adds their signers** — via a link to Safe{Wallet} UI or SandGuard's own interface
4. **Threshold updated** — changes to 2-of-3 (or user-configured) once enough signers are added
5. **SandGuard optionally removed as owner** — or kept as a recovery signer
6. **SandGuard monitors** — begins analyzing all transactions on the new Safe

### Why 1-of-1 Initial Config?

We **cannot** create a 2-of-3 Safe with placeholder addresses. Safe requires all owner addresses to be valid at deployment time, and you can't add a 2-of-3 threshold with only 1 known address. The flow must be:

1. Deploy as 1-of-1 (SandGuard is sole owner)
2. Add user's first signer → becomes 2-of-2 (or keep at 1-of-2)
3. Add user's second signer → becomes 2-of-3

This means **SandGuard briefly has full control of the Safe**. This is addressed in [Security Considerations](#7-security-considerations).

---

## 3. User Flow

### 3.1 Happy Path (Agent-Initiated)

```
User:  "Hey Clawdbot, I want to set up a secure wallet"
Agent: "I'll create a Safe multisig on Base for you. One moment..."
       [deploys Safe via Protocol Kit]
Agent: "Done! Your new Safe is: 0xABC...123
        
        Next step: Add your hardware wallet as a signer.
        Open this link and connect your Ledger/Trezor:
        https://app.safe.global/settings/setup?safe=base:0xABC...123
        
        Once you add 2 signers, I'll set the threshold to 2-of-3
        so no single key can move funds."
User:  [adds signers via Safe{Wallet} UI]
Agent: [detects new owners via Safe Transaction Service]
Agent: "I see you added 0xUSER1 and 0xUSER2 as signers.
        Updating threshold to 2-of-3...
        [proposes threshold change tx, signs it, user confirms]
        
        Your Safe is now fully secured! I'll monitor all
        transactions and alert you to anything suspicious."
```

### 3.2 Happy Path (Web UI)

```
[supersandguard.com]
  ↓
User clicks "I don't have a Safe wallet"
  ↓
[Create Safe page]
  - Explains what a Safe is (2 sentences)
  - "We'll create one for you on Base (fees: ~$0.10)"
  - [Create My Safe] button
  ↓
[Loading: "Deploying your Safe..."]
  - Shows tx hash, progress
  ↓
[Success page]
  - "Your Safe: 0xABC...123"
  - "⚠️ Important: Add your own signers to secure it"
  - [Add Signers on Safe{Wallet}] → link to Safe UI
  - [I'll do it later] → proceeds to dashboard with warning banner
  ↓
[Dashboard]
  - Warning banner: "Your Safe has only 1 owner (SandGuard).
    Add your hardware wallets to fully secure it."
  - SandGuard begins monitoring immediately
```

### 3.3 Edge Cases

- **User already has a Safe** → existing flow, skip creation
- **User abandons before adding signers** → Safe exists as 1-of-1 under SandGuard's control; periodic reminders sent via agent/email
- **User adds only 1 signer** → threshold can be set to 2-of-2 (signer + SandGuard)
- **Gas fails** → retry with exponential backoff; show error to user
- **Base RPC down** → fallback RPC endpoints (Alchemy, Infura, public)

---

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                  SandGuard Backend                       │
│  ┌──────────────────┐  ┌────────────────────────────┐   │
│  │ Safe Creation     │  │ Owner Management            │  │
│  │ Service           │  │ Service                     │  │
│  │                   │  │                             │  │
│  │ - Deploy Safe     │  │ - Detect new owners         │  │
│  │ - Predict address │  │ - Propose addOwner tx       │  │
│  │ - Fund gas        │  │ - Propose threshold change  │  │
│  │ - Track status    │  │ - Propose removeOwner tx    │  │
│  └────────┬─────────┘  └──────────────┬──────────────┘  │
│           │                            │                 │
│  ┌────────▼────────────────────────────▼──────────────┐  │
│  │              Safe Protocol Kit                      │  │
│  │  @safe-global/protocol-kit                          │  │
│  │  @safe-global/api-kit                               │  │
│  └────────┬────────────────────────────┬──────────────┘  │
│           │                            │                 │
└───────────┼────────────────────────────┼─────────────────┘
            │                            │
   ┌────────▼────────┐       ┌──────────▼──────────┐
   │ Base RPC         │       │ Safe Transaction    │
   │ (chain 8453)     │       │ Service API         │
   │                  │       │ (api.safe.global)   │
   └──────────────────┘       └─────────────────────┘
```

### 4.2 NPM Dependencies (New)

```json
{
  "@safe-global/protocol-kit": "^5.x",
  "@safe-global/api-kit": "^2.x",
  "@safe-global/types-kit": "^1.x",
  "viem": "^2.x"
}
```

The Safe Protocol Kit uses `viem` internally. Our backend already uses `ethers` for some functionality, but the Protocol Kit abstracts the provider layer — we can pass an RPC URL string directly.

### 4.3 Deployer Wallet

SandGuard needs a dedicated **deployer EOA** (Externally Owned Account) on Base to:
- Pay gas for Safe deployments
- Sign as the initial 1-of-1 owner
- Propose and sign owner management transactions

**Requirements:**
- Private key stored securely (1Password / environment variable / KMS)
- Funded with ETH on Base for gas (~0.001 ETH per deployment)
- **NEVER holds user funds** — only used for Safe operations
- Address should be well-known and published (transparency)

```
SANDGUARD_DEPLOYER_KEY=0x...  # env var, never committed
SANDGUARD_DEPLOYER_ADDRESS=0x...  # public, documented
```

---

## 5. Safe Deployment Details

### 5.1 Deployment Code

Using Safe Protocol Kit v5+:

```typescript
import Safe, {
  PredictedSafeProps,
  SafeAccountConfig,
  getSafeAddressFromDeploymentTx
} from '@safe-global/protocol-kit'
import { base } from 'viem/chains'

const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const DEPLOYER_KEY = process.env.SANDGUARD_DEPLOYER_KEY

async function deploySafe(options?: {
  additionalOwners?: string[]
  threshold?: number
  saltNonce?: string
}): Promise<{ safeAddress: string; txHash: string }> {
  
  const owners = [
    SANDGUARD_DEPLOYER_ADDRESS,
    ...(options?.additionalOwners || [])
  ]
  
  const safeAccountConfig: SafeAccountConfig = {
    owners,
    threshold: options?.threshold || 1  // Start as 1-of-1
  }

  const predictedSafe: PredictedSafeProps = {
    safeAccountConfig,
    safeDeploymentConfig: {
      saltNonce: options?.saltNonce || Date.now().toString(),
      safeVersion: '1.4.1'
      // deploymentType defaults to 'canonical' for Base
    }
  }

  // Initialize Protocol Kit with predicted (not-yet-deployed) Safe
  const protocolKit = await Safe.init({
    provider: BASE_RPC,
    signer: DEPLOYER_KEY,
    predictedSafe
  })

  // Predict the address before deployment
  const safeAddress = await protocolKit.getAddress()
  console.log(`Predicted Safe address: ${safeAddress}`)

  // Create the deployment transaction
  const deploymentTx = await protocolKit.createSafeDeploymentTransaction()

  // Execute it via the deployer's wallet (viem client)
  const client = await protocolKit.getSafeProvider().getExternalSigner()
  
  const txHash = await client!.sendTransaction({
    to: deploymentTx.to as `0x${string}`,
    value: BigInt(deploymentTx.value),
    data: deploymentTx.data as `0x${string}`,
    chain: base
  })

  // Wait for confirmation
  const receipt = await client!.waitForTransactionReceipt({
    hash: txHash
  })

  // Verify the deployed address
  const deployedAddress = getSafeAddressFromDeploymentTx(receipt, '1.4.1')
  
  // Re-connect Protocol Kit to the now-deployed Safe
  const connectedKit = await protocolKit.connect({ safeAddress })
  const isDeployed = await connectedKit.isSafeDeployed()
  
  if (!isDeployed) {
    throw new Error('Safe deployment failed — contract not found at predicted address')
  }

  return {
    safeAddress: deployedAddress,
    txHash
  }
}
```

### 5.2 Key Contracts Involved

| Contract | Role | Base Address |
|----------|------|-------------|
| **SafeProxyFactory** | Creates new Safe proxy instances | Canonical deployment on Base |
| **SafeL2** (singleton) | Logic contract delegated to by proxy | Canonical deployment on Base |
| **CompatibilityFallbackHandler** | Handles ERC-721/1155 callbacks | Canonical deployment on Base |

Safe contracts are deployed at deterministic addresses across all supported chains via the Safe Singleton Factory. Base (chain ID 8453) is fully supported with:
- Safe{Core} SDK ✅
- Safe{Wallet} ✅
- Transaction Service ✅
- Event Service ✅
- Safe v1.4.1 ✅

### 5.3 Safe Version

Use **v1.4.1** (latest stable):
- SafeL2.sol — the L2-optimized version that emits events (required for Base)
- The Protocol Kit uses SafeL2 by default on non-mainnet chains

### 5.4 Address Prediction

The Safe address is **deterministic** based on:
- Owner addresses
- Threshold
- Salt nonce
- Safe version
- Deployment type

This means we can show the user their Safe address **before** deployment. Useful for the UI: "Your Safe will be at 0xABC...123".

---

## 6. Owner Handoff Protocol

This is the most critical part — transferring control from SandGuard to the user.

### 6.1 Adding Owners

After deployment, the user needs to add their own signer addresses. Two approaches:

#### Option A: Via Safe{Wallet} UI (Recommended for v1)

Generate a direct link to the Safe settings page:

```
https://app.safe.global/settings/setup?safe=base:0x{SAFE_ADDRESS}
```

The user:
1. Opens the link
2. Connects their hardware wallet (Ledger/Trezor via MetaMask, Rabby, etc.)
3. Clicks "Add new signer" in the Safe UI
4. Submits the transaction

**Problem:** Since SandGuard is the 1-of-1 owner, the user **cannot** add themselves — only an existing owner can propose `addOwner`. The user must tell SandGuard their address, and SandGuard proposes/executes the `addOwner` transaction.

#### Option B: Via SandGuard API (Better UX)

The user provides their signer address(es), and SandGuard's backend:

```typescript
async function addOwnerToSafe(
  safeAddress: string,
  newOwnerAddress: string,
  newThreshold?: number
): Promise<string> {
  
  const protocolKit = await Safe.init({
    provider: BASE_RPC,
    signer: DEPLOYER_KEY,
    safeAddress
  })

  // Create the addOwner transaction
  const addOwnerTx = await protocolKit.createAddOwnerTx({
    ownerAddress: newOwnerAddress,
    threshold: newThreshold  // Optional: update threshold when adding
  })

  // Since SandGuard is the sole owner (1-of-1), we can execute directly
  const result = await protocolKit.executeTransaction(addOwnerTx)
  
  return result.hash
}
```

#### Option C: Via Safe{Wallet} UI with SandGuard as Proposer

1. SandGuard proposes the `addOwner` tx via the Safe Transaction Service (API Kit)
2. User sees the pending transaction in Safe{Wallet}
3. User confirms/executes it

This approach works once the user has been added as an owner and the threshold requires their signature.

### 6.2 Handoff Sequence

The recommended sequence for a **2-of-3 target configuration**:

```
Step 0: Deploy Safe
  Config: owners=[SandGuard], threshold=1
  
Step 1: Add User Signer #1
  SandGuard executes addOwner(userAddress1, threshold=1)
  Config: owners=[SandGuard, User1], threshold=1
  
Step 2: Add User Signer #2
  SandGuard executes addOwner(userAddress2, threshold=2)
  Config: owners=[SandGuard, User1, User2], threshold=2
  ⚡ User now has co-control (any 2 of 3 can act)
  
Step 3 (Optional): Remove SandGuard as owner
  Requires 2-of-3: User1 + User2 sign removeOwner(SandGuard, threshold=2)
  Config: owners=[User1, User2], threshold=2
  OR keep SandGuard for recovery: owners=[SandGuard, User1, User2], threshold=2
```

**Critical security moment:** Between Steps 0-1, SandGuard has unilateral control. Minimize this window:
- Do NOT send any funds to the Safe until Step 2 is complete
- Show prominent warnings to the user
- Log all actions for audit trail

### 6.3 "Add Signer" URL Generation

For v1, we construct a URL to Safe's web UI:

```typescript
function getSafeSettingsUrl(safeAddress: string, chainPrefix: string = 'base'): string {
  return `https://app.safe.global/settings/setup?safe=${chainPrefix}:${safeAddress}`
}

function getSafeHomeUrl(safeAddress: string, chainPrefix: string = 'base'): string {
  return `https://app.safe.global/home?safe=${chainPrefix}:${safeAddress}`
}

function getSafeTransactionsUrl(safeAddress: string, chainPrefix: string = 'base'): string {
  return `https://app.safe.global/transactions/queue?safe=${chainPrefix}:${safeAddress}`
}
```

**Note:** The user cannot add themselves via the Safe UI if they're not already an owner. The flow must be: user tells SandGuard their address → SandGuard adds them → user can then access the Safe normally.

### 6.4 Monitoring for Owner Changes

SandGuard should poll the Safe Transaction Service to detect when owners are added/removed:

```typescript
import SafeApiKit from '@safe-global/api-kit'

const apiKit = new SafeApiKit({ chainId: 8453n })

async function checkSafeOwners(safeAddress: string): Promise<string[]> {
  const safeInfo = await apiKit.getSafeInfo(safeAddress)
  return safeInfo.owners
}
```

Compare current owners against stored state → trigger alerts/actions on changes.

---

## 7. Security Considerations

### 7.1 The Trust Gap

During the handoff period (1-of-1 → 2-of-3), SandGuard has **full unilateral control** of the Safe. This is an inherent trust requirement.

**Mitigations:**
- **No funds accepted until handoff is complete** — UI blocks deposits, shows warning
- **Time-limited window** — if user doesn't add signers within 7 days, disable the Safe (don't deploy until user is ready)
- **Full audit log** — every transaction SandGuard executes is logged in the database with timestamps
- **Deployer key isolation** — the deployer private key is used ONLY for Safe operations, never holds user funds, never interacts with DeFi
- **Transparency** — deployer address is published; all txs verifiable on-chain

### 7.2 Key Management

The deployer private key is the highest-value secret in the system.

**Options (ordered by security):**

1. **Cloud KMS (recommended for production)**
   - AWS KMS / GCP Cloud KMS / Azure Key Vault
   - Key never leaves the HSM
   - Sign transactions via API calls
   - Requires custom signer integration with Protocol Kit

2. **Environment Variable (acceptable for MVP)**
   - `SANDGUARD_DEPLOYER_KEY` in Railway/hosting env vars
   - Encrypted at rest by hosting provider
   - Rotatable without code changes

3. **1Password CLI (current SandGuard pattern)**
   - Fetch at startup: `op item get "SandGuard Deployer" --vault "max umbra" --fields "private_key" --reveal`
   - Good for development, less ideal for production (introduces 1Password as dependency)

### 7.3 Deployer Key Rotation

If the deployer key is compromised:
1. **Immediate:** Remove SandGuard deployer as owner from ALL managed Safes
2. Generate new deployer key
3. For Safes still in handoff: user must complete handoff immediately or new Safe is deployed
4. Notify all affected users

### 7.4 What SandGuard Can Do (and Can't)

| Action | Before Handoff (1-of-1) | After Handoff (2-of-3) |
|--------|------------------------|----------------------|
| Move funds | ✅ (sole owner) | ❌ (needs 2 sigs) |
| Add owners | ✅ | ❌ (needs 2 sigs) |
| Remove owners | ✅ | ❌ (needs 2 sigs) |
| Change threshold | ✅ | ❌ (needs 2 sigs) |
| Monitor transactions | ✅ | ✅ (read-only) |
| Propose transactions | ✅ | ✅ (via TX Service) |

**After handoff, SandGuard cannot unilaterally do anything.** This is the security guarantee.

### 7.5 Preventing Abuse

- Rate limit Safe creation: max 3 Safes per IP/user per day
- Require user authentication (email or wallet signature) before creating
- Monitor deployer wallet balance; alert if running low on gas funds
- Alert if any unexpected transactions are sent from the deployer

---

## 8. Backend Integration

### 8.1 New Service: `safeCreationService.ts`

```typescript
// backend/src/services/safeCreationService.ts

import Safe, {
  PredictedSafeProps,
  SafeAccountConfig,
  getSafeAddressFromDeploymentTx
} from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { base } from 'viem/chains'

const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const DEPLOYER_KEY = process.env.SANDGUARD_DEPLOYER_KEY!
const DEPLOYER_ADDRESS = process.env.SANDGUARD_DEPLOYER_ADDRESS!

export interface SafeCreationResult {
  safeAddress: string
  txHash: string
  owners: string[]
  threshold: number
  settingsUrl: string
  homeUrl: string
}

export async function createSafeForUser(opts?: {
  saltNonce?: string
  additionalOwners?: string[]
}): Promise<SafeCreationResult> {
  // ... implementation as shown in Section 5.1
}

export async function addOwnerToManagedSafe(
  safeAddress: string,
  newOwner: string,
  newThreshold?: number
): Promise<{ txHash: string; owners: string[]; threshold: number }> {
  // ... implementation as shown in Section 6.1
}

export async function removeOwnerFromManagedSafe(
  safeAddress: string,
  ownerToRemove: string,
  newThreshold?: number
): Promise<{ txHash: string; owners: string[]; threshold: number }> {
  // Similar to addOwner but uses createRemoveOwnerTx
}

export async function getManagedSafeStatus(
  safeAddress: string
): Promise<{
  deployed: boolean
  owners: string[]
  threshold: number
  handoffComplete: boolean
  sandguardIsOwner: boolean
}> {
  // Check current Safe state
}
```

### 8.2 New Route: `routes/safe-create.ts`

```typescript
// backend/src/routes/safe-create.ts

import { Router, Request, Response } from 'express'
import { createSafeForUser, addOwnerToManagedSafe } from '../services/safeCreationService'

const router = Router()

/**
 * POST /api/safe/create
 * Deploy a new Safe for a user
 * 
 * Body: { email?: string, walletAddress?: string }
 * Returns: { safeAddress, txHash, settingsUrl }
 */
router.post('/create', async (req: Request, res: Response) => {
  // Rate limit check
  // Auth check (API key or email)
  // Deploy Safe
  // Store in DB
  // Return result
})

/**
 * POST /api/safe/:address/add-owner
 * Add an owner to a SandGuard-managed Safe
 * 
 * Body: { ownerAddress: string, threshold?: number }
 */
router.post('/:address/add-owner', async (req: Request, res: Response) => {
  // Verify this Safe was created by SandGuard
  // Verify SandGuard is still an owner
  // Add the new owner
  // Update DB
})

/**
 * POST /api/safe/:address/complete-handoff
 * Finalize the handoff (update threshold, optionally remove SandGuard)
 * 
 * Body: { threshold: number, removeSandguard?: boolean }
 */
router.post('/:address/complete-handoff', async (req: Request, res: Response) => {
  // Verify sufficient owners added
  // Update threshold
  // Optionally remove SandGuard as owner
  // Mark handoff as complete in DB
})

/**
 * GET /api/safe/:address/handoff-status
 * Check the current state of Safe setup/handoff
 */
router.get('/:address/handoff-status', async (req: Request, res: Response) => {
  // Return current owners, threshold, handoff state
})

export default router
```

### 8.3 Database Changes

Add new table to `db.ts`:

```sql
CREATE TABLE IF NOT EXISTS managed_safes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  safe_address TEXT NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL DEFAULT 8453,
  deployer_address TEXT NOT NULL,
  deploy_tx_hash TEXT NOT NULL,
  
  -- Current state
  current_owners TEXT NOT NULL,      -- JSON array of addresses
  current_threshold INTEGER NOT NULL DEFAULT 1,
  
  -- Handoff tracking
  handoff_status TEXT NOT NULL DEFAULT 'pending',
    -- 'pending' = just deployed, waiting for user signers
    -- 'in_progress' = user has added at least 1 signer
    -- 'complete' = threshold >= 2 and user has majority control
    -- 'abandoned' = user never completed setup (7+ days)
  handoff_target_threshold INTEGER NOT NULL DEFAULT 2,
  handoff_target_owners INTEGER NOT NULL DEFAULT 3,
  sandguard_is_owner INTEGER NOT NULL DEFAULT 1,
  
  -- User association
  user_address TEXT,                 -- user's primary EOA (if known)
  user_email TEXT,                   -- for notifications
  subscription_address TEXT,         -- FK to subscriptions table
  
  -- Timestamps
  deployed_at INTEGER NOT NULL,
  first_signer_added_at INTEGER,
  handoff_completed_at INTEGER,
  last_checked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_managed_safes_address ON managed_safes(safe_address);
CREATE INDEX IF NOT EXISTS idx_managed_safes_status ON managed_safes(handoff_status);
CREATE INDEX IF NOT EXISTS idx_managed_safes_user ON managed_safes(user_address);
```

### 8.4 Register New Route

In `backend/src/index.ts`:

```typescript
import safeCreateRouter from './routes/safe-create'

// ... existing routes ...
app.use('/api/safe', safeCreateRouter)  // alongside existing safeRouter
```

### 8.5 Environment Variables (New)

```env
# Safe Creation Service
SANDGUARD_DEPLOYER_KEY=0x...          # Private key (NEVER commit)
SANDGUARD_DEPLOYER_ADDRESS=0x...       # Public address of deployer
BASE_RPC_URL=https://mainnet.base.org  # Primary RPC
BASE_RPC_FALLBACK=https://...          # Fallback RPC (Alchemy/Infura)
```

---

## 9. Frontend Changes

### 9.1 New "Create Safe" Page

Add a new page at `/create-safe` (or integrate into existing onboarding):

```
┌─────────────────────────────────────────────┐
│  🛡️ SandGuard                              │
│                                             │
│  Create Your Secure Wallet                  │
│                                             │
│  We'll set up a Safe multisig wallet on     │
│  Base for you. A multisig means multiple    │
│  keys must approve any transaction —        │
│  no single point of failure.                │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ What happens:                       │    │
│  │ 1. We deploy a Safe smart contract  │    │
│  │ 2. You add your hardware wallets    │    │
│  │ 3. SandGuard monitors it 24/7       │    │
│  │                                     │    │
│  │ Cost: ~$0.10 in gas (paid by us!)   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [  Create My Safe  ]                       │
│                                             │
│  Already have a Safe? [Enter address →]     │
└─────────────────────────────────────────────┘
```

### 9.2 Handoff Status Component

Show on dashboard when Safe is in handoff:

```
┌─────────────────────────────────────────────┐
│  ⚠️ Complete Your Safe Setup                │
│                                             │
│  Your Safe: 0xABC...123                     │
│                                             │
│  Step 1: ✅ Safe deployed                   │
│  Step 2: ⏳ Add your first signer           │
│  Step 3: ⬜ Add your second signer          │
│  Step 4: ⬜ Set 2-of-3 threshold            │
│                                             │
│  [Add Signer Address]  [0x____________]     │
│  [Submit]                                   │
│                                             │
│  Or add via Safe{Wallet}: [Open Safe UI →]  │
│                                             │
│  ⚠️ Don't send funds until setup is done!   │
└─────────────────────────────────────────────┘
```

### 9.3 Modified Login/Onboarding

Update the existing login page to offer the create option:

```
Current:  "Enter your Safe address: [0x________]"

Proposed: "Enter your Safe address: [0x________]"
          — or —
          "Don't have a Safe? [Create one now →]"
```

---

## 10. Gas Costs & Economics

### 10.1 Base Chain Gas Costs

Base is an L2 with very low gas costs. Estimated costs for Safe operations:

| Operation | Gas Used (approx) | Cost @ 0.01 gwei gas | Cost @ 0.1 gwei gas |
|-----------|-------------------|----------------------|---------------------|
| Deploy Safe (proxy) | ~250,000 | ~$0.005 | ~$0.05 |
| addOwner | ~65,000 | ~$0.001 | ~$0.01 |
| changeThreshold | ~40,000 | ~$0.001 | ~$0.01 |
| removeOwner | ~65,000 | ~$0.001 | ~$0.01 |
| **Full handoff** | **~420,000** | **~$0.008** | **~$0.08** |

**Total cost per user onboarding: ~$0.01 - $0.10**

This is negligible. SandGuard can absorb this cost as part of onboarding (subsidized gas). At 1,000 users, total gas spend would be ~$10–$100.

### 10.2 Deployer Wallet Funding

- Pre-fund with **0.1 ETH** (~$300 at current prices) → enough for ~1,000+ Safe deployments
- Set up monitoring alert when balance drops below 0.01 ETH
- Auto-fund from a treasury wallet (future feature)

### 10.3 Who Pays?

**Recommendation:** SandGuard pays all gas for Safe creation and handoff as part of the free onboarding experience. This removes the last friction point (user doesn't need ETH on Base to get started).

For abuse prevention, gate behind:
- Email verification, OR
- Existing SandGuard account (even free tier), OR
- Wallet signature (prove you own an EOA)

---

## 11. Implementation Phases

### Phase 1: MVP (1-2 weeks)

**Goal:** Agent (Clawdbot) can create Safes for users via WhatsApp/chat.

- [ ] Create deployer wallet on Base, fund with ETH
- [ ] Implement `safeCreationService.ts` with `deploySafe()`
- [ ] Implement `addOwnerToManagedSafe()`
- [ ] Add `managed_safes` table to database
- [ ] Create `/api/safe/create` and `/api/safe/:addr/add-owner` endpoints
- [ ] Integrate with Clawdbot: "create my safe" command
- [ ] Generate Safe{Wallet} settings URLs for user
- [ ] Basic logging/audit trail

**Not in MVP:**
- No web UI for creation (agent-only)
- No automatic owner detection/monitoring
- No threshold management (manual via agent)

### Phase 2: Web UI + Monitoring (2-3 weeks)

**Goal:** Users can create Safes via web UI, with automated handoff tracking.

- [ ] Frontend: "Create Safe" page
- [ ] Frontend: Handoff status component on dashboard
- [ ] Backend: Poll Safe Transaction Service for owner changes
- [ ] Backend: Automatic threshold change proposals
- [ ] Backend: Handoff completion detection
- [ ] Email notifications for handoff steps
- [ ] Abandonment detection (7-day timeout)

### Phase 3: Advanced (4+ weeks)

**Goal:** Production-ready, scalable, audited.

- [ ] Cloud KMS integration for deployer key
- [ ] Multi-chain support (Ethereum mainnet, Arbitrum, Optimism)
- [ ] Gas estimation and dynamic gas pricing
- [ ] Safe Guard module installation during creation
- [ ] Batch Safe creation (for organizations)
- [ ] Self-service threshold/owner management in SandGuard UI
- [ ] Deployer key rotation mechanism
- [ ] Comprehensive security audit

---

## 12. Open Questions

### Resolved in this spec:
- ✅ **Initial config** → 1-of-1 with SandGuard as sole owner
- ✅ **How to add signers** → SandGuard proposes/executes addOwner (user provides address)
- ✅ **Gas costs** → Negligible on Base, SandGuard subsidizes
- ✅ **Which SDK** → `@safe-global/protocol-kit` + `@safe-global/api-kit`
- ✅ **Which chain** → Base (8453) primary, with Safe v1.4.1 (L2 variant)

### Still open:
1. **Should SandGuard remain as a signer after handoff?**
   - Pro: Recovery mechanism if user loses keys
   - Con: Permanent trust relationship, liability risk
   - **Proposed default:** Keep as 1-of-3 (user has 2-of-3 control), with option to remove

2. **How does the user prove they own a signer address?**
   - Option A: Honor system (user pastes address)
   - Option B: Wallet signature verification (user signs a message)
   - **Proposed:** Option A for MVP, Option B for production

3. **Should we install SandGuard's Guard contract during Safe creation?**
   - Would enable on-chain policy enforcement from day 1
   - Adds complexity; Guard module development is a separate workstream
   - **Proposed:** Not in MVP, add in Phase 3

4. **Multi-Safe support?**
   - Should one user be able to create multiple Safes via SandGuard?
   - **Proposed:** Yes, up to 3 per account (free tier: 1)

5. **What if a user wants to import an existing Safe AND create a new one?**
   - Both should work; the dashboard shows all monitored Safes regardless of origin

---

## Appendix A: Safe SDK Quick Reference

### Protocol Kit Methods Used

| Method | Purpose |
|--------|---------|
| `Safe.init({ predictedSafe })` | Initialize with not-yet-deployed Safe |
| `Safe.init({ safeAddress })` | Connect to existing deployed Safe |
| `protocolKit.getAddress()` | Get (predicted or actual) Safe address |
| `protocolKit.createSafeDeploymentTransaction()` | Get deployment tx data |
| `protocolKit.createAddOwnerTx({ ownerAddress, threshold })` | Propose adding an owner |
| `protocolKit.createRemoveOwnerTx({ ownerAddress, threshold })` | Propose removing an owner |
| `protocolKit.createChangeThresholdTx(threshold)` | Propose threshold change |
| `protocolKit.executeTransaction(tx)` | Execute a Safe transaction |
| `protocolKit.getOwners()` | List current owners |
| `protocolKit.getThreshold()` | Get current threshold |
| `protocolKit.isSafeDeployed()` | Check if Safe exists on-chain |
| `getSafeAddressFromDeploymentTx(receipt, version)` | Extract address from deploy receipt |

### API Kit Methods Used

| Method | Purpose |
|--------|---------|
| `apiKit.getSafeInfo(address)` | Get Safe config (owners, threshold, modules) |
| `apiKit.proposeTransaction(...)` | Submit tx to Transaction Service |
| `apiKit.getPendingTransactions(address)` | List queued transactions |
| `apiKit.confirmTransaction(hash, signature)` | Confirm a pending tx |

### Safe{Wallet} URL Patterns

| URL | Purpose |
|-----|---------|
| `app.safe.global/home?safe=base:0x...` | Safe home/dashboard |
| `app.safe.global/settings/setup?safe=base:0x...` | Owners & threshold settings |
| `app.safe.global/transactions/queue?safe=base:0x...` | Pending transactions |
| `app.safe.global/transactions/history?safe=base:0x...` | Transaction history |

---

## Appendix B: Safe Transaction Service API (Base)

- **Base URL:** `https://api.safe.global/tx-service/base`
- **Chain ID:** 8453
- **API docs:** https://docs.safe.global/core-api/transaction-service-overview

Key endpoints:
```
GET  /api/v1/safes/{address}/                          # Safe info
GET  /api/v1/safes/{address}/multisig-transactions/    # Transactions
POST /api/v1/safes/{address}/multisig-transactions/    # Propose tx
POST /api/v1/multisig-transactions/{hash}/confirmations/ # Confirm tx
```

---

## Appendix C: Competitive Analysis

No major competitor currently offers auto-Safe-creation as part of a security product:
- **Safe{Wallet}** itself requires manual creation
- **Gnosis** DApps assume Safe exists
- **Brahma Console** requires existing Safe
- **Fireblocks** is enterprise-only, not self-custody

SandGuard auto-creating Safes would be a **unique differentiator** and potential gateway drug to the Safe ecosystem.
