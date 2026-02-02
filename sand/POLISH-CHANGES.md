# SandGuard Polish Sprint — Changes Summary

**Date:** 2025-07-15  
**Commit:** 007f3f7  
**Branch:** main (not pushed)

---

## 1. ✅ Content-Security-Policy Header

**File:** `backend/src/index.ts`

- Added full CSP header to security middleware:
  - `default-src 'self'`
  - `script-src 'self'`
  - `style-src 'self' 'unsafe-inline'` (required for Tailwind)
  - `font-src 'self' https://fonts.gstatic.com`
  - `img-src 'self' data: https:`
  - `connect-src 'self'` + supersandguard.com, safe.global, tenderly.co, etherscan.io
  - `frame-ancestors 'self' https://app.safe.global https://*.safe.global` — **allows Safe App Store embedding**
- Removed `X-Frame-Options: DENY` (conflicted with iframe embedding requirement)
- Added `https://app.safe.global` to CORS allowed origins

## 2. ✅ Standalone /api/explain Endpoint

**File:** `backend/src/routes/explain.ts`

The endpoint now supports two modes:

1. **Original mode:** `{ decoded, simulation, chainId }` — pre-decoded data (backwards compatible)
2. **Standalone mode:** `{ calldata, contractAddress, chainId, from?, value? }` — one-shot decode→simulate→explain

Standalone mode returns `{ success, explanation, decoded, simulation }` — all three results in a single API call. Developer-friendly for agents and integrations.

## 3. ✅ Blog, GitHub, and X Links in Footer

**File:** `frontend/src/pages/Landing.tsx`

Added to landing page footer:
- **Blog:** https://supersandguard.github.io/sandguard/
- **GitHub:** https://github.com/supersandguard/sandguard
- **𝕏 @beto_neh:** https://x.com/beto_neh
- Existing "Powered by Safe" link preserved

## 4. ✅ Demo Mode Variable Cleanup

**Files:** `AuthContext.tsx`, `TransactionsContext.tsx`, `Dashboard.tsx`

| Before | After | File |
|--------|-------|------|
| `isDemoMode` | `isGuestMode` | AuthContext.tsx |
| `setDemoMode` | `setGuestMode` | AuthContext.tsx |
| `isDemo` | `isUnconfigured` | TransactionsContext.tsx |
| `isDemo` | `isUnconfigured` | Dashboard.tsx |

- LocalStorage parsing is backwards-compatible (reads both old `isDemoMode` and new `isGuestMode` keys)
- No "demo" strings remain in exposed interfaces or component props

## 5. ✅ Safe Apps SDK Detection

**New file:** `frontend/src/hooks/useSafeApp.ts`  
**Modified:** `frontend/src/components/Layout.tsx`

### `useSafeApp` hook provides:
- `isInsideIframe` — detects if running in an iframe
- `parentOrigin` — parsed from `document.referrer`
- `isSafeApp` — true if parent origin contains `safe.global`
- `safeAddress` — extracted from URL `?safe=` param (supports `chainPrefix:address` format)
- `chainId` — extracted from URL `?chain=` or `?chainId=` param

### Layout integration:
- When `isInsideIframe` is true, the app header and bottom navigation bar are hidden
- Safe provides its own navigation chrome when embedding apps
- Main content padding adjusted to use full height when nav is hidden

## 6. ✅ TypeScript Verification

- **Frontend:** `tsc --noEmit` passes with 0 errors ✅
- **Backend:** No new errors introduced. Pre-existing issues (import.meta module config, type narrowing in other routes) remain unchanged.

---

## Files Changed (8 files, +278 / -86)

| File | Change |
|------|--------|
| `backend/src/index.ts` | CSP header, CORS update, remove X-Frame-Options |
| `backend/src/routes/explain.ts` | Standalone mode with decode+simulate+explain |
| `frontend/src/hooks/useSafeApp.ts` | **NEW** — Safe App iframe detection hook |
| `frontend/src/components/Layout.tsx` | Hide header/nav in iframe mode |
| `frontend/src/context/AuthContext.tsx` | isDemoMode → isGuestMode rename |
| `frontend/src/context/TransactionsContext.tsx` | isDemo → isUnconfigured rename |
| `frontend/src/pages/Dashboard.tsx` | Updated isDemo → isUnconfigured references |
| `frontend/src/pages/Landing.tsx` | Blog, GitHub, X links in footer |

---

## Next Steps for Safe App Store Submission

1. Install `@safe-global/safe-apps-sdk` and integrate with `useSafeApp` hook for full SDK context
2. Auto-configure Safe address from SDK context (skip login when embedded)
3. Test the app inside the Safe App Store development environment
4. Submit manifest.json to Safe App Store registry
