# SandGuard — Business Strategy & Market Analysis

> **Prepared:** February 2, 2026
> **Product:** SandGuard — Transaction Firewall for Safe Multisig Wallets
> **URL:** https://supersandguard.com
> **Built by:** MaxUmbra (AI agent) + Alberto (human)
> **Chain:** Base (Ethereum L2)

---

## Table of Contents

1. [Market Analysis](#1-market-analysis)
2. [Competitor Comparison](#2-competitor-comparison)
3. [Pricing Recommendation](#3-pricing-recommendation)
4. [$1 USDC Promo Evaluation](#4-1-usdc-promo-evaluation)
5. [90-Day Campaign Plan](#5-90-day-campaign-plan)
6. [$UMBRA Token Utility Proposal](#6-umbra-token-utility-proposal)
7. [Revenue Projections](#7-revenue-projections)
8. [Top 10 Immediate Action Items](#8-top-10-immediate-action-items)

---

## 1. Market Analysis

### 1.1 Total Addressable Market (TAM)

#### Safe Multisig Ecosystem — By the Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Total volume processed | $1 Trillion+ | Safe.global (Jan 2026) |
| Estimated Safe wallets deployed (all chains) | 30M+ accounts | Safe ecosystem data, Dune Analytics estimates |
| Active Safe wallets (monthly txs) | ~200K–500K | Estimated from on-chain activity |
| **High-value Safes** (>$100K TVL) | ~15,000–30,000 | Core target market |
| **DAO treasuries using Safe** | ~5,000+ | DeepDAO, Tally, Safe ecosystem |
| Avg DAO treasury size | $1M–$50M | DeepDAO aggregate data |
| Total DAO treasury value (Safe-managed) | $25B+ estimated | Cross-referenced DeFi Llama, DeepDAO |

#### Chain Distribution (Estimated)

| Chain | % of Active Safes | Notes |
|-------|-------------------|-------|
| Ethereum mainnet | ~45% | Largest TVL, most DAOs |
| Polygon | ~15% | High count, lower TVL per Safe |
| Arbitrum | ~12% | Growing DeFi ecosystem |
| Optimism | ~8% | OP grants ecosystem |
| Base | ~8% | Fast growth, Coinbase ecosystem |
| Gnosis Chain | ~5% | Legacy Gnosis Safe users |
| Other (BNB, Avalanche, etc.) | ~7% | Fragmented |

#### Market Sizing

| Segment | Count | Avg Monthly Willingness to Pay | Annual Revenue Potential |
|---------|-------|-------------------------------|------------------------|
| **Individual power users** (1-3 Safes) | ~50,000 | $10–20/mo | $6M–12M/yr |
| **Small teams/protocols** (3-10 Safes) | ~10,000 | $50–100/mo | $6M–12M/yr |
| **DAOs** (treasury management) | ~5,000 | $100–500/mo | $6M–30M/yr |
| **Enterprise/Exchanges** | ~500 | $500–5,000/mo | $3M–30M/yr |
| **Total TAM** | | | **$21M–$84M/yr** |

**SandGuard's Serviceable Addressable Market (SAM):** Focus on Base + Ethereum power users and DAOs → ~$5M–$15M/yr opportunity.

**SandGuard's Serviceable Obtainable Market (SOM) — Year 1:** Realistically capture 0.5–2% → **$25K–$300K ARR**.

### 1.2 Pain Points — Why People Get Rekt

#### The Blind Signing Problem

The #1 pain point SandGuard solves: **signers approve transactions they cannot read.**

Safe's native UI shows raw calldata — hex strings that are meaningless to humans. Signers must trust that:
1. The transaction was proposed by a legitimate party
2. The UI hasn't been tampered with
3. The calldata does what they expect

When any of these assumptions fail, catastrophic losses follow.

#### Real-World Examples of Multisig Losses

| Incident | Date | Amount Lost | Attack Vector |
|----------|------|-------------|---------------|
| **ByBit hack** | Feb 2025 | **$1.43 BILLION** | Front-end spoofing of Safe UI; signers approved malicious implementation upgrade disguised as routine transfer. Lazarus Group (DPRK). **Largest crypto hack in history.** |
| **WazirX** | Jul 2024 | $234.9M | Multisig signers deceived via compromised interface |
| **Radiant Capital** | Oct 2024 | $50M+ | Multisig signer devices compromised |
| **DMM Bitcoin** | May 2024 | $305M | Private key mismanagement / compromise |
| **Ronin Network** | Mar 2022 | $624M | Social engineering → multisig key compromise |
| **Harmony Bridge** | Jun 2022 | $100M | Multisig signer compromise (2-of-5) |

**Key insight from ByBit:** Ben Zhou (CEO) confirmed: *"All the signers saw the masked UI which showed the correct address and the URL was from Safe."* The signers literally could not tell the transaction was malicious because they were **blind signing**.

As security researcher Nanak Nihal put it: *"There is a name for this and it's BLIND SIGNING. Please please please stop using hardware wallets and multisigs and thinking you are safe."*

#### Common Attack Vectors SandGuard Addresses

1. **Blind signing** — Can't read calldata → approve malicious tx (SandGuard decodes to plain English)
2. **UI spoofing** — Compromised frontend shows fake tx details (SandGuard independently decodes + simulates)
3. **Malicious proposals** — Insider or compromised signer proposes drain tx (SandGuard AI risk scoring flags anomalies)
4. **Delayed attacks** — Malicious tx sits in queue waiting for quorum (SandGuard 24/7 monitoring alerts on suspicious queued txs)
5. **Implementation upgrades** — Contract logic swapped silently (SandGuard detects proxy upgrades and ownership changes)

#### The $2.2B Context

Per Chainalysis (2024 report):
- **$2.2 billion** stolen from crypto platforms in 2024 (21% YoY increase)
- **303 individual hacking incidents** in 2024
- **43.8%** of stolen funds came from **private key compromises**
- **North Korean hackers (Lazarus)** responsible for **$1.34B** (61% of total stolen)
- DeFi + centralized services both heavily targeted

**SandGuard's value proposition in one sentence:** *"For $20/month, never blind-sign a Safe transaction again."*

### 1.3 Willingness to Pay

#### Security Tool Price Benchmarks

| Product | Model | Price Range | Target |
|---------|-------|-------------|--------|
| Hardware wallet (Ledger/Trezor) | One-time | $79–$399 | Individual |
| Password manager (1Password) | Subscription | $3–8/mo | Individual |
| VPN (NordVPN, etc.) | Subscription | $3–12/mo | Individual |
| Tenderly (dev tools) | Subscription | $0–500/mo | Dev teams |
| Blowfish (wallet security API) | B2B SaaS | $500+/mo | Wallet companies |
| Audit (Trail of Bits, OpenZeppelin) | One-time | $50K–$500K | Protocols |

#### Price Sensitivity Analysis

- **Individual crypto users:** Very price-sensitive. Will pay $5–20/mo for security they understand and trust. Free tier expected.
- **Small teams/DAOs:** Moderate sensitivity. Budget exists but must justify to governance. $20–100/mo is acceptable if value is clear.
- **Enterprise/Large DAOs:** Low price sensitivity if product delivers. $200–2,000/mo is noise for a $10M+ treasury. ROI argument is easy: "Costs $200/mo, could save $1M+."
- **Key psychological threshold:** $20/mo is the "Netflix price" — familiar, acceptable, non-threatening. Good anchor.

---

## 2. Competitor Comparison

### 2.1 Detailed Competitor Matrix

| Feature | **SandGuard** | **Tenderly** | **Blowfish** | **Pocket Universe** | **Fire.so** | **Safe Native UI** |
|---------|:------------:|:------------:|:------------:|:-------------------:|:-----------:|:------------------:|
| **Focus** | Safe multisig firewall | Dev platform (simulation, debugging, monitoring) | Wallet security API (B2B) | Browser extension (individual) | Transaction preview extension | Multisig management |
| **Target Customer** | Safe owners, DAOs, treasury managers | DeFi developers, protocol teams | Wallet companies (Phantom, etc.) | Individual retail users | Individual retail users | Safe multisig owners |
| **Calldata Decoding** | ✅ Plain English | ✅ Technical | ❌ API only | ✅ Simplified | ✅ Simplified | ❌ Raw hex |
| **Transaction Simulation** | ✅ Pre-sign | ✅ Full fork sim | ✅ API | ✅ Pre-sign | ✅ Pre-sign | ❌ None |
| **AI Risk Scoring** | ✅ Proprietary | ❌ None | ✅ ML-based | ✅ Basic | ❌ None | ❌ None |
| **Safe Queue Monitoring** | ✅ 24/7 alerts | ❌ Not Safe-specific | ❌ Not Safe-specific | ❌ Not multisig | ❌ Not multisig | ✅ Basic queue view |
| **Multisig-Specific** | ✅ Built for Safe | ❌ General purpose | ❌ General wallet | ❌ Individual wallet | ❌ Individual wallet | ✅ Safe only |
| **Supported Chains** | Base, Ethereum | 30+ chains | 10+ chains | Ethereum, Polygon, others | Ethereum, L2s | 15+ chains |
| **Pricing** | **$20/mo** | Free / $50 / $500/mo | Free / $500+/mo | **Free** (browser ext) | **Free** (browser ext) | **Free** |
| **Payment Method** | Crypto (USDC on Base) | Credit card / crypto | Invoice | N/A (free) | N/A (free) | N/A (free) |
| **Business Model** | B2C/B2B SaaS | B2B SaaS (dev tools) | B2B API | Freemium (extension) | Freemium (extension) | Part of Safe ecosystem |
| **Users** | Early stage | 100K+ developers | 200K+ (via wallet integrations) | 200K+ users | ~50K+ users | Millions (Safe itself) |

### 2.2 Competitive Positioning

#### SandGuard's Unique Advantages (Moat)

1. **Only product built specifically for Safe multisig security** — Every competitor is either a general dev tool (Tenderly), a B2B API (Blowfish), an individual wallet extension (Pocket Universe, Fire), or Safe itself (no simulation/decode). **No one does what SandGuard does for the Safe multisig use case.**

2. **24/7 queue monitoring** — No competitor monitors your Safe queue and alerts you about suspicious pending transactions. This is a unique capability.

3. **AI risk scoring tailored to multisig context** — Generic tools don't understand the specific risks of multisig operations (ownership changes, threshold modifications, delegate calls, implementation upgrades).

4. **Plain English decoding** — Not just "decoded calldata" (technical) but truly human-readable explanations that a non-technical DAO member or CFO can understand.

5. **Crypto-native payment** — No credit card, no KYC. Pay in USDC on Base. This is an advantage for the crypto-native audience.

6. **Built by an AI agent** — Unique narrative angle. MaxUmbra as co-builder creates marketing buzz in the AI x Crypto intersection.

#### SandGuard's Weaknesses (Address These)

1. **Chain support limited to Base + Ethereum** — Most Safes are still on Ethereum mainnet. Need multi-chain.
2. **Early stage, no brand recognition** — Zero established trust yet.
3. **Self-hosted backend (Pi)** — Scalability and reliability concerns for paying customers.
4. **No free tier** — Every competitor has a free option. This is a significant barrier.
5. **No browser extension** — Pocket Universe and Fire integrate at the browser level. SandGuard requires a separate app/dashboard.

### 2.3 Key Insight: The Gap in the Market

```
                    INDIVIDUAL ←————————→ ENTERPRISE
                         |                    |
    FREE  ←─ Pocket Universe  ─────── Tenderly ($500+) ─→ PAID
              Fire.so                  Blowfish ($500+)
              Safe UI (native)
                         |                    |
                         |   *** GAP ***      |
                         |  $10-$100/mo       |
                         |  Safe-specific     |
                         |  prosumer/DAO      |
                         |                    |
                    ←—— SandGuard ——→
```

**SandGuard occupies the unserved middle:** Too sophisticated for free browser extensions, too affordable for enterprise API products. The $20/mo "prosumer/small DAO" slot is **wide open**.

---

## 3. Pricing Recommendation

### 3.1 Recommended Pricing Structure

#### Tier System

| Tier | Price | Target | What's Included |
|------|-------|--------|-----------------|
| **Free (Scout)** | $0/mo | Onboarding, virality | 1 Safe, 10 tx decodes/mo, basic risk alerts, no simulation |
| **Pro (Guardian)** | $20/mo | Power users, small teams | 3 Safes, unlimited decodes, full simulation, AI risk scoring, 24/7 monitoring, email/push alerts |
| **Team (Fortress)** | $99/mo | DAOs, protocols | 10 Safes, everything in Pro + priority alerts, Telegram/Discord bot notifications, API access, multi-user |
| **Enterprise** | Custom ($500+) | Exchanges, large DAOs | Unlimited Safes, SLA, dedicated support, custom integrations, audit logs |

#### Why This Structure

1. **Free tier is essential.** Every competitor has one. Without it, you're fighting with one hand tied. The free tier is your acquisition funnel.
2. **$20/mo Pro is the anchor.** This is the "Netflix price" — psychologically comfortable, easy to expense, easy for a DAO to approve.
3. **$99/mo Team captures more value** from DAOs who manage multiple Safes and need team features. Per-Safe pricing would be confusing; bundles are cleaner.
4. **Enterprise is required** for the long game. Even if you close zero enterprise deals in 90 days, having the option shows maturity.

#### Per-Safe vs Flat Pricing Decision

**Recommendation: Flat pricing with Safe limits per tier (as shown above).**

Per-Safe pricing ($X per Safe) is technically fairer but creates friction:
- Users worry about costs scaling unexpectedly
- DAOs with many Safes feel penalized
- Hard to predict monthly cost

Flat tiers with Safe limits are simpler, more predictable, and align with SaaS best practices.

### 3.2 Annual Discount

| Plan | Monthly | Annual (save 20%) |
|------|---------|-------------------|
| Pro | $20/mo | $192/yr ($16/mo) |
| Team | $99/mo | $948/yr ($79/mo) |

Annual plans reduce churn and lock in revenue. Offer from day one.

### 3.3 $UMBRA Token Discount

Hold ≥10,000 $UMBRA → 25% off any paid tier. (More in Section 6.)

---

## 4. $1 USDC Promo Evaluation

### 4.1 Analysis

#### Pros
| Pro | Weight |
|-----|--------|
| Eliminates price as a barrier to trial | ⭐⭐⭐⭐⭐ |
| Creates urgency (10-day limit) | ⭐⭐⭐⭐ |
| On-chain payment validates the crypto-native flow | ⭐⭐⭐⭐ |
| Gets users into the product (land & expand) | ⭐⭐⭐⭐⭐ |
| Generates social proof ("X users in first 10 days") | ⭐⭐⭐⭐ |
| Great marketing hook ("$1 to protect your treasury") | ⭐⭐⭐⭐ |

#### Cons
| Con | Weight | Mitigation |
|-----|--------|------------|
| Devalues product perception | ⭐⭐⭐ | Frame as "launch special" not "this is what it's worth" |
| Hard to upsell 20x ($1 → $20) | ⭐⭐⭐⭐ | Use the 30-day promo period to prove indispensable value. Alternatively: $5/mo first month instead of $1 |
| Attracts tire-kickers | ⭐⭐ | $1 on-chain payment actually filters out pure noise (need wallet, need USDC) |
| Negligible revenue | ⭐⭐ | This is an investment in growth, not revenue |
| Conversion cliff at day 30 | ⭐⭐⭐⭐ | If product isn't sticky by then, no price helps |

### 4.2 Verdict: CONDITIONAL GO ✅

**Do the $1 promo, but with modifications:**

#### Modified Promo Structure

| Parameter | Recommendation |
|-----------|---------------|
| **Price** | $1 USDC for first month (not 10 days — match the billing cycle) |
| **Duration of offer** | Available for the first 100 signups OR 14 days, whichever comes first |
| **What they get** | Full Pro tier (3 Safes, all features) |
| **After month 1** | Auto-renewal at $20/mo (clearly communicated) |
| **Cap** | 100 users max at $1 price |
| **Marketing angle** | "First 100 Guardians: $1 for your first month" |

#### Why $1 for First Month (Not $1 for 10 Days)

- 10 days isn't enough time to prove value. Users need a full billing cycle to integrate SandGuard into their workflow.
- "First month for $1" is a proven SaaS acquisition tactic (see: most subscription services).
- After 30 days of use, price sensitivity drops dramatically if the product delivers value.

#### Conditions for Success

1. **Onboarding must be frictionless.** If a user pays $1 and can't set up their Safe in 5 minutes, you've lost them forever.
2. **Product must deliver a "wow" moment in the first session.** Decode a complex tx → show them what they were about to sign → show the risk score. This creates the "holy shit" moment.
3. **Email/notification drip campaign during the 30 days.** Weekly "here's what SandGuard caught for you" summaries. Quantify the value.
4. **Day 25 retention push.** "Your $1 trial ends in 5 days. Here's what SandGuard protected: [X txs decoded, Y risks flagged]. Continue at $20/mo."

### 4.3 Alternative: Free Tier + No Promo Pricing

An equally valid approach (and arguably stronger long-term):

1. Launch the **free tier** (1 Safe, 10 decodes/mo)
2. Charge full $20/mo for Pro from day one
3. Use F&F promo codes (90 days free) for early adopters and influencers
4. No need for $1 gimmick — the free tier is your acquisition funnel

**This is actually the recommended approach if you implement a free tier.** The $1 promo is a crutch if you don't have a free tier. If you DO have a free tier, skip the $1 promo entirely.

### 4.4 Final Recommendation

| Scenario | Strategy |
|----------|----------|
| **If you launch with a free tier** | Skip $1 promo. Free → Pro ($20/mo) upgrade path. Use F&F codes for influencers. |
| **If you launch without a free tier** | Do the $1 promo for first 100 users. Then $20/mo standard. |

**Strongest play: Launch with free tier + standard $20/mo Pro. No $1 promo needed.**

---

## 5. 90-Day Campaign Plan

### Phase 1: Soft Launch (Days 1–10)

**Goal:** 50 signups (free tier) + 10 paid users. Establish presence.

#### Channels & Tactics

| Action | Channel | Priority | Owner |
|--------|---------|----------|-------|
| **Launch announcement thread** | Twitter/X (@beto_neh + MaxUmbra accounts) | 🔴 Critical | Alberto + Max |
| **"Built by an AI Agent" narrative** | Twitter/X, Farcaster, Lens | 🔴 Critical | Max |
| **ByBit hack retrospective post** | Twitter thread + blog | 🔴 Critical | Alberto |
| **Moltbook campaign** (already started) | Moltbook platform | 🟡 Active | Max |
| **Post in Safe governance forum** | Safe community forum | 🔴 Critical | Alberto |
| **Post in Base community** | Base Discord, Farcaster /base | 🔴 Critical | Alberto |
| **DM 20 target DAOs** using Safe | Direct outreach | 🔴 Critical | Alberto |
| **F&F promo codes** (90 days free) | Personal network | 🟡 Medium | Alberto |
| **Product Hunt launch** | ProductHunt | 🟡 Medium | Alberto |
| **Hacker News "Show HN"** | HN | 🟡 Medium | Alberto |

#### Content to Produce (Days 1–10)

1. **"The $1.43B Mistake: How Blind Signing Lost ByBit Everything"** — Blog post connecting ByBit hack to SandGuard's value prop. This is your #1 content piece.
2. **60-second demo video** — Show a complex calldata blob → SandGuard decode → plain English + risk score. Screen recording.
3. **"Never Blind-Sign Again" Twitter thread** — Educational, not salesy. Explain the problem, then introduce SandGuard as the solution.
4. **Farcaster frame / cast** — Interactive demo where users paste a tx hash and see a decode preview.

#### Influencer/KOL Strategy

Target these specific people (active in crypto security):

| Person/Account | Why | Approach |
|----------------|-----|----------|
| **@taaborman** (Tayvano) | Documented all 5 Lazarus blind-signing attacks. Massive credibility. | DM with free access. "We built the tool you've been asking for." |
| **@nanaknihal** | Called out blind signing after ByBit. | Same approach. |
| **@samczsun** | Security researcher, Paradigm. Huge following. | Harder to reach. Tweet @ mention + quality content. |
| **@adamscochran** | Commented on ByBit multisig failure. VC. | Share the product, ask for feedback. |
| **Safe team members** | They want their ecosystem to be safer. | Post in Safe forum, tag in threads. |
| **Base ecosystem accounts** | @base, @jessepollak. | Apply to Base ecosystem page. Builder Quest. |
| **Crypto security podcasts** | Unchained, Bankless, etc. | Pitch "AI agent builds security tool" angle. |

#### Community Building

- **Create a Telegram group** for SandGuard users. Keep it small and high-signal.
- **Discord NOT recommended** at this stage — too much overhead for a small team. Telegram is sufficient.
- **Weekly "What SandGuard Caught This Week"** thread on Twitter — anonymized examples of risky transactions detected.

---

### Phase 2: Growth (Days 11–30)

**Goal:** 200 free users + 30 paid users. Content flywheel spinning.

#### Content Marketing Strategy

| Content Type | Frequency | Channel | Purpose |
|-------------|-----------|---------|---------|
| **"Decoded This Week"** — showcase interesting decoded txs | Weekly | Twitter/X, blog | Education + social proof |
| **"DAO Treasury Security Guide"** — comprehensive resource | One-time | Blog, PDF | SEO + lead gen |
| **"Safe Security Best Practices"** — checklist | One-time | Blog, PDF, Safe forum | SEO + authority |
| **Case studies** — "How [DAO X] uses SandGuard" | As available | Blog, Twitter | Social proof |
| **ByBit deep-dive series** (3 parts) | Weekly | Blog, Twitter threads | Thought leadership |
| **Video walkthroughs** | Bi-weekly | YouTube, Twitter | Product demos |

#### Partnership Opportunities

| Partner | Opportunity | Approach |
|---------|-------------|----------|
| **Safe{Wallet} team** | Official integration / listing in Safe app store | Apply as Safe app. Show the product. |
| **Base team (Coinbase)** | Builder Quest, ecosystem grants, feature on base.org | Apply for Builder Quest. Tag @jessepollak. |
| **Optimism** | RetroPGF grant (public good for tx security) | Apply to next RetroPGF round |
| **Gitcoin** | Grants round (security tooling category) | Apply to Gitcoin grants |
| **DAO tooling platforms** (Tally, Snapshot) | Integration partnership | Mutual benefit — their users need security |
| **Colony, Aragon** | DAO framework partnerships | Offer embedded SandGuard in their UI |

#### Referral Program Design

| Element | Design |
|---------|--------|
| **Mechanic** | Each paid user gets a unique referral code |
| **Referrer reward** | 1 month free for every referred paid user |
| **Referee reward** | First month 50% off ($10) |
| **Cap** | Max 6 months free per referrer (prevent abuse) |
| **Tracking** | On-chain referral code embedded in payment |
| **Viral hook** | "Protect your friends' treasuries. Share SandGuard." |

#### Base Builder Quest

Base runs Builder Quests to incentivize building on Base. SandGuard should:
1. Apply to the next Builder Quest
2. Showcase "built on Base" prominently
3. Integrate with Base ecosystem projects
4. Get listed on base.org/ecosystem
5. Apply for Base ecosystem grants (Coinbase Ventures adjacent)

---

### Phase 3: Scale (Days 31–90)

**Goal:** 500 free users + 100 paid users. Sustainable growth engine.

#### Paid Acquisition Channels

| Channel | Budget/mo | Expected CPA | Notes |
|---------|-----------|--------------|-------|
| **Twitter/X promoted tweets** | $500–1,000 | $10–30 per signup | Target crypto security keywords |
| **Farcaster sponsored casts** | $200–500 | $5–15 per signup | Highly targeted crypto audience |
| **Crypto newsletter sponsorships** | $500–2,000 | $15–40 per signup | Bankless, The Defiant, Week in Ethereum |
| **Google Ads (crypto security keywords)** | $300–700 | $20–50 per signup | Long-tail keywords: "safe multisig security", "decode calldata" |
| **Reddit ads (r/ethereum, r/defi)** | $200–500 | $10–25 per signup | Community targeting |

**Recommended Phase 3 budget: $2,000–5,000/month.** Only scale if Phase 2 conversion data supports it.

#### Integration Partnerships

1. **Safe App Store** — Get listed as an official Safe app. This is the #1 distribution channel.
2. **Rabby Wallet** — Integration as a pre-sign check (like Pocket Universe does for MetaMask).
3. **Gnosis Guild (Zodiac modules)** — SandGuard as a Safe Guard module (on-chain enforcement).
4. **Defender (OpenZeppelin)** — Complementary tooling partnership.
5. **Chainlink** — Safe already partners with Chainlink. Could SandGuard use Chainlink Functions for decentralized simulation?

#### Enterprise/DAO Sales Motion

1. **Identify top 50 DAOs by treasury size** (Uniswap, Aave, Lido, Arbitrum, Optimism, MakerDAO, etc.)
2. **Create a 1-page "DAO Security Brief"** customized per DAO showing their specific Safe addresses, pending tx count, and potential risks.
3. **Cold outreach to DAO contributors** on governance forums, Discord, Twitter.
4. **Offer free 30-day pilot** for any DAO with >$1M treasury.
5. **Get one marquee DAO customer** and use them as a case study.

#### Community-Led Growth

1. **Ambassador program** — 10 crypto-native ambassadors who get free access + commission on referrals.
2. **Bug bounty** — $100–500 for valid security reports on SandGuard itself.
3. **"Decode challenge"** — Weekly Twitter challenge: post a complex calldata, first to decode it (using SandGuard) wins $UMBRA.
4. **DAO proposal template** — Create a ready-to-submit governance proposal for DAOs to adopt SandGuard. Lower friction for DAO treasury managers who need governance approval.

---

## 6. $UMBRA Token Utility Proposal

### 6.1 Current State

- **$UMBRA** exists on Base with 1B supply
- No current utility beyond speculative trading
- Token needs utility to have sustainable value

### 6.2 Proposed Token Utility Framework

#### Tier 1: Discount & Access (Immediate — Launch Now)

| Utility | Mechanism | Details |
|---------|-----------|---------|
| **Subscription discount** | Hold ≥10,000 $UMBRA → 25% off any paid tier | Snapshot at payment time; no staking required |
| **Pay with $UMBRA** | Accept $UMBRA as payment (at market rate + 10% bonus) | E.g., if $20 worth of $UMBRA = $18 effective price |
| **Early access** | Hold ≥50,000 $UMBRA → access beta features 2 weeks early | Incentivizes larger holdings |

#### Tier 2: Loyalty & Rewards (Month 2–3)

| Utility | Mechanism | Details |
|---------|-----------|---------|
| **Referral rewards in $UMBRA** | Successful referral = 1,000 $UMBRA to referrer | Funded from a marketing allocation |
| **Bug bounty payments** | Security reports paid in $UMBRA | Gives token organic demand |
| **"Decode challenge" prizes** | Weekly challenge winners receive $UMBRA | Community engagement |
| **Monthly airdrop to active users** | Pro/Team subscribers who use product actively → small $UMBRA reward | Retention + token distribution |

#### Tier 3: Governance & Staking (Month 3–6)

| Utility | Mechanism | Details |
|---------|-----------|---------|
| **Feature voting** | Hold $UMBRA → vote on roadmap priorities | Lightweight governance (Snapshot) |
| **Chain priority voting** | Community votes on which chains to add next | Direct product impact |
| **Staking for premium** | Stake 100K $UMBRA → unlock Team tier for free | For large holders; reduces sell pressure |
| **DAO security fund** | Staked $UMBRA creates a small insurance pool for verified hacks | Advanced; builds trust in ecosystem |

### 6.3 Token Economics Guard Rails

**Critical:** Do NOT make $UMBRA required to use SandGuard. The token should always be optional — a benefit, not a gate. Forcing token purchases kills adoption.

| Principle | Rationale |
|-----------|-----------|
| Token is always optional | Users can pay with USDC and never touch $UMBRA |
| Discounts, not requirements | $UMBRA gives discounts, not exclusive access |
| Clear value accrual | More SandGuard users → more $UMBRA demand (discounts + payments) |
| No inflationary rewards | Don't print tokens for rewards; allocate from existing supply |
| Transparent allocation | Publish the token allocation for marketing/rewards/treasury |

### 6.4 Recommended Token Allocation (from 1B supply)

| Allocation | % | Amount | Purpose |
|------------|---|--------|---------|
| Team/founders | 20% | 200M | Alberto + Max, vested 2 years |
| Community/marketing | 15% | 150M | Referral rewards, challenges, airdrops |
| Liquidity | 10% | 100M | DEX liquidity on Base |
| Treasury | 20% | 200M | Future development, partnerships |
| Public (already circulating) | 35% | 350M | Market |

---

## 7. Revenue Projections (90 Days)

### 7.1 Assumptions

| Variable | Conservative | Moderate | Optimistic |
|----------|-------------|----------|------------|
| Free tier signups (90 days) | 100 | 300 | 800 |
| Free → Pro conversion rate | 5% | 10% | 15% |
| Direct Pro signups | 10 | 25 | 60 |
| Team tier signups | 0 | 3 | 10 |
| Enterprise deals | 0 | 0 | 1 |
| Monthly churn rate | 15% | 10% | 5% |
| Average Pro revenue/user/mo | $20 | $20 | $18 (discounts) |
| Average Team revenue/user/mo | $99 | $99 | $99 |

### 7.2 Revenue Model (90-Day Forecast)

#### Conservative Scenario

| Month | New Free | Free→Pro | Direct Pro | Team | Total Paid | MRR | Revenue |
|-------|----------|----------|------------|------|-----------|-----|---------|
| 1 | 30 | 2 | 3 | 0 | 5 | $100 | $100 |
| 2 | 35 | 3 | 4 | 0 | 10 | $200 | $200 |
| 3 | 35 | 3 | 3 | 0 | 13 | $260 | $260 |
| **Total** | **100** | **8** | **10** | **0** | **15** | | **$560** |

#### Moderate Scenario

| Month | New Free | Free→Pro | Direct Pro | Team | Total Paid | MRR | Revenue |
|-------|----------|----------|------------|------|-----------|-----|---------|
| 1 | 80 | 4 | 8 | 1 | 13 | $359 | $359 |
| 2 | 100 | 8 | 10 | 1 | 27 | $639 | $639 |
| 3 | 120 | 10 | 7 | 1 | 38 | $859 | $859 |
| **Total** | **300** | **22** | **25** | **3** | **47** | | **$1,857** |

#### Optimistic Scenario

| Month | New Free | Free→Pro | Direct Pro | Team | Total Paid | MRR | Revenue |
|-------|----------|----------|------------|------|-----------|-----|---------|
| 1 | 200 | 15 | 20 | 3 | 38 | $1,057 | $1,057 |
| 2 | 300 | 25 | 20 | 4 | 73 | $1,856 | $1,856 |
| 3 | 300 | 30 | 20 | 3 | 110 | $2,797 | $2,797 |
| **Total** | **800** | **70** | **60** | **10** | **130** | | **$5,710** |

*Note: Optimistic includes 1 enterprise deal at $500/mo closing in Month 3, adding $500 to total.*

### 7.3 Summary

| Scenario | 90-Day Revenue | End MRR | Paid Users |
|----------|---------------|---------|------------|
| **Conservative** | $560 | $260/mo | 15 |
| **Moderate** | $1,857 | $859/mo | 47 |
| **Optimistic** | $6,210 | $3,297/mo | 131 |

### 7.4 Path to $10K MRR (Milestone Target)

At $20/mo average: need **500 paid users**.
At moderate conversion rates, this is achievable in **6–9 months** with consistent execution.

Key levers to pull:
1. **Safe App Store listing** (if achieved, could 5x organic signups)
2. **One viral ByBit-style security thread** (could drive 500+ free signups overnight)
3. **One marquee DAO customer** (social proof accelerates everything)
4. **Team tier adoption** (3x revenue per user vs Pro)

---

## 8. Top 10 Immediate Action Items

### 🔴 Do This Week (Days 1–3)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| **1** | **Implement a free tier** (1 Safe, 10 decodes/mo) | Without this, you're fighting every competitor with a free option. This is your #1 growth blocker. | 1–2 days backend |
| **2** | **Write the ByBit blind-signing blog post** | This is your content atom bomb. $1.43B stolen by blind signing → SandGuard prevents this. Time-sensitive while ByBit is still in public consciousness. | 1 day |
| **3** | **Create a 60-second demo video** | Show raw calldata → SandGuard decode → plain English + risk score. Post everywhere. | Half day |
| **4** | **Post in Safe governance forum** | Announce SandGuard to the exact community that needs it. Free, high-impact. | 1 hour |

### 🟡 Do This Month (Days 4–14)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| **5** | **Apply to be a Safe App** | Getting into the Safe App Store is potentially the single highest-leverage distribution move. Start the process now. | 1 day (application) |
| **6** | **Apply to Base Builder Quest / ecosystem grants** | Free money + visibility in the Base ecosystem. SandGuard is built on Base — lean into this. | 1 day |
| **7** | **DM 20 DAO treasury managers** with free access | Hand-pick 20 DAOs. Offer free Pro access. Get feedback + testimonials. | 2–3 days |
| **8** | **Set up referral tracking** | Even simple (unique codes → manual tracking). Referrals will be your #1 organic growth channel. | 1 day |

### 🟢 Do This Quarter (Days 15–30)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| **9** | **Implement $UMBRA discount** (hold 10K → 25% off) | Gives the token immediate utility. Drives demand. Easy to implement (check balance at payment time). | 1 day |
| **10** | **Migrate backend off Pi to cloud** (Railway, Render, or Fly.io) | Paying customers expect reliability. A Raspberry Pi backend is a single point of failure. Even a $5/mo VPS is better. | 1–2 days |

---

## Appendix: Key Quotes for Marketing

Use these in content and ads:

> *"All the signers saw the masked UI which showed the correct address and the URL was from Safe."*
> — Ben Zhou, ByBit CEO, after $1.43B hack

> *"There is a name for this and it's BLIND SIGNING. Please please please stop using hardware wallets and multisigs and thinking you are safe."*
> — Nanak Nihal, after ByBit hack

> *"So, in essence, a group of ByBit executives, who should have significant OpSec training, blindly signed a transaction without asking any of the other multi-sig owners to confirm what it was for."*
> — Derek Silva

> *"They've done this 5 times now. Please start taking it seriously."*
> — Tayvano, security researcher (referring to Lazarus Group's blind-signing attacks)

> *"As onchain exposure grows, neutrality disappears. For enterprises moving value onchain, multisig is no longer optional; it is the baseline."*
> — Safe{Wallet} blog, Jan 2026

> *"$2.2 billion stolen from crypto platforms in 2024... 43.8% from private key compromises."*
> — Chainalysis, 2025 Crypto Crime Report

---

## Appendix: Tagline Options

1. **"Never blind-sign again."** ← Recommended. Direct. Fearful. Actionable.
2. "Your Safe's immune system."
3. "See what you're signing."
4. "The transaction firewall for Safe."
5. "Decode. Simulate. Protect."

---

*This document should be reviewed and updated monthly as market conditions, competitive landscape, and product capabilities evolve.*
