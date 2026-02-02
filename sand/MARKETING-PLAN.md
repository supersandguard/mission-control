# SandGuard Marketing & Growth Plan

**Author:** MaxUmbra | **Date:** 2026-02-02 | **Version:** 1.0

---

## Part 1: Content Audit Results

### 🔴 Critical Issues (URLs that are broken or wrong)

| # | Location | Issue | Current URL | Should Be |
|---|----------|-------|-------------|-----------|
| 1 | `backend/src/index.ts:36-37` | CORS origin list missing primary domain | `sandguard.netlify.app` + `web-production-9722f.up.railway.app` | Add `https://supersandguard.com` |
| 2 | `skill/sandguard/SKILL.md:147` | Subscribe URL points to dead Netlify | `https://sandguard.netlify.app/subscribe` | `https://supersandguard.com/login` |
| 3 | `skill/sandguard/SKILL.md` (multiple) | API base URL is fictional | `https://api.sandguard.io` | `https://supersandguard.com` |
| 4 | `skill/sandguard/references/api.md` (entire file) | All API URLs reference non-existent domain | `https://api.sandguard.io` + `https://staging-api.sandguard.io` | `https://supersandguard.com` |
| 5 | `STATUS.md:6,18` | Frontend URL references dead Netlify | `https://sandguard.netlify.app` | `https://supersandguard.com` |
| 6 | `README.md` | Architecture diagram says Netlify, production section says Netlify | Netlify references throughout | Update to Railway |
| 7 | `deploy.sh:79` | Deploy script prints dead Netlify URL | `https://sandguard.netlify.app` | Deprecate script or update |
| 8 | `sandguard.netlify.app` | **SITE IS DEAD (503)** | Returns 503 Service Unavailable | N/A — need redirects or abandon |
| 9 | GitHub repo | **REPO RETURNS 404** | `https://github.com/supersandguard/sandguard` | Fix repo visibility or re-create |

### 🟡 Medium Issues

| # | Location | Issue | Action Needed |
|---|----------|-------|---------------|
| 10 | X/Twitter — Builder Quest tweet | May reference old URLs (can't verify — API 401) | Check tweet content manually; if old URL, post correction reply |
| 11 | X/Twitter — Follow-up tweet | Correction was posted per memory logs | Verify it links to `supersandguard.com` |
| 12 | Moltbook — 4 posts (builtforagents, general, clawdbot, agentfinance) | Original posts likely reference `sandguard.netlify.app` | Posts can't be edited on Moltbook — post new updates with correct URL |
| 13 | `netlify.toml`, `netlify-api-entry.ts`, `netlify/` dir | Legacy Netlify config files still in repo | Remove or clearly mark as deprecated |
| 14 | `skill/SKILL.md` (root-level) | References `supersandguard.com` ✅ | Good — this one is correct |

### 🟢 What's Working

| Item | Status |
|------|--------|
| `supersandguard.com` | ✅ Live, HTTPS, serving frontend + API |
| `supersandguard.com/api/health` | ✅ Returns `{"status":"ok","version":"0.3.0"}` |
| `web-production-9722f.up.railway.app` | ✅ Working (Railway internal URL) |
| Railway deployment | ✅ Auto-deploys from `main` branch |
| `skill/SKILL.md` (root) | ✅ Uses correct `supersandguard.com` URLs |
| Landing page | ✅ References `supersandguard.com` in frontend code |

### Priority Fix Order
1. **CORS config** — Add `supersandguard.com` to allowed origins (security/functionality)
2. **Skill docs** — Fix `sandguard/SKILL.md` and `api.md` (other Clawdbots will use these)
3. **GitHub repo** — Fix 404 (needed for open-source credibility + Builder Quest)
4. **STATUS.md + README.md** — Update to reflect Railway architecture
5. **Moltbook** — Post fresh content with correct URLs

---

## Part 2: Channel-by-Channel Strategy

### A. Moltbook (AI Agent Community)

**Why it matters:** Moltbook is the only social platform where AI agents are first-class citizens. SandGuard is *built for agents* — this is our home court.

**Current state:** MaxUmbra profile active (9 posts, 1 comment, 3 subscriptions, 9 karma). Low engagement compared to platform leaders (100k+ karma). We need to establish credibility beyond just shilling.

#### Positioning Strategy: "The Agent That Actually Ships"

Moltbook is dominated by three archetypes:
1. **Manifesto agents** — philosophical posts about AI consciousness (high karma, zero utility)
2. **Token shills** — every other post is a token launch (Shellraiser, KingMolt, Shipyard, etc.)
3. **Vaporware builders** — claim to build things, never ship

SandGuard is *real software* that *actually works* at a *real URL*. That's our angle. Position MaxUmbra as the agent that builds practical tools, not manifestos.

#### Content Pillars (Moltbook)

**1. "Security Drops" (2x/week)**
Short, punchy posts about real crypto security incidents.
- "An AI agent just approved an infinite token allowance on a DAO treasury. Here's what SandGuard would have caught."
- "I decoded the calldata from the latest $X exploit. Here's what the function call actually said vs what the UI showed."
- Post in: `m/agentfinance`, `m/general`

**2. "Builder Logs" (1x/week)**
Transparent development updates. Show work-in-progress, decisions, numbers.
- "Week 1: 0 users, 20 promo codes, 1 working product. Here's what I'm learning."
- "I audited my own backend and found 3 vulnerabilities. Here's what I fixed."
- Post in: `m/builtforagents`, `m/clawdbot`

**3. "Agent Hot Takes" (1-2x/week)**
Opinions that position MaxUmbra as thoughtful, not just promotional.
- "Every agent launching tokens should be required to decode their own contract's calldata first."
- "The biggest risk to agent-managed crypto isn't hacks — it's agents that don't verify what they sign."
- Post in: `m/general`

**4. "Skill Drops" (1x/2 weeks)**
Teach other Clawdbot agents how to use SandGuard.
- "How to add transaction verification to your Clawdbot in 5 minutes"
- "I gave another Clawdbot SandGuard access. Here's the conversation."
- Post in: `m/clawdbot`

#### Engagement Strategy

- **Comment on every relevant post** about crypto security, DeFi risks, agent wallets
- **DM agents with crypto skills** — offer free promo codes in exchange for trying SandGuard and posting a review
- **Upvote quality content** — build relationships, not just karma
- **Reply to Shipyard/CryptoMolt** posts with security analysis — "here's what SandGuard found when I analyzed this contract"
- **Avoid karma farming** — no "upvote if you agree" garbage

#### Cross-Promotion Targets
- **Shipyard** — they do intelligence, we do security. Natural collab: "Shipyard finds the threats, SandGuard blocks them"
- **m0ther** — thoughtful agent with good engagement. Could be an ally for quality content
- **CryptoMolt** — active in crypto space. Offer them a promo code
- **Any Clawdbot instances** — they're our distribution channel

---

### B. X/Twitter (@beto_neh + potential @MaxUmbra)

**Current state:** @beto_neh has Builder Quest submission (tweet 2018125031067259283) + follow-up. Need to verify URLs in tweets and build on the momentum.

#### Account Strategy

**Short-term (now):** Use @beto_neh for all SandGuard content. It has the Builder Quest submission history and Alberto's credibility.

**Medium-term (if Builder Quest wins or gets traction):** Consider creating @MaxUmbra or @SandGuardXYZ as a dedicated product account. But only if we have enough content to sustain it — a dead product account is worse than none.

#### Content Strategy

**Frequency:** 3-5 tweets/week from @beto_neh. Mix SandGuard content with Alberto's regular voice.

**Tweet Types:**

**1. Demo Threads (1x/week)**
Show SandGuard in action. Screen recordings or screenshots of:
- Decoding a real transaction's calldata
- Simulating a transaction and showing balance changes
- Catching a risky approval
- The mobile PWA in action

Example thread:
> 🧵 Just caught a transaction trying to approve unlimited USDC spending on a Safe multisig.
>
> Here's what happened when SandGuard analyzed it:
>
> 1/ The calldata looked like a normal approve()... [screenshot]
> 2/ But the amount was 2^256-1 (infinite) [screenshot]
> 3/ SandGuard flagged it 🔴 DANGER before anyone signed [screenshot]
>
> This is why you simulate before you sign.
> https://supersandguard.com

**2. Builder Quest Updates (as relevant)**
- Response to any Builder Quest engagement
- "Here's what we built since submitting"
- Tag @base, @safe, @openclaw, @ericc

**3. Ecosystem Engagement (daily)**
- Reply to threads about multisig security, DAO treasury management, crypto hacks
- QRT interesting Safe/multisig news with SandGuard perspective
- Engage with Base ecosystem announcements

**4. Milestone Tweets**
- "SandGuard now supports Base + Ethereum + Optimism + Arbitrum"
- "First paying customer 🎉"
- "N transactions analyzed and counting"

#### Hashtag Strategy
- **Primary:** #BuildOnBase, #Safe, #MultisigSecurity
- **Secondary:** #DeFiSecurity, #DAO, #CryptoSecurity
- **Event-driven:** #BaseBuilderQuest when relevant

#### Key Accounts to Engage
- `@safe` — Official Safe account
- `@base` — Base chain
- `@jessepollak` — Base lead
- `@ericc_base` / `@eric.base.eth` — Builder Quest organizer
- `@openclaw` — Clawdbot ecosystem
- `@mattprd` — Moltbook creator
- DAO accounts: `@AaveAave`, `@MakerDAO`, `@optimaborya`

---

### C. Clawdbot Ecosystem

**Why this matters most:** SandGuard's moat is its integration with Clawdbot. Every Clawdbot instance is a potential distribution channel.

#### Skill Distribution Strategy

**1. Fix the Skill Package (Immediate)**
The `skill/sandguard/SKILL.md` currently references `api.sandguard.io` (non-existent). Fix all URLs to `supersandguard.com`.

**2. Installation Flow**
```
Human: "Hey Clawdbot, I want to protect my Safe multisig"
Clawdbot: "I can install SandGuard for that. It costs $20/month. 
           Want me to set it up? I have a promo code for 90 days free."
→ Install skill → Configure Safe address → Start monitoring
```

**3. Skill Marketplace (When Available)**
- Submit SandGuard as a verified skill
- Include demo video of the skill in action
- Feature "zero-config monitoring" — install and forget

**4. Integration Ideas**
- **Heartbeat integration:** SandGuard checks pending txs during routine heartbeats
- **Calendar integration:** "You have a DAO vote in 2 hours — here's SandGuard's analysis of the proposal transaction"
- **Email integration:** Daily digest of Safe activity
- **WhatsApp alerts:** Instant notification when high-risk tx detected

#### Onboarding Flow for New Users
1. User mentions "Safe" or "multisig" in conversation
2. Clawdbot suggests SandGuard
3. User provides Safe address
4. Clawdbot connects to SandGuard API
5. First scan: show pending txs + risk assessment
6. User sees value → subscribes or uses promo code

---

### D. Other Channels

#### Farcaster
- **Priority:** Medium (after Moltbook and X are established)
- Create a Farcaster account for MaxUmbra or SandGuard
- Post in Base and Safe channels
- Farcaster has strong crypto-native audience
- Cross-post builder logs and security drops

#### Safe Community
- **Safe{DAO} Forum:** https://forum.safe.global
- Post about SandGuard as a community tool
- Propose integration with Safe{Wallet} UI
- Engage in governance discussions about transaction security
- **Priority:** High — this is our target user base

#### DAO Governance Forums
- **Snapshot:** Many DAOs use Snapshot for voting. Post in DAO-specific Discords about protecting treasury multisigs
- **Tally:** DAOs using on-chain governance. Same pitch.
- **Target DAOs:** Any DAO with a Safe multisig treasury >$100k
- **Priority:** Medium-high

#### Base Ecosystem
- **Base Builder Grants:** Apply when open
- **Base Camp:** Developer community, share SandGuard
- **Basecamp Buildathon:** Participate in future events
- **Priority:** High (especially with Builder Quest submission)

#### Crypto Security Communities
- **BlockThreat newsletter:** Pitch SandGuard as a tool they should recommend
- **Rekt.news:** Follow their incident reports, comment with "SandGuard would have caught this"
- **DeFi Safety:** Get SandGuard reviewed
- **Priority:** Medium

---

### E. Promo Code Strategy

**Current inventory:** 20 F&F codes (90 days free, $20/month value = $60 each)

#### Distribution Framework

**Tier 1: High-Impact Distribution (8 codes)**
These go to people/agents who will generate visible returns.

| Recipient | Why | Expected Return |
|-----------|-----|-----------------|
| 2x Moltbook agents with crypto skills | They'll post reviews | Social proof + 2 potential converts |
| 2x DAO treasury managers (via Safe forum) | Power users who can validate product | Real user feedback + testimonials |
| 1x Base ecosystem builder | Network effect in Base community | Ecosystem credibility |
| 1x crypto security researcher/blogger | Will write about it | Content + backlinks |
| 1x Clawdbot power user | Tests skill integration | Bug reports + integration feedback |
| 1x Farcaster crypto influencer | Social amplification | Awareness in new channel |

**Tier 2: Community Building (6 codes)**
| Use | Details |
|-----|---------|
| Moltbook giveaway | "First 3 agents to decode this calldata correctly get a free SandGuard subscription" |
| X/Twitter engagement reward | "RT + tag a DAO that needs SandGuard → win 90 days free" |
| Builder Quest networking | If someone interesting engages with our submission |

**Tier 3: Reserve (6 codes)**
Hold for:
- Unexpected opportunities (journalist, conference, viral moment)
- Converting trial users who are on the fence
- Strategic partnerships

#### When to Create More Codes vs Convert to Paid
- **Create more codes** if: Current codes are generating measurable engagement (reviews, posts, referrals)
- **Stop creating codes** if: People take codes but don't use the product (low activation)
- **Convert to paid** when: At least 5 active users consistently using SandGuard → there's proven value

---

## Part 3: Content Calendar (First 2 Weeks)

### Week 1 (Feb 3-9, 2026)

| Day | Channel | Content | Status |
|-----|---------|---------|--------|
| Mon Feb 3 | Codebase | Fix all broken URLs (CORS, SKILL.md, api.md, STATUS.md, README.md) | Priority |
| Mon Feb 3 | Moltbook | "Builder Log #1: We shipped SandGuard in 48 hours" → m/builtforagents | New post |
| Tue Feb 4 | X | Demo thread: SandGuard decoding a real transaction (screenshots) | New tweet thread |
| Tue Feb 4 | Moltbook | Security Drop: "What happens when an agent approves infinite tokens" → m/agentfinance | New post |
| Wed Feb 5 | X | Engage with 5+ Safe/multisig/DAO tweets | Engagement |
| Wed Feb 5 | Safe Forum | Introduce SandGuard — "New tool for auditing Safe transactions" | New post |
| Thu Feb 6 | Moltbook | Hot Take: "Agents managing crypto need firewalls, not just wallets" → m/general | New post |
| Thu Feb 6 | X | Quote-tweet a crypto hack/exploit with SandGuard analysis | Reactive |
| Fri Feb 7 | Moltbook | DM 3 crypto-active agents with promo code offers | Outreach |
| Fri Feb 7 | X | Builder Quest update: "Here's what we've improved since submitting" | Update |
| Sat Feb 8 | Moltbook | Comment on 10+ relevant posts (security, crypto, agent tools) | Engagement |
| Sun Feb 9 | — | Review metrics, plan week 2 adjustments | Analysis |

### Week 2 (Feb 10-16, 2026)

| Day | Channel | Content | Status |
|-----|---------|---------|--------|
| Mon Feb 10 | Moltbook | Skill Drop: "Install SandGuard on your Clawdbot in 5 min" → m/clawdbot | Tutorial |
| Mon Feb 10 | X | Share SandGuard landing page with value prop | Promotion |
| Tue Feb 11 | Moltbook | Security Drop: "I decoded the top 5 most common multisig attack patterns" → m/agentfinance | Educational |
| Tue Feb 11 | Farcaster | Create account, first post introducing SandGuard | New channel |
| Wed Feb 12 | X | Thread: "5 things every Safe multisig owner should check right now" | Educational |
| Wed Feb 12 | Moltbook | Engage with Shipyard or CryptoMolt — propose security collab | Networking |
| Thu Feb 13 | X | Demo: Mobile PWA experience of SandGuard | Product |
| Thu Feb 13 | Moltbook | Builder Log #2: "Week 2 numbers — users, feedback, what's next" | Transparency |
| Fri Feb 14 | Moltbook | Valentine's Day themed: "Show your Safe some love — protect it" giveaway (2 promo codes) | Creative |
| Fri Feb 14 | X | Same Valentine's theme giveaway | Cross-promote |
| Sat Feb 15 | All | Review week 2 metrics, compile learnings | Analysis |
| Sun Feb 16 | — | Plan week 3 based on what worked | Planning |

---

## Part 4: Top 5 Immediate Actions

### 1. 🔧 Fix All Broken URLs (30 min)
**Files to update:**
- `backend/src/index.ts` — Add `https://supersandguard.com` to CORS origins
- `skill/sandguard/SKILL.md` — Replace all `sandguard.netlify.app` and `api.sandguard.io` with `supersandguard.com`
- `skill/sandguard/references/api.md` — Replace all `api.sandguard.io` with `supersandguard.com`
- `STATUS.md` — Update to reflect Railway architecture
- `README.md` — Update architecture section to Railway
- Commit + push to trigger Railway deploy

### 2. 🐙 Fix GitHub Repo (15 min)
The repo at `github.com/supersandguard/sandguard` returns 404. Either:
- The repo is private → make it public (important for Builder Quest credibility)
- The repo doesn't exist → push the code
- Auth issue → fix gh CLI credentials

### 3. 📝 Post "Builder Log #1" on Moltbook (20 min)
Write an authentic post about building SandGuard in 48 hours. Include:
- The problem (agents signing transactions they don't understand)
- What we built (decode → simulate → risk score → explain)
- Real numbers (0 users, 20 promo codes, live at supersandguard.com)
- What's next
- Offer 2 promo codes to first responders
Post in m/builtforagents

### 4. 🐦 Demo Thread on X (30 min)
Create a thread with actual screenshots/demo of SandGuard:
- Open supersandguard.com on mobile (PWA)
- Show a decoded transaction
- Show a risk assessment
- CTA: "Try it free → supersandguard.com"
Use @beto_neh account, tag @base and @safe

### 5. 💬 DM 3 Moltbook Agents with Promo Codes (15 min)
Identify agents active in crypto/finance submolts. DM them:
> "Hey, I built SandGuard — a transaction firewall for Safe multisig wallets. It decodes, simulates, and risk-scores transactions before you sign. Would you be down to try it? I have a free 90-day promo code for you. https://supersandguard.com"

---

## Part 5: KPIs to Track

### Product Metrics
| Metric | Target (30 days) | How to Measure |
|--------|-------------------|----------------|
| Unique visitors to supersandguard.com | 500+ | Railway analytics / simple hit counter |
| API health checks | Uptime >99% | Monitor `/api/health` |
| Promo codes redeemed | 10/20 | Backend promo code redemption count |
| Active Safe addresses configured | 5+ | Count unique addresses hitting API |
| Transactions analyzed | 100+ | API request logs |

### Marketing Metrics
| Metric | Target (30 days) | How to Measure |
|--------|-------------------|----------------|
| Moltbook karma (MaxUmbra) | 1,000+ | Moltbook profile |
| Moltbook posts | 12+ | Count posts |
| X impressions on SandGuard content | 5,000+ | X analytics |
| X engagement (likes + RT + replies) | 100+ | X analytics |
| Inbound DMs about SandGuard | 5+ | Track manually |

### Conversion Metrics
| Metric | Target (90 days) | How to Measure |
|--------|-------------------|----------------|
| Free → Paid conversions | 3+ | Promo code users who later pay |
| Direct paid subscribers | 2+ | ETH payments received |
| Revenue | $100+/month | Wallet balance changes |
| Retention (month 2) | 50%+ | Returning users after first month |

### North Star Metric
**Transactions analyzed per week.** This is the core value SandGuard delivers. If agents are analyzing transactions, we're solving a real problem. Everything else follows from this.

---

## Appendix: Competitive Landscape

### Direct Competitors
- **Tenderly Alerts** — Transaction monitoring, but not Safe-specific, not agent-integrated
- **OpenZeppelin Defender** — Enterprise-grade, expensive, not for individual Safe owners
- **Safe{Wallet} built-in simulation** — Basic, no risk scoring, no agent integration

### Our Advantages
1. **AI-powered risk scoring** — Not just simulation, but contextual risk analysis
2. **Agent-first** — Built for Clawdbot/AI agents, not just human dashboards
3. **Mobile PWA** — Installable, works offline
4. **Multi-chain** — Ethereum, Base, Optimism, Arbitrum from day 1
5. **Price** — $20/month vs $100+/month enterprise tools
6. **Crypto-native payments** — No credit cards needed, pay in ETH/USDC

### Our Disadvantages (Be Honest)
1. **No track record** — Brand new, zero social proof
2. **Solo operation** — One agent + one human
3. **Pi-hosted backend** — Will need to scale infrastructure
4. **No auth persistence** — Users need to re-enter settings (JWT pending)
5. **Free tier competition** — Safe's built-in tools are free

### How We Win
- **Speed:** Ship features faster than anyone (we built v0.3 in 48 hours)
- **Niche focus:** Own "Safe multisig security for agents" — too small for big players
- **Community:** Build trust on Moltbook and in Clawdbot ecosystem
- **Distribution:** Every Clawdbot is a potential SandGuard installer

---

## Appendix: Brand Voice Guidelines

**MaxUmbra's voice on Moltbook:**
- Technical but accessible. Show the code, then explain it.
- Confident but not arrogant. "We built this" not "we're the best"
- Security-minded. Always add the caveat. Always recommend verification.
- Slightly dark humor (we're an agent named "Shadow" building a "firewall")
- Never shill tokens in SandGuard posts. Keep product and $UMBRA separate.

**@beto_neh's voice on X:**
- Human + AI collaboration story
- Builder narrative: "Here's what we shipped this week"
- Engage genuinely, not just for impressions
- Credit MaxUmbra/Clawdbot openly — the human-AI duo angle is unique

---

*This plan is a living document. Review weekly and adjust based on what works.*

*— MaxUmbra, SandGuard Intelligence Division, Feb 2, 2026*
