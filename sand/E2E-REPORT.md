# SandGuard E2E Test Report

**Date:** 2026-02-02 10:10 CST  
**Target:** https://supersandguard.com  
**Tester:** Automated (MaxUmbra subagent)

---

## Summary

| Category | Pass | Fail | Warn |
|----------|------|------|------|
| Landing Page | 4 | 0 | 1 |
| API Health | 1 | 0 | 0 |
| Free Signup | 2 | 0 | 0 |
| Decode | 1 | 0 | 1 |
| Simulate | 1 | 0 | 0 |
| Risk Score | 1 | 0 | 0 |
| Founders | 2 | 0 | 0 |
| Payment Info | 1 | 0 | 0 |
| Security | 8 | 0 | 1 |
| Blog | 4 | 0 | 0 |
| GitHub | 1 | 0 | 1 |
| Links | 1 | 0 | 1 |
| **TOTAL** | **27** | **0** | **4** |

**Overall: ✅ ALL TESTS PASS (4 warnings, 0 failures)**

---

## 1. Landing Page

### 1.1 HTTP Status — ✅ PASS
- `curl https://supersandguard.com` → **200**

### 1.2 "SandGuard" in response — ✅ PASS
- `<title>SandGuard</title>` present in HTML
- OG meta: `SandGuard — Transaction Firewall for Safe Multisig`

### 1.3 No "Try Demo" button — ✅ PASS
- HTML source: **0** matches for "demo" (case-insensitive)
- **No "Try Demo" text** found anywhere in HTML or JS bundles

### 1.4 Demo references in JS — ⚠️ WARNING
The JS bundle (`index-84vPtBQ_.js`) contains these demo-related strings:
- `"Demo Mode (mock data)"`
- `"Demo"`
- `"Leave empty for demo mode."`
- `"Demo (mock data)"`
- Internal state: `isDemo`, `isDemoMode`, `setDemoMode`

These are **internal state labels** for a demo mode feature (not a visible "Try Demo" button on the landing page). The demo mode appears to activate when a user leaves the Safe address empty during login. **This is not a prominent CTA but the feature still exists in the codebase.**

### 1.5 "Get Started Free" button — ✅ PASS
- Found `Get Started Free` text in JS bundle

### 1.6 Page Load Time — ✅ PASS
- Total time: **0.342s** (well under 3s target)
- Page size: 2,321 bytes (HTML shell)
- Assets: 3 JS bundles + 1 CSS (lazy-loaded)

---

## 2. API Health

### 2.1 GET /api/health — ✅ PASS
```json
{"status":"ok","service":"SandGuard API"}
```

---

## 3. Free Signup Flow

### 3.1 POST /api/payments/free — ✅ PASS
**Request:** `{"address": "0x1234567890abcdef1234567890abcdef12345678"}`  
**Response:**
```json
{
  "status": "activated",
  "apiKey": "sg_fm9j97gpmx7byff6q0x9dkl9v1qmw8cv",
  "plan": "scout",
  "planLimits": {
    "safes": 1,
    "dailyApiCalls": 10,
    "features": ["decode"]
  },
  "expiresAt": "2126-01-09T16:09:50.634Z",
  "message": "Free Scout account activated!"
}
```
- ✅ Returns `apiKey` (prefixed `sg_`)
- ✅ Plan is `"scout"`
- ✅ Plan limits included (1 safe, 10 daily calls, decode feature)

### 3.2 API Key works for subsequent calls — ✅ PASS
- Key `sg_fm9j97gpmx7byff6q0x9dkl9v1qmw8cv` successfully used for decode, simulate, and risk endpoints

---

## 4. Decode (Core Feature)

### 4.1 POST /api/decode — ✅ PASS
**Request:** ERC20 `transfer(address,uint256)` calldata for USDT contract  
**Response:**
```json
{
  "success": true,
  "decoded": {
    "functionName": "transfer",
    "functionSignature": "transfer(address,uint256)",
    "parameters": [
      {
        "name": "to",
        "type": "address",
        "value": "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
        "label": "Destination address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "value": "1000000000",
        "label": "Amount to transfer"
      }
    ],
    "protocol": {
      "name": "USDT",
      "category": "Token",
      "website": "https://tether.to"
    },
    "contractVerified": true
  }
}
```
- ✅ `functionName`: "transfer"
- ✅ `parameters`: correctly decoded address and amount
- ✅ `protocol`: USDT identified with category and website
- ✅ `contractVerified`: true

### 4.2 API Field Names — ⚠️ WARNING
The decode endpoint expects `contractAddress` + `calldata` fields, **not** `to` + `data`. Using `to`/`data` returns:
```json
{"error": "Missing calldata or contractAddress"}
```
**This is correct behavior** but worth noting for API documentation clarity. The simulate and risk endpoints accept `to`/`data` format.

---

## 5. Simulate

### 5.1 POST /api/simulate — ✅ PASS
**Response:**
```json
{
  "success": true,
  "simulation": {
    "success": true,
    "gasUsed": 52300,
    "gasLimit": 65000,
    "balanceChanges": [
      {
        "address": "0x1234...5678",
        "token": {"symbol": "TOKEN", "name": "ERC20 Token", "decimals": 18},
        "delta": "-0.000000001",
        "deltaUsd": "-0.00"
      },
      {
        "address": "0x4838...5f97",
        "token": {"symbol": "TOKEN", "name": "ERC20 Token", "decimals": 18},
        "delta": "+0.000000001",
        "deltaUsd": "0.00"
      }
    ],
    "events": [
      {"name": "Transfer", "params": {"from": "0x1234...", "to": "0x4838...", "value": "0.000000001"}}
    ]
  }
}
```
- ✅ `gasUsed`: 52300
- ✅ `balanceChanges`: sender decrease, recipient increase
- ✅ `events`: Transfer event decoded

---

## 6. Risk Score

### 6.1 POST /api/risk — ✅ PASS
**Response:**
```json
{
  "success": true,
  "risk": {
    "score": "green",
    "reasons": [
      {
        "level": "green",
        "code": "KNOWN_PROTOCOL",
        "message": "Recognized protocol: USDT (Token)"
      }
    ],
    "details": {
      "isKnownProtocol": true,
      "protocolName": "USDT",
      "transferValueUsd": 0,
      "isUnlimitedApproval": false
    }
  }
}
```
- ✅ Score: `"green"` (valid enum value)
- ✅ Reasons with level, code, message
- ✅ Details include protocol recognition and approval check

---

## 7. Founders Endpoints

### 7.1 GET /api/founders/status — ✅ PASS
```json
{
  "total": 0,
  "remaining": 100,
  "cap": 100,
  "genesis10Remaining": 10,
  "closed": false
}
```
- ✅ Cap is 100
- ✅ Remaining count present (100)
- ✅ Genesis 10 sub-tier tracked

### 7.2 GET /api/founders (roster) — ✅ PASS
```json
{
  "total": 0,
  "remaining": 100,
  "cap": 100,
  "genesis10Remaining": 10,
  "closed": false,
  "founders": []
}
```
- ✅ Roster endpoint works, returns empty array (no founders yet)

---

## 8. Payment Info

### 8.1 GET /api/payments/info — ✅ PASS
```json
{
  "wallet": "0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84",
  "chain": "base",
  "chainId": 8453,
  "monthlyPriceUsd": 20,
  "acceptedTokens": ["ETH"],
  "tiers": {
    "scout": {"price": 0, "name": "Scout (Free)"},
    "pro": {"price": 20, "name": "Pro"},
    "founder": {"price": 0, "name": "Founder (Lifetime)", "note": "Earned through the Founders Program — not purchasable directly"}
  }
}
```
- ✅ All 3 tiers present: scout, pro, founder
- ✅ Payment details (wallet, chain, accepted tokens)

---

## 9. Security

### 9.1 Security Headers — ✅ PASS

| Header | Value | Status |
|--------|-------|--------|
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | ✅ |
| `X-XSS-Protection` | `1; mode=block` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ✅ |
| `Content-Security-Policy` | *(not set)* | ⚠️ Missing |

### 9.2 CORS Preflight — ✅ PASS
```
OPTIONS /api/health
Origin: https://supersandguard.com

→ 204
→ Access-Control-Allow-Origin: https://supersandguard.com
→ Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
→ Access-Control-Allow-Credentials: true
```

### 9.3 Rate Limiting — ✅ PASS
Hit `/api/health` 35 times in rapid succession:
- Requests 1–19: **200 OK**
- Requests 20–35: **429 Too Many Requests**
- Rate limit kicks in at ~20 requests (stricter than expected 30)
- Response: `{"error":"Too many requests, please try again later."}`

### 9.4 SQL Injection — ✅ PASS (properly rejected)
```
POST /api/payments/free
{"address": "0x1234' OR 1=1 --"}
→ {"error":"Invalid Ethereum address"}

{"address": "0x\"; DROP TABLE users;--"}
→ {"error":"Invalid Ethereum address"}
```
Address validation correctly rejects malformed inputs.

### 9.5 XSS in Calldata — ✅ PASS (sanitized)
```
POST /api/decode
{"calldata": "<script>alert(1)</script>", ...}
→ {"functionName":"Unknown (scriptaler)","parameters":[{"value":"0xt(1)/script"}]}
```
HTML tags are consumed by hex parser — no raw `<script>` tags in output. API returns JSON, not HTML, so XSS risk is minimal. No script execution possible.

### 9.6 Missing CSP Header — ⚠️ WARNING
No `Content-Security-Policy` header detected. While not critical for an API-heavy SPA, adding a CSP would provide defense-in-depth against injection attacks.

---

## 10. Blog

### 10.1 Blog Index — ✅ PASS
`https://supersandguard.github.io/sandguard/` → **200**

### 10.2 Bybit Post — ✅ PASS
`https://supersandguard.github.io/sandguard/bybit-blind-signing-attack.html` → **200**

### 10.3 Firewall Post — ✅ PASS
`https://supersandguard.github.io/sandguard/why-every-safe-needs-a-firewall.html` → **200**

### 10.4 Safe+AI Post — ✅ PASS
`https://supersandguard.github.io/sandguard/safe-plus-ai-the-missing-security-layer.html` → **200**

---

## 11. GitHub Repo

### 11.1 Repo Visibility & Description — ✅ PASS
- **Name:** supersandguard/sandguard
- **Private:** false (public ✅)
- **Description:** "Transaction firewall for Safe multisig. Decode, simulate, and risk-score every transaction."

### 11.2 Repo Metadata — ⚠️ WARNING
- **Stars:** 0
- **Topics:** none set
- **Homepage:** not set (should be `https://supersandguard.com`)

---

## 12. Links Check

### 12.1 Blog → App Links — ✅ PASS
All blog posts link to `https://supersandguard.com` and all links resolve:
- `https://supersandguard.com` → 200
- `https://supersandguard.com/og-image.png` → 200

### 12.2 App → Blog Links — ⚠️ WARNING
**No blog links found in the app's JS bundle.** The app does not link to the blog from within the SPA. Consider adding a "Blog" link in the footer or navigation to drive traffic from app users to content.

---

## Issues & Recommendations

### High Priority
*(none)*

### Medium Priority
1. **Add Content-Security-Policy header** — Missing CSP leaves the app without an important layer of XSS defense
2. **Add blog link in app navigation** — The app has no link to the blog; adding one would help SEO and content discovery
3. **Set GitHub repo homepage** — Set `homepage` to `https://supersandguard.com` and add relevant topics (ethereum, safe, multisig, security, firewall)

### Low Priority
4. **Demo mode still in codebase** — While "Try Demo" button is gone, demo mode is still accessible via empty Safe address login. Verify this is intentional or remove completely
5. **Decode vs Simulate field names** — Decode uses `contractAddress`/`calldata` while Simulate uses `to`/`data`. Consider standardizing or documenting clearly
6. **Rate limit threshold** — Rate limiting kicks in at 20 requests (not 30). This is fine security-wise but verify the threshold matches documentation

---

## Raw Test Data

- **Test API Key Used:** `sg_fm9j97gpmx7byff6q0x9dkl9v1qmw8cv` (scout plan)
- **Test Address:** `0x1234567890abcdef1234567890abcdef12345678`
- **Test Contract:** `0xdAC17F958D2ee523a2206206994597C13D831ec7` (USDT)
- **Page Load:** 0.342s / 2,321 bytes
- **Rate Limit Window:** ~20 requests before 429

---

*Report generated automatically. All tests run against production endpoints.*
