# X Thread Drafts — @beto_neh / SandGuard

> ⚠️ DRAFTS ONLY — Do NOT post without Alberto's review
> Generated: 2025-07-15
> Based on: bybit-thread.md (refined for 280 char limit)

---

## VERSION A: "Educational" Thread
### Focus: ByBit hack, blind signing, what went wrong, prevention
### Tone: Informative, authoritative, subtle SandGuard mention at end only

---

**1/8 — HOOK**

$1.43 BILLION lost. Not a smart contract bug — a UI spoof.

ByBit's signers approved a transaction they couldn't read. The Safe UI showed "transfer ETH." The calldata said "give attackers everything."

This is blind signing. Here's the full breakdown 🧵

---

**2/8 — THE SETUP**

ByBit ran a Safe multisig cold wallet. Multiple signers, hardware wallets — textbook security.

Lazarus Group (North Korea) compromised signers' machines and faked the Safe interface.

Signers saw a routine transfer. They signed a proxy upgrade.

---

**3/8 — THE KILL**

Hidden in the calldata: a delegatecall that swapped the wallet's logic contract for a malicious one containing sweepERC20().

Last signer approved → attackers swept everything.

401K ETH. $1.43B. Gone in minutes.

---

**4/8 — THE PATTERN**

Same attack keeps repeating:

• WazirX — $235M (2024)
• Radiant Capital — multisig compromise (2024)
• DMM Bitcoin — blind signing (2024)

$2B+ stolen via blind signing in two years. The playbook is public. The fix is overdue.

---

**5/8 — THE ROOT CAUSE**

Here's the core problem:

Multisigs protect authorization — who can approve.

They do nothing for verification — what you're approving.

If the UI lies and nobody decodes the raw calldata, your 5-of-7 multisig is security theater.

---

**6/8 — THE FIX**

The answer: decode + simulate + verify BEFORE anyone signs.

1. Decode calldata into human-readable functions
2. Simulate the tx on a fork — show real outcomes
3. Flag proxy upgrades, unverified contracts, drain patterns

Stop trusting the UI. Read the actual transaction.

---

**7/8 — WHAT DETECTION LOOKS LIKE**

Run the ByBit tx through proper analysis:

🔴 delegatecall → proxy upgrade
🔴 Target contract: unverified, 2 days old
🔴 Contains sweepERC20() — drain pattern
🔴 Simulation: ownership → unknown address

CRITICAL risk. Nobody signs that.

---

**8/8 — CTA**

This is why we built SandGuard — a transaction firewall for Safe wallets.

Decodes every tx. Simulates outcomes. Scores risk. All before you sign.

30 seconds of verification > $1.43B in losses.

Stop blind signing → supersandguard.com

---

### Suggested Hashtags (sprinkle, don't spam — max 2 per tweet)
- #MultisigSecurity
- #BlindSigning
- #CryptoSecurity
- #SafeWallet
- #Web3Security
- #DeFiSecurity

### Posting Strategy
- **Best time:** Tue–Thu, 14:00–16:00 UTC (US + EU overlap)
- **Alt time:** Mon 15:00 UTC (fresh week energy)
- Pin tweet 1/8 if it gains traction
- QT relevant ByBit/security discussions with tweet 5 or 7
- Wait 3-5 min between tweets in the thread
- Reply to own thread with supersandguard.com link as bookmark

### Visual Suggestions
- **Tweet 1:** Dark graphic — "$1.43B" in red, "Lost to Blind Signing" subtitle
- **Tweet 3:** Attack flow diagram: Spoofed UI → fake "Transfer" → actual delegatecall → sweepERC20 → drained
- **Tweet 7:** Mockup of decoded tx analysis with red flags
- **Tweet 8:** SandGuard brand card + URL

---
---

## VERSION B: "Builder" Thread
### Focus: Building SandGuard, the tech, the AI agent, the mission
### Tone: Personal, builder-perspective, showing the work

---

**1/7 — HOOK**

I'm building a transaction firewall for Safe multisig wallets.

It decodes raw calldata into plain English, simulates outcomes on a fork, and flags risks — before anyone signs.

It's called SandGuard. Here's why and how I'm building it 🧵

---

**2/7 — THE WHY**

The ByBit hack was the catalyst. $1.43B stolen because signers couldn't read what they were signing.

I kept thinking: this is a solvable problem. The calldata is right there. Someone just needs to translate it and show what actually happens.

---

**3/7 — HOW IT WORKS**

SandGuard sits between the proposal and the signature.

When a Safe tx is queued, it:
→ Decodes the raw calldata
→ Forks the chain, simulates execution
→ Maps every state change
→ Assigns a risk score

All automated. No manual review needed.

---

**4/7 — THE HARD PART**

The real challenge: calldata interpretation at scale.

Proxy contracts, nested delegatecalls, batch transactions — the rabbit hole goes deep.

Building an AI agent that parses these patterns and explains them in plain language has been the hardest and most rewarding part.

---

**5/7 — THE DESIGN PRINCIPLE**

What excites me most: this doesn't require changing how teams use Safe.

No new wallet. No new flow. Just a verification layer that catches what humans miss.

Like a spell checker for transactions — runs in the background until something looks wrong.

---

**6/7 — BUILDING IN PUBLIC**

Currently in the Safe Builder Quest. Shipping weekly, learning from every edge case.

The goal: make blind signing obsolete.

If your multisig has SandGuard, every signer sees exactly what they're approving. In plain language. With risk context.

---

**7/7 — CTA**

If you run a Safe multisig for your project, DAO, or treasury — I want your feedback.

What does your signing workflow look like? What scares you most?

DMs open. Or check it out → supersandguard.com

Building this for the people who need it most.

---

### Suggested Hashtags
- #BuildInPublic
- #SafeBuilderQuest
- #Web3Security
- #CryptoSecurity
- #AIAgent
- #MultisigSecurity

### Posting Strategy
- **Best time:** Wed–Fri, 15:00–17:00 UTC (builder crowd online)
- **Alt time:** Sunday evening UTC (week-ahead planning mode)
- Space this at least 2-3 days after the Educational thread
- More personal — engage heavily in replies
- QT the Builder Quest tweet from yesterday as context for tweet 6
- Reply to own thread asking specific questions to drive engagement

### Visual Suggestions
- **Tweet 1:** Clean SandGuard logo + "Transaction Firewall for Safe" tagline
- **Tweet 3:** Architecture diagram: Safe TX → Decode → Simulate → Risk Score → Signer
- **Tweet 4:** Code snippet or terminal screenshot showing calldata parsing
- **Tweet 7:** Simple brand card with supersandguard.com

---
---

## POSTING ORDER RECOMMENDATION

1. **Post Educational thread first** (Tue/Wed) — establishes credibility, rides ByBit awareness
2. **Post Builder thread 3-4 days later** (Fri/Sat) — personal angle, engages builder community
3. After both threads, individual tweets can reference back to them

## CROSS-PROMOTION IDEAS

- Share Educational thread on Farcaster (Warpcast)
- Adapt Builder thread for a short LinkedIn post
- Use tweet 5/8 from Educational as standalone QTs on security discussions
- Tag @safe in tweet 6 of Builder thread (Builder Quest mention)
