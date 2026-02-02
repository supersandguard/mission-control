# SandGuard × Safe: Deep Integration Strategy

> **Prepared:** February 2, 2026
> **Product:** SandGuard — Transaction Firewall for Safe Multisig Wallets
> **URL:** https://supersandguard.com
> **Objective:** Make SandGuard THE security layer for Safe users — from product UX to on-chain enforcement to co-marketing partnership.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [A. Product UX Integration](#a-product-ux-integration)
3. [B. Technical Integration (Safe Guard Module)](#b-technical-integration-safe-guard-module)
4. [C. Marketing & Content Strategy](#c-marketing--content-strategy)
5. [D. Partnership Proposal](#d-partnership-proposal)
6. [E. Competitive Landscape](#e-competitive-landscape)
7. [F. Implementation Roadmap](#f-implementation-roadmap)
8. [G. Concrete Code Changes](#g-concrete-code-changes)
9. [Appendix: Partnership Outreach Draft](#appendix-partnership-outreach-draft)
10. [Appendix: Social Media Content](#appendix-social-media-content)

---

## Executive Summary

SandGuard is a transaction firewall for Safe multisig wallets. It decodes calldata, simulates transactions, and provides AI risk scoring before signers approve. Yet today, SandGuard's product never explains what Safe is, shows no Safe branding, provides no links to Safe, and offers zero guidance for users who don't yet have a Safe wallet.

This is a critical gap. SandGuard's entire value proposition depends on Safe — and Safe's ecosystem has a massive unmet need for pre-signing security tooling. The $1.43B ByBit hack proved this. Vitalik Buterin, the Ethereum Foundation, Worldcoin, Morpho Labs, and Polygon all use Safe. Over $1 trillion in volume has been processed through Safe. Yet there is **no dedicated transaction firewall** in the Safe ecosystem.

**This document outlines a full vertical integration strategy:**
- **UX:** Educate users about Safe, validate addresses, show Safe details, link to Safe creation
- **Technical:** Build a Safe Guard smart contract, submit as a Safe App, use the Safe Transaction Service API
- **Marketing:** Co-branded content, ByBit case study, X/Twitter engagement with @safe ecosystem
- **Partnership:** Formal outreach to Safe's BD team, Safe App Store listing, revenue share proposal
- **Competitive:** Own the "Safe security layer" category before competitors notice the gap

---

## A. Product UX Integration

### A.1 Current State: The Gap

**What SandGuard does now:**
- Landing page says "Transaction Firewall for Safe Multisig" but never explains what Safe is
- Login page asks for a "Wallet Address" — doesn't specify this should be a Safe address or explain why
- Settings page has a "Safe Address" field with placeholder "0x..." and helper text "Leave empty to use demo data"
- No Safe logo anywhere
- No link to safe.global or app.safe.global
- No guidance on creating a Safe
- No validation that the entered address is actually a Safe
- No display of Safe details (owners, threshold, modules, guard)

**What users need to understand:**
- What Safe is and why it matters
- How to create a Safe if they don't have one
- How to find their Safe address
- Confirmation that their address is valid and connected

### A.2 Proposed Onboarding Flow

```
[Landing Page]
  ↓
"Built for Safe" section explains:
  - What Safe is (multisig smart wallet)
  - Why multisig matters for security
  - Safe logo + "Official Safe ecosystem" badge
  - Link: "Don't have a Safe? Create one →" → app.safe.global
  ↓
[Login Page]
  ↓
Address input with:
  - Safe logo next to input field
  - ENS resolution support (e.g., "vitalik.eth" → address)
  - Checksum validation (EIP-55)
  - On-chain validation: verify address is actually a Safe contract
  - Error state: "This address is not a Safe wallet. Create one at app.safe.global"
  ↓
[Safe Details Panel] (after valid address)
  - Display Safe owners (count + truncated addresses)
  - Display threshold (e.g., "3 of 5 signatures required")
  - Display installed modules
  - Display current Guard (if any)
  - Network badge (Ethereum, Base, etc.)
  ↓
[Dashboard]
  - "Powered by Safe" footer badge
  - Link to view Safe on app.safe.global
```

### A.3 "Built for Safe" Landing Section

Add a new section between "How it works" and "Pricing" on Landing.tsx:

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Safe Logo]  Built for Safe{Wallet}        │
│                                             │
│  Safe is the most trusted smart wallet      │
│  infrastructure, securing over $1 trillion  │
│  in onchain assets. Used by Ethereum        │
│  Foundation, Worldcoin, Vitalik Buterin,    │
│  and thousands of DAOs.                     │
│                                             │
│  SandGuard adds a critical security layer   │
│  to every Safe: decode, simulate, and       │
│  score transactions before you sign.        │
│                                             │
│  [Create a Safe →]  [Learn about Safe →]    │
│                                             │
└─────────────────────────────────────────────┘
```

**Key elements:**
- Safe green logo (download from safe.global/press-kit or use SVG from their brand assets)
- Attribution: "Safe is a trademark of Safe Ecosystem Foundation"
- CTA 1: "Don't have a Safe? Create one →" → `https://app.safe.global/new-safe/create`
- CTA 2: "Learn about Safe →" → `https://safe.global`
- Social proof: mention that Safe processes $1T+ in volume

### A.4 Safe Address Validation

Implement real validation when a user enters an address:

```typescript
// Check if address is a valid Safe
async function validateSafeAddress(address: string, chainId: number): Promise<SafeInfo | null> {
  // 1. Basic format validation (0x + 40 hex chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  
  // 2. EIP-55 checksum validation
  if (!isValidChecksum(address)) return null;
  
  // 3. Query Safe Transaction Service API to verify it's a Safe
  const serviceUrl = getSafeServiceUrl(chainId);
  // GET https://safe-transaction-mainnet.safe.global/api/v1/safes/{address}/
  const response = await fetch(`${serviceUrl}/api/v1/safes/${address}/`);
  if (!response.ok) return null;
  
  const data = await response.json();
  return {
    address: data.address,
    owners: data.owners,
    threshold: data.threshold,
    nonce: data.nonce,
    modules: data.modules,
    guard: data.guard,
    version: data.version,
    fallbackHandler: data.fallbackHandler,
  };
}
```

**Safe Transaction Service endpoints by chain:**
- Ethereum: `https://safe-transaction-mainnet.safe.global`
- Base: `https://safe-transaction-base.safe.global`
- Optimism: `https://safe-transaction-optimism.safe.global`
- Arbitrum: `https://safe-transaction-arbitrum.safe.global`
- Full list: `https://docs.safe.global/core-api/transaction-service-overview`

### A.5 ENS Resolution

```typescript
// Resolve ENS names to addresses
import { ethers } from 'ethers';

async function resolveENS(input: string): Promise<string | null> {
  if (input.endsWith('.eth')) {
    const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/...');
    return await provider.resolveName(input);
  }
  return input;
}
```

### A.6 SafeDetails Component

After a valid Safe address is entered, show a panel:

```
┌─────────────────────────────────────────┐
│ ✅ Valid Safe Wallet                     │
│                                         │
│ 🔐 Threshold: 3 of 5 owners            │
│ 👥 Owners:                              │
│    0x1234...5678                         │
│    0xabcd...ef01                         │
│    0x9876...5432                         │
│    + 2 more                              │
│                                         │
│ 📦 Modules: 1 active                    │
│ 🛡️ Guard: None installed               │
│ 🔗 Network: Ethereum Mainnet            │
│ 📋 Version: 1.3.0                       │
│                                         │
│ [View on Safe{Wallet} ↗]                │
└─────────────────────────────────────────┘
```

### A.7 Embedded Safe Creation (Future)

For Phase 4, consider embedding Safe creation directly in SandGuard using the Safe{Core} SDK:

```typescript
import Safe, { SafeFactory } from '@safe-global/protocol-kit';

// Create a new Safe directly from SandGuard
const safeFactory = await SafeFactory.init({ provider, signer });
const safe = await safeFactory.deploySafe({
  safeAccountConfig: {
    owners: ['0xOwner1', '0xOwner2', '0xOwner3'],
    threshold: 2,
  },
});

const safeAddress = await safe.getAddress();
// → Auto-configure SandGuard with the new Safe
```

This would allow users to create a Safe + enable SandGuard in a single flow. This is the ultimate integration.

---

## B. Technical Integration (Safe Guard Module)

### B.1 What is a Safe Guard?

From Safe's documentation:

> *"Safe Guards are used when there are restrictions on top of the n-out-of-m scheme. Safe Guards can make checks before and after a Safe transaction. The check before a transaction can programmatically check all the parameters of the respective transaction before execution. The check after a transaction is called at the end of the transaction execution and can be used to perform checks on the final state of the Safe."*

**Critical insight:** A Guard has **full power to block Safe transaction execution.** This means SandGuard could become an on-chain enforcement layer — not just a monitoring/alerting tool, but an actual smart contract that blocks risky transactions from executing.

### B.2 Guard Module Interface

The Safe Guard interface requires implementing `IGuard`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGuard {
    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures,
        address msgSender
    ) external;

    function checkAfterExecution(
        bytes32 txHash,
        bool success
    ) external;
}
```

### B.3 SandGuard Guard Contract Architecture

```
┌─────────────────────────────────────────────────┐
│                 Safe Multisig                     │
│                                                   │
│  Owners sign tx → Guard.checkTransaction() →      │
│  If Guard approves → Execute → checkAfterExec()   │
│  If Guard reverts → Transaction BLOCKED           │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│            SandGuardGuard.sol                     │
│                                                   │
│  checkTransaction():                              │
│    1. Check if target is blacklisted              │
│    2. Check if function selector is blocked       │
│    3. Check if operation is delegateCall          │
│       → Block unless whitelisted                  │
│    4. Check if value exceeds daily limit          │
│    5. Check if approval amount is unlimited       │
│       → Block unless whitelisted token            │
│    6. Emit TransactionChecked event               │
│       (for off-chain SandGuard to analyze)        │
│                                                   │
│  checkAfterExecution():                           │
│    1. Verify critical state unchanged             │
│       (owner list, threshold, guard, modules)     │
│    2. Emit PostExecutionCheck event               │
│                                                   │
│  Owner functions (only Safe owners):              │
│    - setDailyLimit(uint256)                       │
│    - addToWhitelist(address)                      │
│    - removeFromBlacklist(address)                 │
│    - setDelegateCallPolicy(bool blockAll)         │
│    - pause() / unpause()                          │
│    - EMERGENCY: removeGuard() (recovery)          │
│                                                   │
└─────────────────────────────────────────────────┘
```

### B.4 Proposed SandGuard Guard Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@safe-global/safe-contracts/contracts/common/Enum.sol";

contract SandGuardGuard {
    
    // --- State ---
    address public safe;
    bool public paused;
    bool public blockDelegateCalls;
    uint256 public dailyLimit;        // in wei
    uint256 public dailySpent;
    uint256 public lastResetDay;
    
    mapping(address => bool) public blacklistedTargets;
    mapping(address => bool) public whitelistedTargets;
    mapping(bytes4 => bool) public blockedSelectors;
    
    // --- Events ---
    event TransactionBlocked(address indexed to, bytes4 selector, string reason);
    event TransactionAllowed(address indexed to, uint256 value, bytes4 selector);
    event PolicyUpdated(string policy, bytes data);
    
    // --- Modifiers ---
    modifier onlySafe() {
        require(msg.sender == safe, "Only Safe can call");
        _;
    }
    
    constructor(address _safe) {
        safe = _safe;
        blockDelegateCalls = true; // Safe default: block all delegatecalls
        dailyLimit = type(uint256).max; // No limit initially
    }
    
    // --- Guard Interface ---
    
    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256, uint256, uint256,
        address, address payable,
        bytes memory,
        address
    ) external view {
        require(!paused, "SandGuard: Guard is paused");
        
        // 1. Block delegatecalls unless explicitly allowed
        if (operation == Enum.Operation.DelegateCall) {
            require(!blockDelegateCalls || whitelistedTargets[to],
                "SandGuard: delegateCall blocked");
        }
        
        // 2. Check blacklist
        require(!blacklistedTargets[to],
            "SandGuard: target is blacklisted");
        
        // 3. Check blocked function selectors
        if (data.length >= 4) {
            bytes4 selector = bytes4(data);
            require(!blockedSelectors[selector],
                "SandGuard: function selector blocked");
        }
        
        // 4. Check daily spending limit
        // (simplified — production version needs day-reset logic)
        
        // 5. Check for unlimited approvals
        if (data.length >= 4) {
            bytes4 selector = bytes4(data);
            // ERC20.approve(address,uint256)
            if (selector == 0x095ea7b3 && data.length >= 68) {
                uint256 amount;
                assembly {
                    amount := mload(add(data, 68))
                }
                require(amount < type(uint256).max,
                    "SandGuard: unlimited approval blocked");
            }
        }
    }
    
    function checkAfterExecution(bytes32, bool) external view {
        // Post-execution: verify critical Safe state unchanged
        // In production: check that owners, threshold, guard, modules
        // haven't been maliciously modified
    }
    
    // --- Policy Management (only via Safe multisig) ---
    
    function setDailyLimit(uint256 _limit) external onlySafe {
        dailyLimit = _limit;
        emit PolicyUpdated("dailyLimit", abi.encode(_limit));
    }
    
    function setBlockDelegateCalls(bool _block) external onlySafe {
        blockDelegateCalls = _block;
        emit PolicyUpdated("blockDelegateCalls", abi.encode(_block));
    }
    
    function addToBlacklist(address _target) external onlySafe {
        blacklistedTargets[_target] = true;
    }
    
    function addToWhitelist(address _target) external onlySafe {
        whitelistedTargets[_target] = true;
    }
    
    function blockSelector(bytes4 _selector) external onlySafe {
        blockedSelectors[_selector] = true;
    }
    
    function pause() external onlySafe { paused = true; }
    function unpause() external onlySafe { paused = false; }
}
```

### B.5 Guard Module — What It Would Have Caught

| Attack | Guard Rule That Blocks It |
|--------|--------------------------|
| **ByBit ($1.43B)** | `blockDelegateCalls = true` — the implementation upgrade via delegatecall would be blocked |
| **WazirX ($235M)** | Blacklisted target + delegatecall block |
| **Unlimited approval drains** | `approve()` with `type(uint256).max` blocked by default |
| **Proxy upgrades** | `upgradeTo()` and `upgradeToAndCall()` selectors blocked |

### B.6 Safe Apps SDK Integration (Safe App Store)

**Goal:** Get SandGuard listed in the Safe{Wallet} App Store so users can access it directly from their Safe dashboard.

**How Safe Apps Work:**
1. Safe Apps are web applications that run inside an iframe in the Safe{Wallet} UI
2. They communicate with the Safe using the `@safe-global/safe-apps-sdk`
3. They can read Safe state, propose transactions, and interact with the Safe's signers
4. Listed apps appear in the Safe{Wallet}'s "Apps" section alongside 200+ other apps

**Integration Steps:**

1. **Add Safe Apps SDK to SandGuard frontend:**
```bash
npm install @safe-global/safe-apps-sdk @safe-global/safe-apps-react-sdk
```

2. **Add manifest.json:**
```json
{
  "name": "SandGuard",
  "description": "Transaction firewall — decode, simulate, and risk-score every transaction before signing",
  "iconPath": "logo.svg",
  "providedBy": { "name": "SandGuard", "url": "https://supersandguard.com" }
}
```

3. **Auto-detect Safe context:**
```typescript
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK();
  
  if (connected) {
    // Running inside Safe{Wallet}
    // safe.safeAddress — the current Safe address
    // safe.chainId — the current chain
    // safe.owners — owner addresses
    // safe.threshold — signature threshold
    // Auto-configure SandGuard with this Safe's details
  }
}
```

4. **Enable CORS for Safe{Wallet}:**
```
Access-Control-Allow-Origin: https://app.safe.global
Access-Control-Allow-Methods: GET
```

5. **Submit listing request:**
   - URL: Fill out Safe App listing request form (linked from https://help.safe.global/en/articles/145503-how-to-build-a-safe-app-and-get-it-listed-in-safe-wallet)
   - Provide: App URL, manifest.json, description, audited contract info (if Guard deployed), ABIs
   - Categories: Security, Infrastructure
   - Expected timeline: Days to a couple weeks for initial review

**User experience when listed:**
```
User opens Safe{Wallet} → Apps → "SandGuard" →
  SandGuard loads inside Safe iframe →
  Auto-detects Safe address, chain, owners, threshold →
  Shows pending transactions with decode + simulation + risk score →
  User can review all queued txs without leaving Safe{Wallet}
```

This is the **#1 distribution channel** for SandGuard. Being inside the Safe UI means every Safe user can discover and use SandGuard without leaving their wallet.

### B.7 Safe Transaction Service API — Deep Integration

Currently SandGuard likely polls the Safe Transaction Service for pending transactions. We can go deeper:

**Endpoints to leverage:**
- `GET /api/v1/safes/{address}/` — Safe info (owners, threshold, modules, guard, nonce)
- `GET /api/v1/safes/{address}/multisig-transactions/` — All multisig transactions (pending + executed)
- `GET /api/v1/safes/{address}/all-transactions/` — Full transaction history
- `GET /api/v1/safes/{address}/balances/` — Token balances
- `GET /api/v1/safes/{address}/delegates/` — Delegate list
- `GET /api/v1/safes/{address}/transfers/` — Transfer history

**Deep integration features:**
1. **Historical transaction analysis** — Scan past transactions to build a baseline of "normal" behavior for this Safe. Flag transactions that deviate from the pattern.
2. **Owner behavior profiling** — Track which owners typically propose vs. sign, at what times, from which addresses. Alert on anomalies.
3. **Balance change tracking** — Monitor balance changes over time. Alert on large outflows.
4. **Delegate monitoring** — Alert when new delegates are added (potential attack vector).
5. **Module change detection** — Alert immediately when modules are added/removed.

**API Key:** Safe Transaction Service requires API keys for higher rate limits:
- Docs: `https://docs.safe.global/core-api/how-to-use-api-keys`
- Apply for a key to support SandGuard's monitoring needs

---

## C. Marketing & Content Strategy

### C.1 Co-Marketing Opportunities with Safe

**Key Safe accounts and channels:**
- **@safe** on X/Twitter — Main Safe account
- **@safegov** on X/Twitter — SafeDAO governance
- **Safe Forum:** `https://forum.safe.global` — Governance and community discussions
- **Safe Blog:** `https://safe.global/blog`
- **Safe Discord** — Community support and ecosystem discussion

**Co-marketing opportunities:**
1. **"Ecosystem spotlight" blog post** — Safe regularly features ecosystem partners. SandGuard as "the security layer for Safe" is a compelling story.
2. **Joint security report** — "The State of Safe Transaction Security" — co-authored with Safe team, citing SandGuard's risk analysis data.
3. **Safe{Con} presence** — If Safe hosts events, propose a talk on "Transaction-level security for multisig wallets."
4. **SafeDAO grant proposal** — Apply for a SafeDAO ecosystem grant to fund SandGuard development as a public good for the Safe ecosystem.

### C.2 Blog Content: "Why Every Safe Needs a Transaction Firewall"

**Outline:**

1. **The False Sense of Security**
   - Multisig ≠ secure. It means "multiple signatures required" but says nothing about what you're signing.
   - $2.2B stolen in 2024, 43.8% from private key compromises (Chainalysis)
   - The ByBit case: all signers approved, everything looked legit

2. **The Three Layers of Safe Security**
   - Layer 1: Authorization (multisig threshold) ← Safe provides this ✅
   - Layer 2: Verification (understand what you're signing) ← **Missing** ❌
   - Layer 3: Enforcement (on-chain rules to block risky txs) ← SandGuard Guard module
   - SandGuard fills Layers 2 and 3

3. **What a Transaction Firewall Does**
   - Decodes calldata into plain English
   - Simulates outcome before signing
   - AI risk scoring against known attack patterns
   - 24/7 queue monitoring with push alerts

4. **Real Attack Patterns SandGuard Catches**
   - delegatecall proxy upgrades (ByBit pattern)
   - Unlimited token approvals
   - Owner/threshold changes by compromised signers
   - Unverified contract interactions

5. **How to Set Up SandGuard for Your Safe**
   - Step-by-step: visit supersandguard.com → enter Safe address → review first analysis
   - Free tier available, Pro for full simulation + risk scoring

**CTA:** "Try SandGuard free → supersandguard.com"

### C.3 X/Twitter Engagement Strategy

**Target accounts to engage with regularly:**

| Account | Relevance | Engagement Type |
|---------|-----------|-----------------|
| `@safe` | Official Safe account | Reply to security-related posts, share SandGuard features |
| `@safegov` | SafeDAO governance | Participate in governance discussions about security |
| `@richardmeissner` | Safe co-founder / CTO | Engage on technical posts about Guard modules |
| `@luaborges` | Safe CEO | Engage on vision/strategy posts |
| `@SchorLukas` | Safe co-founder | Technical engagement |
| `@taaborman` | Security researcher (documented Lazarus attacks) | Share SandGuard as solution to blind signing |
| `@samczsun` | Paradigm security researcher | Technical credibility |
| `@nanaknihal` | Called out blind signing | SandGuard solves what they flagged |
| `@VitalikButerin` | Uses Safe, publicly endorsed multisig | When he posts about wallet security |

**Engagement playbook:**
1. **Monitor @safe's posts daily.** Reply with value-adding comments about security, not shilling.
2. **Quote-tweet Safe ecosystem announcements** with SandGuard's perspective on security.
3. **Reply to every major hack/exploit news** with "Here's how SandGuard would have caught this."
4. **Thread on Safe security best practices** — educational content that positions SandGuard as the expert.
5. **Tag @safe when sharing SandGuard features** — build visibility with their community team.

### C.4 Case Study: "How SandGuard Would Have Caught the ByBit Hack"

This already exists at `/home/clawdbot/clawd/sand/content/bybit-post.md` — it's excellent. Adapt it for Safe-specific distribution:

1. **Post in Safe{DAO} forum** as "Security Discussion: The ByBit Hack and What It Means for Safe Users"
2. **Create a Twitter/X thread version** — shorter, punchier, with screenshots showing SandGuard's analysis of the ByBit transaction
3. **Submit to Safe's blog** as a guest post (via partnership outreach)
4. **Cross-post to Farcaster** with Safe-related channels

### C.5 Content Explaining Multisig Security Gaps

**Weekly content series: "Safe Security Gaps"**

1. **"Your Safe is only as smart as its last signer"** — Why simulation matters
2. **"The delegateCall trap"** — How proxy upgrades bypass multisig security
3. **"Unlimited approvals: the silent drain"** — Why max uint256 approvals are dangerous
4. **"Trust but verify... your Safe's modules"** — How malicious modules can bypass threshold
5. **"The Guard you're missing"** — Why every Safe needs a transaction guard

Each piece ends with: "SandGuard catches all of these. Try it free → supersandguard.com"

---

## D. Partnership Proposal

### D.1 Value Proposition for Safe

**What Safe gets from partnering with SandGuard:**

1. **Security story:** "Safe ecosystem has a dedicated transaction firewall" — strengthens Safe's brand as the most secure smart wallet
2. **ByBit response:** The ByBit hack was a black eye for Safe (it happened through Safe's UI). SandGuard is the direct answer — "This can never happen again if you use SandGuard"
3. **Guard module showcase:** SandGuard as a Guard module demonstrates the power of Safe's modular architecture
4. **User retention:** Users who feel more secure are less likely to leave the Safe ecosystem
5. **Revenue share:** SandGuard can share a percentage of subscription revenue for users acquired through Safe{Wallet}'s App Store

**What SandGuard gets:**
1. **Distribution:** Listing in Safe App Store = access to hundreds of thousands of Safe users
2. **Credibility:** "Official Safe ecosystem partner" is the strongest possible endorsement
3. **Technical access:** Deeper API integration, early access to new Safe features
4. **Co-marketing:** Joint blog posts, tweets, event appearances

### D.2 Mutual Benefits Summary

| Benefit | For Safe | For SandGuard |
|---------|----------|---------------|
| Security credibility | ✅ "Our ecosystem has a firewall" | ✅ "Official Safe partner" |
| ByBit hack response | ✅ Shows proactive security stance | ✅ Direct product-market fit story |
| User acquisition | ✅ More secure users = higher retention | ✅ Safe App Store = #1 distribution |
| Revenue | ✅ Revenue share from SandGuard subs | ✅ Access to Safe's user base |
| Guard module showcase | ✅ Demonstrates Safe's modularity | ✅ On-chain enforcement capability |
| Content | ✅ Security content for blog/socials | ✅ Co-branded authority content |

### D.3 Potential Integration Paths

1. **Safe App Store listing** (Phase 2) — SandGuard as a listed Safe App
2. **Official Guard recommendation** (Phase 3) — Safe recommends SandGuard Guard to users
3. **Built-in "Security Check" feature** (Phase 4) — SandGuard API powers a native security layer in Safe{Wallet}
4. **Co-branded "Safe × SandGuard" security tier** — Premium security features exclusively for Safe users

### D.4 Revenue Share Proposal

| Model | Details |
|-------|---------|
| **Referral fee** | Safe gets 20% of first-year subscription revenue from users acquired through Safe App Store |
| **Flat listing fee** | SandGuard pays Safe $X/month to be listed as a featured/promoted app |
| **Revenue share** | Ongoing 10% of all SandGuard revenue from Safe-originated users |
| **Free for Safe** | SandGuard listed for free; Safe benefits from ecosystem security story (preferred initial approach) |

**Recommendation:** Start with free listing (mutual benefit), offer revenue share once SandGuard has meaningful revenue. Don't let money be a blocker to getting listed.

---

## E. Competitive Landscape

### E.1 How Competitors Integrate with Safe

| Competitor | Safe Integration | How They Work |
|-----------|-----------------|---------------|
| **Pocket Universe** | ❌ No Safe integration. Browser extension for individual EOA wallets only. Intercepts transactions at the MetaMask/Rabby level. | Pre-sign simulation overlay |
| **Fire (fire.so)** | ❌ No Safe integration. Browser extension for individual wallets. | Transaction preview extension |
| **Blowfish** | 🟡 Partial. B2B API — wallet providers can integrate Blowfish's scanning API. No direct Safe App. Docs behind paywall (password-protected). | API-level transaction scanning |
| **Tenderly** | 🟡 General purpose. Can simulate any transaction including Safe txs, but not Safe-specific. Developer-focused, not end-user friendly. | Fork simulation + monitoring |
| **OpenZeppelin Defender** | 🟡 Enterprise-grade monitoring. Can monitor Safe transactions but is expensive ($500+/mo) and complex. | Sentinel monitoring + Relayer |
| **Safe{Wallet} native** | ✅ Obviously built-in, but no decode, no simulation, no risk scoring. Shows raw calldata or basic decode. | Basic queue management |

### E.2 The Gap SandGuard Can Own

```
                    SAFE-SPECIFIC
                         ▲
                         │
   Safe{Wallet}  ────── │ ─────── SandGuard 🎯
   (native, basic)       │        (deep security)
                         │
   ─────────────── CONSUMER ──────────── ENTERPRISE ──
                         │
   Pocket Universe  ──── │ ─────── Tenderly
   Fire.so               │        Blowfish API
   (EOA only)            │        OpenZeppelin
                         │
                         ▼
                   NOT SAFE-SPECIFIC
```

**SandGuard's unique position:** The only product that is BOTH Safe-specific AND consumer/prosumer priced.

- Pocket Universe/Fire: Great UX but don't work with Safe multisigs
- Tenderly/Blowfish: Powerful but not Safe-specific, enterprise-priced
- Safe native: Safe-specific but no simulation/risk scoring
- **SandGuard: Safe-specific + full security stack + $20/mo**

### E.3 SandGuard's Unique Angles

1. **The ONLY dedicated Safe transaction firewall** — No competitor focuses exclusively on Safe. This is our entire moat.

2. **Guard module** — No competitor offers an on-chain enforcement layer for Safe. Pocket Universe can warn you; SandGuard can actually block the transaction on-chain.

3. **AI risk scoring tailored to multisig context** — Generic tools don't understand the specific risks of multisig operations (ownership changes, threshold modifications, delegate calls, implementation upgrades).

4. **ByBit credibility** — We can concretely demonstrate how SandGuard would have prevented the largest crypto hack in history. No competitor can make this claim with the same specificity.

5. **24/7 queue monitoring** — No competitor monitors your Safe queue and alerts you about suspicious pending transactions as a continuous service.

6. **Safe App Store integration path** — By being inside Safe{Wallet}, we have zero-friction distribution. Extension-based competitors can't reach Safe users this way.

### E.4 Competitive Threats to Monitor

1. **Safe building native simulation** — If Safe adds built-in transaction simulation and risk scoring, it could reduce SandGuard's value. Mitigation: move fast, establish before they build it, offer features they'd rather outsource.
2. **Blowfish adding Safe support** — Blowfish is well-funded and their API could be integrated into Safe{Wallet} directly. Mitigation: our consumer UX + Guard module is harder to replicate via API alone.
3. **New Safe security startup** — Someone else could see the same gap. Mitigation: first-mover advantage + Safe App Store listing + Guard module deployment = defensible position.

---

## F. Implementation Roadmap

### Phase 1: UX Fixes (This Week)

**Goal:** Make SandGuard properly explain Safe, show branding, and validate addresses.

| Task | File(s) | Effort | Priority |
|------|---------|--------|----------|
| Add "Built for Safe" section to landing page | `Landing.tsx` | 2 hours | 🔴 Critical |
| Add Safe logo SVG asset | `public/safe-logo.svg` | 15 min | 🔴 Critical |
| Add "Don't have a Safe? Create one →" CTA | `Landing.tsx`, `Login.tsx` | 30 min | 🔴 Critical |
| Better Safe address input labels + help text | `Login.tsx`, `Settings.tsx` | 1 hour | 🔴 Critical |
| Basic address format validation (0x + 40 hex) | `Login.tsx`, `Settings.tsx` | 30 min | 🟡 High |
| "What is Safe?" tooltip or modal | New: `SafeExplainer.tsx` | 1 hour | 🟡 High |
| Add Safe links to footer | `Landing.tsx` | 15 min | 🟡 High |

### Phase 2: Safe App Store + API Integration (Next Week)

**Goal:** Submit to Safe App Store, add address validation via API.

| Task | File(s) | Effort | Priority |
|------|---------|--------|----------|
| Add `manifest.json` for Safe Apps | `public/manifest.json` | 30 min | 🔴 Critical |
| Install `@safe-global/safe-apps-sdk` | `package.json` | 30 min | 🔴 Critical |
| Auto-detect Safe context when running in iframe | New: `useSafeContext.ts` hook | 2 hours | 🔴 Critical |
| Validate address against Safe Transaction Service API | New: `safeApi.ts` | 2 hours | 🔴 Critical |
| Show Safe details (owners, threshold, modules) after validation | New: `SafeDetails.tsx` | 3 hours | 🟡 High |
| Enable CORS for `app.safe.global` | `backend/src/index.ts` | 15 min | 🔴 Critical |
| Submit Safe App listing request | External form | 1 hour | 🔴 Critical |
| Test as custom Safe App in Safe{Wallet} | Manual testing | 1 hour | 🔴 Critical |

### Phase 3: Partnership Outreach + Marketing (Month 1)

**Goal:** Formal outreach to Safe team, launch co-marketing.

| Task | Effort | Priority |
|------|--------|----------|
| Send partnership email to Safe BD (see draft below) | 1 hour | 🔴 Critical |
| Post "Why Every Safe Needs a Transaction Firewall" blog | 3 hours writing | 🔴 Critical |
| Post ByBit case study in Safe{DAO} forum | 1 hour (adapt existing) | 🔴 Critical |
| Start X/Twitter engagement campaign with Safe accounts | Ongoing | 🟡 High |
| Apply for SafeDAO ecosystem grant | 2 hours | 🟡 High |
| Create "Safe Security Best Practices" guide | 3 hours | 🟡 High |
| Propose Guard module to Safe team for feedback | 1 hour (email/DM) | 🟡 High |

### Phase 4: Deep Technical Integration (Month 2+)

**Goal:** Deploy Guard module, embedded Safe creation, deep API integration.

| Task | Effort | Priority |
|------|--------|----------|
| Develop SandGuardGuard.sol smart contract | 2 weeks | 🟡 High |
| Audit Guard contract (critical — broken guard = DoS) | External audit needed | 🔴 Critical |
| Deploy Guard to testnet → mainnet | 1 week | 🟡 High |
| Add "Install SandGuard Guard" button to UI | 1 week | 🟡 High |
| Embedded Safe creation via Safe{Core} SDK | 1 week | 🟢 Medium |
| Historical transaction analysis (baseline normal behavior) | 2 weeks | 🟢 Medium |
| Owner behavior anomaly detection | 2 weeks | 🟢 Medium |
| ENS resolution in address input | 1 day | 🟢 Medium |

---

## G. Concrete Code Changes

### G.1 Landing.tsx Changes

**Add "Built for Safe" section** after the "How it works" section:

```tsx
{/* Built for Safe section — add after "How it works" */}
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-slate-800/60">
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* Safe Logo */}
      <div className="flex-shrink-0">
        <img src="/safe-logo.svg" alt="Safe{Wallet}" className="h-16 w-auto" />
      </div>
      
      {/* Content */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-2xl font-bold mb-3">
          Built for <span className="text-emerald-400">Safe{'{'}Wallet{'}'}</span>
        </h2>
        <p className="text-slate-400 mb-4 leading-relaxed">
          Safe is the most trusted smart wallet infrastructure, securing over
          <strong className="text-slate-200"> $1 trillion</strong> in onchain assets.
          Used by Ethereum Foundation, Worldcoin, Vitalik Buterin, and thousands
          of DAOs. SandGuard adds the security layer every Safe needs.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
          <a
            href="https://app.safe.global/new-safe/create"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-5 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-medium"
          >
            Don't have a Safe? Create one →
          </a>
          <a
            href="https://safe.global"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Learn about Safe →
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Add Safe links to footer:**

```tsx
<footer className="border-t border-slate-800/60 py-8">
  <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Shield size={16} className="text-slate-500" />
      <span>SandGuard</span>
      <span>·</span>
      <span>supersandguard.com</span>
    </div>
    <div className="flex items-center gap-4 text-xs text-slate-600">
      <a href="https://safe.global" target="_blank" rel="noopener noreferrer"
         className="hover:text-slate-400 transition-colors">
        Built for Safe{'{'}Wallet{'}'}
      </a>
      <span>·</span>
      <span>© {new Date().getFullYear()} SandGuard</span>
    </div>
  </div>
</footer>
```

### G.2 Login.tsx Changes

**Update the free signup form** with better Safe-specific guidance:

```tsx
{/* Replace the current free signup step with Safe-aware version */}
{step === 'free' && !verifying && (
  <>
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">Start Free</h1>
      <p className="text-sm text-slate-400">
        Enter your Safe multisig address to get started
      </p>
    </div>
    <form onSubmit={handleFreeSignup} className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 block mb-1.5 flex items-center gap-2">
          <img src="/safe-logo.svg" alt="Safe" className="h-4 w-auto" />
          Safe Address
        </label>
        <input
          type="text" value={freeAddress}
          onChange={(e) => setFreeAddress(e.target.value)}
          placeholder="0x... or name.eth"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 text-center"
        />
        <p className="text-xs text-slate-600 mt-1.5">
          This is the address of your Safe multisig wallet, not your personal wallet.
          {' '}
          <a href="https://app.safe.global" target="_blank" rel="noopener noreferrer"
             className="text-emerald-500 hover:text-emerald-400">
            Find it in Safe{'{'}Wallet{'}'} →
          </a>
        </p>
      </div>
      {/* ... rest of form */}
    </form>
    
    {/* "Don't have a Safe?" callout */}
    <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/40 text-center">
      <p className="text-sm text-slate-400 mb-2">
        Don't have a Safe multisig yet?
      </p>
      <a
        href="https://app.safe.global/new-safe/create"
        target="_blank" rel="noopener noreferrer"
        className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
      >
        Create a Safe wallet — it takes 2 minutes →
      </a>
    </div>
    {/* ... */}
  </>
)}
```

### G.3 Settings.tsx Changes

**Enhance the Safe Multisig section:**

```tsx
{/* Enhanced Safe section */}
<div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
      <img src="/safe-logo.svg" alt="Safe" className="h-4 w-auto opacity-60" />
      Safe Multisig
    </h3>
    <a href="https://app.safe.global" target="_blank" rel="noopener noreferrer"
       className="text-xs text-emerald-500 hover:text-emerald-400">
      Open Safe{'{'}Wallet{'}'} ↗
    </a>
  </div>
  <div>
    <label className="text-xs text-slate-500 block mb-1">Safe Address</label>
    <input
      type="text"
      value={config.address}
      onChange={e => setConfig(c => ({ ...c, address: e.target.value }))}
      placeholder="0x... or name.eth"
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
    />
    <p className="text-xs text-slate-600 mt-1">
      Enter your Safe multisig address. 
      <a href="https://app.safe.global/new-safe/create" target="_blank"
         className="text-emerald-500 hover:text-emerald-400 ml-1">
        Don't have one? Create a Safe →
      </a>
    </p>
  </div>
  
  {/* SafeDetails component renders here when address is valid */}
  {config.address && <SafeDetails address={config.address} chainId={config.chainId} />}
  
  {/* ... network selector ... */}
</div>
```

### G.4 New Component: SafeExplainer.tsx

```tsx
// frontend/src/components/SafeExplainer.tsx
import { ExternalLink, Shield, Users, Lock } from 'lucide-react';

interface SafeExplainerProps {
  compact?: boolean;
}

export default function SafeExplainer({ compact = false }: SafeExplainerProps) {
  if (compact) {
    return (
      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <strong className="text-slate-400">What is Safe?</strong> Safe (formerly Gnosis Safe) is 
          the most trusted multisig wallet for Ethereum. It requires multiple signatures to approve 
          transactions, protecting your funds from single points of failure.
        </p>
        <a href="https://safe.global" target="_blank" rel="noopener noreferrer"
           className="text-emerald-500 hover:text-emerald-400 inline-flex items-center gap-1">
          Learn more <ExternalLink size={10} />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/60 space-y-4">
      <div className="flex items-center gap-3">
        <img src="/safe-logo.svg" alt="Safe" className="h-8 w-auto" />
        <h3 className="text-lg font-semibold">What is Safe{'{'}Wallet{'}'}?</h3>
      </div>
      
      <p className="text-sm text-slate-400 leading-relaxed">
        Safe is the most trusted smart wallet infrastructure in crypto, securing over 
        <strong className="text-slate-200"> $1 trillion</strong> in assets. It's used by 
        Ethereum Foundation, Vitalik Buterin, major DAOs, and thousands of teams.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2">
          <Users size={16} className="text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Multisig</p>
            <p className="text-xs text-slate-500">Multiple people must approve each transaction</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Lock size={16} className="text-cyan-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Smart Contract</p>
            <p className="text-xs text-slate-500">No single private key can drain funds</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Shield size={16} className="text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Modular</p>
            <p className="text-xs text-slate-500">Add Guards like SandGuard for extra security</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a href="https://app.safe.global/new-safe/create" target="_blank" rel="noopener noreferrer"
           className="text-sm px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors text-center font-medium">
          Create a Safe →
        </a>
        <a href="https://safe.global" target="_blank" rel="noopener noreferrer"
           className="text-sm px-4 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors text-center flex items-center justify-center gap-1">
          Learn more <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
```

### G.5 New Component: SafeDetails.tsx

```tsx
// frontend/src/components/SafeDetails.tsx
import { useState, useEffect } from 'react';
import { Check, AlertTriangle, ExternalLink, Shield, Users } from 'lucide-react';

interface SafeInfo {
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
  modules: string[];
  guard: string;
  version: string;
}

interface SafeDetailsProps {
  address: string;
  chainId: number;
}

const SAFE_SERVICE_URLS: Record<number, string> = {
  1: 'https://safe-transaction-mainnet.safe.global',
  8453: 'https://safe-transaction-base.safe.global',
  10: 'https://safe-transaction-optimism.safe.global',
  42161: 'https://safe-transaction-arbitrum.safe.global',
};

export default function SafeDetails({ address, chainId }: SafeDetailsProps) {
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setSafeInfo(null);
      setError('');
      return;
    }

    const fetchSafeInfo = async () => {
      setLoading(true);
      setError('');
      try {
        const baseUrl = SAFE_SERVICE_URLS[chainId];
        if (!baseUrl) {
          setError('Chain not supported');
          return;
        }
        const res = await fetch(`${baseUrl}/api/v1/safes/${address}/`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Not a Safe wallet on this network');
          } else {
            setError('Could not verify address');
          }
          return;
        }
        const data = await res.json();
        setSafeInfo(data);
      } catch {
        setError('Failed to connect to Safe service');
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSafeInfo, 500);
    return () => clearTimeout(timeout);
  }, [address, chainId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        Verifying Safe address...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-400">
        <AlertTriangle size={14} />
        {error}.{' '}
        <a href="https://app.safe.global/new-safe/create" target="_blank"
           className="text-emerald-500 hover:text-emerald-400">
          Create a Safe →
        </a>
      </div>
    );
  }

  if (!safeInfo) return null;

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-500/20 space-y-3">
      <div className="flex items-center gap-2">
        <Check size={14} className="text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-400">Valid Safe Wallet</span>
        <span className="text-xs text-slate-500">v{safeInfo.version}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex items-center gap-1 text-slate-500 mb-1">
            <Shield size={12} />
            Threshold
          </div>
          <p className="text-slate-300 font-medium">
            {safeInfo.threshold} of {safeInfo.owners.length} owners
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-slate-500 mb-1">
            <Users size={12} />
            Owners
          </div>
          <div className="space-y-0.5">
            {safeInfo.owners.slice(0, 3).map(o => (
              <p key={o} className="text-slate-400 font-mono text-[10px]">{truncate(o)}</p>
            ))}
            {safeInfo.owners.length > 3 && (
              <p className="text-slate-600">+ {safeInfo.owners.length - 3} more</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Modules:</span>
          <span className="text-slate-400">{safeInfo.modules.length}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Guard:</span>
          <span className={safeInfo.guard === ZERO_ADDRESS ? 'text-amber-400' : 'text-emerald-400'}>
            {safeInfo.guard === ZERO_ADDRESS ? 'None' : 'Active'}
          </span>
        </div>
        <a href={`https://app.safe.global/home?safe=${address}`}
           target="_blank" rel="noopener noreferrer"
           className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
          View <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
```

### G.6 New File: public/safe-logo.svg

Download from Safe's brand assets or use:
- Safe brand page: `https://safe.global` (inspect logo)
- Safe GitHub: `https://github.com/safe-global` (org avatar)
- Create a clean SVG with Safe's green shield mark

### G.7 New File: public/manifest.json (Safe Apps)

```json
{
  "name": "SandGuard",
  "description": "Transaction firewall for Safe — decode calldata, simulate transactions, and get AI risk scores before you sign. Never blind-sign again.",
  "iconPath": "logo.svg",
  "providedBy": {
    "name": "SandGuard",
    "url": "https://supersandguard.com"
  }
}
```

### G.8 Files Summary

| File | Action | What Changes |
|------|--------|-------------|
| `frontend/src/pages/Landing.tsx` | Edit | Add "Built for Safe" section, update footer with Safe links |
| `frontend/src/pages/Login.tsx` | Edit | Better labels ("Safe Address"), help text, "Create a Safe" CTA, Safe logo next to input |
| `frontend/src/pages/Settings.tsx` | Edit | Safe logo in header, "Open Safe{Wallet}" link, "Create a Safe" link, integrate SafeDetails component |
| `frontend/src/components/SafeExplainer.tsx` | **New** | Reusable component explaining what Safe is |
| `frontend/src/components/SafeDetails.tsx` | **New** | Shows Safe info (owners, threshold, modules, guard) after address validation |
| `frontend/public/safe-logo.svg` | **New** | Safe logo asset |
| `frontend/public/manifest.json` | **New** | Safe Apps manifest for App Store listing |
| `backend/src/index.ts` | Edit | Add `https://app.safe.global` to CORS allowed origins |
| `contracts/SandGuardGuard.sol` | **New** (Phase 4) | On-chain Guard smart contract |

---

## Appendix: Partnership Outreach Draft

### Email to Safe BD Team

**Subject:** SandGuard × Safe: Transaction firewall for the Safe ecosystem

---

Hi Safe team,

I'm Alberto, building **SandGuard** (supersandguard.com) — a transaction firewall built specifically for Safe{Wallet} users.

**What SandGuard does:**
SandGuard decodes calldata into plain English, simulates transactions before signing, and provides AI risk scoring — all designed for Safe multisig workflows. We're the "verification layer" that sits between your queue and your signers.

**Why this matters for Safe:**
The ByBit hack ($1.43B) showed that multisig authorization without transaction verification isn't enough. Signers approved a malicious implementation upgrade because they couldn't read the calldata. SandGuard makes every transaction readable, simulatable, and scorable before the first signature lands.

**What we'd love to explore:**
1. **Safe App Store listing** — SandGuard as a listed Safe App, auto-detecting Safe context when running inside Safe{Wallet}
2. **Guard module collaboration** — We're developing a SandGuard Guard contract (implementing IGuard) that can block risky transactions on-chain. We'd love your team's technical feedback.
3. **Co-marketing** — Joint content on multisig security, featuring SandGuard as the ecosystem answer to blind signing attacks

**What's in it for Safe:**
- Stronger security story: "The Safe ecosystem has a dedicated transaction firewall"
- Direct response to ByBit criticism: proactive security tooling
- Guard module showcase: demonstrates Safe's modular architecture in action
- We're happy to discuss revenue sharing for users acquired through Safe App Store

**Current traction:**
- Live at supersandguard.com
- Supports Ethereum, Base, Optimism, Arbitrum
- Free tier + Pro ($20/mo)
- Active on X (@beto_neh) and in the Base ecosystem

Would love to set up a 15-minute call to discuss how we can work together to make Safe users safer.

Best,
**Alberto**
SandGuard — supersandguard.com
@beto_neh on X

---

### DM Version (Twitter/X — to @safe or @luaborges or @richardmeissner)

> Hey @safe team 👋 I built SandGuard (supersandguard.com) — a transaction firewall specifically for Safe multisig. It decodes calldata, simulates txs, and risk-scores everything before signers approve.
>
> After the ByBit hack showed that blind signing is the #1 multisig threat, we think every Safe needs a verification layer.
>
> Would love to explore: Safe App Store listing + Guard module integration + co-marketing. Who's the best person to chat with?

---

## Appendix: Social Media Content

### Tweet Ideas (tag @safe)

**Tweet 1: Value Prop**
> Your @safe multisig has authorization security (multiple signatures).
> 
> But does it have verification security?
> 
> SandGuard decodes every transaction into plain English, simulates the outcome, and scores the risk — before anyone signs.
> 
> The firewall every Safe needs 🛡️
> supersandguard.com

**Tweet 2: ByBit Hook**
> The ByBit hack didn't exploit code. It exploited trust.
> 
> All signers saw a legit @safe UI. All approved. $1.43B gone.
> 
> The calldata told the real story — a delegateCall to a malicious implementation contract.
> 
> SandGuard reads the calldata so you don't have to read Solidity.
> supersandguard.com

**Tweet 3: Technical/Educational**
> What does a Safe Guard module actually do? 🧵
> 
> A Guard sits between your signers and transaction execution. It can:
> ✅ Check every parameter before a tx executes
> ✅ Verify the final state after execution
> ❌ Block transactions that fail its rules
> 
> We're building a SandGuard Guard that blocks:
> • delegateCalls to unverified contracts
> • Unlimited token approvals
> • Implementation upgrades
> • Suspicious drain patterns
> 
> If ByBit had this, $1.43B stays in the wallet.
> 
> @safe's modular architecture makes this possible. Built for Safe. 🏗️

**Tweet 4: Social Proof / Stat-based**
> $2.2B stolen from crypto in 2024.
> 43.8% from key compromises.
> $1.43B from one blind-signing attack on a @safe multisig.
> 
> Not code exploits. Not flash loans. Just humans signing things they couldn't read.
> 
> SandGuard: decode, simulate, score. Before you sign.
> Free tier → supersandguard.com

**Tweet 5: Community/Engagement**
> Poll for @safe users:
> 
> When you approve a multisig transaction, do you:
> 
> 🔴 Trust the proposer and sign
> 🟡 Check the destination address
> 🟢 Read the decoded calldata
> ⚡ Simulate the full outcome first
> 
> (If you picked anything but ⚡, you need SandGuard)

**Tweet 6: Partner-positioning**
> .@safe built the most trusted multisig infrastructure in crypto. $1T+ in volume. Used by ETH Foundation, Vitalik, thousands of DAOs.
> 
> We built the security layer on top.
> 
> SandGuard = transaction firewall for Safe.
> Decode. Simulate. Score. Before you sign.
> 
> The combination that would have stopped the ByBit hack.

---

## Summary: Strategic Priorities

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| 🔴 #1 | Add Safe explanation + branding to UX | High — reduces confusion, improves conversion | Low |
| 🔴 #2 | Submit to Safe App Store | Critical — #1 distribution channel | Medium |
| 🔴 #3 | Send partnership outreach to Safe team | High — opens co-marketing + technical collab | Low |
| 🔴 #4 | Post ByBit case study in Safe{DAO} forum | High — establishes credibility with target audience | Low |
| 🟡 #5 | Build Safe address validation + SafeDetails component | Medium — improves trust + UX | Medium |
| 🟡 #6 | Start X/Twitter engagement with Safe ecosystem | Medium — builds visibility over time | Ongoing |
| 🟡 #7 | Write "Why Every Safe Needs a Firewall" blog post | Medium — SEO + content marketing | Medium |
| 🟢 #8 | Develop SandGuard Guard smart contract | High long-term — on-chain enforcement moat | High |
| 🟢 #9 | Embedded Safe creation in SandGuard | Medium — reduces friction for new users | High |
| 🟢 #10 | Apply for SafeDAO ecosystem grant | Medium — funding + credibility | Low |

---

*This strategy positions SandGuard as the essential security infrastructure for Safe{Wallet}. The gap in the market is clear: no product offers Safe-specific transaction verification at a consumer price point. By integrating deeply at every level — UX, on-chain, marketing, and partnership — SandGuard can own this category before anyone else notices it's empty.*

*— SandGuard Strategy, February 2, 2026*
