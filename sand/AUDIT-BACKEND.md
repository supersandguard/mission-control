# SandGuard Backend API Audit Report

**Date:** 2026-02-01  
**API Version:** 0.3.0  
**Base URL:** http://localhost:3001  
**Auditor:** MaxUmbra (automated)

---

## Executive Summary

The SandGuard backend API is **functional and reasonably well-structured**, with proper HTTP status codes on most endpoints and basic input validation. However, several security concerns were identified, primarily around **missing rate limiting**, **reflected XSS in decoded output**, **overly permissive CORS**, and **large payload handling**. The webhook endpoint correctly requires authentication.

**Overall Rating: MEDIUM RISK** — Functional for beta/MVP, needs hardening before production.

---

## Endpoint Testing Results

### 1. GET /api/health
| Test | Result | HTTP Status |
|------|--------|-------------|
| Basic health check | ✅ PASS | 200 |
| Returns version, service name | ✅ PASS | 200 |

**Response:** `{"status":"ok","service":"SandGuard API","version":"0.3.0"}`

---

### 2. GET /api/safe/{address}/transactions
| Test | Result | HTTP Status |
|------|--------|-------------|
| Valid Safe address | ✅ PASS | 200 |
| Invalid address (not hex) | ✅ PASS | 400 |
| Non-Safe address (EOA) | ⚠️ NOTE | 200 |

**Notes:**
- Valid Safe returns `{"success":true,"count":0,"transactions":[]}` — correct
- Invalid address returns `{"error":"Invalid Safe address"}` with 400 — correct
- Non-Safe EOA (0x0000...0001) returns 200 with empty transactions — **acceptable** since Safe Transaction Service may not differentiate, but could be improved with actual Safe verification

---

### 3. POST /api/decode
| Test | Result | HTTP Status |
|------|--------|-------------|
| Valid approve calldata | ✅ PASS | 200 |
| Empty body `{}` | ✅ PASS | 400 |
| Missing contractAddress | ✅ PASS | 400 |
| Invalid calldata ("0xinvalid") | ⚠️ WARN | 200 |
| XSS in calldata | 🔴 FAIL | 200 |
| Large payload (100KB) | 🔴 FAIL | 200 |

**Details:**
- **Valid decode works correctly:** Properly identifies `approve(address,uint256)` with USDC protocol info, spender label, and parameter names
- **Missing fields:** Returns `{"error":"Missing calldata or contractAddress"}` — correct
- **Invalid calldata "0xinvalid":** Returns 200 with `functionName: "Native Transfer"` — should return an error or at least flag it as undecodable
- **XSS payload:** `<script>alert(1)</script>` in calldata is reflected verbatim in response as `functionName: "Unknown (<script>al)"` — **stored/reflected XSS risk if frontend renders without sanitization**
- **Large payload (100KB calldata):** Accepted and decoded into 1500+ parameters. No size limit enforced — **DoS vector**

---

### 4. POST /api/simulate
| Test | Result | HTTP Status |
|------|--------|-------------|
| Valid simulation | ✅ PASS | 200 |
| Empty body | ✅ PASS | 400 |
| Missing data/value | ✅ PASS | 400 |

**Details:**
- Valid simulation returns gas estimation, events, and balance changes — correct
- `{"error":"Missing or invalid \"to\" address"}` for empty body — correct
- `{"error":"Transaction must have calldata or value"}` for missing data — correct

---

### 5. POST /api/payments/verify
| Test | Result | HTTP Status |
|------|--------|-------------|
| Empty body | ✅ PASS | 400 |
| txHash only (no address) | ✅ PASS | 400 |
| Invalid txHash format | ✅ PASS | 400 |
| Valid format, fake tx | ✅ PASS | 400 |
| SQL injection in address | ✅ PASS | 400 |

**Details:**
- Requires both `txHash` and `address` — correct validation
- Verifies transaction recipient matches payment wallet — good security check
- Error: `"Transaction recipient does not match payment wallet"` for wrong recipient

---

### 6. POST /api/payments/recover
| Test | Result | HTTP Status |
|------|--------|-------------|
| Valid address (no subscription) | ✅ PASS | 404 |
| Invalid address format | ⚠️ WARN | 404 |
| Empty body | ✅ PASS | 400 |

**Details:**
- `"Wallet address is required"` for empty body — correct
- Invalid address format ("invalid") returns 404 instead of 400 — **should validate address format first**

---

### 7. POST /api/payments/activate
| Test | Result | HTTP Status |
|------|--------|-------------|
| Empty body | ✅ PASS | 400 |
| Address only | ✅ PASS | 400 |
| With admin key | ✅ PASS | 400 |
| Both fields, no subscription | ✅ PASS | 404 |

**Details:**
- Requires both `address` and `paymentId` — correct validation
- No admin key bypass found — good

---

### 8. GET /api/payments/status/{address}
| Test | Result | HTTP Status |
|------|--------|-------------|
| Known active address | ✅ PASS | 200 |
| Unknown address | ✅ PASS | 200 |
| Invalid address format | ⚠️ WARN | 200 |
| SQL injection in path | ⚠️ WARN | 200 |

**Details:**
- Active subscription: Returns `{"status":"active","plan":"pro","expiresAt":"...","apiKey":"sg_a4c2i..."}` — **Note: API key is partially masked (good)**
- Unknown address: Returns `{"status":"inactive","message":"No active subscription"}` — correct
- Invalid address format (SQL injection strings): Returns 200 with inactive status instead of 400 — **should validate address format**

---

### 9. GET /api/payments/info
| Test | Result | HTTP Status |
|------|--------|-------------|
| Payment info response | ✅ PASS | 200 |

**Response includes:** wallet address, chain (base), chainId (8453), monthly price ($20), accepted tokens (ETH), and instructions — correct and complete.

---

### 10. POST /api/promo/redeem
| Test | Result | HTTP Status |
|------|--------|-------------|
| Valid code SG-D5FKT83Y | ✅ PASS | 200 |
| Invalid code | ✅ PASS | 400 |
| Empty body | ✅ PASS | 400 |
| Missing address | ✅ PASS | 400 |
| Code reuse (same address) | ✅ PASS | 400 |
| Code reuse (different address) | ✅ PASS | 400 |

**Details:**
- Valid promo code redeemed successfully, returns API key and 90-day trial expiry — correct
- Requires both `code` and `address` — correct
- Code properly marked as "fully redeemed" after use — correct
- **⚠️ API key returned in plaintext in promo response** — consider whether this is the right approach

---

### 11. POST /api/webhooks/daimo
| Test | Result | HTTP Status |
|------|--------|-------------|
| Empty body | ✅ PASS | 401 |
| Valid-looking payload | ✅ PASS | 401 |
| Non-JSON body | ✅ PASS | 401 |

**Details:**
- All requests return `{"error":"Unauthorized"}` with 401 — **correct, webhook is properly authenticated**
- Auth check happens before body parsing — good security practice

---

## Security Assessment

### 🔴 HIGH Severity

#### SEC-01: Reflected XSS in /api/decode Response
- **Finding:** Arbitrary HTML/JavaScript in `calldata` and `contractAddress` is reflected in the response without sanitization
- **Test:** `calldata: "<script>alert(1)</script>"` → response includes `"functionName":"Unknown (<script>al)"`
- **Impact:** If the frontend renders decoded output using `innerHTML` or similar, this enables XSS attacks
- **Recommendation:** Sanitize all output fields or add Content-Type headers preventing browser interpretation

#### SEC-02: No Rate Limiting
- **Finding:** 20 rapid requests to /api/decode all returned 200 with no throttling
- **Impact:** API is vulnerable to brute force attacks, DoS, and abuse. Particularly dangerous for:
  - `/api/simulate` (likely has RPC costs)
  - `/api/promo/redeem` (brute force promo codes)
  - `/api/payments/verify` (tx hash enumeration)
- **Recommendation:** Add rate limiting (e.g., express-rate-limit) — suggest 30 req/min for unauthenticated, 100 req/min for authenticated

### 🟡 MEDIUM Severity

#### SEC-03: Overly Permissive CORS (Access-Control-Allow-Origin: *)
- **Finding:** All responses include `Access-Control-Allow-Origin: *`
- **Impact:** Any website can make API requests, enabling cross-origin attacks if combined with auth tokens
- **Recommendation:** Restrict to specific domains (e.g., `sandguard.xyz`, `localhost:3000`)

#### SEC-04: No Payload Size Limit on /api/decode
- **Finding:** 100KB+ calldata payload accepted and processed, generating 1500+ decoded parameters
- **Impact:** Memory/CPU DoS — an attacker could send multi-MB payloads to exhaust server resources
- **Recommendation:** Limit calldata length (e.g., max 64KB) and/or limit number of decoded parameters

#### SEC-05: Server Technology Disclosure
- **Finding:** Response header `X-Powered-By: Express` present on all responses
- **Impact:** Reveals server technology stack, aiding targeted attacks
- **Recommendation:** Add `app.disable('x-powered-by')` or use `helmet` middleware

#### SEC-06: API Key Exposure in /api/payments/status
- **Finding:** The status endpoint returns a partially masked API key (`sg_a4c2i...`)
- **Impact:** Partial key disclosure could aid social engineering or reduce brute force space
- **Recommendation:** Don't return API key at all in status endpoint, or return only last 4 chars

### 🟢 LOW Severity

#### SEC-07: Missing Address Validation on /api/payments/status
- **Finding:** Invalid/malicious strings in the address path param return 200 with "inactive" status instead of 400
- **Impact:** Low — no injection possible, but inconsistent with other endpoints' validation
- **Recommendation:** Validate Ethereum address format (0x + 40 hex chars) before lookup

#### SEC-08: Invalid Calldata Returns 200 Instead of Error
- **Finding:** `"0xinvalid"` calldata returns 200 with `"functionName":"Native Transfer"` instead of an error
- **Impact:** Could mislead users about transaction type
- **Recommendation:** Validate calldata is valid hex before decoding, return error for malformed input

#### SEC-09: Missing Address Validation on /api/payments/recover
- **Finding:** Invalid address format returns 404 ("No subscription found") instead of 400 (invalid format)
- **Impact:** Inconsistent error handling, minor info leak about validation order
- **Recommendation:** Check address format before DB lookup

#### SEC-10: HTTP Method Handling
- **Finding:** Incorrect HTTP methods (PUT /api/decode, DELETE /api/health) return Express default 404 HTML page
- **Impact:** Low — reveals Express framework, but no security bypass
- **Recommendation:** Return JSON errors for wrong methods (405 Method Not Allowed)

---

## Positive Findings ✅

1. **Webhook authentication works correctly** — /api/webhooks/daimo requires valid auth
2. **Payment verification validates tx recipient** — prevents claiming arbitrary transactions
3. **Promo codes have use-count limits** — no infinite redemption possible
4. **Input validation on required fields** — most POST endpoints validate required params
5. **Proper HTTP status codes** — 400 for validation, 401 for auth, 404 for not found
6. **SQL injection not exploitable** — injected strings handled safely (likely using parameterized queries or in-memory store)
7. **Path traversal blocked** — `../../etc/passwd` in URL returns 404
8. **Prototype pollution no observable effect** — `__proto__` in JSON body didn't cause visible issues
9. **API key masking in status response** — partial masking applied
10. **Transaction simulation includes gas estimation and events** — useful and functional

---

## Recommendations Summary

| Priority | Action | Effort |
|----------|--------|--------|
| 🔴 HIGH | Add rate limiting to all endpoints | Low |
| 🔴 HIGH | Sanitize decoded output to prevent XSS | Low |
| 🟡 MED | Restrict CORS to specific origins | Low |
| 🟡 MED | Add payload size limits | Low |
| 🟡 MED | Remove X-Powered-By header | Trivial |
| 🟡 MED | Remove/reduce API key in status response | Low |
| 🟢 LOW | Validate address format on all endpoints | Low |
| 🟢 LOW | Return errors for invalid calldata | Low |
| 🟢 LOW | Return 405 for wrong HTTP methods | Low |

---

## Test Coverage Summary

| Endpoint | Functional | Error Handling | Security |
|----------|-----------|----------------|----------|
| GET /api/health | ✅ | ✅ | ✅ |
| GET /api/safe/{addr}/transactions | ✅ | ✅ | ✅ |
| POST /api/decode | ✅ | ⚠️ | 🔴 |
| POST /api/simulate | ✅ | ✅ | ✅ |
| POST /api/payments/verify | ✅ | ✅ | ✅ |
| POST /api/payments/recover | ✅ | ⚠️ | ✅ |
| POST /api/payments/activate | ✅ | ✅ | ✅ |
| GET /api/payments/status/{addr} | ✅ | ⚠️ | ⚠️ |
| GET /api/payments/info | ✅ | ✅ | ✅ |
| POST /api/promo/redeem | ✅ | ✅ | ✅ |
| POST /api/webhooks/daimo | ✅ | ✅ | ✅ |

**Legend:** ✅ Pass | ⚠️ Minor issues | 🔴 Needs fix
