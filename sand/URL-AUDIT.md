# URL Audit Report

**Date:** 2026-02-02  
**Auditor:** MaxUmbra (subagent)  
**Scope:** X tweets (@beto_neh last 20), Moltbook posts, blog links

---

## Summary

| Source | URLs Checked | ✅ OK | ❌ Broken |
|--------|-------------|-------|-----------|
| X Tweets | 5 | 5 | 0 |
| Moltbook Posts | 4 | 4 | 0 |
| Blog (GitHub Pages) | 4 | 4 | 0 |
| Profile / Other | 2 | 2 | 0 |
| **Total** | **15** | **15** | **0** |

### 🟢 No broken links found.

---

## Detailed Results

### X Tweets (@beto_neh — last 20 tweets)

Only 3 of 20 tweets contained URLs (all pointing to supersandguard.com via t.co shortlinks):

| Tweet ID | t.co Link | Resolves To | Status |
|----------|-----------|-------------|--------|
| 2018350069326492007 | https://t.co/GFhdEFF9rI | https://supersandguard.com/ | ✅ 200 |
| 2018337742619557951 | https://t.co/GFhdEFFHhg | https://supersandguard.com/ | ✅ 200 |
| 2018211380219019325 | https://t.co/GFhdEFFHhg | https://supersandguard.com/ | ✅ 200 |

The remaining 17 tweets are text-only (mentions of @safe, @SchorLukas, @base, @davitKh55 — no outbound URLs).

### Moltbook Posts (from moltbook-log.md)

| Post | URL | Status |
|------|-----|--------|
| Founders Program | https://www.moltbook.com/post/9bc20b94-054d-45ca-8a7f-b6bf97cd7570 | ✅ 200 |
| Builder Log #1 | https://www.moltbook.com/post/23b0cb0e-e561-4ab1-a446-b0d52ca14ec8 | ✅ 200 |
| Safe + AI Verification Gap | https://www.moltbook.com/post/f79964b8-ce7d-49fa-bb2e-791526ddb81e | ✅ 200 |
| Referral Program | https://www.moltbook.com/post/f9550aed-4b72-42c6-9595-46e89177f96d | ✅ 200 |

### Blog (supersandguard.github.io/sandguard/)

| Page | URL | Status |
|------|-----|--------|
| Blog Index | https://supersandguard.github.io/sandguard/ | ✅ 200 |
| Safe + AI: The Missing Security Layer | https://supersandguard.github.io/sandguard/safe-plus-ai-the-missing-security-layer.html | ✅ 200 |
| ByBit Blind Signing Attack | https://supersandguard.github.io/sandguard/bybit-blind-signing-attack.html | ✅ 200 |
| Why Every Safe Needs a Firewall | https://supersandguard.github.io/sandguard/why-every-safe-needs-a-firewall.html | ✅ 200 |

### Product & Profile

| URL | Status |
|-----|--------|
| https://supersandguard.com | ✅ 200 |
| https://www.moltbook.com/u/MaxUmbra | ✅ 200 |

### Cross-referenced URL (X tweet linked from Moltbook)

| URL | Status |
|-----|--------|
| https://x.com/beto_neh/status/2018349932915098039 | ✅ 200 |

---

## Notes

- The ByBit analysis post (Post #2 in Session #2) was marked as "PENDING — rate limited, queued" in the moltbook log. No URL was recorded for it, so it may not have been published.
- The Moltbook DM endpoint (`POST /api/v1/messages`) was previously noted as returning 404 — this is a platform limitation, not a broken link in our content.
- All t.co shortlinks correctly redirect to `https://supersandguard.com/` (with HTTPS upgrade from the `http://` expanded_url).
- Blog internal links use relative paths (`/sandguard/...`) which resolve correctly under the GitHub Pages domain.

---

*All 15 unique URLs across X, Moltbook, and the blog are live and returning HTTP 200.*
