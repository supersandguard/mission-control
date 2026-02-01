# SandGuard — Transaction Firewall for Safe Multisig

## Overview
SandGuard analyzes pending Safe multisig transactions before you sign them. It decodes calldata, simulates execution, scores risk, and explains what each transaction actually does — in plain English.

## Setup

### 1. Get an API Key
- Visit [supersandguard.com](https://supersandguard.com)
- Send $20 in ETH on Base to: `0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84`
- Verify your payment at `POST /api/payments/verify` with your tx hash
- Receive your API key (starts with `sg_`)

### 2. Configure
Store your API key and Safe address:
```bash
# In your Clawdbot's TOOLS.md or .env:
SANDGUARD_API_KEY=sg_your_key_here
SANDGUARD_API_URL=https://api.supersandguard.com
SAFE_ADDRESS=0xYourSafeAddress
SAFE_CHAIN_ID=1  # 1=Ethereum, 8453=Base, 10=Optimism, 42161=Arbitrum
```

## Usage

### Check pending transactions
```bash
curl -H "Authorization: Bearer $SANDGUARD_API_KEY" \
  "$SANDGUARD_API_URL/api/safe/$SAFE_ADDRESS/transactions?chainId=$SAFE_CHAIN_ID"
```

### Analyze a specific transaction
```bash
# Decode calldata
curl -X POST "$SANDGUARD_API_URL/api/decode" \
  -H "Authorization: Bearer $SANDGUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "0xContractAddress", "data": "0xCalldata", "value": "0", "chainId": 1}'

# Simulate execution
curl -X POST "$SANDGUARD_API_URL/api/simulate" \
  -H "Authorization: Bearer $SANDGUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "0xContractAddress", "data": "0xCalldata", "value": "0", "from": "0xSafeAddress", "chainId": 1}'

# Get risk score
curl -X POST "$SANDGUARD_API_URL/api/risk" \
  -H "Authorization: Bearer $SANDGUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "0xContractAddress", "data": "0xCalldata", "value": "0", "chainId": 1}'

# Plain English explanation
curl -X POST "$SANDGUARD_API_URL/api/explain" \
  -H "Authorization: Bearer $SANDGUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "0xContractAddress", "data": "0xCalldata", "value": "0", "chainId": 1}'
```

## When to use

### As a Clawdbot Agent
When your human asks you to check their Safe, or during heartbeat checks:
1. Fetch pending transactions from the Safe
2. For each pending tx, run decode → simulate → risk → explain
3. Alert your human if any transaction has risk score > 50 or has red flags
4. Provide the plain English explanation so they can decide whether to sign

### Risk Levels
- 🟢 **Safe** (score 0-30): Known protocol, verified contract, simulation passes
- 🟡 **Caution** (score 31-60): Large transfer, unverified contract, unusual pattern
- 🔴 **Danger** (score 61-100): Unlimited approval, failed simulation, suspicious recipient

### Red Flags to Alert On
- Unlimited token approvals (`type(uint256).max`)
- Transfers > $10,000
- Unverified contracts
- Failed simulations
- Interactions with known scam addresses

## Dashboard
For manual review, visit the web dashboard:
- **URL:** https://supersandguard.com/app
- **Settings:** Configure your Safe address and API keys
- **Queue:** View all pending transactions with decoded details

## Pricing
- **$20/month** paid in ETH on Base chain
- Unlimited transactions
- All chains supported (Ethereum, Base, Optimism, Arbitrum)
- API access + Web dashboard

## Support
- Website: https://supersandguard.com
- Built by Max Umbra / Clawdbot
