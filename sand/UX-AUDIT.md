# SandGuard UX Audit Report

**Date:** 2026-02-02  
**Auditor:** Clawd (automated)  
**Target:** https://web-production-9722f.up.railway.app  
**Version:** 0.3.0  

---

## Executive Summary

SandGuard has a clean, modern landing page with clear messaging and a well-structured login flow. However, **critical performance and SEO issues** undermine the experience. The 4.47 MB uncompressed JS bundle (no gzip!) is the #1 problem — it will cause 10+ second loads on mobile/3G and hurt conversions. Empty PWA icons, missing SEO infrastructure, and no `<meta description>` mean zero discoverability. The good news: the UX *design* is solid; the issues are mostly technical and fixable with config changes.

---

## Issues by Priority

### P0 — Critical (Fix immediately)

#### 1. 🔴 JS Bundle is 4.47 MB — No Compression Served
**Impact:** Page will take 10-15s to load on mobile. Users will bounce before seeing anything.

The main bundle `index-DQT7Nd6B.js` is **4,472,917 bytes** (4.47 MB) uncompressed. The server returns `content-length: 4472917` with **no `content-encoding` header** — meaning Railway is serving the raw uncompressed file.

**Root cause:** `@daimo/pay` pulls in the entire WalletConnect/Reown/wagmi/viem/ethers ecosystem. The Vite config has no `manualChunks` splitting, and Railway's static serving has no gzip/brotli compression.

**Breakdown:**
| Chunk | Size |
|---|---|
| `index-DQT7Nd6B.js` (main) | 4,473 KB |
| `index.es-BaCdbTd3.js` (lazy) | 399 KB |
| `index-C_RrqKdU.js` (lazy) | 364 KB |
| `index-BSw-gSUv.js` (lazy) | 340 KB |
| CSS total | 29 KB |
| **Total JS** | **~5,630 KB** |

**Fixes:**
1. **Enable compression** — Add `compression` middleware to Express:
   ```ts
   // backend/src/index.ts — add before static serving
   import compression from 'compression'
   app.use(compression())
   ```
   This alone should cut transfer size to ~1.2 MB.

2. **Code-split Daimo Pay** — Only import on the login page:
   ```ts
   // frontend/src/pages/Login.tsx
   const DaimoPayButton = lazy(() => import('@daimo/pay').then(m => ({ default: m.DaimoPayButton })))
   ```

3. **Add manualChunks to Vite config:**
   ```ts
   // frontend/vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor-react': ['react', 'react-dom', 'react-router-dom'],
           'vendor-web3': ['viem', 'wagmi', '@tanstack/react-query'],
           'vendor-daimo': ['@daimo/pay'],
         }
       }
     }
   }
   ```

4. **Lazy-load DaimoProvider** — Currently wraps the entire app in `main.tsx`. Move it to only wrap the Login page.

**File refs:** `frontend/vite.config.ts`, `frontend/src/main.tsx`, `backend/src/index.ts`

#### 2. 🔴 PWA Icons Are Empty (0 bytes)
Both `icon-192.png` and `icon-512.png` return `content-length: 0`. The manifest references them, so:
- PWA install will fail or show blank icon
- `manifest.webmanifest` revision hash is `d41d8cd98f00b204e9800998ecf8427e` (MD5 of empty string)

**Fix:** Generate actual icons. Quick:
```bash
# Use the shield emoji as source
npx pwa-asset-generator "🛡️" frontend/public/ --background "#0f172a" --splash-only false --icon-only
```
Or create a proper SVG logo and export at 192x192 and 512x512.

**File ref:** `frontend/public/icon-192.png`, `frontend/public/icon-512.png`

#### 3. 🔴 No Meta Description or OG Tags
The `<head>` contains only:
```html
<meta charset="UTF-8" />
<meta name="viewport" content="..." />
<meta name="theme-color" content="#0f172a" />
<title>SandGuard</title>
```

**Missing:**
- `<meta name="description">` — Google will auto-generate a bad snippet
- `og:title`, `og:description`, `og:image` — social shares will look broken
- `twitter:card`, `twitter:title`, `twitter:description` — same for X
- `<link rel="canonical">` — duplicate content risk (railway URL vs supersandguard.com)

**Fix in `frontend/index.html`:**
```html
<meta name="description" content="Transaction firewall for Safe multisig. Decode, simulate, and score every transaction before you sign. Don't trust, verify — without reading Solidity." />
<meta property="og:title" content="SandGuard — Transaction Firewall for Safe Multisig" />
<meta property="og:description" content="Decode, simulate, and score every crypto transaction before signing." />
<meta property="og:image" content="https://supersandguard.com/og-image.png" />
<meta property="og:url" content="https://supersandguard.com" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="SandGuard — Transaction Firewall for Safe Multisig" />
<meta name="twitter:description" content="Don't trust, verify — without reading Solidity." />
<link rel="canonical" href="https://supersandguard.com" />
```

**File ref:** `frontend/index.html`

---

### P1 — High (Fix this week)

#### 4. 🟠 No robots.txt, sitemap.xml, or security.txt
All three return the SPA fallback (index.html) instead of their proper content. The Express catch-all `app.get('*')` serves `index.html` for everything.

**Fix — Add static files before the SPA fallback in `backend/src/index.ts`:**
```ts
// Before the SPA catch-all:
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: https://supersandguard.com/sitemap.xml`)
})

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://supersandguard.com/</loc><priority>1.0</priority></url>
  <url><loc>https://supersandguard.com/login</loc><priority>0.8</priority></url>
</urlset>`)
})
```

Or better: add `robots.txt` and `sitemap.xml` as static files in `frontend/public/`.

**File ref:** `backend/src/index.ts` (lines ~76-82, SPA fallback section)

#### 5. 🟠 `<html lang="es">` Should Be `lang="en"`
The HTML declares Spanish (`es`) but all content is in English. This confuses screen readers and search engines.

**Fix:** `frontend/index.html` line 2:
```html
<html lang="en">
```

#### 6. 🟠 Title Is Just "SandGuard" — Same Across All Pages
Every route shows `<title>SandGuard</title>`. Should be descriptive per page for SEO and tab identification.

**Fix:** Add a `useEffect` in each page component, or use `react-helmet-async`:
```ts
// Landing.tsx
useEffect(() => { document.title = 'SandGuard — Transaction Firewall for Safe Multisig' }, [])
// Login.tsx
useEffect(() => { document.title = 'Get Started — SandGuard' }, [])
// Dashboard
useEffect(() => { document.title = 'Dashboard — SandGuard' }, [])
```

#### 7. 🟠 API Errors Return Raw Express HTML for Unknown Routes
`POST /api/payments/plan` returns:
```html
<pre>Cannot POST /api/payments/plan</pre>
```
This is Express's default error — not JSON, no proper status code guidance.

**Fix:** Add a 404 handler for API routes in `backend/src/index.ts`:
```ts
// After all API route registrations, before the static file serving:
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found', docs: 'https://supersandguard.com/docs' })
})
```

#### 8. 🟠 Free Signup Doesn't Validate Address Format Client-Side
The wallet address input on `/login` accepts any text. Invalid addresses only fail server-side. Users typing "vitalik.eth" or a partial address get a generic error.

**Fix in `frontend/src/pages/Login.tsx`:**
```ts
const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/i.test(addr)

// Add validation before submit:
if (!isValidAddress(freeAddress)) {
  setError('Please enter a valid Ethereum address (0x...)')
  return
}
```

Also add `pattern` attribute to the input for native validation hints.

#### 9. 🟠 Service Worker Precaches 100 Assets Including 4.47 MB Bundle
The SW precache list includes **100 files** including the massive main bundle. On install, this will try to cache ~5.6 MB. On slow connections this will fail silently, and the SW update flow could cause issues.

**Fix:** Reduce precache to essential files only, use runtime caching for large assets:
```ts
// frontend/vite.config.ts — VitePWA config
workbox: {
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  globPatterns: ['**/*.{html,css,ico,png}'],
  runtimeCaching: [{
    urlPattern: /\.js$/,
    handler: 'StaleWhileRevalidate',
  }]
}
```

---

### P2 — Medium (Fix this sprint)

#### 10. 🟡 Landing Page "Try Demo" Button Goes to Protected Route
The "Try Demo →" button links to `/app` which redirects to `/login` because it's behind `ProtectedRoute`. The demo shortcut is only available from the Login page's "Skip — try the demo →" link at the bottom.

**Fix options:**
- A) Change the landing page demo link to `/login?demo=true` and auto-trigger demo mode
- B) Add a `/demo` route that sets demo mode and redirects to `/app`

**File ref:** `frontend/src/pages/Landing.tsx` (line ~80), `frontend/src/App.tsx`

#### 11. 🟡 No Loading State for Initial SPA Render
The HTML body is just `<div id="root"></div>`. While the 4.47 MB JS loads, users see a blank dark screen. No spinner, no skeleton, nothing.

**Fix — Add inline loading indicator in `frontend/index.html`:**
```html
<div id="root">
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#020617">
    <div style="text-align:center;color:#94a3b8">
      <div style="font-size:2rem;margin-bottom:1rem">🛡️</div>
      <div style="font-size:0.875rem">Loading SandGuard...</div>
    </div>
  </div>
</div>
```

#### 12. 🟡 Cache-Control Set to 1 Day for Hashed Assets
Assets with content hashes in filenames (like `index-DQT7Nd6B.js`) should use immutable caching: `Cache-Control: public, max-age=31536000, immutable`. Currently they're `max-age=86400` (1 day).

**Fix in `backend/src/index.ts`:**
```ts
app.use(express.static(frontendDistPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  }
}))
```

#### 13. 🟡 "Works with Clawdbot" Badge Means Nothing to New Users
The hero section badge says "Works with Clawdbot" — this is meaningless to someone who doesn't already know what Clawdbot is. It takes up premium real estate without building trust.

**Fix:** Replace with something universally meaningful:
- "Trusted by X Safes" (social proof)
- "Built for DeFi Teams" (audience clarity)
- "Open Source" (trust signal, if applicable)
- Or at minimum, make "Clawdbot" a link with a tooltip explaining what it is

#### 14. 🟡 Footer Domain "supersandguard.com" May Not Resolve
The footer shows `supersandguard.com` but the app runs on `web-production-9722f.up.railway.app`. If the domain isn't configured, this is misleading.

**Fix:** Verify DNS is set up. If not, remove the domain reference or use the actual URL.

#### 15. 🟡 Manifest `lang` Field Says "en" but HTML Says "es"
The `manifest.webmanifest` has `"lang": "en"` while `index.html` has `lang="es"`. Inconsistency.

**Fix:** Align both to `"en"` (since content is English).

#### 16. 🟡 No Keyboard Focus Indicators
The CSS uses Tailwind's `focus:outline-none` on inputs but only adds `focus:border-*` which has low visibility. Users navigating by keyboard can't see where focus is.

**Fix:** Replace `focus:outline-none` with `focus:outline-2 focus:outline-emerald-500/50 focus:outline-offset-2` or use `focus-visible:` variants.

**File ref:** `frontend/src/pages/Login.tsx` — all input elements

#### 17. 🟡 "Recover Access" Flow Has No Link from Landing Page
Users who previously paid have to know to go to `/login` and then find the small "Already paid? Recover access →" link. There should be a clearer path.

**Fix:** Add "Already a user? Log in" to the landing page header (the current "Log in" goes to the same page as "Get Started", which is confusing).

---

### P3 — Nice to Have (Backlog)

#### 18. 🔵 No Favicon for Non-SVG-Supporting Browsers
The favicon uses an inline SVG data URI with an emoji. Older browsers, some social platforms, and bookmarks won't render this properly.

**Fix:** Add a `.ico` or `.png` fallback:
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

#### 19. 🔵 No `aria-label` or ARIA Landmarks
The Landing page lacks semantic landmarks (`<main>`, `<nav>`, `role="navigation"`). The header uses a generic `<header>` but has no `<nav>` wrapper for links.

**Fix:** Wrap header links in `<nav aria-label="Main">`, wrap hero + features in `<main>`.

#### 20. 🔵 Pricing Section Could Show Annual Option
Competitors like Pocket Universe offer annual discounts. Adding "Save 20% annually" would boost conversions for price-sensitive users.

#### 21. 🔵 No Rate Limit Feedback in UI
When a user hits the 10 calls/day limit on Scout, the error message is API-level only. The Dashboard should show remaining calls and a clear upgrade nudge.

#### 22. 🔵 DaimoPayButton Has Hardcoded `appId="pay-demo"`
**File ref:** `frontend/src/pages/Login.tsx` line ~161  
The `appId` is `"pay-demo"` which is a test/demo identifier. For production, this should be a real Daimo app ID.

#### 23. 🔵 Error Messages Could Be More Helpful
`"Wallet address is required"` is correct but not warm. Better: `"Enter your wallet address (0x...) to create your free account."`

#### 24. 🔵 Lucide Icons Not Tree-Shaken Optimally
Only 6-7 icons are used across the app, but the bundle contains 3 references to the lucide namespace. Verify icons are individually imported (they appear to be, so this is likely fine, but worth confirming in production analysis).

---

## Quick Wins (< 1 hour each)

| Fix | Impact | Effort |
|-----|--------|--------|
| Add `compression` middleware | 70% transfer size reduction | 5 min |
| Fix `lang="es"` → `lang="en"` | SEO + accessibility | 1 min |
| Add meta description + OG tags | Social sharing + SEO | 10 min |
| Add loading spinner in `index.html` | Perceived performance | 5 min |
| Fix empty PWA icons | PWA install works | 15 min |
| Add API 404 handler | Clean error responses | 5 min |
| Client-side address validation | Reduce friction | 10 min |

## Longer-term Improvements

| Fix | Impact | Effort |
|-----|--------|--------|
| Code-split Daimo Pay (lazy load) | 50-70% bundle reduction | 2-4 hours |
| Vite manualChunks config | Better caching | 1 hour |
| Move DaimoProvider out of global wrapper | Faster initial render | 1-2 hours |
| Per-page `<title>` tags | SEO | 30 min |
| robots.txt + sitemap.xml | Crawlability | 30 min |
| Immutable caching for hashed assets | Repeat visit speed | 15 min |
| SW precache optimization | Install reliability | 1 hour |
| Keyboard accessibility audit | A11y compliance | 2 hours |
| Demo flow from landing page | Conversion | 30 min |

---

## Competitive Comparison

| Feature | SandGuard | Pocket Universe | Blowfish | Fire (wallet.fire) |
|---------|-----------|-----------------|----------|---------------------|
| **Form factor** | Web app (PWA) | Browser extension | API + extension | Browser extension |
| **Pricing** | Free + $20/mo | Free + $5/mo | B2B API pricing | Free |
| **Safe/multisig focus** | ✅ Primary | ❌ Individual txs | ⚠️ API-level | ❌ Individual |
| **Transaction simulation** | ✅ (Pro) | ✅ (all tiers) | ✅ | ✅ |
| **Risk scoring** | ✅ AI-powered (Pro) | ✅ Basic | ✅ Advanced | ✅ Basic |
| **Calldata decoding** | ✅ Human-readable | ✅ | ✅ | ✅ |
| **OG tags / SEO** | ❌ Missing | ✅ Full | ✅ Full | ✅ Full |
| **Initial load time** | ~10s (no gzip) | <1s (extension) | N/A (API) | <1s (extension) |
| **Mobile experience** | ✅ Good (PWA) | ❌ Desktop only | N/A | ❌ Desktop only |

**SandGuard's differentiators:**
1. **Safe-native** — Only product focused specifically on multisig review flow
2. **Web/PWA** — Works on mobile, no extension install required
3. **Clawdbot integration** — Push alerts via bot (unique, but needs explanation)

**Where competitors beat SandGuard:**
1. **Performance** — Extensions load instantly; SandGuard's 4.47 MB bundle is a dealbreaker
2. **SEO presence** — Pocket Universe and Blowfish have full SEO, OG tags, blog content
3. **Free tier depth** — Simulation locked behind Pro ($20/mo) while Pocket Universe includes it free
4. **Social proof** — Competitors show user counts, audit badges, backed-by logos
5. **Price point** — $20/mo is 4x Pocket Universe's premium tier

**Key recommendation:** The $20/mo price with simulation locked behind the paywall is SandGuard's biggest conversion risk. Consider:
- Moving simulation to the free tier (limited: 5/day)
- Dropping price to $9/mo to match market
- Adding social proof (user count, Safe TVL protected, testimonials)

---

## Summary

**The #1 action item is enabling gzip compression and code-splitting the Daimo Pay dependency.** This single change would transform the UX from "why is this blank" to "this loads fast." Everything else — SEO, PWA icons, meta tags — matters but won't help if users bounce before the page renders.

Total estimated effort for all quick wins: **~1 hour**  
Total estimated effort for all items: **~1-2 days**
