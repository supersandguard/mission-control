# SandGuard Security Audit Report

**Date:** February 2, 2026  
**Target:** https://supersandguard.com  
**Auditor:** MaxUmbra (Automated Security Audit)  
**Version Detected:** 0.3.0  
**Infrastructure:** Railway (railway-edge, us-west2)

---

## Executive Summary

**Overall Risk Rating: LOW-MEDIUM**

SandGuard demonstrates a generally solid security posture for an early-stage product. The application properly handles most common attack vectors including SQL injection, path traversal, and authentication on sensitive endpoints. Rate limiting is functional and cannot be trivially bypassed. No critical vulnerabilities were found that would allow immediate exploitation.

However, several medium-severity issues were identified that should be addressed before scaling, particularly around input validation, missing security headers, and potential denial-of-service vectors.

**Finding Summary:**
| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 4 |
| LOW | 5 |
| INFO | 6 |

---

## Findings

---

### [HIGH-001] No Payload Size Limit on /api/decode — Resource Exhaustion Risk

**Severity:** HIGH  
**Endpoint:** `POST /api/decode`  
**CVSS:** 7.5 (High)

**Description:**  
The `/api/decode` endpoint accepts and processes arbitrarily large calldata payloads with no apparent size restriction. A 100KB payload was successfully processed, generating a response with 1,562+ decoded parameters. This creates a significant denial-of-service (DoS) vector.

**Proof of Concept:**
```bash
# Generate 100KB calldata payload
python3 -c "import json; print(json.dumps({'calldata': '0x' + 'a'*100000, 'contractAddress': '0xdAC17F958D2ee523a2206206994597C13D831ec7'}))" | \
  curl -s -X POST https://supersandguard.com/api/decode \
    -H "Content-Type: application/json" -d @-
# Returns 200 OK with 1562+ parameters decoded
```

**Impact:**  
- An attacker could send many concurrent large payloads to exhaust server CPU/memory
- Each request generates a proportionally large response, amplifying bandwidth consumption
- Combined with the 30 req/min rate limit, an attacker could still send 30 × 100KB = 3MB/min of processing per IP
- Multiple IPs or botnets could scale this significantly

**Recommended Fix:**
- Enforce a maximum calldata size (e.g., 64KB or 128KB)
- Limit the maximum number of decoded parameters returned (e.g., 50)
- Add request body size limits at the Express/middleware level
- Consider returning a 413 (Payload Too Large) for oversized requests

---

### [MEDIUM-001] Unsanitized Input Reflected in API Responses (Stored XSS Risk)

**Severity:** MEDIUM  
**Endpoints:** `POST /api/simulate`, `POST /api/decode`  
**CVSS:** 5.4 (Medium)

**Description:**  
Multiple API endpoints accept and reflect unsanitized user input in their JSON responses. While JSON responses with `Content-Type: application/json` are not directly exploitable in modern browsers, any client that renders these values without proper escaping is vulnerable to XSS.

**Proof of Concept:**
```bash
# XSS payload in "from" address — reflected in response
curl -s -X POST https://supersandguard.com/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"from":"<img src=x onerror=alert(1)>","to":"0xdAC17F958D2ee523a2206206994597C13D831ec7","data":"0xa9059cbb","value":"0x0","chainId":1}'

# Response includes:
# "from":"<img src=x onerror=alert(1)>"
# in balanceChanges and event params
```

```bash
# Non-address accepted in contractAddress field
curl -s -X POST https://supersandguard.com/api/decode \
  -H "Content-Type: application/json" \
  -d '{"calldata":"0xa9059cbb","contractAddress":"<script>alert(1)</script>"}'

# Returns 200 OK with decoded data
```

**Impact:**  
- If the frontend renders API response data in the DOM without sanitization, this becomes a reflected XSS
- Could be exploited via phishing: attacker shares a malicious transaction for the victim to "analyze" in SandGuard
- The simulate endpoint accepts non-Ethereum addresses in the `from` field without validation

**Recommended Fix:**
- Validate `from` address in `/api/simulate` (reject non-0x addresses)
- Validate `contractAddress` in `/api/decode` (reject non-0x addresses)
- Sanitize/escape all user-provided values before including in responses
- Ensure the frontend uses proper text rendering (not `innerHTML`) for API data

---

### [MEDIUM-002] Missing Security Headers

**Severity:** MEDIUM  
**Affected:** All responses  
**CVSS:** 5.0 (Medium)

**Description:**  
The application is missing several important security headers that protect against common web attacks.

**Proof of Concept:**
```bash
curl -s -D- https://supersandguard.com/api/health 2>&1 | grep -iE "strict-transport|x-frame|x-content-type|content-security|x-xss|referrer-policy|permissions-policy"
# No output — all headers missing
```

**Missing Headers:**
| Header | Purpose | Status |
|--------|---------|--------|
| `Strict-Transport-Security` | Force HTTPS | ❌ Missing |
| `X-Frame-Options` | Prevent clickjacking | ❌ Missing |
| `X-Content-Type-Options` | Prevent MIME sniffing | ❌ Missing |
| `Content-Security-Policy` | Prevent XSS/injection | ❌ Missing |
| `Referrer-Policy` | Control referer leakage | ❌ Missing |
| `Permissions-Policy` | Restrict browser features | ❌ Missing |

**Impact:**  
- Without HSTS, users could be subject to SSL stripping attacks
- Without X-Frame-Options, the app could be embedded in malicious iframes (clickjacking)
- Without CSP, injected scripts have no restrictions
- Without X-Content-Type-Options, MIME-type confusion attacks are possible

**Recommended Fix:**
Add middleware to set security headers:
```javascript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
```

---

### [MEDIUM-003] CORS Configuration Inconsistency

**Severity:** MEDIUM  
**Affected:** All API endpoints  
**CVSS:** 4.3 (Medium)

**Description:**  
The CORS configuration has an inconsistency: `access-control-allow-credentials: true` is returned for ALL requests (including from unauthorized origins), but `access-control-allow-origin` is only returned for the legitimate origin. Additionally, preflight responses return `access-control-allow-methods` and `access-control-allow-headers` for any origin.

**Proof of Concept:**
```bash
# Legitimate origin — gets allow-origin
curl -s -D- -H "Origin: https://supersandguard.com" https://supersandguard.com/api/health 2>&1 | grep -i access-control
# access-control-allow-credentials: true
# access-control-allow-origin: https://supersandguard.com

# Evil origin — gets credentials but NO allow-origin
curl -s -D- -H "Origin: https://evil.com" https://supersandguard.com/api/health 2>&1 | grep -i access-control
# access-control-allow-credentials: true
# (no access-control-allow-origin)

# Preflight from evil origin — leaks allowed methods
curl -s -D- -X OPTIONS -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://supersandguard.com/api/decode 2>&1 | grep -i access-control
# access-control-allow-credentials: true
# access-control-allow-headers: Content-Type
# access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

**Impact:**  
- While browsers will correctly block the response without `access-control-allow-origin`, the credentials flag being always-on is unnecessary
- Preflight leaking all allowed methods gives attackers reconnaissance
- If CORS configuration is accidentally changed to reflect origins, the credentials flag would immediately enable cookie-based attacks

**Recommended Fix:**
- Only set `access-control-allow-credentials: true` for whitelisted origins
- Only return preflight headers for whitelisted origins
- Explicitly define allowed origins list: `['https://supersandguard.com']`
- Deny preflight entirely for unknown origins

---

### [MEDIUM-004] No `from` Address Validation on /api/simulate

**Severity:** MEDIUM  
**Endpoint:** `POST /api/simulate`  
**CVSS:** 4.3 (Medium)

**Description:**  
The `/api/simulate` endpoint validates the `to` address but does NOT validate the `from` address. Any arbitrary string is accepted and used in the simulation response, including HTML/JavaScript payloads.

**Proof of Concept:**
```bash
curl -s -X POST https://supersandguard.com/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"from":"NOT_AN_ADDRESS","to":"0xdAC17F958D2ee523a2206206994597C13D831ec7","data":"0xa9059cbb","value":"0x0","chainId":1}'
# Returns 200 OK — "NOT_AN_ADDRESS" appears in balanceChanges
```

**Impact:**  
- Combined with MEDIUM-001, creates a reliable reflected data injection vector
- Could confuse users if the frontend displays this data

**Recommended Fix:**
```javascript
if (!isValidEthereumAddress(from)) {
  return res.status(400).json({ error: 'Invalid "from" address' });
}
```

---

### [LOW-001] Version Information Disclosure in /api/health

**Severity:** LOW  
**Endpoint:** `GET /api/health`

**Description:**  
The health endpoint exposes the exact API version number.

**Proof of Concept:**
```bash
curl -s https://supersandguard.com/api/health
# {"status":"ok","service":"SandGuard API","version":"0.3.0"}
```

**Impact:**  
- Helps attackers identify the exact version for targeted attacks
- Minor information leakage

**Recommended Fix:**
- Remove the `version` field from the health endpoint in production
- Or make it available only to authenticated/internal requests

---

### [LOW-002] Payment Verify Error Message Leaks Validation Logic

**Severity:** LOW  
**Endpoint:** `POST /api/payments/verify`

**Description:**  
The payment verification endpoint returns specific error messages that reveal the internal validation steps.

**Proof of Concept:**
```bash
curl -s -X POST https://supersandguard.com/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","chainId":8453}'
# {"error":"Transaction recipient does not match payment wallet"}
```

**Impact:**  
- Reveals that the system checks transaction recipient address
- Could help an attacker iterate and understand validation steps to craft a bypass
- Different error messages for different failures enable enumeration of validation steps

**Recommended Fix:**
- Use a generic error message: `"Payment verification failed"`
- Log specific reasons server-side for debugging

---

### [LOW-003] Subscription Status Enumerable via /api/payments/status

**Severity:** LOW  
**Endpoint:** `GET /api/payments/status/:address`

**Description:**  
The payment status endpoint allows anyone to check whether any wallet has an active subscription, without authentication.

**Proof of Concept:**
```bash
curl -s "https://supersandguard.com/api/payments/status/0x0000000000000000000000000000000000000001"
# {"status":"inactive","message":"No active subscription"}
```

**Impact:**  
- Attackers could enumerate wallet addresses to find active subscribers
- Could be used to build a list of SandGuard Pro users
- Privacy concern for users

**Recommended Fix:**
- Require authentication (API key or signed message) to check status
- Or return the same response regardless of subscription status unless authenticated

---

### [LOW-004] No robots.txt or security.txt

**Severity:** LOW  
**Affected:** Frontend

**Description:**  
The application lacks both `robots.txt` and `security.txt` files. All unmatched routes return the SPA HTML (200 OK), which is a minor issue.

**Proof of Concept:**
```bash
curl -s https://supersandguard.com/robots.txt | head -5
# Returns SPA HTML (not a real robots.txt)

curl -s https://supersandguard.com/.well-known/security.txt | head -5
# Returns SPA HTML
```

**Recommended Fix:**
- Add a `robots.txt` with appropriate directives
- Add a `security.txt` per RFC 9116 with contact information for responsible disclosure

---

### [LOW-005] Express Default Error Page Exposed for Malformed JSON

**Severity:** LOW  
**Affected:** All POST endpoints

**Description:**  
Sending malformed JSON to POST endpoints returns Express's default error HTML page instead of a JSON error response.

**Proof of Concept:**
```bash
curl -s -X POST https://supersandguard.com/api/decode \
  -H "Content-Type: application/json" \
  -d '{invalid json'
# Returns HTML: <pre>Bad Request</pre>
```

**Impact:**  
- Reveals the backend framework (Express/Node.js)
- Inconsistent response format (HTML vs JSON)

**Recommended Fix:**
```javascript
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});
```

---

### [INFO-001] Rate Limiting is Functional ✅

**Severity:** INFO (Positive Finding)

**Description:**  
Rate limiting is correctly implemented at 30 requests per 60-second window. Testing confirmed that request #31 and beyond receive 429 status codes.

**Evidence:**
```
Request 30: 200
Request 31: 429
...
Request 50: 429
```

Rate limit headers are properly exposed:
```
ratelimit-limit: 30
ratelimit-policy: 30;w=60
ratelimit-remaining: 27
ratelimit-reset: 59
```

**Cannot be bypassed** with `X-Forwarded-For` or `X-Real-IP` headers — rate limiting persists with spoofed IPs.

---

### [INFO-002] Input Validation on Safe Address Endpoint ✅

**Severity:** INFO (Positive Finding)

**Description:**  
The `/api/safe/{address}/transactions` endpoint properly validates Ethereum addresses and rejects SQL injection attempts, XSS payloads, and path traversal attempts.

**Evidence:**
```bash
# SQL injection → properly rejected
curl -s "https://supersandguard.com/api/safe/0x1234'%20OR%201=1--/transactions"
# {"error":"Invalid Safe address","message":"Provide a valid Ethereum address (0x...)"}
```

---

### [INFO-003] Webhook Authentication Working ✅

**Severity:** INFO (Positive Finding)

**Description:**  
The `/api/webhooks/daimo` endpoint properly rejects requests without valid authentication.

**Evidence:**
```bash
# No auth header → 401
curl -s -X POST https://supersandguard.com/api/webhooks/daimo \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.completed"}'
# {"error":"Unauthorized"}

# Fake signature → 401
curl -s -X POST https://supersandguard.com/api/webhooks/daimo \
  -H "X-Daimo-Signature: sha256=fakesignature" \
  -d '{"event":"payment.completed"}'
# {"error":"Unauthorized"}
```

---

### [INFO-004] No Sensitive Files Exposed ✅

**Severity:** INFO (Positive Finding)

**Description:**  
Common sensitive files (`.env`, `.git/config`, source maps) are not exposed. The SPA's catch-all route returns the frontend HTML for all unmatched paths, effectively hiding any server-side files.

**Evidence:**
- `/.env` → Returns SPA HTML (not env file)
- `/.git/config` → Returns SPA HTML
- `/assets/index-BnfLu3ws.js.map` → Returns SPA HTML
- No API keys, secrets, or VITE environment variables found in the 4.4MB frontend JS bundle

---

### [INFO-005] No Secrets in Frontend Bundle ✅

**Severity:** INFO (Positive Finding)

**Description:**  
The 4.4MB frontend JavaScript bundle was analyzed for secrets. No API keys, authentication tokens, or sensitive environment variables were found. The only `VITE_` reference found was a cryptocurrency token image URL (unrelated to env vars).

---

### [INFO-006] Payment Endpoints Have Proper Field Validation ✅

**Severity:** INFO (Positive Finding)

**Description:**  
Payment endpoints properly validate required fields and return appropriate error messages:
- `/api/payments/verify` → Requires `txHash` and `address`
- `/api/payments/activate` → Requires `address` and `paymentId`
- `/api/payments/recover` → Requires `address`
- `/api/promo/redeem` → Requires `code` and `address`, validates code existence
- Payment verify checks transaction recipient matches payment wallet

---

## Attack Surface Summary

| Endpoint | Method | Auth Required | Rate Limited | Input Validated | Notes |
|----------|--------|:---:|:---:|:---:|-------|
| `/api/health` | GET | ❌ | ✅ | N/A | Leaks version |
| `/api/safe/:addr/transactions` | GET | ❌ | ✅ | ✅ | Address validated |
| `/api/decode` | POST | ❌ | ✅ | ⚠️ | No size limit, accepts XSS in contractAddress |
| `/api/simulate` | POST | ❌ | ✅ | ⚠️ | No `from` validation |
| `/api/explain` | POST | ❌ | ✅ | ✅ | Requires decoded/simulation data |
| `/api/risk` | POST | ❌ | ✅ | ✅ | Proper validation |
| `/api/payments/verify` | POST | ❌ | ✅ | ✅ | Verbose error messages |
| `/api/payments/recover` | POST | ❌ | ✅ | ✅ | OK |
| `/api/payments/activate` | POST | ❌ | ✅ | ✅ | OK |
| `/api/payments/status/:addr` | GET | ❌ | ✅ | ⚠️ | Enumerable |
| `/api/promo/redeem` | POST | ❌ | ✅ | ✅ | OK |
| `/api/webhooks/daimo` | POST | ✅ | ✅ | ✅ | Proper auth |

---

## Prioritized Remediation Plan

### Priority 1 — Fix This Week
1. **[HIGH-001]** Add payload size limits to `/api/decode` (max 64KB body, max 50 parameters)
2. **[MEDIUM-002]** Add security headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)
3. **[MEDIUM-001]** Validate `from` and `contractAddress` as Ethereum addresses before processing

### Priority 2 — Fix Within 2 Weeks
4. **[MEDIUM-003]** Tighten CORS: only allow credentials and preflight for whitelisted origins
5. **[MEDIUM-004]** Validate all address inputs across all endpoints
6. **[LOW-005]** Add custom JSON error handler for malformed request bodies

### Priority 3 — Fix Within 1 Month
7. **[LOW-001]** Remove version from health endpoint or gate behind auth
8. **[LOW-002]** Use generic error messages on payment verify
9. **[LOW-003]** Gate subscription status behind authentication
10. **[LOW-004]** Add `robots.txt` and `security.txt`

---

## Methodology

This audit was conducted using black-box testing from an external perspective. The following techniques were employed:

- **API Fuzzing:** All documented endpoints tested with valid, invalid, and malicious inputs
- **Injection Testing:** SQL injection, XSS, path traversal, and prompt injection attempts
- **Authentication Testing:** Endpoints tested with/without API keys, with fake keys
- **Rate Limit Testing:** 50 rapid sequential requests, IP spoofing bypass attempts
- **CORS Testing:** Cross-origin requests from unauthorized domains
- **Infrastructure Reconnaissance:** Header analysis, common file discovery, source map checks
- **Secret Scanning:** Frontend JS bundle analyzed for hardcoded credentials
- **Payment Security:** Transaction replay, wallet enumeration, fake payment attempts

**Tools Used:** curl, bash scripting, manual analysis

---

## Disclaimer

This audit represents a point-in-time assessment based on black-box testing. It does not guarantee the absence of all vulnerabilities. Source code review and authenticated testing would provide additional coverage.
