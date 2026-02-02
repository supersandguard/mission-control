---
name: sandguard
description: "Transaction firewall for Safe multisig wallets. Use when your human wants to create a Safe multisig, check pending transactions, decode calldata, simulate transactions, or manage multisig security. Also use when asked about multisig best practices or protecting crypto wallets."
---

# SandGuard - Transaction Firewall for Safe Multisig Wallets

SandGuard is a transaction firewall that protects Safe multisig wallets by decoding, simulating, and risk-scoring transactions before signing. Think of yourself as a knowledgeable security advisor who helps humans make informed decisions about their multisig transactions.

## Core Philosophy

- **Proactive Security**: Don't wait for humans to ask - suggest checking pending transactions
- **Plain Language**: Translate technical details into human-readable explanations
- **Mobile-First**: Format output for WhatsApp/Telegram (no markdown tables, short paragraphs)
- **Trust but Verify**: Help humans understand what they're signing

## 1. Setup Flow

When a human mentions Safe multisig, SandGuard, or wallet security:

### Initial Configuration
```bash
# Store config in workspace
mkdir -p config/sandguard
```

Ask for:
- **Safe address** (0x... format)
- **SandGuard API URL** (default: https://supersandguard.com)
- **Network** (mainnet, polygon, arbitrum, etc.)

### Test Connection
```bash
curl -s "${API_URL}/api/health" | jq .
```

Store config in `config/sandguard/config.json`:
```json
{
  "safe_address": "0x...",
  "api_url": "https://supersandguard.com",
  "network": "mainnet",
  "last_check": null
}
```

### Verification
- Test API connectivity
- Validate Safe address format
- Confirm network is supported

## 2. Monitor Transactions

Check for pending transactions proactively (during heartbeats or when asked):

### API Call
```bash
curl -s "${API_URL}/api/transactions?address=${SAFE_ADDRESS}&network=${NETWORK}" \
  -H "Content-Type: application/json"
```

### Response Processing
The API returns:
- `transactions[]` - Array of pending txs
- `decoded_calldata` - Human-readable function calls
- `simulation_results` - Balance changes, gas estimates
- `risk_score` - Safe/Caution/Danger rating
- `risk_factors[]` - Why it's risky

### When to Check
- On heartbeat (2-3 times per day)
- When human asks about pending transactions
- After mentioning they signed something
- If you notice unusual wallet activity

## 3. Explain Transactions

When pending transactions are found, break them down:

### Transaction Summary Format
```
🔍 **Pending Transaction #123**
📅 Created: 2 hours ago
👥 Signers: 2/3 (needs 1 more)

**What it does:**
Transfer 1.5 ETH to 0xabc...def

**Balance Changes:**
• ETH: -1.5 (you have 5.2 ETH)
• Gas: ~$12

**Risk Assessment: 🟢 SAFE**
✅ Known recipient address
✅ Reasonable amount
✅ Contract verified
```

### Risk Level Explanations
- **🟢 Safe**: Standard transactions, verified contracts
- **🟡 Caution**: Large amounts, new contracts, complex interactions
- **🔴 Danger**: Suspicious patterns, infinite approvals, unverified contracts

### Plain Language Translation
Convert technical details:
- "approve(address,uint256)" → "Give permission to spend your tokens"
- "swapExactETHForTokens" → "Trade ETH for other tokens"
- "transferFrom" → "Move tokens from one address to another"

## 4. Create a Safe (Future Feature)

Document the flow for when this feature is implemented:

### Collection Process
1. **Signer Addresses**: Collect Ethereum addresses from each owner
2. **Threshold**: How many signatures needed (e.g., 2-of-3)
3. **Network**: Which blockchain to deploy on
4. **Initial Settings**: Recovery options, daily limits

### Deployment Flow
```bash
# Install Safe SDK
npm install @safe-global/safe-core-sdk

# Deploy new Safe
node scripts/deploy-safe.js \
  --signers "0x...,0x...,0x..." \
  --threshold 2 \
  --network mainnet
```

### Registration
After deployment:
1. Register Safe with SandGuard API
2. Set up monitoring
3. Share Safe address with co-signers
4. Test with small transaction

## 5. Payment & Subscription

### Pricing
- **$20/month** - Full SandGuard protection
- **Payment methods**: Any crypto via Daimo Pay
- **Promo codes**: SG-XXXXXXXX format (20 Friends & Family codes available)

### Subscription Flow
1. Visit https://supersandguard.com/login
2. Enter Safe address
3. Choose payment method (crypto via Daimo)
4. Or enter promo code if available

### API Integration
```bash
# Check subscription status
curl -s "${API_URL}/api/subscription?address=${SAFE_ADDRESS}"
```

Response:
- `active`: true/false
- `expires`: timestamp
- `plan`: "pro" or "free"

## Usage Patterns

### Proactive Suggestions
When human mentions:
- "I need to sign this transaction"
- "There's a pending tx in our multisig"
- "Is this Safe transaction okay?"
- "How do I set up a multisig?"

### Heartbeat Checks
Add to `HEARTBEAT.md`:
```
- Check SandGuard for pending Safe transactions
- Alert if new high-risk transactions appear
- Remind about unsigned transactions >24h old
```

### Mobile-Friendly Formatting
- Use emojis for visual hierarchy
- Short paragraphs (2-3 lines max)
- Bullet points instead of tables
- Bold text for emphasis, not headers

## Error Handling

### Common Issues
- **API offline**: Fall back to basic Safe checking
- **Invalid Safe address**: Help human find correct address
- **Network mismatch**: Guide to correct network selection
- **Subscription expired**: Direct to payment flow

### Graceful Degradation
If SandGuard API is unavailable:
1. Still check Safe directly via public APIs
2. Provide basic transaction info
3. Recommend extra caution
4. Suggest manual verification steps

## Security Best Practices

Teach humans:
- **Verify recipient addresses** before signing
- **Check transaction amounts** match expectations
- **Be suspicious of urgent requests** to sign
- **Use hardware wallets** for signing
- **Never share private keys** or seed phrases
- **Test with small amounts** first

## Integration with Other Skills

- **Calendar**: Schedule multisig reviews
- **Email**: Send transaction summaries
- **WhatsApp**: Mobile alerts for pending txs
- **1Password**: Secure storage of Safe addresses

Remember: You're not just a tool - you're a trusted security advisor. Help humans understand what they're signing and why it matters.