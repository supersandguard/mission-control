import { ExplainRequest, ExplanationResult, DecodedTransaction, SimulationResult } from '../types';
import { MAX_UINT256_DECIMAL } from '../utils/constants';

// Etherscan base URLs by chain
const ETHERSCAN_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  10: 'https://optimistic.etherscan.io',
  42161: 'https://arbiscan.io',
  137: 'https://polygonscan.com',
};

/**
 * Generate a human-readable English explanation of a transaction.
 */
export function explainTransaction(req: ExplainRequest): ExplanationResult {
  const { decoded, simulation, chainId = 1 } = req;
  const actionType = detectActionType(decoded);

  switch (actionType) {
    case 'approve':
      return explainApprove(decoded, simulation, chainId);
    case 'transfer':
      return explainTransfer(decoded, simulation, chainId);
    case 'swap':
      return explainSwap(decoded, simulation, chainId);
    case 'supply':
    case 'deposit':
      return explainSupply(decoded, simulation, chainId);
    case 'withdraw':
      return explainWithdraw(decoded, simulation, chainId);
    case 'borrow':
      return explainBorrow(decoded, simulation, chainId);
    case 'native_transfer':
      return explainNativeTransfer(decoded, simulation, chainId);
    case 'safe_exec':
      return explainSafeExec(decoded, simulation, chainId);
    default:
      return explainGeneric(decoded, simulation, chainId);
  }
}

function detectActionType(decoded: DecodedTransaction): string {
  const name = decoded.functionName.toLowerCase();

  if (name.includes('approve')) return 'approve';
  if (name === 'transfer' || name === 'transferfrom') return 'transfer';
  if (name.includes('swap') || name.includes('exactinput') || name.includes('exactoutput')) return 'swap';
  if (name.includes('supply') || name.includes('deposit')) return 'supply';
  if (name.includes('withdraw') || name.includes('redeem')) return 'withdraw';
  if (name.includes('borrow')) return 'borrow';
  if (name.includes('repay')) return 'repay';
  if (name === 'native transfer' || name === '') return 'native_transfer';
  if (name.includes('multicall')) return 'multicall';
  if (name === 'exectransaction' && decoded.isSafeProxy) return 'safe_exec';

  return 'unknown';
}

function getExplorerUrl(chainId: number): string {
  return ETHERSCAN_URLS[chainId] || ETHERSCAN_URLS[1];
}

function formatAddress(addr: string, chainId: number): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAddressWithLink(addr: string, chainId: number): string {
  if (!addr || addr.length < 10) return addr;
  const explorer = getExplorerUrl(chainId);
  return `${addr.slice(0, 6)}...${addr.slice(-4)} (${explorer}/address/${addr})`;
}

function isZeroAddress(addr: string): boolean {
  return addr === '0x0000000000000000000000000000000000000000' || addr === '0x' + '0'.repeat(40);
}

function formatParamReadable(name: string, type: string, value: string, chainId: number): string {
  if (type === 'address') {
    if (isZeroAddress(value)) return `${name}: zero address (0x000...000)`;
    return `${name}: ${formatAddressWithLink(value, chainId)}`;
  }
  if (type === 'uint256' || type === 'uint128' || type === 'int256') {
    // Try to display as a readable number
    try {
      const bn = BigInt(value);
      if (bn === 0n) return `${name}: 0`;
      // If it's a huge number (likely wei), show both
      if (bn > 10n ** 15n) {
        const ethValue = Number(bn) / 1e18;
        return `${name}: ${ethValue.toFixed(6)} (raw: ${value})`;
      }
      return `${name}: ${bn.toLocaleString()}`;
    } catch {
      return `${name}: ${value}`;
    }
  }
  if (type === 'bool') {
    return `${name}: ${value === 'true' ? 'Yes' : 'No'}`;
  }
  return `${name}: ${value.length > 42 ? value.slice(0, 20) + '...' + value.slice(-8) : value}`;
}

// ─── Explainer for Safe execTransaction ───

function explainSafeExec(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const inner = decoded.innerTransaction;
  const warnings: string[] = [];
  const details: string[] = [];

  details.push('This is a Safe multisig wallet executing an internal transaction.');

  if (inner) {
    const explorer = getExplorerUrl(chainId);
    details.push(`Inner target: ${formatAddressWithLink(inner.to, chainId)}`);

    if (inner.value !== '0') {
      const ethValue = Number(BigInt(inner.value)) / 1e18;
      details.push(`ETH value: ${ethValue.toFixed(6)} ETH`);
    }

    if (inner.data && inner.data !== '0x' && inner.data.length > 2) {
      const innerSelector = inner.data.slice(0, 10);
      details.push(`Inner function selector: ${innerSelector}`);
    } else {
      details.push('Inner call: native ETH transfer (no calldata)');
    }

    details.push(`Operation: ${inner.operation === 0 ? 'Call' : 'DelegateCall'}`);
    if (inner.operation === 1) {
      warnings.push('⚠️ DELEGATECALL: This executes code in the context of the Safe. Be extremely careful.');
    }
  }

  // Simulation info
  if (sim.balanceChanges.length > 0) {
    const changes = sim.balanceChanges.map(c => `${c.delta} ${c.token.symbol}`).join(', ');
    details.push(`Balance changes: ${changes}`);
  } else {
    details.push('No balance changes detected');
  }

  details.push(sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed');

  return {
    summary: `Safe multisig executing transaction to ${inner ? formatAddress(inner.to, chainId) : 'unknown target'}`,
    details,
    warnings,
    actionType: 'safe_exec',
  };
}

// ─── Generic / Unknown transaction explainer ───

function explainGeneric(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const protocol = decoded.protocol?.name;
  const isUnknown = decoded.functionName.startsWith('Unknown') || decoded.functionSource === 'raw';
  const isUnverified = !decoded.contractVerified;
  const is4byte = decoded.functionSource === '4byte';
  const warnings: string[] = [];
  const details: string[] = [];

  // Build informative explanation based on what we know
  if (isUnknown && isUnverified) {
    // Worst case: unknown function on unverified contract
    details.push(`Function: ${decoded.functionSignature || decoded.functionName}`);
    details.push('⛔ Contract is NOT verified — source code unavailable');
    details.push('⛔ Function could not be identified');
    details.push('We cannot determine what this transaction does. Review the raw data manually before signing.');

    warnings.push('HIGH RISK: Unverified contract with unknown function. Cannot confirm what this transaction does.');
  } else if (is4byte && isUnverified) {
    // Function name from 4byte but contract not verified
    details.push(`Function: ${decoded.functionSignature}`);
    details.push('ℹ️ Function name found in signature database (unverified — could be a different function with the same selector)');
    details.push('⛔ Contract is NOT verified — source code unavailable');

    warnings.push('Function name is from a public database, not from verified source code. The actual behavior may differ.');
  } else if (isUnknown && !isUnverified) {
    // Verified contract but unknown function (unusual)
    details.push(`Function: ${decoded.functionSignature || decoded.functionName}`);
    details.push('Contract is verified but function signature not recognized');
  } else {
    // Known function
    details.push(`Function: ${decoded.functionSignature || decoded.functionName}`);
  }

  // Protocol info
  if (protocol) {
    details.push(`Protocol: ${protocol}`);
  } else if (!isUnknown) {
    details.push('Protocol not identified');
  }

  // Safe proxy detection
  if (decoded.isSafeProxy) {
    details.push('Target is a Safe multisig wallet');
    if (decoded.innerTransaction) {
      details.push(`Inner target: ${formatAddressWithLink(decoded.innerTransaction.to, chainId)}`);
    }
  }

  // Parameters — format readably
  if (decoded.parameters.length > 0 && !isUnknown) {
    const formattedParams = decoded.parameters.map(p =>
      `  • ${formatParamReadable(p.label || p.name, p.type, p.value, chainId)}`
    ).join('\n');
    details.push(`Parameters:\n${formattedParams}`);
  } else if (decoded.parameters.length > 0 && isUnknown) {
    // For unknown functions, show params more cautiously
    const paramSummary = decoded.parameters.map(p => {
      if (p.type === 'address') {
        if (isZeroAddress(p.value)) return `  • ${p.name}: zero address`;
        return `  • ${p.name}: address ${formatAddress(p.value, chainId)}`;
      }
      return `  • ${p.name}: ${p.value.length > 20 ? p.value.slice(0, 12) + '...' : p.value}`;
    }).join('\n');
    details.push(`Raw parameters:\n${paramSummary}`);
  }

  // Gas
  details.push(`Estimated gas: ${sim.gasUsed.toLocaleString()} units`);

  // Balance changes
  if (sim.balanceChanges.length > 0) {
    const nonZeroChanges = sim.balanceChanges.filter(c => {
      const delta = parseFloat(c.delta);
      return !isNaN(delta) && Math.abs(delta) > 0.000001;
    });

    if (nonZeroChanges.length > 0) {
      details.push(`Balance changes: ${nonZeroChanges.map(c => `${c.delta} ${c.token.symbol}`).join(', ')}`);
    } else {
      details.push('No significant balance changes detected');
    }
  } else {
    details.push('No balance changes detected');
  }

  // Simulation status
  details.push(sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed');

  // Unverified contract warning
  if (isUnverified && !warnings.length) {
    warnings.push('This contract is not verified on the block explorer. Cannot inspect source code.');
  }

  const summaryPrefix = isUnknown && isUnverified
    ? '⚠️ UNVERIFIED: '
    : isUnknown
      ? '⚠️ '
      : '';

  return {
    summary: `${summaryPrefix}Execute "${decoded.functionName}"${protocol ? ` on ${protocol}` : ''}`,
    details,
    warnings,
    actionType: 'unknown',
  };
}

// ─── Existing explainers (improved with chainId) ───

function explainApprove(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const spender = decoded.parameters.find(p => p.name === 'spender')?.value || 'unknown address';
  const amount = decoded.parameters.find(p => p.name === 'amount' || p.name === 'value')?.value || '0';
  const protocol = decoded.protocol?.name || 'unknown protocol';
  const isUnlimited = amount === MAX_UINT256_DECIMAL || amount.includes('ffffffff');

  const amountDesc = isUnlimited ? 'UNLIMITED' : amount;
  const tokenName = decoded.protocol?.category === 'Token' ? decoded.protocol.name : 'token';

  const warnings: string[] = [];
  if (isUnlimited) {
    warnings.push('⚠️ UNLIMITED APPROVAL: Authorizes spending an unlimited amount of tokens. Consider approving only the needed amount.');
  }

  return {
    summary: `Authorize ${protocol} to spend ${isUnlimited ? 'an unlimited amount of' : amountDesc} ${tokenName}`,
    details: [
      `Authorizes address ${formatAddressWithLink(spender, chainId)} to spend tokens on your behalf`,
      `Authorized amount: ${isUnlimited ? '∞ (unlimited)' : amountDesc}`,
      decoded.protocol ? `Detected protocol: ${decoded.protocol.name} (${decoded.protocol.category})` : 'Protocol not identified',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings,
    actionType: 'approve',
  };
}

function explainTransfer(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const to = decoded.parameters.find(p => p.name === 'to')?.value || 'unknown address';
  const amount = decoded.parameters.find(p => p.name === 'amount' || p.name === 'value')?.value || '0';

  const balanceChange = sim.balanceChanges[0];
  const tokenSymbol = balanceChange?.token.symbol || 'tokens';
  const usdValue = balanceChange?.deltaUsd || '0';

  return {
    summary: `Transfer ${amount} ${tokenSymbol} to ${formatAddress(to, chainId)}`,
    details: [
      `Destination: ${formatAddressWithLink(to, chainId)}`,
      `Amount: ${amount} ${tokenSymbol}`,
      usdValue !== '0' ? `Estimated value: $${Math.abs(parseFloat(usdValue)).toFixed(2)} USD` : '',
      `Estimated gas: ${sim.gasUsed.toLocaleString()} units`,
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ].filter(Boolean),
    warnings: [],
    actionType: 'transfer',
  };
}

function explainSwap(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const outgoing = sim.balanceChanges.find(c => c.delta.startsWith('-'));
  const incoming = sim.balanceChanges.find(c => c.delta.startsWith('+'));

  const fromToken = outgoing?.token.symbol || 'TOKEN_A';
  const toToken = incoming?.token.symbol || 'TOKEN_B';
  const fromAmount = outgoing ? Math.abs(parseFloat(outgoing.delta)).toString() : '?';
  const toAmount = incoming ? incoming.delta.replace('+', '') : '?';

  const protocol = decoded.protocol?.name || 'unknown DEX';

  return {
    summary: `Swap ${fromAmount} ${fromToken} for ~${toAmount} ${toToken} on ${protocol}`,
    details: [
      `You send: ${fromAmount} ${fromToken}${outgoing?.deltaUsd ? ` (~$${Math.abs(parseFloat(outgoing.deltaUsd)).toFixed(2)} USD)` : ''}`,
      `You receive: ~${toAmount} ${toToken}${incoming?.deltaUsd ? ` (~$${parseFloat(incoming.deltaUsd).toFixed(2)} USD)` : ''}`,
      `Protocol: ${protocol}`,
      `Estimated gas: ${sim.gasUsed.toLocaleString()} units`,
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: [],
    actionType: 'swap',
  };
}

function explainSupply(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'lending protocol';

  return {
    summary: `Deposit ${amount} tokens into ${protocol}`,
    details: [
      `Token: ${formatAddressWithLink(asset, chainId)}`,
      `Amount: ${amount}`,
      `Protocol: ${protocol}`,
      'Deposited tokens will earn yield',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: [],
    actionType: 'supply',
  };
}

function explainWithdraw(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'lending protocol';

  return {
    summary: `Withdraw ${amount} tokens from ${protocol}`,
    details: [
      `Token: ${formatAddressWithLink(asset, chainId)}`,
      `Amount: ${amount}`,
      `Protocol: ${protocol}`,
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: [],
    actionType: 'withdraw',
  };
}

function explainBorrow(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'lending protocol';
  const rateMode = decoded.parameters.find(p => p.name === 'interestRateMode')?.value;
  const rateType = rateMode === '1' ? 'stable rate' : rateMode === '2' ? 'variable rate' : 'unknown rate';

  return {
    summary: `Borrow ${amount} tokens on ${protocol} (${rateType})`,
    details: [
      `Token: ${formatAddressWithLink(asset, chainId)}`,
      `Amount: ${amount}`,
      `Interest type: ${rateType}`,
      `Protocol: ${protocol}`,
      '⚠️ This creates a debt that must be repaid with interest',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: ['A debt position will be created. Make sure you have sufficient collateral.'],
    actionType: 'borrow',
  };
}

function explainNativeTransfer(decoded: DecodedTransaction, sim: SimulationResult, chainId: number): ExplanationResult {
  const outgoing = sim.balanceChanges.find(c => c.delta.startsWith('-'));
  const incoming = sim.balanceChanges.find(c => c.delta.startsWith('+'));
  const amount = outgoing ? Math.abs(parseFloat(outgoing.delta)).toString() : '0';
  const to = incoming?.address || 'unknown address';

  return {
    summary: `Send ${amount} ETH to ${formatAddress(to, chainId)}`,
    details: [
      `Destination: ${formatAddressWithLink(to, chainId)}`,
      `Amount: ${amount} ETH`,
      outgoing?.deltaUsd ? `Value: ~$${Math.abs(parseFloat(outgoing.deltaUsd)).toFixed(2)} USD` : '',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ].filter(Boolean),
    warnings: [],
    actionType: 'native_transfer',
  };
}
