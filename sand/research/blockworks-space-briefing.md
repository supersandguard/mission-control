# Blockworks Space Briefing
**"Self custody is dead, long live self custody!"**
📅 Feb 3, 2026 | Sponsored by OasisVault
🔗 [Space](https://x.com/i/spaces/1mnGeNABObEJX) | [Tweet](https://x.com/Blockworks_/status/2018390502001824183)

---

## 1. Context: Why This Topic, Why Now

**The paradox in the title:** Self-custody "died" (ByBit proved even sophisticated multisig setups can be hacked for $1.4B) — but long live self-custody (the alternative — trusting custodians — is worse). The industry must evolve self-custody, not abandon it.

**Key events shaping the conversation:**

- **ByBit hack (Feb 2025)** — $1.4B stolen via UI manipulation of a Safe multisig. Lazarus Group. Signers saw a spoofed interface, approved a malicious payload. The *smart contract* wasn't exploited — the *human signing process* was. This is THE defining event.
- **Blind signing crisis** — ByBit proved that signing what you can't read = writing blank checks. Ledger's CTO: *"Stop signing blank cheques."* Ledger removed blind signing from their devices post their own 2023 attack.
- **Ledger Enterprise Multisig (Oct 2025)** — Built on Safe's open-source code but adding Clear Signing natively. Charges per-tx fee. Safe sees it as "validation" of their standard.
- **Safe + Circle USDC partnership (Oct 2025)** — USDC as default asset for institutional self-custody. Safe securing ~$100B across 7M+ smart accounts.
- **Safe's "Multisig is the baseline" manifesto (Jan 2026)** — Position paper arguing: ad-hoc custody vs multisig, there's no middle ground. Multisig isn't innovation, it's the minimum standard.
- **Regulatory shift** — Post-FTX/Celsius, regulators more sympathetic to self-custody. But MiCA and US frameworks still push toward licensed custodians. Tension: compliance vs sovereignty.

**MPC vs Multisig debate:**
- MPC (Multi-Party Computation): Fireblocks, institutional darling. Single key split into shards. Proprietary, hard to audit.
- Multisig (Safe): Transparent, onchain, auditable. But vulnerable to UI/signing attacks (ByBit proved this).
- Emerging middle: "smart accounts" that combine multisig + programmable policies + clear signing.

---

## 2. Speaker Profiles

### 🎙️ @yeluacaM — Macauley Peterson (MODERATOR)
- **Role:** Senior Editor at Blockworks & Blockworks Research
- **Followers:** 2.2K | Based in Germany
- **Background:** Edits 0xResearch newsletter and The Breakdown. Deep in Ethereum/DeFi coverage.
- **Relevant beats:** Covered the Ledger Gen5 + Enterprise Multisig launch, Safe+Circle partnership, ByBit hack aftermath, Ethereum governance. Wrote about Ledger Clear Signing solving the blind signing problem.
- **Angle:** Will likely steer conversation toward ByBit lessons, institutional adoption tensions, and what "enterprise-grade" self-custody looks like.
- **Note:** As moderator for the sponsor's Space, will likely give OasisVault softball setup questions.

### 🟢 @_0xsd_ — 0xsd (OASISVAULT)
- **Role:** Self-described "self-custody maxi" at @OasisVaultio
- **Followers:** 163 | Based in North America
- **Background:** Likely co-founder or core team at OasisVault. Low profile, relatively new account (Oct 2022). Verified.
- **Angle:** Will advocate for OasisVault's 2-of-3 multisig model. "Self-custody with a safety net." Likely anti-KYC, pro-privacy positioning.
- **What to expect:** OasisVault product pitch woven into self-custody philosophy. Recovery + inheritance as killer features.

### 🔵 @Oxxbid — oxb.base.eth (BASE/COINBASE)
- **Role:** Product Manager for Trading at Base (Coinbase's L2)
- **Followers:** 10.7K | Based in UK | Active on Farcaster
- **Background:** "In the trenches" — high-volume poster (10.8K tweets). Deep in Base ecosystem, DeFi trading.
- **Angle:** Brings the Coinbase/Base perspective. Base is pushing smart wallets, account abstraction, passkey-based onboarding. This is the "make self-custody easy enough for normies" camp.
- **Tension point:** Coinbase is also a major *custodian* (Coinbase Custody). How does Base's self-custody push square with the parent company's custody business?

### 🟣 @rsquare — Rahul Rumalla (SAFE LABS)
- **Role:** CEO of Safe Labs (est. June 2025)
- **Followers:** 3.7K | Based in Berlin | Ex-SoundCloud
- **Website:** rahulrumalla.com — "Building systems people can truly own"
- **Background:** Shaped how hundreds of millions discover/monetize music at SoundCloud. Founded startups across Web3 and creator economy. Now running Safe Labs — the commercial arm of Safe, operating app.safe.global with enterprise SLAs.
- **Key positions:**
  - Safe = "the industry standard" for onchain custody
  - "Multisig is the baseline" — no room for ad-hoc custody at scale
  - Post-ByBit: problem was compromised credentials + blind signing, NOT Safe's smart contracts
  - Pushing Clear Signing as industry standard (collaborating with Ledger)
  - Safe+Circle: USDC at the core of institutional self-custody
- **Sensitive topics:** ByBit used Safe and got hacked. Rahul will likely draw the line between "Safe's code was fine" and "the signing UX needs to evolve." Watch for defensive framing.

---

## 3. OasisVault Context

**What they are:** Self-custody wallet with a recovery safety net.

**How it works:**
- **2-of-3 multisig:** User holds 2 keys (phone + Ledger), Oasis holds 1 recovery key
- User always controls their assets (2 of 3)
- If you lose one key → recover with remaining key + Oasis's key
- **Inheritance:** Set up a beneficiary, assets recoverable if something happens to you
- **No KYC required** — privacy-first positioning
- **All you need is an email** to get started

**Why they're sponsoring this:**
- Perfect topic alignment — "self custody isn't dead, it just needs a safety net" is literally their pitch
- Blockworks audience = institutional + crypto-native = their target market
- The ByBit narrative creates urgency around better self-custody UX
- Sponsoring gives them credibility + visibility alongside Safe's CEO and Base PM

**Competitive landscape:**
- vs. Fireblocks: OasisVault = self-custody, no KYC. Fireblocks = institutional MPC, licensed custodian.
- vs. Casa: Similar 2-of-3 model, but Casa is Bitcoin-focused + KYC required.
- vs. Plain Safe: OasisVault adds the recovery UX layer + inheritance on top.

---

## 4. Key Themes & Hot Debates

1. **"Self-custody is too hard"** — Is UX the real barrier? OasisVault and Base both tackling this from different angles (recovery keys vs smart wallets).

2. **Blind signing killed ByBit, not multisig** — Clear Signing as the fix. Ledger, Safe, and the whole ecosystem converging on this. But is it enough?

3. **MPC vs Multisig** — Institutional money flows to Fireblocks MPC. Is multisig fighting a losing battle? Or does onchain auditability win long-term?

4. **Single point of failure vs. social recovery** — Hardware wallets alone = one lost seed away from disaster. Multisig + recovery = better? But then who holds the recovery key? Trust circle comes back.

5. **Regulation pushing toward custodians** — MiCA, SEC, etc. want regulated custodians. Does "self-custody with a safety net" satisfy regulators while preserving sovereignty?

6. **Institutional adoption paradox** — Institutions want self-custody (not your keys, not your coins) but also need compliance, insurance, SLAs. Safe Labs building exactly this. Is it still "self-custody" if you need enterprise contracts?

7. **AI agents + custody** — Emerging: autonomous agents managing onchain assets. Who holds the keys? How do you firewall agent actions? (This is where SandGuard fits.)

---

## 5. Smart Questions for Alberto

1. **To Rahul (Safe):** *"After ByBit, Safe published 'Multisig is the baseline' — but the attack showed that even multisig signers can be tricked. Beyond Clear Signing, what systemic changes are needed in how signers verify transactions?"*

2. **To Rahul:** *"Safe Labs now has enterprise SLAs, Circle partnership, Ledger building on your code. At what point does 'self-custody infrastructure' start looking like institutional custody with extra steps?"*

3. **To 0xsd (OasisVault):** *"You hold one of three keys as a recovery mechanism. How do you prevent yourselves from becoming a single point of compromise — the way Safe's UI became one for ByBit?"*

4. **To Oxxbid (Base):** *"Base is pushing passkey wallets and smart accounts — making self-custody feel like Web2 login. But Coinbase is also the largest US custodian. Is there tension between those two missions?"*

5. **To all:** *"The ByBit hack wasn't a smart contract failure — it was a human signing failure. Should we be building systems that remove humans from the signing loop entirely, or is human judgment non-negotiable?"*

6. **To all:** *"What does self-custody look like when AI agents are managing billions in onchain value? Who holds the keys? How do you build guardrails that an agent can't be tricked into bypassing?"*

7. **To Rahul:** *"Ledger's Enterprise Multisig is built on Safe's code but charges a per-transaction fee and adds Clear Signing that Safe{Wallet} doesn't have yet. Is Safe worried about fragmentation of its own standard?"*

---

## 6. SandGuard Angle

**What SandGuard is:** Transaction Firewall for Safe Multisig — analyzes transactions *before* signing, flags malicious payloads.

**Why it's hyper-relevant to this Space:**

- **ByBit as case study:** The signers saw a spoofed UI and approved a malicious transaction. If they had a transaction firewall analyzing the *actual payload* (not just the UI display), it could have flagged the mismatch. SandGuard exists to solve exactly this.

- **Blind signing is the enemy:** The industry is converging on "Clear Signing" — but that requires hardware support (Ledger), protocol support (EIP-712), and *software that actually parses and validates transactions*. SandGuard is the software layer.

- **Multisig doesn't mean safe:** Having 3/5 signers means nothing if all 5 see the same spoofed UI. You need an independent verification layer that checks what the transaction *actually does* vs what the UI *says it does*.

- **Fits OasisVault's model:** OasisVault does 2-of-3 multisig on Safe. SandGuard could be the verification layer that makes their safety net even safer.

- **Fits the "agents + custody" narrative:** As AI agents interact with multisigs, transaction firewalls become the "immune system" — programmatic guardrails that can't be socially engineered the way humans can.

**One-liner if it comes up:** *"Multisig distributes trust across signers. SandGuard makes sure each signer actually knows what they're signing."*

---

## TL;DR for Alberto

- **Rahul (Safe CEO)** is the heavyweight — he'll defend multisig-as-standard and position Safe's post-ByBit evolution
- **Oxxbid (Base PM)** brings the Coinbase/L2 smart-wallet perspective
- **0xsd** will pitch OasisVault's recovery model (they're the sponsor, so this is their stage)
- **Macauley** moderates — he's written about all these topics for Blockworks
- **The ByBit hack is THE reference point** — every speaker will have a take on it
- **SandGuard is the missing layer** that this conversation implicitly points to: you can have multisig + clear signing + hardware keys, but without independent transaction verification, the UI is still the attack surface
