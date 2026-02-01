# SandGuard — API Research

> Comprehensive research for building a crypto transaction firewall product.
> Stack: Node.js + React PWA. Target chains: Ethereum, Base.

---

## Table of Contents

1. [Safe SDK (Protocol Kit + API Kit)](#1-safe-sdk-protocol-kit--api-kit)
2. [Tenderly Simulation API](#2-tenderly-simulation-api)
3. [Calldata Decoding](#3-calldata-decoding)
4. [Web Push API](#4-web-push-api)

---

## 1. Safe SDK (Protocol Kit + API Kit)

### Overview

The Safe SDK provides two main packages for interacting with Safe (formerly Gnosis Safe) multisig wallets:

| Package | Purpose |
|---|---|
| `@safe-global/protocol-kit` | Create Safes, build transactions, sign them, execute on-chain |
| `@safe-global/api-kit` | Interact with Safe Transaction Service — propose, list pending, confirm transactions |
| `@safe-global/types-kit` | Shared TypeScript types |

### Installation

```bash
npm install @safe-global/protocol-kit @safe-global/api-kit @safe-global/types-kit
```

### Setup & Initialization

```typescript
import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import {
  MetaTransactionData,
  OperationType
} from '@safe-global/types-kit'

// --- Configuration ---
const RPC_URL = 'https://mainnet.base.org' // or any EVM RPC
const SAFE_ADDRESS = '0xYourSafeAddress...'
const SIGNER_PRIVATE_KEY = '0xYourPrivateKey...'
const SIGNER_ADDRESS = '0xYourSignerAddress...'

// --- Initialize Protocol Kit (for signing/executing) ---
const protocolKit = await Safe.init({
  provider: RPC_URL,
  signer: SIGNER_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
})

// --- Initialize API Kit (for proposing/reading) ---
// For supported chains, just specify chainId:
const apiKit = new SafeApiKit({
  chainId: 8453n, // Base mainnet
  // apiKey: 'YOUR_SAFE_API_KEY' // optional but recommended for rate limits
})

// For custom/self-hosted Transaction Service:
// const apiKit = new SafeApiKit({
//   chainId: 8453n,
//   txServiceUrl: 'https://your-custom-service.com'
// })
```

**Supported chains for Transaction Service**: Ethereum, Polygon, Arbitrum, Optimism, Base, Gnosis, Avalanche, BNB, and more. See [Safe supported networks](https://docs.safe.global/advanced/smart-account-supported-networks).

### Propose a Transaction

This is the core flow for a firewall: intercept a user's intended transaction, wrap it as a Safe proposal, and hold it for review.

```typescript
// 1. Define the transaction(s)
const safeTransactionData: MetaTransactionData = {
  to: '0xRecipientOrContract',
  value: '0', // ETH value in wei as string
  data: '0xabcdef...', // Encoded calldata
  operation: OperationType.Call, // 0 = Call, 1 = DelegateCall
}

// 2. Create the Safe transaction object
const safeTransaction = await protocolKit.createTransaction({
  transactions: [safeTransactionData], // supports batching multiple txs
})

// 3. Compute the deterministic Safe tx hash
const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)

// 4. Sign the hash (first signer)
const signature = await protocolKit.signHash(safeTxHash)

// 5. Propose to the Transaction Service
await apiKit.proposeTransaction({
  safeAddress: SAFE_ADDRESS,
  safeTransactionData: safeTransaction.data,
  safeTxHash,
  senderAddress: SIGNER_ADDRESS,
  senderSignature: signature.data,
})

console.log('Transaction proposed:', safeTxHash)
```

### Read Pending Transactions

```typescript
// Get ALL pending (not yet executed) transactions for a Safe
const pendingTxs = await apiKit.getPendingTransactions(SAFE_ADDRESS)
console.log('Pending transactions:', pendingTxs.results)

// Each result contains:
// - safeTxHash: string
// - to, value, data, operation
// - confirmations: array of {owner, signature}
// - confirmationsRequired: number
// - isExecuted: boolean
// - nonce: number

// Get a specific transaction by its Safe tx hash
const tx = await apiKit.getTransaction(safeTxHash)

// Other useful methods:
// const allTxs = await apiKit.getAllTransactions(SAFE_ADDRESS)
// const multisigTxs = await apiKit.getMultisigTransactions(SAFE_ADDRESS)
// const incomingTxs = await apiKit.getIncomingTransactions(SAFE_ADDRESS)
// const moduleTxs = await apiKit.getModuleTransactions(SAFE_ADDRESS)
```

### Confirm (Co-sign) a Transaction

When a second owner approves a pending transaction:

```typescript
// Initialize Protocol Kit with second signer
const protocolKitOwner2 = await Safe.init({
  provider: RPC_URL,
  signer: OWNER_2_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
})

// Sign the same Safe tx hash
const signature2 = await protocolKitOwner2.signHash(safeTxHash)

// Submit confirmation to Transaction Service
await apiKit.confirmTransaction(safeTxHash, signature2.data)
```

### Execute a Transaction

Once enough confirmations are collected (meeting the threshold):

```typescript
// Retrieve the fully-signed transaction from the service
const safeTransaction = await apiKit.getTransaction(safeTxHash)

// Execute on-chain (the executing signer pays gas)
const executeTxResponse = await protocolKit.executeTransaction(safeTransaction)

console.log('Executed! TX hash:', executeTxResponse.hash)
// Wait for confirmation
await executeTxResponse.transactionResponse?.wait()
```

### Multi-Send (Batch Transactions)

```typescript
const transactions: MetaTransactionData[] = [
  {
    to: '0xTokenA',
    value: '0',
    data: '0x...', // approve calldata
    operation: OperationType.Call,
  },
  {
    to: '0xProtocol',
    value: '0',
    data: '0x...', // deposit calldata
    operation: OperationType.Call,
  },
]

// createTransaction auto-wraps multiple txs into a MultiSend call
const batchTx = await protocolKit.createTransaction({ transactions })
```

### Read Safe Info

```typescript
// Get owners, threshold, nonce, modules, guard
const safeInfo = await apiKit.getSafeInfo(SAFE_ADDRESS)
console.log('Threshold:', safeInfo.threshold)
console.log('Owners:', safeInfo.owners)
console.log('Nonce:', safeInfo.nonce)
```

### Key Architecture Notes for SandGuard

- **Firewall flow**: User submits intent → backend creates Safe tx → simulates with Tenderly → if safe, auto-sign and propose → push notification to other signers → they confirm → execute.
- **EIP-1193 signers**: Protocol Kit accepts any EIP-1193 provider, not just private keys. In production, use WalletConnect or injected provider.
- **Transaction nonce**: Safe uses sequential nonces. If you propose tx with nonce N, it blocks all txs with nonce > N until N is executed or rejected.
- **Rejections**: To reject a pending tx, propose a "zero" transaction (to: Safe address, value: 0, data: 0x) with the same nonce.

---

## 2. Tenderly Simulation API

### Overview

Tenderly provides transaction simulation that predicts exact outcomes before execution. Critical for a firewall to detect:
- Token balance changes (who gains/loses what)
- ETH balance changes
- Events emitted (Transfer, Approval, etc.)
- State diffs (storage changes)
- Gas estimation
- Revert reasons

Two approaches available:
1. **RPC method** (`tenderly_simulateTransaction`) — via Tenderly Node RPC URL
2. **REST API** — `POST /api/v1/account/{accountSlug}/project/{projectSlug}/simulate`

### Approach 1: RPC Simulation (Recommended for simplicity)

Get your RPC URL from [Tenderly Dashboard](https://dashboard.tenderly.co) → Node → Copy HTTPS URL.

```typescript
import { ethers } from 'ethers'

const TENDERLY_RPC = 'https://base-mainnet.gateway.tenderly.co/YOUR_ACCESS_KEY'

// The RPC method returns decoded logs, call traces, asset changes, 
// balance changes, and state changes
async function simulateViaRPC(tx: {
  from: string
  to: string
  data: string
  value?: string
  gas?: string
}) {
  const provider = new ethers.JsonRpcProvider(TENDERLY_RPC)

  const result = await provider.send('tenderly_simulateTransaction', [
    {
      from: tx.from,
      to: tx.to,
      data: tx.data,
      value: tx.value || '0x0',
      gas: tx.gas || '0x1312D00', // 20M gas default
    },
    'latest', // block tag
    // Optional: state overrides (3rd param), block overrides (4th param)
  ])

  return result
  // result contains:
  // - status: boolean (success/revert)
  // - gasUsed: hex
  // - logs: decoded event logs
  // - trace: full call trace
  // - assetChanges: token transfers with USD values
  // - balanceChanges: ETH balance diffs with USD values  
  // - stateDiffs: storage slot changes
}
```

#### RPC Response Structure

```jsonc
{
  "status": true,
  "gasUsed": "0x5208",
  "logs": [
    {
      "name": "Transfer",
      "anonymous": false,
      "inputs": [
        { "name": "from", "type": "address", "value": "0x..." },
        { "name": "to", "type": "address", "value": "0x..." },
        { "name": "value", "type": "uint256", "value": "1000000" }
      ],
      "raw": { "address": "0x...", "topics": [...], "data": "0x..." }
    }
  ],
  "assetChanges": [
    {
      "type": "Transfer",
      "from": "0xSender",
      "to": "0xReceiver",
      "rawAmount": "1000000",
      "amount": "1.0",
      "dollarValue": "1.00",
      "tokenInfo": {
        "standard": "ERC20",
        "contractAddress": "0xTokenAddress",
        "symbol": "USDC",
        "name": "USD Coin",
        "decimals": 6,
        "dollarValue": "1.00"
      }
    }
  ],
  "balanceChanges": [
    {
      "address": "0xSender",
      "dollarValue": "-1.50",
      "transfers": [...]
    }
  ],
  "stateDiffs": [
    {
      "address": "0xContract",
      "soltype": { "name": "balances", "type": "mapping(address => uint256)" },
      "original": "0x...",
      "dirty": "0x...",
      "raw": [{ "key": "0x...", "original": "0x...", "dirty": "0x..." }]
    }
  ]
}
```

### Approach 2: REST API Simulation

```typescript
const TENDERLY_ACCOUNT = 'your-account-slug'
const TENDERLY_PROJECT = 'your-project-slug'
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_ACCESS_KEY!

interface SimulationRequest {
  network_id: string       // "1" for Ethereum, "8453" for Base
  block_number?: number    // omit for latest
  from: string
  to: string
  input: string            // calldata
  gas: number
  value?: string           // wei as decimal string
  simulation_type?: 'full' | 'quick' | 'abi'
  save?: boolean
  save_if_fails?: boolean
  state_objects?: Record<string, any>  // state overrides
}

async function simulateViaAPI(params: SimulationRequest) {
  const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulate`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Key': TENDERLY_ACCESS_KEY,
    },
    body: JSON.stringify({
      network_id: params.network_id,
      block_number: params.block_number,
      from: params.from,
      to: params.to,
      input: params.input,
      gas: params.gas,
      value: params.value || '0',
      simulation_type: params.simulation_type || 'full',
      save: params.save || false,
      save_if_fails: params.save_if_fails || true,
      state_objects: params.state_objects,
    }),
  })

  const data = await response.json()
  return data
}

// Example: Simulate a USDC transfer on Base
const result = await simulateViaAPI({
  network_id: '8453',
  from: '0xSafeAddress',
  to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  input: '0xa9059cbb000000000000000000000000RECIPIENT0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f4240', // transfer(address,uint256)
  gas: 100000,
  value: '0',
  simulation_type: 'full',
})
```

#### API Response Structure

```jsonc
{
  "transaction": {
    "hash": "0x...",
    "block_number": 12345678,
    "from": "0x...",
    "to": "0x...",
    "gas": 100000,
    "gas_used": 52000,
    "value": "0",
    "status": true,
    "error_message": "",  // populated if reverted
    "transaction_info": {
      "call_trace": {
        "calls": [...],     // nested internal calls
        "output": "0x...",
        "decoded_output": [...]
      },
      "logs": [
        {
          "name": "Transfer",
          "inputs": [
            { "soltype": { "name": "from", "type": "address" }, "value": "0x..." },
            { "soltype": { "name": "to", "type": "address" }, "value": "0x..." },
            { "soltype": { "name": "value", "type": "uint256" }, "value": "1000000" }
          ],
          "raw": { "address": "0x...", "topics": [...], "data": "0x..." }
        }
      ],
      "state_diff": [
        {
          "address": "0x...",
          "soltype": { "name": "_balances", "type": "mapping(address => uint256)" },
          "original": { "0xOwner": "5000000" },
          "dirty": { "0xOwner": "4000000" }
        }
      ],
      "asset_changes": [
        {
          "type": "Transfer",
          "from": "0x...",
          "to": "0x...",
          "raw_amount": "1000000",
          "dollar_value": "1.00",
          "token_info": {
            "standard": "ERC20",
            "contract_address": "0x...",
            "symbol": "USDC",
            "decimals": 6
          }
        }
      ],
      "balance_diff": [
        {
          "address": "0x...",
          "original": "1000000000000000000",
          "dirty": "999000000000000000",
          "is_miner": false
        }
      ]
    }
  }
}
```

### Simulation with State Overrides

Useful for simulating from accounts you don't control (e.g., simulating what would happen if the Safe executes a tx):

```typescript
// Override the Safe's ETH balance to ensure it has enough for the tx
const result = await provider.send('tenderly_simulateTransaction', [
  {
    from: SAFE_ADDRESS,
    to: '0xTarget',
    data: '0x...',
    value: '0xDE0B6B3A7640000', // 1 ETH
    gas: '0x1312D00',
  },
  'latest',
  {
    // State overrides: give the Safe 100 ETH
    [SAFE_ADDRESS]: {
      balance: '0x56BC75E2D63100000', // 100 ETH in hex wei
    },
    // Override a token balance (storage slot manipulation)
    // '0xTokenAddress': {
    //   stateDiff: {
    //     '0xSLOT_HASH': '0xNEW_VALUE'
    //   }
    // }
  },
])
```

### Simulation Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `full` | Decoded call trace, inputs/outputs, state diffs, events | Full firewall analysis |
| `quick` | Raw data only, no decoding | Fast gas estimation |
| `abi` | Decoded inputs/outputs and events, no state diffs | Lightweight analysis |

### Network IDs

| Chain | Network ID |
|-------|-----------|
| Ethereum Mainnet | `1` |
| Base | `8453` |
| Arbitrum | `42161` |
| Optimism | `10` |
| Polygon | `137` |
| Sepolia | `11155111` |
| Base Sepolia | `84532` |

### Key Firewall Use Cases

1. **Detect unexpected token drains**: Check `asset_changes` for outgoing transfers you didn't expect
2. **Verify approvals**: Look for `Approval` events with suspicious spender addresses
3. **Detect rug pulls**: Check if the tx changes ownership or admin storage slots
4. **Gas estimation**: Use `gas_used` for accurate gas cost predictions
5. **Revert detection**: Check `status === false` and read `error_message` before executing

---

## 3. Calldata Decoding

### Overview

Decoding transaction calldata is essential for the firewall to understand *what* a transaction does before it's executed. This involves:

1. Extracting the function selector (first 4 bytes)
2. Finding the matching ABI
3. Decoding the parameters

### Decode with ethers.js v6

```typescript
import { ethers } from 'ethers'

// --- Basic decoding with a known ABI ---
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
]

const iface = new ethers.Interface(ERC20_ABI)

// Decode calldata
const calldata = '0xa9059cbb0000000000000000000000001234567890abcdef1234567890abcdef123456780000000000000000000000000000000000000000000000000000000000989680'

try {
  const decoded = iface.parseTransaction({ data: calldata })
  console.log('Function:', decoded.name)        // "transfer"
  console.log('Args:', decoded.args)             // [address, bigint]
  console.log('To:', decoded.args[0])            // "0x1234..."
  console.log('Amount:', decoded.args[1])        // 10000000n
  console.log('Selector:', decoded.selector)     // "0xa9059cbb"
  console.log('Signature:', decoded.signature)   // "transfer(address,uint256)"
} catch (e) {
  console.log('Could not decode with this ABI')
}
```

### Extract Function Selector

```typescript
// The selector is the first 4 bytes of calldata
function getFunctionSelector(calldata: string): string {
  return calldata.slice(0, 10) // "0x" + 8 hex chars = 4 bytes
}

// Compute selector from function signature
const selector = ethers.id('transfer(address,uint256)').slice(0, 10)
// "0xa9059cbb"
```

### Fetch ABI from Etherscan/Basescan API

```typescript
interface EtherscanResponse {
  status: string
  message: string
  result: string // JSON-encoded ABI array
}

async function fetchABI(
  contractAddress: string,
  chain: 'ethereum' | 'base' = 'ethereum'
): Promise<ethers.InterfaceAbi | null> {
  const apiKeys: Record<string, string> = {
    ethereum: process.env.ETHERSCAN_API_KEY!,
    base: process.env.BASESCAN_API_KEY!,
  }
  const baseUrls: Record<string, string> = {
    ethereum: 'https://api.etherscan.io/api',
    base: 'https://api.basescan.org/api',
  }

  const url = `${baseUrls[chain]}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKeys[chain]}`

  const response = await fetch(url)
  const data: EtherscanResponse = await response.json()

  if (data.status === '1' && data.message === 'OK') {
    return JSON.parse(data.result)
  }

  // Contract might be a proxy — try to get implementation
  const implUrl = `${baseUrls[chain]}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKeys[chain]}`
  const implResponse = await fetch(implUrl)
  const implData = await implResponse.json()

  if (implData.result?.[0]?.Implementation) {
    const implAddress = implData.result[0].Implementation
    return fetchABI(implAddress, chain)
  }

  return null
}

// Usage
const abi = await fetchABI('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'base')
if (abi) {
  const iface = new ethers.Interface(abi)
  const decoded = iface.parseTransaction({ data: calldata })
}
```

### Smart Decoding Pipeline

```typescript
import { ethers } from 'ethers'

// Cache ABIs in memory (or Redis/DB in production)
const abiCache = new Map<string, ethers.Interface>()

// Well-known ABIs for common protocols
const KNOWN_ABIS: Record<string, string[]> = {
  ERC20: [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  ERC721: [
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function approve(address to, uint256 tokenId)',
    'function setApprovalForAll(address operator, bool approved)',
  ],
  UNISWAP_V3_ROUTER: [
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) returns (uint256)',
    'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) returns (uint256)',
    'function multicall(uint256 deadline, bytes[] data) returns (bytes[])',
    'function multicall(bytes[] data) returns (bytes[])',
  ],
  AAVE_V3_POOL: [
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
    'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
    'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
    'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)',
    'function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken)',
  ],
  MORPHO: [
    'function supply((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
    'function withdraw((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)',
    'function borrow((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)',
    'function repay((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
    'function supplyCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, bytes data)',
  ],
}

// Well-known contract addresses (Base mainnet)
const KNOWN_CONTRACTS_BASE: Record<string, { name: string; protocol: string }> = {
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { name: 'USDC', protocol: 'ERC20' },
  '0x4200000000000000000000000000000000000006': { name: 'WETH', protocol: 'ERC20' },
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': { name: 'DAI', protocol: 'ERC20' },
  '0x2626664c2603336E57B271c5C0b26F421741e481': { name: 'Uniswap V3 Router', protocol: 'UNISWAP_V3_ROUTER' },
  '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5': { name: 'Aave V3 Pool', protocol: 'AAVE_V3_POOL' },
  '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb': { name: 'Morpho', protocol: 'MORPHO' },
}

// Well-known contract addresses (Ethereum mainnet)
const KNOWN_CONTRACTS_ETH: Record<string, { name: string; protocol: string }> = {
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { name: 'USDC', protocol: 'ERC20' },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': { name: 'USDT', protocol: 'ERC20' },
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': { name: 'WETH', protocol: 'ERC20' },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': { name: 'DAI', protocol: 'ERC20' },
  '0xE592427A0AEce92De3Edee1F18E0157C05861564': { name: 'Uniswap V3 Router', protocol: 'UNISWAP_V3_ROUTER' },
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': { name: 'Uniswap V3 Router 02', protocol: 'UNISWAP_V3_ROUTER' },
  '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2': { name: 'Aave V3 Pool', protocol: 'AAVE_V3_POOL' },
  '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb': { name: 'Morpho Blue', protocol: 'MORPHO' },
}

interface DecodedTransaction {
  protocol: string
  contractName: string
  functionName: string
  functionSignature: string
  selector: string
  args: Record<string, any>
  raw: ethers.TransactionDescription | null
}

async function decodeCalldata(
  to: string,
  calldata: string,
  chain: 'ethereum' | 'base' = 'base'
): Promise<DecodedTransaction | null> {
  const knownContracts = chain === 'base' ? KNOWN_CONTRACTS_BASE : KNOWN_CONTRACTS_ETH
  const addressLower = to.toLowerCase()

  // 1. Try known contracts first
  const known = Object.entries(knownContracts).find(
    ([addr]) => addr.toLowerCase() === addressLower
  )

  if (known) {
    const [, info] = known
    const abi = KNOWN_ABIS[info.protocol]
    if (abi) {
      const iface = new ethers.Interface(abi)
      try {
        const parsed = iface.parseTransaction({ data: calldata })
        if (parsed) {
          return {
            protocol: info.protocol,
            contractName: info.name,
            functionName: parsed.name,
            functionSignature: parsed.signature,
            selector: parsed.selector,
            args: Object.fromEntries(
              parsed.fragment.inputs.map((input, i) => [input.name, parsed.args[i]])
            ),
            raw: parsed,
          }
        }
      } catch { /* selector not in known ABI, fall through */ }
    }
  }

  // 2. Try fetching ABI from block explorer
  const abi = await fetchABI(to, chain)
  if (abi) {
    const iface = new ethers.Interface(abi)
    try {
      const parsed = iface.parseTransaction({ data: calldata })
      if (parsed) {
        return {
          protocol: known?.[1]?.protocol || 'UNKNOWN',
          contractName: known?.[1]?.name || to,
          functionName: parsed.name,
          functionSignature: parsed.signature,
          selector: parsed.selector,
          args: Object.fromEntries(
            parsed.fragment.inputs.map((input, i) => [input.name, parsed.args[i]])
          ),
          raw: parsed,
        }
      }
    } catch { /* decode failed */ }
  }

  // 3. Try all known ABIs as fallback (contract might implement a standard interface)
  for (const [protocol, abi] of Object.entries(KNOWN_ABIS)) {
    const iface = new ethers.Interface(abi)
    try {
      const parsed = iface.parseTransaction({ data: calldata })
      if (parsed) {
        return {
          protocol,
          contractName: to,
          functionName: parsed.name,
          functionSignature: parsed.signature,
          selector: parsed.selector,
          args: Object.fromEntries(
            parsed.fragment.inputs.map((input, i) => [input.name, parsed.args[i]])
          ),
          raw: parsed,
        }
      }
    } catch { continue }
  }

  // 4. Return minimal info
  return {
    protocol: 'UNKNOWN',
    contractName: to,
    functionName: `unknown_${calldata.slice(0, 10)}`,
    functionSignature: calldata.slice(0, 10),
    selector: calldata.slice(0, 10),
    args: { rawData: calldata },
    raw: null,
  }
}
```

### Decode Logs/Events

```typescript
// Decode events from Tenderly simulation output or tx receipt
function decodeLogs(
  logs: Array<{ address: string; topics: string[]; data: string }>,
  knownInterfaces: ethers.Interface[]
): Array<{ address: string; event: string; args: Record<string, any> } | null> {
  return logs.map((log) => {
    for (const iface of knownInterfaces) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data })
        if (parsed) {
          return {
            address: log.address,
            event: parsed.name,
            args: Object.fromEntries(
              parsed.fragment.inputs.map((input, i) => [input.name, parsed.args[i]])
            ),
          }
        }
      } catch { continue }
    }
    return null
  })
}
```

### 4byte.directory Fallback

When no ABI is available, you can look up function selectors:

```typescript
async function lookupSelector(selector: string): Promise<string | null> {
  // selector should be "0xabcdef12" format
  const response = await fetch(
    `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`
  )
  const data = await response.json()
  if (data.results?.length > 0) {
    return data.results[0].text_signature // e.g. "transfer(address,uint256)"
  }
  return null
}
```

### Risk Classification Helper

```typescript
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

function classifyTransactionRisk(decoded: DecodedTransaction): {
  level: RiskLevel
  reasons: string[]
} {
  const reasons: string[] = []
  let level: RiskLevel = 'LOW'

  // Approvals are always at least MEDIUM risk
  if (decoded.functionName === 'approve') {
    const amount = decoded.args.amount || decoded.args.value
    if (amount === ethers.MaxUint256) {
      level = 'HIGH'
      reasons.push('Unlimited token approval (MaxUint256)')
    } else {
      level = 'MEDIUM'
      reasons.push(`Token approval for ${ethers.formatUnits(amount, 18)} tokens`)
    }
  }

  // setApprovalForAll is HIGH risk
  if (decoded.functionName === 'setApprovalForAll') {
    level = 'HIGH'
    reasons.push('NFT approval for all tokens to an operator')
  }

  // Unknown functions are MEDIUM
  if (decoded.protocol === 'UNKNOWN') {
    level = level === 'LOW' ? 'MEDIUM' : level
    reasons.push('Unknown contract/function — could not decode')
  }

  // DelegateCall is CRITICAL
  // (would be detected at the Safe tx level, not calldata level)

  return { level, reasons }
}
```

---

## 4. Web Push API

### Overview

Web Push enables server-initiated notifications to users even when the PWA is closed. The flow:

1. **Client**: Register service worker → request notification permission → subscribe to push
2. **Server**: Store push subscriptions → send push messages via push service (FCM, Mozilla, etc.)
3. **Service Worker**: Receive push event → show notification

Key technology: **VAPID** (Voluntary Application Server Identification) — a key pair that authenticates your server with push services.

### Dependencies

```bash
# Server
npm install web-push

# Generate VAPID keys (one-time)
npx web-push generate-vapid-keys
```

### Server Implementation (Node.js/Express)

```typescript
// server/push.ts
import webpush from 'web-push'
import express from 'express'

// --- VAPID Configuration (generate once, store securely) ---
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = 'mailto:admin@sandguard.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

// --- Subscription Storage ---
// In production, store in your database (Postgres, Redis, etc.)
interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// Map: userId -> PushSubscription[]
const subscriptions = new Map<string, PushSubscription[]>()

const router = express.Router()

// Save a new subscription
router.post('/push/subscribe', async (req, res) => {
  const { userId, subscription } = req.body

  if (!userId || !subscription?.endpoint || !subscription?.keys) {
    return res.status(400).json({ error: 'Invalid subscription data' })
  }

  const userSubs = subscriptions.get(userId) || []
  // Avoid duplicates
  if (!userSubs.find((s) => s.endpoint === subscription.endpoint)) {
    userSubs.push(subscription)
    subscriptions.set(userId, userSubs)
  }

  res.json({ success: true })
})

// Remove a subscription
router.post('/push/unsubscribe', async (req, res) => {
  const { userId, endpoint } = req.body

  const userSubs = subscriptions.get(userId) || []
  subscriptions.set(
    userId,
    userSubs.filter((s) => s.endpoint !== endpoint)
  )

  res.json({ success: true })
})

// Send notification to a specific user
async function sendPushNotification(
  userId: string,
  payload: {
    title: string
    body: string
    icon?: string
    badge?: string
    url?: string
    tag?: string
    data?: Record<string, any>
  }
) {
  const userSubs = subscriptions.get(userId) || []
  const notification = JSON.stringify(payload)

  const results = await Promise.allSettled(
    userSubs.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notification, {
          TTL: 60 * 60, // 1 hour
          urgency: 'high',
          topic: payload.tag, // replaces older notifications with same topic
        })
      } catch (error: any) {
        // 410 Gone or 404 = subscription expired, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          const subs = subscriptions.get(userId) || []
          subscriptions.set(
            userId,
            subs.filter((s) => s.endpoint !== subscription.endpoint)
          )
        }
        throw error
      }
    })
  )

  return results
}

// --- Endpoint: Send test notification ---
router.post('/push/test', async (req, res) => {
  const { userId } = req.body
  await sendPushNotification(userId, {
    title: '🛡️ SandGuard',
    body: 'Push notifications are working!',
    icon: '/icons/icon-192.png',
    url: '/',
  })
  res.json({ success: true })
})

// --- Endpoint: Notify about pending transaction ---
router.post('/push/notify-tx', async (req, res) => {
  const { userId, safeTxHash, description, riskLevel } = req.body
  
  const emoji = { LOW: '✅', MEDIUM: '⚠️', HIGH: '🔴', CRITICAL: '🚨' }
  
  await sendPushNotification(userId, {
    title: `${emoji[riskLevel] || '📋'} New Transaction Pending`,
    body: description,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url: `/tx/${safeTxHash}`,
    tag: `tx-${safeTxHash}`, // dedup: replaces previous notification for same tx
    data: { safeTxHash, riskLevel },
  })

  res.json({ success: true })
})

// Expose VAPID public key for clients
router.get('/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY })
})

export { router as pushRouter, sendPushNotification }
```

### Service Worker (public/service-worker.js)

```javascript
// public/service-worker.js
// This runs in the background, even when the app is closed

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// --- Handle incoming push messages ---
self.addEventListener('push', (event) => {
  let payload = {
    title: 'SandGuard',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url: '/',
  }

  if (event.data) {
    try {
      const data = event.data.json()
      payload = { ...payload, ...data }
    } catch {
      payload.body = event.data.text()
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag || 'default',
    renotify: true, // vibrate even if replacing same tag
    requireInteraction: payload.data?.riskLevel === 'HIGH' || payload.data?.riskLevel === 'CRITICAL',
    data: {
      url: payload.url,
      ...payload.data,
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  )
})

// --- Handle notification click ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  if (event.action === 'dismiss') return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new tab
      return clients.openWindow(url)
    })
  )
})

// --- Handle notification close (analytics) ---
self.addEventListener('notificationclose', (event) => {
  // Optional: track dismissed notifications
  console.log('Notification closed:', event.notification.tag)
})
```

### React Client Implementation

```tsx
// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react'

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  error: string | null
}

export function usePushNotifications(userId: string): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) return

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications not supported')
      return
    }

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError('Notification permission denied')
        return
      }

      // 2. Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      await navigator.serviceWorker.ready

      // 3. Get VAPID public key from server
      const keyResponse = await fetch('/api/push/vapid-public-key')
      const { publicKey } = await keyResponse.json()

      // 4. Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // 5. Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      })

      setIsSubscribed(true)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }, [isSupported, userId])

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            endpoint: subscription.endpoint,
          }),
        })
      }

      setIsSubscribed(false)
    } catch (err: any) {
      setError(err.message)
    }
  }, [userId])

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe, error }
}
```

### React Component

```tsx
// src/components/PushNotificationToggle.tsx
import { usePushNotifications } from '../hooks/usePushNotifications'

export function PushNotificationToggle({ userId }: { userId: string }) {
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe, error } =
    usePushNotifications(userId)

  if (!isSupported) {
    return <p className="text-gray-500 text-sm">Push notifications not supported in this browser</p>
  }

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isSubscribed}
          onChange={() => (isSubscribed ? unsubscribe() : subscribe())}
          className="toggle"
        />
        <span>
          {isSubscribed ? '🔔 Notifications enabled' : '🔕 Enable notifications'}
        </span>
      </label>
      {permission === 'denied' && (
        <p className="text-red-500 text-sm">
          Notifications blocked. Please enable in browser settings.
        </p>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
```

### PWA Manifest Requirements

```json
// public/manifest.json
{
  "name": "SandGuard",
  "short_name": "SandGuard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```html
<!-- In your HTML head -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
```

### Integration: Notify on Pending Transaction

Tying it all together — when a new transaction is proposed to the Safe:

```typescript
// server/firewall.ts
import { sendPushNotification } from './push'
import { decodeCalldata, classifyTransactionRisk } from './decoder'
import { simulateViaRPC } from './tenderly'

async function onTransactionProposed(params: {
  userId: string
  safeTxHash: string
  to: string
  data: string
  value: string
  chain: 'ethereum' | 'base'
  safeAddress: string
}) {
  // 1. Decode the calldata
  const decoded = await decodeCalldata(params.to, params.data, params.chain)

  // 2. Simulate with Tenderly
  const simulation = await simulateViaRPC({
    from: params.safeAddress,
    to: params.to,
    data: params.data,
    value: params.value,
  })

  // 3. Classify risk
  const risk = decoded
    ? classifyTransactionRisk(decoded)
    : { level: 'MEDIUM' as const, reasons: ['Could not decode'] }

  // Elevate risk if simulation fails
  if (!simulation.status) {
    risk.level = 'CRITICAL'
    risk.reasons.push(`Simulation reverted: ${simulation.error_message || 'unknown error'}`)
  }

  // 4. Build notification description
  const description = decoded
    ? `${decoded.contractName}: ${decoded.functionName}(${Object.entries(decoded.args)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')})`
    : `Unknown function call to ${params.to.slice(0, 10)}...`

  // 5. Push notification
  await sendPushNotification(params.userId, {
    title: `${risk.level === 'LOW' ? '✅' : risk.level === 'CRITICAL' ? '🚨' : '⚠️'} Transaction Review`,
    body: description,
    url: `/tx/${params.safeTxHash}`,
    tag: `tx-${params.safeTxHash}`,
    data: {
      safeTxHash: params.safeTxHash,
      riskLevel: risk.level,
      reasons: risk.reasons,
    },
  })
}
```

---

## Appendix: Key Links & References

### Safe SDK
- Docs: https://docs.safe.global/sdk/protocol-kit
- API Kit Guide: https://docs.safe.global/sdk/api-kit/guides/propose-and-confirm-transactions
- Execute Transactions Guide: https://docs.safe.global/sdk/protocol-kit/guides/execute-transactions
- GitHub: https://github.com/safe-global/safe-core-sdk
- Supported Networks: https://docs.safe.global/advanced/smart-account-supported-networks

### Tenderly
- Simulations Overview: https://docs.tenderly.co/simulations
- Single Simulations: https://docs.tenderly.co/simulations/single-simulations
- RPC Reference: https://docs.tenderly.co/node/rpc-reference
- API Reference: https://docs.tenderly.co/reference/api
- Asset/Balance Changes: https://docs.tenderly.co/simulations/asset-balance-changes
- Simulation Modes: https://docs.tenderly.co/simulations/simulation-modes

### Calldata / ABI
- ethers.js v6 Interface: https://docs.ethers.org/v6/api/abi/#Interface
- Etherscan API (get ABI): `https://api.etherscan.io/api?module=contract&action=getabi&address=ADDRESS&apikey=KEY`
- Basescan API: `https://api.basescan.org/api?module=contract&action=getabi&address=ADDRESS&apikey=KEY`
- 4byte.directory: https://www.4byte.directory/

### Web Push
- MDN Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- web-push npm: https://www.npmjs.com/package/web-push
- Push Notifications Overview: https://web.dev/articles/push-notifications-overview
- Server Codelab: https://web.dev/articles/push-notifications-server-codelab
- Client Codelab: https://web.dev/articles/push-notifications-client-codelab
- VAPID Spec: https://tools.ietf.org/html/draft-thomson-webpush-vapid
