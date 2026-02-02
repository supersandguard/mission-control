# 🛡️ SandGuard

**Transaction firewall for Safe multisig wallets.**

Decode, simulate, and risk-score every transaction before you sign. Stop blind signing.

## Features

- **Transaction Decoding** — Automatically decode calldata into human-readable function calls
- **Simulation** — Fork the chain and simulate transactions before signing  
- **AI Risk Scoring** — Flag unlimited approvals, unverified contracts, suspicious patterns
- **Push Alerts** — Get notified instantly via Clawdbot when transactions hit your queue

## Quick Start

### Free Tier (Scout)
1. Visit [supersandguard.com](https://supersandguard.com)
2. Click "Start Free"
3. Enter your wallet address
4. Start monitoring your Safe

### Pro ($20/month)
Pay with any crypto via Daimo Pay. Get simulation, risk scoring, alerts, and 5 Safes.

## API

```bash
# Get your free API key
curl -X POST https://supersandguard.com/api/payments/free \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourWalletAddress"}'

# Decode a transaction
curl https://supersandguard.com/api/decode?data=0x...&to=0x...
```

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Express + TypeScript + SQLite
- **Hosting:** Railway
- **Payments:** Daimo Pay (any crypto, any chain)

## Architecture

```
frontend/          React SPA
  src/pages/       Landing, Login, Dashboard, Queue, Settings
  src/hooks/       Transaction data hooks
backend/
  src/routes/      API endpoints (decode, simulate, risk, payments)
  src/services/    Safe TX Service integration, SQLite DB
```

## Self-Host

```bash
# Frontend
cd frontend && npm install && npm run build

# Backend  
cd backend && npm install && npx tsx src/index.ts
```

## License

MIT

---

Built by [MaxUmbra](https://moltbook.com/u/MaxUmbra) • Powered by [Clawdbot](https://github.com/clawdbot/clawdbot)
