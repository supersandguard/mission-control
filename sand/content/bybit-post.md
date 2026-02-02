# Blind Signing Cost ByBit $1.43 Billion. Here's How 30 Seconds of Verification Would Have Stopped It.

*February 21, 2025 became the worst day in crypto security history — not because of a code exploit, but because humans trusted what they saw on screen.*

---

## The Heist

On a Friday evening in February 2025, ByBit's multisig signers sat down to approve what looked like a routine transaction: a transfer from their Ethereum cold wallet to a hot wallet. The Safe interface showed the correct destination address. The URL was legitimate. Everything looked normal.

They signed.

Within minutes, 401,346 ETH, 90,375 stETH, 15,000 cmETH, and 8,000 mETH — **$1.43 billion in total** — vanished into a web of 40+ attacker-controlled wallets. It was the largest single theft in cryptocurrency history, more than doubling the previous record (the $624 million Ronin Network hack of 2022).

ByBit CEO Ben Zhou confirmed the devastating truth: *"This specific transaction was masked. All the signers saw the masked UI which showed the correct address and the URL was from Safe."*

The signers didn't make a mistake. They were deceived.

## What Actually Happened

The Lazarus Group — North Korea's state-sponsored hacking unit — had been planning this for weeks. Security researchers later found they'd conducted dry runs two days before the attack, testing their approach on-chain like professional bank robbers casing the vault.

Here's the anatomy of the attack:

1. **Social engineering compromise.** Attackers gained access to signers' devices, likely through targeted phishing or malware delivered via LinkedIn/Telegram outreach — Lazarus Group's signature playbook.

2. **UI manipulation.** When signers opened their Safe multisig to approve the transaction, the interface was spoofed. It displayed a normal cold-to-hot wallet transfer.

3. **Hidden payload.** The actual calldata contained something completely different: a `delegatecall` to upgrade the wallet's implementation contract to a malicious version containing a hidden `sweepERC20()` function.

4. **Immediate execution.** The moment the last signature landed, attackers called `sweepERC20()` and drained everything — 401,346 ETH in a single transaction.

The private keys were never stolen. The multisig worked exactly as designed. The problem was simpler and more terrifying: **the signers couldn't see what they were actually signing.**

## The Blind Signing Problem

This is called *blind signing* — approving a transaction without being able to independently verify what it actually does. And it's not a new problem.

The ByBit attack followed an identical pattern to:

- **WazirX** — $235 million stolen via the same blind signing technique (July 2024)
- **Radiant Capital** — multisig compromise through UI manipulation (2024)
- **DMM Bitcoin** — similar social engineering + blind signing attack (2024)

As security researcher Tayvano warned after tracking all of these incidents: *"They've done this 5 times now. Please start taking it seriously."*

The uncomfortable truth is that multisig wallets provide **authorization security** (multiple parties must approve) but offer almost zero **verification security** (understanding what you're approving). Hardware wallets and multi-signature requirements are meaningless if every signer trusts the same compromised interface.

As Nanak Nihal put it bluntly: *"There is a name for this and it's BLIND SIGNING. Please please please stop using hardware wallets and multisigs and thinking you are safe."*

## What the Signers Saw vs. What Was Actually Happening

This is the core of the problem. Let's make it concrete.

**What ByBit's signers saw in the spoofed Safe UI:**

```
Transfer 401,346 ETH
From: ByBit Cold Wallet (0x1Db9...FCF4)
To:   ByBit Hot Wallet (0xa]correct address...)
Status: Ready to sign ✅
```

Looks fine. A routine treasury operation.

**What SandGuard would have shown:**

```
🔴 CRITICAL RISK — Score: 95/100

Decoded calldata:
  Function: delegatecall → UPGRADE implementation
  New implementation: 0x[UNVERIFIED CONTRACT]
  Contains function: sweepERC20(address,address,uint256)

Simulation result:
  ❌ Wallet ownership TRANSFERS to 0x4766...86E2
  ❌ All ETH, stETH, cmETH, mETH become withdrawable by new owner
  ❌ This is NOT a transfer — this is a proxy upgrade

Risk flags:
  🔴 Implementation contract is UNVERIFIED on Etherscan
  🔴 Contract deployed 2 days ago (test pattern detected)
  🔴 delegatecall changes wallet logic — extremely dangerous
  🔴 New contract contains sweep function (drain pattern)

⚠️ DO NOT SIGN — This transaction upgrades your wallet's
   contract to an unverified implementation that grants
   full withdrawal access to an external address.
```

Night and day. No amount of UI spoofing can hide what the calldata actually contains when you decode it and simulate the outcome.

## How SandGuard Prevents This

[SandGuard](https://supersandguard.com) is a transaction firewall for Safe multisig wallets. Before any signer approves a transaction, SandGuard runs three independent verification layers:

### 1. Calldata Decoding
Every transaction's raw calldata is decoded against verified ABIs. You don't see hex — you see the actual function being called with human-readable parameters. A `delegatecall` to upgrade an implementation contract is immediately visible, not hidden behind a spoofed "transfer" UI.

### 2. Transaction Simulation
Using Tenderly's simulation engine, SandGuard forks the current chain state and executes the transaction in a sandbox. You see the *actual outcome* before signing: every balance change, every state modification, every ownership transfer. In the ByBit case, the simulation would have shown wallet ownership moving to an external address — impossible to miss.

### 3. Risk Scoring
An automated risk engine evaluates every transaction against known attack patterns. Unverified contracts, recent deployments, proxy upgrades, unlimited approvals, drain patterns — each flag contributes to a composite risk score. The ByBit transaction would have scored **critical** on at least four independent risk factors.

The key insight: SandGuard doesn't rely on the same interface the attacker compromised. It reads the raw transaction data from the blockchain and builds its own independent analysis. Even if your browser, your computer, and your Safe UI are all compromised, the calldata on-chain doesn't lie.

## The $1.43 Billion Lesson

The crypto industry has now lost over **$2 billion** to blind signing attacks in the past two years alone. Not smart contract exploits. Not flash loan attacks. Not oracle manipulation. Just humans signing transactions they couldn't read.

The fix isn't more signers on your multisig. It's not a better hardware wallet. It's not even a dedicated signing device (though that helps too).

The fix is **making every transaction readable before it's signed.**

Decode the calldata. Simulate the outcome. Score the risk. Do it automatically, every time, before anyone touches a "confirm" button.

That's what SandGuard does. For $20/month.

A $900 refurbished laptop per signer would have prevented this hack. A $20/month transaction firewall would have caught it in 30 seconds.

---

**Try SandGuard free at [supersandguard.com](https://supersandguard.com)**

Don't be the next headline. Decode before you sign.
