# SandGuard Risk Assessment Guide

How to understand and explain transaction risks to humans in simple terms.

## Risk Levels

### 🟢 Safe (Risk Score 0-3)
**What it means:** Standard transactions with minimal risk.

**Characteristics:**
- Known, verified smart contracts
- Reasonable transaction amounts
- Established recipients
- Standard token transfers or swaps
- Clear, understandable purpose

**How to explain:**
> "This looks like a normal transaction. The contract is verified, the amount is reasonable, and the recipient address has been used safely before."

**Examples:**
- Sending ETH to a known exchange
- Swapping tokens on Uniswap
- Claiming rewards from staking
- Standard ERC-20 transfers

### 🟡 Caution (Risk Score 4-7)
**What it means:** Higher risk transactions that need careful review.

**Characteristics:**
- Large amounts relative to wallet balance
- New or unverified contracts
- Complex multi-step transactions
- Unusual approval patterns
- First-time recipients

**How to explain:**
> "This transaction has some risk factors. Take extra time to verify the details before signing. The amount is large, or the contract hasn't been used much before."

**Examples:**
- Large token approvals (>$10k value)
- Interacting with new DeFi protocols
- Complex atomic transactions
- Cross-chain bridges
- NFT marketplace interactions

### 🔴 Danger (Risk Score 8-10)
**What it means:** High-risk transactions that should be carefully investigated or avoided.

**Characteristics:**
- Infinite token approvals
- Unverified smart contracts
- Suspicious recipient patterns
- Drain-like transaction patterns
- MEV/sandwich attack indicators

**How to explain:**
> "⚠️ This transaction has serious red flags. It could give someone unlimited access to your tokens or send funds to a suspicious address. Consider rejecting this transaction."

**Examples:**
- Approval for `2^256-1` tokens (infinite approval)
- Transactions to recently created contracts
- Complex transactions that could hide malicious behavior
- Patterns matching known scam contracts

## Common Dangerous Patterns

### 1. Infinite Approvals
**Technical:** `approve(spender, 115792089237316195423570985008687907853269984665640564039457584007913129639935)`
**Plain English:** "Giving unlimited permission to spend all your tokens forever"

**Why dangerous:**
- Approved contract can drain your entire token balance anytime
- Permission doesn't expire
- Even if you trust the contract today, it could be compromised later

**Red flags in calldata:**
- `approve` function with very large numbers
- Amount like `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`

**How to explain:**
> "This transaction gives another contract permission to spend ALL of your [token name] tokens, forever. That means they could take every single token from your wallet at any time, even after this transaction. Consider approving only the amount you need right now."

### 2. Unverified Contracts
**Technical:** Contract source code not published/verified on block explorer
**Plain English:** "Interacting with a mystery contract"

**Why dangerous:**
- Can't see what the contract actually does
- Could be malicious or buggy
- No way to audit the code

**How to explain:**
> "This contract's source code hasn't been published, so we can't see what it actually does. It's like being asked to sign a document that's completely blacked out."

### 3. Large Token Transfers
**Technical:** Transfer amount >50% of wallet balance
**Plain English:** "Moving most of your tokens at once"

**Why risky:**
- Higher impact if recipient address is wrong
- Could be result of compromised wallet
- Unusual for normal operations

**How to explain:**
> "This transaction moves [X]% of your total [token] balance. Double-check the recipient address is correct, and consider if this amount makes sense for what you're trying to do."

### 4. Recently Created Contracts
**Technical:** Contract deployed <30 days ago
**Plain English:** "Very new, untested contract"

**Why risky:**
- No track record of safe operation
- Could have hidden bugs or backdoors
- Less community scrutiny

**How to explain:**
> "This contract was created only [X] days ago. New contracts haven't had time for security audits or community review. Proceed with extra caution."

### 5. Complex Multi-Call Transactions
**Technical:** Multiple contract calls in single transaction
**Plain English:** "Doing many things at once"

**Why risky:**
- Harder to understand total impact
- Could hide malicious calls among legitimate ones
- Unexpected interactions between calls

**How to explain:**
> "This transaction does several things in sequence. While each step might look OK, the combination could have unexpected effects. Make sure you understand the full chain of actions."

### 6. Unusual Gas Settings
**Technical:** Very high gas price or gas limit
**Plain English:** "Willing to pay way too much for this transaction"

**Why risky:**
- Could indicate MEV/sandwich attack
- Might be rushing to exploit something
- Unnecessarily expensive

**How to explain:**
> "This transaction is set to pay much higher fees than normal. This could mean someone is rushing to exploit something before others notice."

## Risk Factors Database

### Contract-Related Risks
- **Unverified source code** (Score: +3)
- **Recently deployed** (<7 days: +2, <30 days: +1)
- **No prior transactions** (+2)
- **Proxy contract without implementation** (+3)
- **Known malicious contract** (+10, auto-reject)

### Transaction-Related Risks
- **Infinite approval** (+5)
- **Large approval** (>$10k: +2, >$1k: +1)
- **High value transfer** (>50% balance: +3, >25%: +2)
- **Complex multi-call** (+1 per additional call, max +3)
- **Unusual gas settings** (+1)

### Recipient-Related Risks
- **New recipient address** (+1)
- **Contract recipient** (+1 if not mainstream DeFi)
- **Multiple recipients** (+1)
- **Exchange hot wallet** (+1, normal but worth noting)

### Timing-Related Risks
- **Pending >7 days** (+1, could indicate controversy)
- **High gas price** (+1, could indicate urgency/MEV)
- **Unusual time** (3-6 AM local: +1, could indicate compromise)

## Communication Templates

### Safe Transaction Template
```
🟢 **SAFE TRANSACTION**

What it does:
[Simple description]

Amount: [Amount and token]
To: [Recipient description]
Risk: Low

✅ This looks like a standard transaction. The contract is verified and the amount is reasonable.

Ready to sign? The transaction appears safe to approve.
```

### Caution Transaction Template
```
🟡 **CAUTION - PLEASE REVIEW**

What it does:
[Simple description]

Amount: [Amount and token]
To: [Recipient description]
Risk: Medium

⚠️ Risk factors:
• [List specific concerns]

Take extra time to:
• [Specific verification steps]
• [Double-check details]

Only sign if you're confident this is what you intended.
```

### Danger Transaction Template
```
🔴 **DANGER - HIGH RISK**

What it does:
[Simple description]

Amount: [Amount and token]
To: [Recipient description]
Risk: HIGH

🚨 MAJOR RISK FACTORS:
• [List critical issues]

RECOMMENDATION: Do not sign this transaction.

If you must proceed:
• [Specific safety steps]
• Consider using a separate wallet with minimal funds
• Get a second opinion from a security expert

This could result in loss of funds. Proceed with extreme caution.
```

## Mobile-Friendly Risk Indicators

Use emojis and short text for mobile platforms:

### Risk Level Indicators
- 🟢 SAFE
- 🟡 CAUTION  
- 🔴 DANGER
- ⚫ UNKNOWN

### Common Risk Emojis
- ⚠️ Warning/attention needed
- 🚨 Critical alert
- ✅ Verified/safe
- ❌ Not recommended
- 🔍 Needs investigation
- 💰 Large amount
- ⏰ Time sensitive
- 🆕 New/untested

### Quick Risk Summary Format
```
🔍 TX #123 | 🟡 CAUTION
💰 1.5 ETH → 0xabc...
⚠️ Large amount (30% of balance)
❓ Unverified recipient
```

## Educational Moments

Use transaction reviews as teaching opportunities:

### Good Security Habits
- Always verify recipient addresses
- Check transaction amounts carefully
- Be suspicious of urgent requests
- Use hardware wallets when possible
- Keep most funds in cold storage
- Test with small amounts first

### Red Flag Behaviors to Watch For
- Pressure to sign quickly
- Requests to approve "just once" 
- Transactions from unknown sources
- Promises of guaranteed returns
- Complex transactions without explanation
- Multiple urgent transactions in sequence

### Questions to Ask
Before signing any transaction:
1. "Do I understand what this does?"
2. "Is the amount correct?"
3. "Do I recognize the recipient?"
4. "Was I expecting this transaction?"
5. "Am I being pressured to rush?"

If any answer is "no", investigate further or seek help.