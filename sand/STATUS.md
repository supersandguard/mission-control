# SandGuard - Transaction Firewall PWA
## Status: MVP v0.1 Running ✅

### Access
- **Frontend:** http://100.105.206.114:3000 (Tailscale)
- **Backend:** http://100.105.206.114:3001/api/health (Tailscale)
- **Local:** http://localhost:3000 (frontend) / http://localhost:3001 (backend)

### What's Built
- [x] Backend API (Express + TypeScript)
  - GET /api/safe/:address/transactions — fetch pending txs from Safe TX Service
  - POST /api/simulate — simulate tx (mock data, Tenderly-ready)
  - POST /api/decode — decode calldata (ethers.js + Etherscan ABI)
  - POST /api/explain — human-readable Spanish explanation
  - POST /api/risk — risk scoring (green/yellow/red)
  - GET /api/health — health check
- [x] Frontend PWA (React + Vite + Tailwind)
  - Dashboard with Safe info, balances, pending txs
  - TX Queue with risk badges
  - TX Detail with simulation, decode, explanation, risk, approve/reject
  - Settings page (Safe config, policies, API keys)
  - PWA installable (manifest + service worker)
  - Dark theme, mobile-first
- [x] Mock data with 3 realistic transactions:
  - 🟢 Aave V3 supply (5,000 USDC)
  - 🔴 Unlimited USDC approval to 1inch
  - 🟡 Large transfer to unknown contract

### What's Next (v0.2)
- [ ] Connect frontend to backend API (currently using mock data)
- [ ] Real Safe TX fetching (just needs Safe address)
- [ ] Tenderly API integration (needs API key)
- [ ] Push notifications
- [ ] Policy engine (auto-block unlimited approvals)
- [ ] Actual signing via Safe SDK

### Architecture
See ARCHITECTURE.md for full details.

### Running
```bash
# Backend
cd sand/backend && npx tsx src/index.ts

# Frontend (dev)
cd sand/frontend && npx vite --host

# Frontend (production build)
cd sand/frontend && npx vite build
cd sand/frontend/dist && python3 -m http.server 3000 --bind 0.0.0.0
```
