import { ethers } from 'ethers';
import { DecodeRequest, DecodedTransaction, DecodedParameter, ProtocolInfo } from '../types';
import { KNOWN_PROTOCOLS, ERC20_SIGNATURES, ETHERSCAN_API_URLS } from '../utils/constants';

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

// Combined known ABIs for local decoding
const ALL_KNOWN_ABIS = [
  ...ERC20_ABI,
  ...UNISWAP_V2_ROUTER_ABI,
  ...UNISWAP_V3_ROUTER_ABI,
  ...AAVE_V3_ABI,
  ...MORPHO_BLUE_ABI,
];

/**
 * Decode transaction calldata
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
    };
  }

  // Try local decoding first with known ABIs
  const localResult = tryLocalDecode(calldata, contractAddress);
  if (localResult) {
    return localResult;
  }

  // Try fetching ABI from Etherscan
  const etherscanResult = await tryEtherscanDecode(calldata, contractAddress, chainId);
  if (etherscanResult) {
    return etherscanResult;
  }

  // Fallback: return raw selector info
  const selector = calldata.slice(0, 10);
  const knownSig = ERC20_SIGNATURES[selector];

  return {
    functionName: knownSig ? knownSig.split('(')[0] : `Unknown (${selector})`,
    functionSignature: knownSig || selector,
    parameters: parseRawParams(calldata),
    protocol: detectProtocol(contractAddress),
    contractVerified: false,
  };
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
  const apiUrl = ETHERSCAN_API_URLS[chainId];

  if (!apiKey || !apiUrl) return null;

  try {
    const url = `${apiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;
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
      spender: 'Dirección autorizada para gastar',
      amount: 'Cantidad máxima autorizada',
    },
    transfer: {
      to: 'Dirección destino',
      amount: 'Cantidad a transferir',
    },
    transferFrom: {
      from: 'Dirección origen',
      to: 'Dirección destino',
      amount: 'Cantidad a transferir',
    },
    swapExactTokensForTokens: {
      amountIn: 'Cantidad de tokens a intercambiar',
      amountOutMin: 'Mínimo de tokens a recibir',
      path: 'Ruta de intercambio (tokens intermedios)',
      to: 'Dirección que recibe los tokens',
      deadline: 'Fecha límite de la transacción',
    },
    supply: {
      asset: 'Token a depositar',
      amount: 'Cantidad a depositar',
      onBehalfOf: 'Beneficiario del depósito',
    },
    withdraw: {
      asset: 'Token a retirar',
      amount: 'Cantidad a retirar',
      to: 'Dirección que recibe',
    },
    borrow: {
      asset: 'Token a pedir prestado',
      amount: 'Cantidad a pedir',
      interestRateMode: 'Tipo de interés (1=estable, 2=variable)',
    },
    supplyCollateral: {
      marketParams: 'Parámetros del mercado Morpho',
      assets: 'Cantidad de colateral a depositar',
      onBehalf: 'Beneficiario del depósito',
    },
    withdrawCollateral: {
      marketParams: 'Parámetros del mercado Morpho',
      assets: 'Cantidad de colateral a retirar',
      onBehalf: 'Propietario del colateral',
      receiver: 'Dirección que recibe',
    },
    liquidate: {
      marketParams: 'Parámetros del mercado Morpho',
      borrower: 'Dirección del deudor a liquidar',
      seizedAssets: 'Colateral a confiscar',
    },
    setAuthorization: {
      authorized: 'Dirección autorizada',
      newIsAuthorized: 'Nuevo estado de autorización',
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
