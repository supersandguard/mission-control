# SandGuard - Transaction Firewall PWA

## Vision
A PWA that acts as a personal transaction firewall for crypto wallets. 
Simulates, decodes, and explains every transaction before you sign.
"Don't trust, verify — without needing to read Solidity."

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    PWA (React)                   │
│  ┌───────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ Dashboard  │ │ TX Queue │ │  Sign / Reject  │ │
│  │ Balances   │ │ Simulate │ │  Push Notifs    │ │
│  │ History    │ │ Explain  │ │  Risk Score     │ │
│  └───────────┘ └──────────┘ └─────────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ API
┌──────────────────────▼──────────────────────────┐
│                Backend (Node.js)                 │
│  ┌────────────┐ ┌───────────┐ ┌───────────────┐ │
│  │ Safe SDK   │ │ Tenderly  │ │ ABI Decoder   │ │
│  │ Propose TX │ │ Simulate  │ │ Known contracts│ │
│  │ Sign TX    │ │ Fork/Run  │ │ Etherscan API │ │
│  └────────────┘ └───────────┘ └───────────────┘ │
│  ┌────────────┐ ┌───────────┐ ┌───────────────┐ │
│  │ Risk Engine│ │ LLM Layer │ │ Push Service  │ │
│  │ Policies   │ │ Explain TX│ │ Web Push API  │ │
│  │ Whitelist  │ │ in Spanish│ │ Notifications │ │
│  └────────────┘ └───────────┘ └───────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌───────────┐  ┌──────────┐
   │  Safe   │  │ Tenderly  │  │ Ethereum │
   │  API    │  │   API     │  │ RPC/Node │
   └─────────┘  └───────────┘  └──────────┘
```

## Multisig Setup
- **Safe 2-of-3**: Agent (1 key) + User (2 keys)
- Agent proposes → User reviews in PWA → User signs (1 of their 2 keys) → TX executes
- Agent can NEVER execute alone

## Core Features

### 1. Transaction Queue
- Agent (Clawd) proposes txs via Safe SDK
- TX appears in queue with pending status
- Push notification sent to user

### 2. Transaction Simulation
- Tenderly Simulation API forks the chain
- Runs the TX in sandbox
- Returns: balance changes, events emitted, gas used, state changes
- Shows before/after of ALL affected balances

### 3. Calldata Decoding
- Fetch ABI from Etherscan (verified contracts)
- Decode function name + parameters
- Known protocol detection (Morpho, Aave, Uniswap, Safe, ERC20)
- Show: "This calls deposit(uint256 5000000000) on Morpho Vault"

### 4. Human-Readable Explanation
- LLM takes decoded calldata + simulation results
- Generates plain Spanish explanation:
  "Vas a depositar 5,000 USDC en la vault de Steakhouse/Morpho. 
   Tu balance de USDC baja 5,000. Recibes 4,987 shares del vault."
- Highlights anything unexpected

### 5. Risk Scoring
- 🟢 Green: Known contract, verified, matches expected behavior
- 🟡 Yellow: Unverified contract, unusual parameters, large amount
- 🔴 Red: Unlimited approval, unverified proxy, new contract, drain pattern

### 6. Policy Engine
- User-defined rules:
  - Max single transfer amount
  - Whitelist of allowed contracts
  - Block unlimited approvals
  - Require extra confirmation for large TXs
  - Time-lock for certain operations

## Tech Stack
- **Frontend**: React + Vite PWA, TailwindCSS, ethers.js
- **Backend**: Node.js + Express (or Hono for edge)
- **Database**: SQLite (simple, local-first)
- **APIs**: Safe SDK, Tenderly, Etherscan, OpenAI/Anthropic
- **Push**: Web Push API + service worker
- **Chain**: Ethereum mainnet + Base (where Alberto operates)

## MVP Scope (v0.1)
1. ✅ PWA shell with install prompt
2. ✅ Connect to existing Safe (read pending TXs)
3. ✅ Simulate any pending TX via Tenderly
4. ✅ Decode calldata for known protocols
5. ✅ LLM explanation in Spanish
6. ✅ Risk score (basic)
7. ✅ Approve/reject from PWA
8. ❌ Push notifications (v0.2)
9. ❌ Policy engine (v0.2)
10. ❌ Agent auto-propose (v0.3)

## File Structure
```
sand/
├── frontend/          # React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── safe.ts
│   │   │   ├── tenderly.ts
│   │   │   ├── decoder.ts
│   │   │   ├── risk.ts
│   │   │   └── explainer.ts
│   │   └── index.ts
│   └── package.json
└── ARCHITECTURE.md
```
