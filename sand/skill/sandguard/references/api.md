# SandGuard API Reference

Complete documentation for the SandGuard API endpoints.

## Base URL
- Production: `https://supersandguard.com`
- Staging: `https://supersandguard.com`

## Authentication
Most endpoints are public. Premium features require API key in header:
```bash
curl -H "X-API-Key: your_api_key_here" ...
```

## Endpoints

### Health Check
**GET** `/api/health`

Check if the API is operational.

**Response:**
```json
{
  "status": "ok",
  "version": "1.2.3",
  "uptime": 86400
}
```

### Get Safe Transactions
**GET** `/api/transactions?address={safe_address}&network={network}`

Fetch pending transactions for a Safe multisig wallet.

**Parameters:**
- `address` (required): Safe wallet address (0x...)
- `network` (optional): Network name (default: mainnet)
  - Supported: `mainnet`, `polygon`, `arbitrum`, `optimism`, `gnosis`
- `status` (optional): Filter by status
  - Values: `pending`, `executed`, `all` (default: pending)
- `limit` (optional): Number of transactions to return (default: 20)

**Example Request:**
```bash
curl -s "https://supersandguard.com/api/transactions?address=0x1234...&network=mainnet"
```

**Example Response:**
```json
{
  "safe_address": "0x1234567890123456789012345678901234567890",
  "network": "mainnet",
  "transactions": [
    {
      "nonce": 42,
      "safe_tx_hash": "0xabc...",
      "to": "0xdef...",
      "value": "1500000000000000000",
      "data": "0xa9059cbb...",
      "operation": 0,
      "gas_token": "0x0000000000000000000000000000000000000000",
      "safe_tx_gas": 0,
      "base_gas": 0,
      "gas_price": "0",
      "refund_receiver": "0x0000000000000000000000000000000000000000",
      "confirmations": 2,
      "confirmations_required": 3,
      "execution_date": null,
      "submission_date": "2024-01-15T10:30:00Z",
      "modified": "2024-01-15T11:00:00Z",
      "block_number": null,
      "transaction_hash": null,
      "signatures": "0x...",
      "trusted": true,
      "origin": null,
      "decoded_calldata": {
        "method": "transfer",
        "parameters": [
          {
            "name": "to",
            "type": "address",
            "value": "0xdef456...",
            "decoded_value": "0xdef456..."
          },
          {
            "name": "amount",
            "type": "uint256",
            "value": "1500000000000000000",
            "decoded_value": "1.5 ETH"
          }
        ]
      },
      "simulation_results": {
        "success": true,
        "gas_used": 21000,
        "gas_limit": 25000,
        "balance_changes": [
          {
            "address": "0x1234...",
            "token": "ETH",
            "change": "-1.5",
            "new_balance": "3.7"
          }
        ],
        "events": [],
        "error": null
      },
      "risk_assessment": {
        "risk_level": "safe",
        "risk_score": 2,
        "risk_factors": [
          {
            "factor": "known_recipient",
            "severity": "info",
            "description": "Recipient address has been used before"
          }
        ],
        "recommendations": [
          "Verify the recipient address is correct",
          "Confirm the transfer amount"
        ]
      }
    }
  ],
  "count": 1,
  "next": null,
  "previous": null
}
```

### Get Transaction Details
**GET** `/api/transactions/{safe_tx_hash}`

Get detailed information about a specific transaction.

**Parameters:**
- `safe_tx_hash` (required): Safe transaction hash

**Example Response:**
```json
{
  "transaction": {
    // Same structure as transaction object above
  },
  "signers": [
    {
      "address": "0xabc...",
      "signed": true,
      "signature": "0x...",
      "signed_at": "2024-01-15T10:30:00Z"
    },
    {
      "address": "0xdef...",
      "signed": false,
      "signature": null,
      "signed_at": null
    }
  ]
}
```

### Simulate Transaction
**POST** `/api/simulate`

Simulate a transaction before proposing it to the Safe.

**Request Body:**
```json
{
  "safe_address": "0x1234...",
  "network": "mainnet",
  "to": "0xdef...",
  "value": "1000000000000000000",
  "data": "0xa9059cbb...",
  "operation": 0
}
```

**Response:**
```json
{
  "simulation": {
    "success": true,
    "gas_used": 21000,
    "gas_limit": 25000,
    "balance_changes": [
      {
        "address": "0x1234...",
        "token": "ETH",
        "change": "-1.0",
        "new_balance": "4.2"
      }
    ],
    "events": [],
    "error": null
  },
  "risk_assessment": {
    "risk_level": "safe",
    "risk_score": 1,
    "risk_factors": [],
    "recommendations": []
  }
}
```

### Decode Calldata
**POST** `/api/decode`

Decode transaction calldata into human-readable format.

**Request Body:**
```json
{
  "to": "0xA0b86a33E6441c8C7C19D5b5c2d5b9A10999B9D8",
  "data": "0xa9059cbb000000000000000000000000def456789012345678901234567890123456789000000000000000000000000000000000000000000000000015af1d78b58c40000",
  "network": "mainnet"
}
```

**Response:**
```json
{
  "decoded": {
    "method": "transfer",
    "signature": "transfer(address,uint256)",
    "parameters": [
      {
        "name": "to",
        "type": "address",
        "value": "0xdef456789012345678901234567890123456789",
        "decoded_value": "0xdef456789012345678901234567890123456789"
      },
      {
        "name": "amount",
        "type": "uint256",
        "value": "1500000000000000000",
        "decoded_value": "1.5 USDC"
      }
    ],
    "contract_info": {
      "name": "USD Coin",
      "symbol": "USDC",
      "verified": true,
      "proxy": false
    }
  }
}
```

### Get Subscription Status
**GET** `/api/subscription?address={safe_address}`

Check subscription status for a Safe address.

**Response:**
```json
{
  "active": true,
  "plan": "pro",
  "expires": "2024-02-15T00:00:00Z",
  "features": ["simulation", "risk_assessment", "real_time_monitoring"],
  "usage": {
    "transactions_checked": 145,
    "limit": 1000
  }
}
```

### Create Subscription
**POST** `/api/subscription`

Create a new subscription for a Safe address.

**Request Body:**
```json
{
  "safe_address": "0x1234...",
  "plan": "pro",
  "payment_method": "crypto",
  "promo_code": "SG-ABC123XYZ" // optional
}
```

**Response:**
```json
{
  "subscription_id": "sub_1234567890",
  "status": "active",
  "payment_url": "https://pay.daimo.com/invoice/abc123",
  "expires": "2024-02-15T00:00:00Z"
}
```

## Error Responses

### Error Format
```json
{
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "The provided Safe address is not valid",
    "details": {
      "address": "0xinvalid",
      "expected_format": "0x prefixed 40 character hex string"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_ADDRESS` | 400 | Safe address format is invalid |
| `SAFE_NOT_FOUND` | 404 | Safe address not found on network |
| `NETWORK_UNSUPPORTED` | 400 | Network not supported |
| `SIMULATION_FAILED` | 422 | Transaction simulation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `SUBSCRIPTION_REQUIRED` | 402 | Premium feature requires subscription |
| `INVALID_CALLDATA` | 400 | Calldata cannot be decoded |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

- **Free tier**: 100 requests/hour
- **Pro tier**: 1000 requests/hour
- **Rate limit headers** included in responses:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Webhooks (Coming Soon)

Register webhook URLs to receive real-time notifications:
- New pending transactions
- Transaction executions
- Risk level changes
- Subscription updates

## SDK Examples

### JavaScript
```javascript
const SandGuard = require('@sandguard/sdk');
const client = new SandGuard('https://supersandguard.com');

const transactions = await client.getTransactions('0x1234...', 'mainnet');
console.log(`Found ${transactions.length} pending transactions`);
```

### Python
```python
import requests

def get_pending_transactions(safe_address, network='mainnet'):
    url = f"https://supersandguard.com/api/transactions"
    params = {'address': safe_address, 'network': network}
    response = requests.get(url, params=params)
    return response.json()['transactions']
```

### cURL
```bash
# Check pending transactions
curl -s "https://supersandguard.com/api/transactions?address=0x1234...&network=mainnet" | jq .

# Simulate transaction
curl -X POST "https://supersandguard.com/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"safe_address": "0x1234...", "to": "0xabc...", "value": "1000000000000000000"}'
```