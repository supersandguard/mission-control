import { ProtocolInfo } from '../types';

// ─── Safe Transaction Service URLs ───

export const SAFE_TX_SERVICE_URLS: Record<number, string> = {
  1: 'https://api.safe.global/tx-service/eth',
  8453: 'https://api.safe.global/tx-service/base',
  10: 'https://api.safe.global/tx-service/oeth',
  42161: 'https://api.safe.global/tx-service/arb',
  137: 'https://api.safe.global/tx-service/matic',
};

// ─── Etherscan API URLs ───

// Etherscan V2 API - single endpoint for all chains
export const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api';

// Chain IDs supported by Etherscan V2
export const ETHERSCAN_SUPPORTED_CHAINS = [1, 8453, 10, 42161, 137];

// Legacy: kept for reference, no longer used
export const ETHERSCAN_API_URLS: Record<number, string> = {
  1: 'https://api.etherscan.io/v2/api',
  8453: 'https://api.etherscan.io/v2/api',
  10: 'https://api.etherscan.io/v2/api',
  42161: 'https://api.etherscan.io/v2/api',
  137: 'https://api.etherscan.io/v2/api',
};

// ─── Chain Names ───

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  8453: 'Base',
  10: 'Optimism',
  42161: 'Arbitrum One',
  137: 'Polygon',
};

// ─── Known Protocols (by contract address, lowercase) ───

export const KNOWN_PROTOCOLS: Record<string, ProtocolInfo> = {
  // Uniswap
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': {
    name: 'Uniswap V2 Router',
    category: 'DEX',
    website: 'https://uniswap.org',
  },
  '0xe592427a0aece92de3edee1f18e0157c05861564': {
    name: 'Uniswap V3 Router',
    category: 'DEX',
    website: 'https://uniswap.org',
  },
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': {
    name: 'Uniswap Universal Router',
    category: 'DEX',
    website: 'https://uniswap.org',
  },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': {
    name: 'Uniswap V3 Router 2',
    category: 'DEX',
    website: 'https://uniswap.org',
  },

  // Aave
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': {
    name: 'Aave V3 Pool (Mainnet)',
    category: 'Lending',
    website: 'https://aave.com',
  },
  '0xa238dd80c259a72e81d7e4664a9801593f98d1c5': {
    name: 'Aave V3 Pool (Base)',
    category: 'Lending',
    website: 'https://aave.com',
  },

  // Lido
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': {
    name: 'Lido stETH',
    category: 'Staking',
    website: 'https://lido.fi',
  },

  // 1inch
  '0x1111111254eeb25477b68fb85ed929f73a960582': {
    name: '1inch Router V5',
    category: 'DEX Aggregator',
    website: 'https://1inch.io',
  },

  // Curve
  '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7': {
    name: 'Curve 3pool',
    category: 'DEX',
    website: 'https://curve.fi',
  },

  // OpenSea Seaport
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': {
    name: 'Seaport 1.5',
    category: 'NFT Marketplace',
    website: 'https://opensea.io',
  },

  // WETH
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    name: 'WETH',
    category: 'Token',
    website: 'https://weth.io',
  },

  // USDC
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    name: 'USDC',
    category: 'Token',
    website: 'https://circle.com',
  },

  // USDT
  '0xdac17f958d2ee523a2206206994597c13d831ec7': {
    name: 'USDT',
    category: 'Token',
    website: 'https://tether.to',
  },

  // DAI
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    name: 'DAI',
    category: 'Token',
    website: 'https://makerdao.com',
  },

  // Morpho Blue
  '0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb': {
    name: 'Morpho Blue',
    category: 'Lending',
    website: 'https://morpho.org',
  },
  '0x38989bba00bdf8181f4082995b3deae96163ac5d': {
    name: 'Morpho Blue (Base)',
    category: 'Lending',
    website: 'https://morpho.org',
  },

  // Compound V3
  '0xc3d688b66703497daa19211eedff47f25384cdc3': {
    name: 'Compound V3 (USDC)',
    category: 'Lending',
    website: 'https://compound.finance',
  },

  // Base tokens
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    name: 'USDC (Base)',
    category: 'Token',
    website: 'https://circle.com',
  },
  '0x4200000000000000000000000000000000000006': {
    name: 'WETH (Base)',
    category: 'Token',
    website: 'https://base.org',
  },
  '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': {
    name: 'cbETH (Base)',
    category: 'Token',
    website: 'https://coinbase.com',
  },
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': {
    name: 'USDbC (Base)',
    category: 'Token',
    website: 'https://base.org',
  },
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': {
    name: 'DAI (Base)',
    category: 'Token',
    website: 'https://makerdao.com',
  },

  // Safe MultiSend
  '0x38869bf66a61cf6bdb996a6ae40d5853fd43b526': {
    name: 'Safe MultiSend',
    category: 'Infrastructure',
    website: 'https://safe.global',
  },
  '0xa238cb80c259a72e81d7e4664a9801593f98d1c5': {
    name: 'Aave V3 Pool (Base)',
    category: 'Lending',
    website: 'https://aave.com',
  },
};

// ─── ERC20 Function Signatures ───

export const ERC20_SIGNATURES: Record<string, string> = {
  '0x095ea7b3': 'approve(address,uint256)',
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x70a08231': 'balanceOf(address)',
  '0xdd62ed3e': 'allowance(address,address)',
  '0x18160ddd': 'totalSupply()',
  '0x313ce567': 'decimals()',
  '0x06fdde03': 'name()',
  '0x95d89b41': 'symbol()',
};

// ─── Max uint256 (unlimited approval) ───

export const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const MAX_UINT256_DECIMAL = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
