# 🛡️ SandGuard

**Transaction Firewall for Safe Multisig** — works with Clawdbot

Don't trust, verify — without reading Solidity. SandGuard decodes, simulates, and risk-scores every pending transaction before you sign.

## Features

- **🔍 Decode** — Automatically decode calldata into human-readable function calls. Identifies known protocols (Aave, Uniswap, Morpho, etc.)
- **⚡ Simulate** — Fork the chain and simulate transactions before signing. See exact balance changes, gas costs, and state diffs.
- **🛡️ Risk Score** — AI-powered risk analysis flags unlimited approvals, unverified contracts, and suspicious patterns.
- **🔔 Push Alerts** — Get notified instantly when new transactions hit your queue via Clawdbot.
- **📱 PWA** — Installable as a mobile app. Works offline with cached data.

## Pricing

**$20/month, paid in ETH.**

Payment address: `0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84`

Accepts ETH on Ethereum mainnet or Base.

## Architecture

```
┌─────────────────────────────┐
│     Frontend (React PWA)    │
│   Vite + Tailwind + TS      │
│   Landing / Login / App     │
└──────────────┬──────────────┘
               │ /api/*
┌──────────────▼──────────────┐
│   Netlify Functions          │
│   (Express via serverless-http) │
└──────────────┬──────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Safe   │ │Tenderly│ │Etherscan│
│ API    │ │  API   │ │ V2 API │
└────────┘ └────────┘ └────────┘
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/safe/:address/info` | Safe config (owners, threshold) |
| GET | `/api/safe/:address/transactions` | Pending transactions |
| POST | `/api/simulate` | Simulate a transaction |
| POST | `/api/decode` | Decode calldata |
| POST | `/api/explain` | Human-readable explanation |
| POST | `/api/risk` | Risk score assessment |
| GET | `/api/poll/:address` | Poll for new transactions |

## Setup

### Prerequisites

- Node.js 22+
- npm

### Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Run frontend (port 3000)
cd frontend && npm run dev

# Run backend (port 3001)
cd backend && npx tsx src/index.ts

# Set API URL for local dev
# Create frontend/.env.local:
VITE_API_URL=http://localhost:3001
```

### Production (Netlify)

1. Connect the repo to Netlify
2. Set build settings:
   - Base directory: `sand/`
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
3. Set environment variables in Netlify dashboard:
   - `ETHERSCAN_API_KEY`
   - `TENDERLY_ACCESS_KEY`
   - `TENDERLY_ACCOUNT`
   - `TENDERLY_PROJECT`

### Build

```bash
# Frontend
cd frontend && npm run build

# Backend (standalone)
cd backend && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/server.cjs --external:ethers --format=cjs
```

## Domain

**supersandguard.com** (registered via Njalla)

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, React Router 7, PWA
- **Backend:** Express 4, TypeScript, ethers.js 6
- **Deployment:** Netlify (Functions + Static)
- **APIs:** Safe Transaction Service, Etherscan V2, Tenderly
- **Integration:** Clawdbot (push notifications, Safe management)

## License

Private — All rights reserved.
