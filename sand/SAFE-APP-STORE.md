# Safe App Store Listing — SandGuard

> **Status:** 🔴 NOT YET SUBMITTED
> **Last Updated:** 2026-02-02
> **Priority:** #1 — This is our biggest distribution channel

---

## TL;DR — What Needs to Happen

1. ⬜ **Fill out the [Pre-Assessment Form](https://forms.gle/PcDcaVx715LKrrQs8)** — Required first step
2. 🟡 **Verify iframe works** — Railway injects `X-Frame-Options: DENY` but CSP `frame-ancestors` should override it
3. ⬜ **Integrate Safe Apps SDK** — Auto-detect Safe address, no manual login needed
4. ⬜ **Create manifest.json** — Required at root URL (`/manifest.json`)
5. ⬜ **Add UTM parameter support** — `?utm_source=SafeWallet`
6. ⬜ **Wait for Safe team review** — They review code + do functional QA
7. ⬜ **Get listed on staging** → production launch with joint announcement

**Estimated timeline:** 1–2 weeks dev work + 2–4 weeks review process

---

## 1. Requirements Checklist

### Submission Requirements (from safe-global/safe-apps-list)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Pre-assessment form submitted | ⬜ Not done | **MUST do first** — [Form link](https://forms.gle/PcDcaVx715LKrrQs8) |
| 2 | manifest.json at root URL | ⬜ Not done | Need to create and serve at `/manifest.json` |
| 3 | App icon (square SVG, ≥128x128) | ✅ Exists | `/icon.svg` — 100x100 viewBox, need to verify ≥128px render |
| 4 | App name (max 50 chars) | ✅ Ready | "SandGuard" (9 chars) |
| 5 | App description (max 200 chars) | ⬜ Draft needed | See draft below |
| 6 | Smart contract audit | ✅ N/A | SandGuard has no smart contracts — it's a read-only analysis tool |
| 7 | Auto-connect to Safe | ⬜ Not done | Need Safe Apps SDK integration |
| 8 | CORS headers on manifest.json | ⬜ Partially | Backend CORS includes `app.safe.global` but needs verification |
| 9 | Source code accessible | ✅ Done | Public repo: https://github.com/supersandguard/sandguard |
| 10 | Test plan / feature list | ⬜ Not done | Need to write QA guide |
| 11 | Transaction decoding (ABIs) | ✅ N/A | SandGuard doesn't deploy contracts |
| 12 | UTM parameter support | ⬜ Not done | Need `?utm_source=SafeWallet` support |
| 13 | Iframe compatible | 🟡 Likely OK | Railway injects `X-Frame-Options: DENY` but CSP `frame-ancestors` overrides it in modern browsers |

### Technical Requirements

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| A | Safe Apps SDK installed | ⬜ Not done | `@safe-global/safe-apps-sdk` + `@safe-global/safe-apps-react-sdk` |
| B | SafeProvider wrapper | ⬜ Not done | Wrap app in `<SafeProvider>` |
| C | Auto-detect Safe address | ⬜ Not done | `useSafeAppsSDK()` → `safe.safeAddress` |
| D | Works outside Safe (standalone) | ✅ Done | Current login flow works fine standalone |
| E | No X-Frame-Options blocking | 🟡 Likely OK | Railway injects it but CSP `frame-ancestors` overrides in modern browsers |
| F | CSP frame-ancestors allows Safe | ✅ Done | Already includes `https://app.safe.global https://*.safe.global` |
| G | CORS allows Safe origin | ✅ Done | Backend CORS includes `https://app.safe.global` |

---

## 2. X-Frame-Options: DENY (Railway Edge)

### Problem
Railway's edge server automatically injects `X-Frame-Options: DENY` on all responses:

```
$ curl -sI https://supersandguard.com/
server: railway-edge
x-frame-options: DENY
```

Our backend code does NOT set this header (we intentionally removed it). Railway's infrastructure adds it.

### ✅ Good News: CSP frame-ancestors Takes Precedence

Per the CSP Level 3 spec and confirmed by MDN docs: **when both `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` are present, `frame-ancestors` takes precedence** in all modern browsers (Chrome, Firefox, Safari, Edge).

Our backend already sends:
```
Content-Security-Policy: frame-ancestors 'self' https://app.safe.global https://*.safe.global
```

**This means Safe's iframe should work despite Railway's X-Frame-Options header.** All Safe users use modern browsers.

### Still Recommended: Remove X-Frame-Options If Possible

Even though CSP overrides it, having conflicting headers is messy. Options:

**Option A: Railway dashboard or `railway.toml` header override**
```toml
[deploy]
headers = { "X-Frame-Options" = "" }
```

**Option B: Override in Express** (may not work since Railway edge adds it after)
```typescript
res.removeHeader('X-Frame-Options');
```

**Option C: Verify it works first, then clean up later**
- Test as custom Safe App now — if CSP override works, this is low priority
- Clean up the header later for best practices

### Recommended: Option C — test first, the CSP should be sufficient

---

## 3. Safe Apps SDK Integration Plan

### Packages to Install

```bash
cd frontend
npm install @safe-global/safe-apps-sdk @safe-global/safe-apps-react-sdk
```

### Architecture Changes

#### 3.1 Detect Safe App Context

Create a new hook: `src/hooks/useSafeApp.ts`

```typescript
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';

export function useSafeApp() {
  try {
    const { sdk, connected, safe } = useSafeAppsSDK();
    return {
      isSafeApp: connected,
      safeAddress: safe.safeAddress,
      chainId: safe.chainId,
      sdk,
    };
  } catch {
    // Not running inside SafeProvider — standalone mode
    return {
      isSafeApp: false,
      safeAddress: null,
      chainId: null,
      sdk: null,
    };
  }
}
```

#### 3.2 Wrap App in SafeProvider

Update `src/main.tsx`:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import SafeProvider from '@safe-global/safe-apps-react-sdk'
import { TransactionsProvider } from './context/TransactionsContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeProvider>
      <BrowserRouter>
        <TransactionsProvider>
          <App />
        </TransactionsProvider>
      </BrowserRouter>
    </SafeProvider>
  </StrictMode>,
)
```

**Note:** `SafeProvider` shows a loading state while detecting whether we're in a Safe iframe. Outside of Safe, it will eventually resolve with `connected: false`.

#### 3.3 Auto-Login When Inside Safe

Update `src/App.tsx` to auto-login when running as a Safe App:

```typescript
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';

function SafeAutoLogin() {
  const { connected, safe } = useSafeAppsSDK();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected && safe.safeAddress && !isAuthenticated) {
      // Auto-create free account or recover existing one
      const autoLogin = async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_URL || '';
          // Try to recover existing subscription first
          let response = await fetch(`${API_BASE}/api/payments/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: safe.safeAddress }),
          });
          let data = await response.json();
          
          if (!response.ok) {
            // No existing account — create free one
            response = await fetch(`${API_BASE}/api/payments/free`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: safe.safeAddress }),
            });
            data = await response.json();
          }
          
          if (data.apiKey) {
            login(data.apiKey, safe.safeAddress);
            navigate('/app');
          }
        } catch (err) {
          console.error('Safe App auto-login failed:', err);
        }
      };
      autoLogin();
    }
  }, [connected, safe.safeAddress, isAuthenticated]);

  return null;
}
```

#### 3.4 Skip Landing/Login Pages in Safe Context

When loaded inside Safe, skip the landing page and go directly to the dashboard:

```typescript
// In App.tsx routes
function AppRoutes() {
  const { connected } = useSafeAppsSDK();
  
  return (
    <Routes>
      {/* If in Safe App, redirect root to /app */}
      <Route path="/" element={connected ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={connected ? <Navigate to="/app" replace /> : <Login />} />
      
      {/* App pages */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/queue" element={<TxQueue />} />
        <Route path="/app/tx/:id" element={<TxDetail />} />
        <Route path="/app/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
```

#### 3.5 Use HashRouter for Iframe Compatibility

Safe Apps run inside an iframe. `BrowserRouter` can have issues because the iframe URL is controlled by Safe. Switch to `HashRouter`:

```typescript
import { HashRouter } from 'react-router-dom'

// In main.tsx — use HashRouter when inside Safe App
const RouterComponent = window.parent !== window ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeProvider>
      <RouterComponent>
        <TransactionsProvider>
          <App />
        </TransactionsProvider>
      </RouterComponent>
    </SafeProvider>
  </StrictMode>,
)
```

#### 3.6 UTM Parameter Support

Add UTM tracking detection:

```typescript
// src/utils/tracking.ts
export function getUTMSource(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('utm_source');
}

export function isSafeWalletReferral(): boolean {
  return getUTMSource() === 'SafeWallet';
}
```

---

## 4. manifest.json

Create at `frontend/public/manifest.json`:

```json
{
  "name": "SandGuard",
  "description": "Transaction firewall for Safe multisig. Decode, simulate, and risk-score every transaction before signing.",
  "iconPath": "icon.svg",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Important:** The `manifest.json` must be served with CORS headers allowing `https://app.safe.global` to fetch it.

### CORS for manifest.json

Our backend CORS already allows `app.safe.global`. Since the manifest is served as a static file through Express, CORS should apply. But we need to verify the Express static middleware sends CORS headers. Add explicit handling if needed:

```typescript
// In backend/src/index.ts — ensure CORS applies to all static files
app.use((req, res, next) => {
  if (req.path === '/manifest.json') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
  next();
});
```

---

## 5. Icon Requirements

**Current icon:** `icon.svg` — 100x100 viewBox with shield + checkmark gradient (emerald → cyan)

**Requirement:** Square SVG, at least 128x128 pixels.

**Action needed:** The SVG `viewBox` is `0 0 100 100`. This should render fine at any size (SVGs are scalable), but to be safe, consider adding `width="128" height="128"` attributes:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="128" height="128">
```

The existing icon design (green-cyan gradient shield with checkmark) is clean and professional. ✅

---

## 6. App Description (max 200 chars)

**Option A (190 chars):**
> Transaction firewall for Safe multisig. Decode calldata, simulate on forks, and AI risk-score every transaction before signing. Stop blind signing.

**Option B (148 chars):**
> Decode, simulate, and risk-score every Safe transaction before signing. Your transaction firewall against blind signing.

**Option C (124 chars):**
> Transaction firewall for Safe. Decode calldata, simulate transactions, and risk-score before you sign.

**Recommended: Option B** — punchy and descriptive.

---

## 7. Pre-Assessment Form — Draft Answers

The form at https://forms.gle/PcDcaVx715LKrrQs8 likely asks these questions (based on community reports):

| Question | Answer |
|----------|--------|
| **App name** | SandGuard |
| **App URL** | https://supersandguard.com |
| **Short description** | Transaction firewall for Safe multisig. Decode, simulate, and risk-score every transaction before signing. |
| **Category** | Security / Transaction Analysis |
| **Networks supported** | Ethereum, Base, Arbitrum, Polygon, Optimism, and all chains supported by Safe |
| **Does it include smart contracts?** | No — SandGuard is a read-only analysis tool. It doesn't deploy or interact with custom contracts. |
| **GitHub repo** | https://github.com/supersandguard/sandguard |
| **Contact** | (Alberto's email/Discord) |
| **How does it interact with Safe?** | SandGuard monitors pending transactions in the Safe queue, decodes calldata, simulates them on forked chains, and provides risk assessments before owners sign. |

---

## 8. Test Plan / QA Feature List

For the Safe team's functional review:

### Core Flows

1. **Auto-connect in Safe iframe**
   - Open SandGuard from Safe App Store
   - App should automatically detect the Safe address (no manual input)
   - User lands on the Dashboard

2. **Transaction queue view**
   - Shows pending transactions for the connected Safe
   - Each transaction displays decoded calldata (function name, parameters)

3. **Transaction detail**
   - Click a pending transaction to see full details
   - Decoded calldata in human-readable format
   - Target contract information
   - Risk indicators (unlimited approvals, unverified contracts)

4. **Simulation (Pro feature)**
   - Fork simulation results showing expected state changes
   - Balance changes preview

5. **Risk scoring (Pro feature)**
   - AI-powered risk assessment
   - Flags suspicious patterns

6. **Standalone mode**
   - Works normally when opened outside Safe (direct URL)
   - Manual address entry on login page

### Video Walkthrough
- TODO: Record a 2-3 minute video demonstrating the above flows

---

## 9. Draft PR to safe-global/safe-apps-list

### PR Title
`Add SandGuard — Transaction Firewall for Safe Multisig`

### PR Description

```markdown
## App Information

- **Name:** SandGuard
- **URL:** https://supersandguard.com?utm_source=SafeWallet
- **Description:** Transaction firewall for Safe multisig. Decode, simulate, and risk-score every transaction before signing.
- **Icon:** https://supersandguard.com/icon.svg
- **Networks:** Ethereum, Base, Arbitrum, Polygon, Optimism, Gnosis
- **Category:** Security

## What does it do?

SandGuard helps Safe owners understand what they're signing. For every pending transaction, it:

1. **Decodes calldata** into human-readable function calls and parameters
2. **Simulates execution** on forked chains to preview exact outcomes
3. **Risk scores** transactions using AI to flag unlimited approvals, unverified contracts, and suspicious patterns

No more blind signing.

## Technical Details

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + TypeScript (hosted on Railway)
- **Smart Contracts:** None — SandGuard is read-only
- **Source Code:** https://github.com/supersandguard/sandguard (MIT License)
- **Safe Apps SDK:** Integrated with `@safe-global/safe-apps-react-sdk`
- **Auto-connect:** Yes — automatically detects Safe address via SDK

## Pre-Assessment

Pre-assessment form submitted on [DATE].

## Checklist

- [x] manifest.json at root URL
- [x] SVG icon ≥128x128
- [x] CORS headers configured
- [x] Auto-connects to Safe
- [x] Public source code
- [x] UTM parameter support
- [x] No smart contracts (no audit needed)
```

---

## 10. Implementation Timeline

### Phase 1: Verify Iframe + Manifest (Day 1)
- [ ] Test loading supersandguard.com as custom Safe App on https://app.safe.global
  - CSP `frame-ancestors` should override Railway's `X-Frame-Options: DENY`
  - If it doesn't work, try `railway.toml` header override or move frontend hosting
- [ ] Deploy manifest.json and verify it's served with proper CORS
- [ ] Fill out the pre-assessment form (can do this in parallel)

### Phase 2: SDK Integration (Days 3-5)
- [ ] Install `@safe-global/safe-apps-sdk` and `@safe-global/safe-apps-react-sdk`
- [ ] Add `SafeProvider` wrapper
- [ ] Implement `useSafeApp` hook
- [ ] Auto-login flow when inside Safe iframe
- [ ] Skip landing page when in Safe context
- [ ] Test with HashRouter for iframe compatibility
- [ ] Add UTM parameter tracking

### Phase 3: Create manifest.json + Polish (Day 6)
- [ ] Create `manifest.json` in `/public`
- [ ] Update icon SVG with explicit 128x128 dimensions
- [ ] Test as custom Safe App on https://app.safe.global
- [ ] Verify CORS headers work for manifest.json fetch

### Phase 4: Submit Application (Day 7)
- [ ] Fill out pre-assessment form
- [ ] Record video walkthrough
- [ ] Write test plan document
- [ ] Wait for form response before creating GitHub PR

### Phase 5: Review Period (Weeks 2-4)
- [ ] Safe team reviews code and does QA
- [ ] Address any feedback
- [ ] Test on staging environment
- [ ] Coordinate launch announcement

---

## 11. Testing as Custom App (Before Submission)

You can test SandGuard as a Safe App immediately:

1. Go to https://app.safe.global
2. Open any Safe you own
3. Go to **Apps** → **My custom apps** → **Add custom app**
4. Enter URL: `https://supersandguard.com`
5. The Safe will fetch `manifest.json` and display the app

**⚠️ This will fail right now because of `X-Frame-Options: DENY`.** Fix the header first.

---

## 12. Key Resources

- **Safe Apps SDK Docs:** https://github.com/safe-global/safe-apps-sdk
- **React SDK:** `@safe-global/safe-apps-react-sdk` 
- **Safe Apps List (submission):** https://github.com/safe-global/safe-apps-list
- **Pre-Assessment Form:** https://forms.gle/PcDcaVx715LKrrQs8
- **Safe App testing:** https://app.safe.global → Apps → Add custom app
- **Example manifest:** https://raw.githubusercontent.com/safe-global/safe-apps-sdk/main/packages/cra-template-safe-app/template/public/manifest.json
- **Safe Discord:** https://chat.safe.global (for post-launch support)

---

## 13. Why This Matters

The Safe App Store is the **primary discovery channel** for Safe users. Getting listed means:

- **Direct access** to every Safe multisig user (millions of wallets, billions in TVL)
- **Zero friction** — users open SandGuard right from the Safe interface
- **Auto-connect** — no manual address entry, the Safe address is automatic
- **Trust signal** — being in the official app store implies Safe team review
- **Distribution** — the #1 thing SandGuard needs right now

This is the single highest-ROI action for SandGuard's growth.

---

## Appendix: Current Backend Configuration (Already Done)

The backend already has these Safe App-friendly configurations:

### CORS (backend/src/index.ts)
```typescript
app.use(cors({
  origin: [
    'https://supersandguard.com',
    'https://app.safe.global',       // ✅ Safe App Store iframe
    // ... other origins
  ],
  credentials: true,
}));
```

### CSP frame-ancestors
```typescript
res.setHeader('Content-Security-Policy', [
  // ...
  "frame-ancestors 'self' https://app.safe.global https://*.safe.global",
].join('; '));
```

### Connect-src includes Safe
```typescript
"connect-src 'self' https://supersandguard.com https://*.safe.global https://*.tenderly.co https://*.etherscan.io",
```

These are already correct. The only blocker is Railway injecting `X-Frame-Options: DENY` at the edge level.
