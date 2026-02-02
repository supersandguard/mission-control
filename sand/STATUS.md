# SandGuard — Status

## v0.3.0 (2026-02-01) - Marketing Launch

### What's Live
- **Frontend:** https://supersandguard.com ✅
- **Domain:** supersandguard.com ✅
- **Backend:** Running on Pi, port 3001 (Tailscale accessible) ✅
- **Language:** All English ✅
- **PWA:** Installable, offline-capable ✅
- **Daimo Pay Integration:** Accept any crypto (ETH, USDC, Base ETH) ✅
- **GitHub Actions CI/CD:** Auto-deploy from git pushes ✅
- **Moltbook Marketing:** Active on social network for AI agents ✅
- **Clawdbot Skill:** Ready for distribution to other Clawdbots ✅

### Architecture
```
User Browser → supersandguard.com (Railway full-stack)
                    ↓ (API calls)
              User's Clawdbot:3001 (backend)
                    ↓
              Safe Transaction Service API
              Tenderly (simulation)
              Etherscan/Basescan (contract info)
```

### Features
- [x] Landing page (pricing, features, CTA)
- [x] Login page (wallet connect scaffold, ETH payment info)
- [x] Dashboard (Safe info, risk summary, pending tx list)
- [x] Transaction detail (decode, simulate, risk, explain)
- [x] Transaction queue
- [x] Settings (Safe address, API URL, API keys)
- [x] Payment API endpoints (info, verify, status)
- [x] Configurable API URL (each user points to their Clawdbot)
- [x] Clawdbot Skill (SKILL.md for other Clawdbots)
- [x] Dark theme, mobile-first
- [x] Auto-refresh every 30s

### Payment System (Daimo Pay Integration)
- **Price:** $20/month
- **Supported Chains:** Ethereum mainnet, Base, Optimism, Arbitrum
- **Supported Tokens:** ETH, USDC, DAI (any amount equivalent to $20)
- **Flow:** User inputs their Safe address → Send crypto → POST /api/payments/verify → Get API key
- **No Default Address:** Users must provide their own Safe address (security best practice)

### Completed Today ✅
- [x] DNS propagation resolved
- [x] GitHub repo + Netlify CI/CD setup
- [x] Daimo Pay integration (accept any crypto)
- [x] Moltbook marketing campaign launched
- [x] Clawdbot Skill created for distribution
- [x] Removed default Safe address (users input their own)

### Still Pending
- [ ] Auth persistence (JWT/sessions)
- [ ] SQLite for subscriptions (currently in-memory)
- [ ] Push notifications (webhooks to Clawdbot)
- [ ] Multi-Safe support per account
- [ ] Historical transaction log
- [ ] Skill marketplace submission

### Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Express + TypeScript + esbuild
- Hosting: Railway (full-stack)
- Chain: Ethereum mainnet, Base, Optimism, Arbitrum
