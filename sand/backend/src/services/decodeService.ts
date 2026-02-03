import { ethers } from 'ethers';
import { DecodeRequest, DecodedTransaction, DecodedParameter, ProtocolInfo } from '../types';
import { KNOWN_PROTOCOLS, ERC20_SIGNATURES, ETHERSCAN_V2_BASE, ETHERSCAN_SUPPORTED_CHAINS } from '../utils/constants';

// ─── Minimal ABIs for common interfaces ───

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

const UNISWAP_V2_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)',
];

const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
  'function multicall(uint256 deadline, bytes[] data) external payable returns (bytes[] results)',
  'function multicall(bytes[] data) external payable returns (bytes[] results)',
];

const AAVE_V3_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
  'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)',
];

const MORPHO_BLUE_ABI = [
  'function supply((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
  'function withdraw((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)',
  'function borrow((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)',
  'function repay((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
  'function supplyCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, bytes data)',
  'function withdrawCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, address receiver)',
  'function liquidate((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, address borrower, uint256 seizedAssets, uint256 repaidShares, bytes data) returns (uint256, uint256)',
  'function flashLoan(address token, uint256 assets, bytes data)',
  'function setAuthorization(address authorized, bool newIsAuthorized)',
];

// Safe execTransaction ABI
const SAFE_EXEC_ABI = [
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)',
];

// Combined known ABIs for local decoding
const ALL_KNOWN_ABIS = [
  ...ERC20_ABI,
  ...UNISWAP_V2_ROUTER_ABI,
  ...UNISWAP_V3_ROUTER_ABI,
  ...AAVE_V3_ABI,
  ...MORPHO_BLUE_ABI,
  ...SAFE_EXEC_ABI,
];

// Known Safe Proxy Factory addresses (all chains)
const SAFE_PROXY_FACTORIES = new Set([
  '0xa6b71e26c5e0845f74c812102ca7114b6a896ab2', // Safe v1.3.0 factory
  '0xc22834581ebc8527d974f8a1c97e1bea4ef910bc', // Safe v1.3.0 factory (alt)
  '0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67', // Safe v1.4.1 factory
]);

// Known Safe singleton (master copy) addresses
const SAFE_SINGLETONS = new Set([
  '0xd9db270c1b5e3bd161e8c8503c55ceabee709552', // Safe v1.3.0
  '0x3e5c63644e683549055b9be8653de26e0b4cd36e', // Safe v1.3.0 L2
  '0x41675c099f32341bf84bfc5382af534df5c7461a', // Safe v1.4.1
  '0x29fcb43b46531bca003ddc8fcb67ffe91900c762', // Safe v1.4.1 L2
]);

// execTransaction selector
const EXEC_TX_SELECTOR = '0x6a761202';

/**
 * Decode transaction calldata — full fallback chain
 */
export async function decodeTransaction(req: DecodeRequest): Promise<DecodedTransaction> {
  const { calldata, contractAddress, chainId = 1 } = req;

  if (!calldata || calldata === '0x' || calldata.length < 10) {
    return {
      functionName: 'Native Transfer',
      functionSignature: '',
      parameters: [],
      protocol: detectProtocol(contractAddress),
      contractVerified: false,
      functionSource: 'local',
    };
  }

  const selector = calldata.slice(0, 10);

  // Check if target is a Safe proxy
  const isSafe = await checkIfSafeProxy(contractAddress, chainId);

  // Try local decoding first with known ABIs
  const localResult = tryLocalDecode(calldata, contractAddress);
  if (localResult) {
    localResult.functionSource = 'local';
    localResult.isSafeProxy = isSafe;
    if (isSafe && selector === EXEC_TX_SELECTOR) {
      localResult.innerTransaction = extractInnerTransaction(calldata);
    }
    return localResult;
  }

  // Try fetching ABI from Etherscan
  const etherscanResult = await tryEtherscanDecode(calldata, contractAddress, chainId);
  if (etherscanResult) {
    etherscanResult.functionSource = 'etherscan';
    etherscanResult.isSafeProxy = isSafe;
    if (isSafe && selector === EXEC_TX_SELECTOR) {
      etherscanResult.innerTransaction = extractInnerTransaction(calldata);
    }
    return etherscanResult;
  }

  // Try Sourcify
  const sourcifyResult = await trySourcifyDecode(calldata, contractAddress, chainId);
  if (sourcifyResult) {
    sourcifyResult.functionSource = 'sourcify';
    sourcifyResult.isSafeProxy = isSafe;
    if (isSafe && selector === EXEC_TX_SELECTOR) {
      sourcifyResult.innerTransaction = extractInnerTransaction(calldata);
    }
    return sourcifyResult;
  }

  // Try 4byte.directory for function name
  const fourByteName = await lookup4byte(selector);

  // Known ERC20 signature fallback
  const knownSig = ERC20_SIGNATURES[selector];

  const functionName = fourByteName
    ? fourByteName.split('(')[0]
    : knownSig
      ? knownSig.split('(')[0]
      : `Unknown (${selector})`;

  const functionSignature = fourByteName || knownSig || selector;
  const source = fourByteName ? '4byte' as const : 'raw' as const;

  const result: DecodedTransaction = {
    functionName,
    functionSignature,
    parameters: parseRawParams(calldata),
    protocol: detectProtocol(contractAddress),
    contractVerified: false,
    functionSource: source,
    isSafeProxy: isSafe,
  };

  // If it's a Safe and looks like execTransaction, try to extract inner tx
  if (isSafe && selector === EXEC_TX_SELECTOR) {
    result.innerTransaction = extractInnerTransaction(calldata);
    // Update protocol info for Safe
    if (!result.protocol) {
      result.protocol = { name: 'Safe Multisig', category: 'Wallet', website: 'https://safe.global' };
    }
  }

  return result;
}

/**
 * Check if a contract is a Safe proxy by calling masterCopy() or checking known patterns
 */
async function checkIfSafeProxy(address: string, chainId: number): Promise<boolean> {
  const addr = address.toLowerCase();

  // Known Safe-related addresses
  if (SAFE_PROXY_FACTORIES.has(addr) || SAFE_SINGLETONS.has(addr)) return true;

  // Check if it's in our known protocols as Safe
  const protocol = KNOWN_PROTOCOLS[addr];
  if (protocol && (protocol.name.includes('Safe') || protocol.category === 'Wallet')) return true;

  // Try calling masterCopy() or getStorageAt slot 0 (EIP-1967 pattern)
  try {
    const rpcUrl = getRpcUrl(chainId);
    if (!rpcUrl) return false;

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Method 1: Read storage slot 0 — Safe proxies store masterCopy address there
    const slot0 = await provider.getStorage(address, 0);
    if (slot0 && slot0 !== '0x' + '0'.repeat(64)) {
      const masterCopy = '0x' + slot0.slice(26).toLowerCase();
      if (SAFE_SINGLETONS.has(masterCopy)) return true;
    }
  } catch {
    // Ignore — not critical
  }

  return false;
}

/**
 * Extract inner transaction from Safe's execTransaction calldata
 */
function extractInnerTransaction(calldata: string): { to: string; value: string; data: string; operation: number } | undefined {
  try {
    const iface = new ethers.Interface(SAFE_EXEC_ABI);
    const decoded = iface.parseTransaction({ data: calldata });
    if (!decoded) return undefined;

    return {
      to: decoded.args[0] as string,
      value: decoded.args[1].toString(),
      data: decoded.args[2] as string,
      operation: Number(decoded.args[3]),
    };
  } catch {
    return undefined;
  }
}

/**
 * Lookup function signature on 4byte.directory
 */
async function lookup4byte(selector: string): Promise<string | null> {
  try {
    const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}&ordering=created_at`;
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const data = await response.json() as { count: number; results: { text_signature: string }[] };

    if (data.count > 0 && data.results.length > 0) {
      return data.results[0].text_signature;
    }
  } catch {
    // 4byte lookup failed — non-critical
  }
  return null;
}

/**
 * Try fetching ABI from Sourcify and decoding
 */
async function trySourcifyDecode(
  calldata: string,
  contractAddress: string,
  chainId: number
): Promise<DecodedTransaction | null> {
  try {
    // Try full match first, then partial match
    for (const matchType of ['full_match', 'partial_match']) {
      const url = `https://repo.sourcify.dev/contracts/${matchType}/${chainId}/${contractAddress}/metadata.json`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });

      if (!response.ok) continue;

      const metadata = await response.json() as { output?: { abi?: any[] } };
      const abi = metadata?.output?.abi;
      if (!abi || !Array.isArray(abi)) continue;

      const iface = new ethers.Interface(abi);
      const decoded = iface.parseTransaction({ data: calldata });
      if (!decoded) continue;

      const parameters: DecodedParameter[] = decoded.fragment.inputs.map((input, i) => ({
        name: input.name || `param${i}`,
        type: input.type,
        value: formatParamValue(decoded.args[i], input.type),
        label: getParamLabel(decoded.name, input.name, input.type),
      }));

      return {
        functionName: decoded.name,
        functionSignature: decoded.signature,
        parameters,
        protocol: detectProtocol(contractAddress),
        contractVerified: matchType === 'full_match',
      };
    }
  } catch {
    // Sourcify lookup failed — non-critical
  }
  return null;
}

/**
 * Get RPC URL for a chain
 */
function getRpcUrl(chainId: number): string | null {
  // Use env vars if available, otherwise use public RPCs
  const envKey = `RPC_URL_${chainId}`;
  if (process.env[envKey]) return process.env[envKey]!;

  const publicRpcs: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    8453: 'https://mainnet.base.org',
    10: 'https://mainnet.optimism.io',
    42161: 'https://arb1.arbitrum.io/rpc',
    137: 'https://polygon-rpc.com',
  };

  return publicRpcs[chainId] || null;
}

/**
 * Try decoding with our local ABI collection
 */
function tryLocalDecode(calldata: string, contractAddress: string): DecodedTransaction | null {
  try {
    const iface = new ethers.Interface(ALL_KNOWN_ABIS);
    const decoded = iface.parseTransaction({ data: calldata });

    if (!decoded) return null;

    const parameters: DecodedParameter[] = decoded.fragment.inputs.map((input, i) => ({
      name: input.name || `param${i}`,
      type: input.type,
      value: formatParamValue(decoded.args[i], input.type),
      label: getParamLabel(decoded.name, input.name, input.type),
    }));

    return {
      functionName: decoded.name,
      functionSignature: decoded.signature,
      parameters,
      protocol: detectProtocol(contractAddress),
      contractVerified: true,
    };
  } catch {
    return null;
  }
}

/**
 * Try fetching ABI from Etherscan and decoding
 */
async function tryEtherscanDecode(
  calldata: string,
  contractAddress: string,
  chainId: number
): Promise<DecodedTransaction | null> {
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey || !ETHERSCAN_SUPPORTED_CHAINS.includes(chainId)) return null;

  try {
    // Etherscan V2: single endpoint, chainid as query param
    const url = `${ETHERSCAN_V2_BASE}?chainid=${chainId}&module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json() as { status: string; result: string };

    if (data.status !== '1' || !data.result) return null;

    const abi = JSON.parse(data.result);
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseTransaction({ data: calldata });

    if (!decoded) return null;

    const parameters: DecodedParameter[] = decoded.fragment.inputs.map((input, i) => ({
      name: input.name || `param${i}`,
      type: input.type,
      value: formatParamValue(decoded.args[i], input.type),
      label: getParamLabel(decoded.name, input.name, input.type),
    }));

    return {
      functionName: decoded.name,
      functionSignature: decoded.signature,
      parameters,
      protocol: detectProtocol(contractAddress),
      contractVerified: true,
    };
  } catch (error) {
    console.error('Etherscan decode failed:', error);
    return null;
  }
}

/**
 * Detect known protocol from contract address
 */
function detectProtocol(address: string): ProtocolInfo | null {
  return KNOWN_PROTOCOLS[address.toLowerCase()] || null;
}

/**
 * Format parameter value for display
 */
function formatParamValue(value: any, type: string): string {
  if (type === 'uint256' || type === 'uint128' || type === 'int256') {
    return value.toString();
  }
  if (type === 'address') {
    return value.toString();
  }
  if (type === 'bytes' || type.startsWith('bytes')) {
    return value.toString();
  }
  if (type === 'address[]') {
    return JSON.stringify(value.map((v: any) => v.toString()));
  }
  if (type === 'bool') {
    return value ? 'true' : 'false';
  }
  if (type === 'tuple') {
    return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
  }
  return String(value);
}

/**
 * Get human-readable label for a parameter
 */
function getParamLabel(functionName: string, paramName: string, paramType: string): string {
  const labels: Record<string, Record<string, string>> = {
    approve: {
      spender: 'Address authorized to spend',
      amount: 'Maximum authorized amount',
    },
    transfer: {
      to: 'Destination address',
      amount: 'Amount to transfer',
    },
    transferFrom: {
      from: 'Source address',
      to: 'Destination address',
      amount: 'Amount to transfer',
    },
    swapExactTokensForTokens: {
      amountIn: 'Amount of tokens to swap',
      amountOutMin: 'Minimum tokens to receive',
      path: 'Swap route (intermediate tokens)',
      to: 'Address receiving tokens',
      deadline: 'Transaction deadline',
    },
    supply: {
      asset: 'Token to deposit',
      amount: 'Amount to deposit',
      onBehalfOf: 'Deposit beneficiary',
    },
    withdraw: {
      asset: 'Token to withdraw',
      amount: 'Amount to withdraw',
      to: 'Receiving address',
    },
    borrow: {
      asset: 'Token to borrow',
      amount: 'Amount to borrow',
      interestRateMode: 'Interest type (1=stable, 2=variable)',
    },
    supplyCollateral: {
      marketParams: 'Morpho market parameters',
      assets: 'Amount of collateral to deposit',
      onBehalf: 'Deposit beneficiary',
    },
    withdrawCollateral: {
      marketParams: 'Morpho market parameters',
      assets: 'Amount of collateral to withdraw',
      onBehalf: 'Collateral owner',
      receiver: 'Receiving address',
    },
    liquidate: {
      marketParams: 'Morpho market parameters',
      borrower: 'Address of borrower to liquidate',
      seizedAssets: 'Collateral to seize',
    },
    setAuthorization: {
      authorized: 'Authorized address',
      newIsAuthorized: 'New authorization status',
    },
    execTransaction: {
      to: 'Inner transaction target',
      value: 'ETH value sent',
      data: 'Inner transaction calldata',
      operation: 'Operation type (0=call, 1=delegatecall)',
      safeTxGas: 'Gas for the inner transaction',
      baseGas: 'Base gas cost',
      gasPrice: 'Gas price for refund',
      gasToken: 'Token used for gas refund',
      refundReceiver: 'Address receiving gas refund',
      signatures: 'Owner signatures',
    },
  };

  return labels[functionName]?.[paramName] || '';
}

/**
 * Parse raw calldata parameters when we can't decode
 */
function parseRawParams(calldata: string): DecodedParameter[] {
  const data = calldata.slice(10); // remove selector
  const params: DecodedParameter[] = [];

  for (let i = 0; i < data.length; i += 64) {
    const chunk = data.slice(i, i + 64);
    if (!chunk) break;

    const isAddress = chunk.startsWith('000000000000000000000000') && chunk.length === 64;
    const value = isAddress ? '0x' + chunk.slice(24) : '0x' + chunk;

    params.push({
      name: `param${Math.floor(i / 64)}`,
      type: isAddress ? 'address' : 'uint256',
      value,
    });
  }

  return params;
}
