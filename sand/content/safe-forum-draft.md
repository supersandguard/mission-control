# [Discussion] SandGuard — Transaction Firewall for Safe Users

**Authors:** SandGuard Team
**Created:** 2026-02-02

## Abstract

We're building SandGuard, a transaction firewall designed specifically for Safe multisig wallets. It decodes calldata, simulates transactions, and risk-scores every pending operation before signers approve — providing the verification layer that sits between authorization (your multisig threshold) and execution.

We're sharing this here to get feedback from the Safe community, discuss integration paths (Safe App Store, Guard module), and explore how SandGuard can become part of Safe's ecosystem security infrastructure.

**Links:**
- Product: [supersandguard.com](https://supersandguard.com)
- GitHub: [github.com/supersandguard/sandguard](https://github.com/supersandguard/sandguard)
- Blog: [ByBit Attack Analysis](https://supersandguard.github.io/sandguard/bybit-blind-signing-attack.html)

---

## Purpose and Background

### The Problem: Blind Signing in Multisigs

Safe's multisig model is the gold standard for onchain authorization. Requiring M-of-N signatures ensures no single party can unilaterally move funds. This is Layer 1 security — and Safe does it exceptionally well.

But there's a critical gap: **verification**. When a transaction is proposed to a Safe, signers see a summary in the UI — a destination address, an amount, maybe a function name. They don't see what the calldata actually does. They can't independently verify that the transaction summary matches the raw bytes.

This is the blind signing problem, and it has become the single most damaging attack vector in crypto:

- **ByBit (Feb 2025):** $1.43B stolen. Lazarus Group spoofed the Safe UI to display a routine ETH transfer. The actual calldata was a `delegatecall` that upgraded the wallet's implementation contract to a malicious version with a `sweepERC20()` function. All signers approved. [Detailed analysis →](https://supersandguard.github.io/sandguard/bybit-blind-signing-attack.html)
- **WazirX (Jul 2024):** $235M stolen via the same blind signing pattern.
- **Radiant Capital (2024):** $50M stolen through multisig UI manipulation.
- **Ronin Network (2022):** $624M stolen via social engineering of multisig signers.

Safe's own blog post ["Multisig is the baseline"](https://safe.global/blog/multisig-is-the-baseline) correctly identifies that multisig is necessary — but it's not sufficient when the human verification layer is the weakest link.

The common thread: authorized signers approved transactions they couldn't read. The multisig threshold was met. The private keys were never stolen. The attack targeted the gap between what the UI showed and what the calldata actually did.

### The Gap in Safe's Security Stack

Safe's modular architecture is designed to be extensible. Modules and Guards allow additional security logic to be layered on top of the base multisig. Yet today, there is no widely adopted tool in the Safe ecosystem that provides:

1. **Calldata decoding** — translating raw transaction bytes into human-readable function calls with named parameters
2. **Transaction simulation** — executing the transaction against a fork of the current chain state to show the actual outcome before signing
3. **Automated risk scoring** — evaluating transactions against known attack patterns (delegatecalls, proxy upgrades, unlimited approvals, unverified contracts)
4. **24/7 queue monitoring** — continuously watching a Safe's pending transactions and alerting signers to suspicious activity

This is the gap SandGuard fills.

---

## SandGuard's Solution

### How It Works

SandGuard connects to any Safe address via the Safe Transaction Service API and monitors its transaction queue. When a new transaction is proposed, SandGuard performs three independent analyses:

**1. Decode**
Raw calldata is decoded against verified contract ABIs. Signers see the actual function being called (`delegatecall`, `upgradeToAndCall`, `approve`, etc.) with all parameters in plain English — not the hex summary that can be spoofed.

**2. Simulate**
Using Tenderly's fork simulation engine, the transaction is executed against the current chain state in a sandbox. The simulation shows every balance change, state modification, and event that would result from execution. In the ByBit case, this would have shown wallet ownership transferring to an external address.

**3. Score**
An automated risk engine evaluates decoded data and simulation results against known attack patterns. Flags include: unverified target contracts, recently deployed contracts, delegatecall operations, unlimited token approvals, ownership/threshold changes, and sweep function patterns. Each flag contributes to a composite risk score.

### What This Would Have Caught

| Attack | What SandGuard Would Show |
|--------|--------------------------|
| ByBit ($1.43B) | `delegatecall` to unverified contract with `sweepERC20()` → Critical risk |
| WazirX ($235M) | Blacklisted target + delegatecall pattern → Critical risk |
| Unlimited approval drains | `approve(spender, type(uint256).max)` → High risk flag |
| Proxy upgrades | `upgradeTo()` to unverified implementation → Critical risk |

### Current State

SandGuard is live at [supersandguard.com](https://supersandguard.com) with:
- Free tier: calldata decoding for any Safe address
- Pro tier ($20/mo): simulation, risk scoring, 24/7 queue monitoring
- Source code: [github.com/supersandguard/sandguard](https://github.com/supersandguard/sandguard)

---

## Technical Integration with Safe

### Path 1: Safe App Store Listing

We'd like to submit SandGuard as a Safe App so users can access it directly from the Safe{Wallet} interface. We've reviewed the Safe Apps SDK documentation and are prepared to:

- Add `@safe-global/safe-apps-sdk` to auto-detect the Safe context (address, chain, owners, threshold)
- Serve a `manifest.json` for the Safe Apps registry
- Enable CORS for `app.safe.global`

This would allow any Safe user to open SandGuard as an app within Safe{Wallet}, automatically connected to their Safe — zero-friction access to transaction verification.

### Path 2: Guard Module (Future)

We're designing a SandGuard Guard smart contract that implements the `IGuard` interface to provide on-chain enforcement:

```solidity
function checkTransaction(
    address to, uint256 value, bytes memory data,
    Enum.Operation operation, ...
) external {
    // Block delegatecalls unless target is whitelisted
    // Block unlimited token approvals
    // Block interactions with blacklisted addresses
    // Block proxy upgrades unless explicitly permitted
}
```

This would provide Layer 3 (on-chain enforcement) in addition to Layer 2 (off-chain verification). Even if every signer is compromised, the Guard would block known-dangerous transaction patterns.

**We'd appreciate feedback from Safe's technical team on:**
- Guard module best practices and security considerations
- Recommended audit process for Guard contracts (a broken Guard can DoS a Safe)
- Whether there's interest in SandGuard as a recommended/default Guard for new Safes

### Path 3: Safe Transaction Service Integration

We currently use the Safe Transaction Service API to monitor pending transactions. Deeper integration could include:
- Historical transaction analysis to build behavioral baselines per Safe
- Owner activity profiling to detect anomalous signing patterns
- Module/Guard change detection with immediate alerts

---

## What We're Asking For

### Feedback
We want to hear from Safe users, developers, and governance participants:
- Would you use a transaction firewall for your Safe?
- What risk patterns are most important to detect?
- What's the right UX for presenting decoded/simulated data to signers?
- Are there concerns about the Guard module approach?

### Safe App Store Listing
We'd like to begin the process of getting SandGuard listed as a Safe App. If there are specific requirements or contacts for the listing review, we'd appreciate guidance.

### Ecosystem Grant (Optional)
If SafeDAO has an active grants program, we'd be interested in applying to fund:
- Guard module development and security audit
- Open-sourcing the risk scoring engine as a public good for the Safe ecosystem
- Building deeper Safe Transaction Service integrations

---

## About Us

SandGuard was built after studying the ByBit hack and realizing that no dedicated transaction verification tool existed for Safe multisig users. The product is live, the code is public, and we're committed to making transaction security accessible to every Safe user — not just enterprises with $500/month security budgets.

We believe that if a $20/month tool can prevent a $1.43 billion hack, it should be available to everyone.

---

**We're looking forward to the community's feedback. Happy to answer any technical questions about the approach.**

- Website: [supersandguard.com](https://supersandguard.com)
- GitHub: [github.com/supersandguard/sandguard](https://github.com/supersandguard/sandguard)
- Blog: [SandGuard Security Blog](https://supersandguard.github.io/sandguard/)
