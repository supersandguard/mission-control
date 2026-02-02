# ByBit Hack — X Thread for @beto_neh / SandGuard

## Thread (10 tweets)

---

**🧵 1/10 — HOOK**

ByBit lost $1.43 BILLION on February 21, 2025.

Not a smart contract exploit. Not a flash loan attack.

The signers approved a transaction they couldn't read.

It's called blind signing — and it's the #1 threat to every multisig treasury in crypto.

Here's exactly how it happened and how to prevent it 🧵

---

**2/10 — WHAT HAPPENED**

ByBit's cold wallet was a Safe multisig. Multiple signers, hardware wallets. Textbook security.

The Lazarus Group (North Korea's hackers) compromised the signers' devices and spoofed the Safe UI.

Signers saw: "Transfer 401,346 ETH to hot wallet ✅"

What they actually signed: a proxy upgrade giving attackers full control.

---

**3/10 — THE BAIT AND SWITCH**

The real calldata contained a `delegatecall` that swapped the wallet's implementation contract for a malicious one.

Hidden inside: a `sweepERC20()` function.

The moment the last signer approved, attackers called sweep and drained everything:

• 401,346 ETH ($1.11B)
• 90,375 stETH ($250.8M)
• 15,000 cmETH ($44M)
• 8,000 mETH ($23.5M)

---

**4/10 — THIS KEEPS HAPPENING**

This wasn't new. Same attack pattern as:

• WazirX — $235M (July 2024)
• Radiant Capital — multisig compromise (2024)
• DMM Bitcoin — blind signing (2024)

Security researcher @taaborlin tracked all of them: "They've done this 5 times now. Please start taking it seriously."

$2B+ lost to blind signing in 2 years.

---

**5/10 — THE REAL PROBLEM**

Multisigs give you authorization security (multiple approvals needed).

They give you ZERO verification security (understanding what you're approving).

If the UI shows "transfer" but the calldata says "upgrade proxy to attacker contract" — and nobody decodes the calldata — the multisig is theater.

---

**6/10 — THE FIX: DECODE + SIMULATE + SCORE**

This is what @SandGuard does before anyone signs:

1️⃣ DECODE — Raw calldata → human-readable function calls
2️⃣ SIMULATE — Fork the chain, run the tx in sandbox, show actual outcomes
3️⃣ RISK SCORE — Flag unverified contracts, drain patterns, proxy upgrades

No more trusting the UI. Read the actual transaction.

---

**7/10 — HOW SANDGUARD CATCHES THIS**

The ByBit tx decoded through SandGuard would show:

🔴 Function: delegatecall → UPGRADE implementation
🔴 New contract: UNVERIFIED, deployed 2 days ago
🔴 Contains sweepERC20() — classic drain pattern
🔴 Simulation: wallet ownership transfers to external address

Risk score: CRITICAL.

No signer approves that.

---

**8/10 — BEFORE vs AFTER**

WITHOUT SandGuard:
```
Transfer 401,346 ETH ✅
From: Cold Wallet → Hot Wallet
Looks normal. Sign.
```

WITH SandGuard:
```
🔴 CRITICAL RISK
This is NOT a transfer.
This upgrades your wallet to an
unverified contract that can drain
all funds. DO NOT SIGN.
```

30 seconds of verification. $1.43B saved.

---

**9/10 — THE MATH**

ByBit hack: $1,430,000,000 lost
SandGuard: $20/month

A $900 laptop per signer would've helped too.

But even cheaper: a transaction firewall that reads the calldata for you, simulates the outcome, and says "this is a proxy upgrade to a drain contract" BEFORE you sign.

---

**10/10 — CTA**

Stop blind signing. Start verifying.

SandGuard decodes every Safe transaction into plain English, simulates it, and scores the risk — automatically.

Try it free → supersandguard.com

Your multisig is only as strong as your weakest signer's ability to read calldata.

Make every signer an expert. 🛡️

---

## Image/Visual Suggestions

1. **Tweet 1:** Dark graphic with "$1.43B" in large red text, "Lost to Blind Signing" subtitle. ByBit logo faded in background.

2. **Tweet 3:** Infographic showing the attack flow: Spoofed UI → "Transfer" label → Actual calldata (delegatecall) → sweepERC20 → Funds drained. Arrow diagram style.

3. **Tweet 7:** Screenshot-style mockup of SandGuard's risk analysis screen showing the decoded calldata with red flags. Could be a real SandGuard UI screenshot with the ByBit tx data overlaid.

4. **Tweet 8 (Before/After):** Split-screen comparison. Left side: clean simple "Transfer 401,346 ETH ✅" in green. Right side: SandGuard decoded view with red alerts, decoded functions, risk score. This is the most shareable image — make it punchy.

5. **Tweet 10:** Clean SandGuard logo + "supersandguard.com" + shield emoji. Brand card.

## Posting Notes

- Post as thread (reply chain) from @beto_neh
- Pin tweet 1 if it gets traction
- Best posting times: Tue-Thu 14:00-16:00 UTC (US+EU overlap)
- Consider quote-tweeting relevant ByBit/security discussions with tweet 6 or 8
- Thread can be adapted as a single LinkedIn post (combine tweets 1-4 for hook, 5-8 for solution)
