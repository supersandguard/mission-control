import { ExplainRequest, ExplanationResult, DecodedTransaction, SimulationResult } from '../types';
import { MAX_UINT256_DECIMAL } from '../utils/constants';

/**
 * Generate a human-readable English explanation of a transaction.
 * Uses template strings for now; LLM integration later.
 */
export function explainTransaction(req: ExplainRequest): ExplanationResult {
  const { decoded, simulation, chainId = 1 } = req;
  const actionType = detectActionType(decoded);

  switch (actionType) {
    case 'approve':
      return explainApprove(decoded, simulation);
    case 'transfer':
      return explainTransfer(decoded, simulation);
    case 'swap':
      return explainSwap(decoded, simulation);
    case 'supply':
    case 'deposit':
      return explainSupply(decoded, simulation);
    case 'withdraw':
      return explainWithdraw(decoded, simulation);
    case 'borrow':
      return explainBorrow(decoded, simulation);
    case 'native_transfer':
      return explainNativeTransfer(decoded, simulation);
    default:
      return explainGeneric(decoded, simulation);
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

  return 'unknown';
}

function explainApprove(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
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
      `Authorizes address ${shortenAddress(spender)} to spend tokens on your behalf`,
      `Authorized amount: ${isUnlimited ? '∞ (unlimited)' : amountDesc}`,
      decoded.protocol ? `Detected protocol: ${decoded.protocol.name} (${decoded.protocol.category})` : 'Protocol not identified',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings,
    actionType: 'approve',
  };
}

function explainTransfer(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const to = decoded.parameters.find(p => p.name === 'to')?.value || 'unknown address';
  const amount = decoded.parameters.find(p => p.name === 'amount' || p.name === 'value')?.value || '0';

  const balanceChange = sim.balanceChanges[0];
  const tokenSymbol = balanceChange?.token.symbol || 'tokens';
  const usdValue = balanceChange?.deltaUsd || '0';

  return {
    summary: `Transfer ${amount} ${tokenSymbol} to ${shortenAddress(to)}`,
    details: [
      `Destination: ${to}`,
      `Amount: ${amount} ${tokenSymbol}`,
      usdValue !== '0' ? `Estimated value: $${Math.abs(parseFloat(usdValue)).toFixed(2)} USD` : '',
      `Estimated gas: ${sim.gasUsed.toLocaleString()} units`,
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ].filter(Boolean),
    warnings: [],
    actionType: 'transfer',
  };
}

function explainSwap(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
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

function explainSupply(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'lending protocol';

  return {
    summary: `Deposit ${amount} tokens into ${protocol}`,
    details: [
      `Token: ${shortenAddress(asset)}`,
      `Amount: ${amount}`,
      `Protocol: ${protocol}`,
      'Deposited tokens will earn yield',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: [],
    actionType: 'supply',
  };
}

function explainWithdraw(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'lending protocol';

  return {
    summary: `Withdraw ${amount} tokens from ${protocol}`,
    details: [
      `Token: ${shortenAddress(asset)}`,
      `Amount: ${amount}`,
      `Protocol: ${protocol}`,
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: [],
    actionType: 'withdraw',
  };
}

function explainBorrow(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'lending protocol';
  const rateMode = decoded.parameters.find(p => p.name === 'interestRateMode')?.value;
  const rateType = rateMode === '1' ? 'stable rate' : rateMode === '2' ? 'variable rate' : 'unknown rate';

  return {
    summary: `Borrow ${amount} tokens on ${protocol} (${rateType})`,
    details: [
      `Token: ${shortenAddress(asset)}`,
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

function explainNativeTransfer(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const outgoing = sim.balanceChanges.find(c => c.delta.startsWith('-'));
  const incoming = sim.balanceChanges.find(c => c.delta.startsWith('+'));
  const amount = outgoing ? Math.abs(parseFloat(outgoing.delta)).toString() : '0';
  const to = incoming?.address || 'unknown address';

  return {
    summary: `Send ${amount} ETH to ${shortenAddress(to)}`,
    details: [
      `Destination: ${to}`,
      `Amount: ${amount} ETH`,
      outgoing?.deltaUsd ? `Value: ~$${Math.abs(parseFloat(outgoing.deltaUsd)).toFixed(2)} USD` : '',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ].filter(Boolean),
    warnings: [],
    actionType: 'native_transfer',
  };
}

function explainGeneric(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const protocol = decoded.protocol?.name;
  const params = decoded.parameters.map(p =>
    `  • ${p.label || p.name} (${p.type}): ${shortenValue(p.value)}`
  ).join('\n');

  return {
    summary: `Execute function "${decoded.functionName}"${protocol ? ` on ${protocol}` : ''}`,
    details: [
      `Function: ${decoded.functionSignature || decoded.functionName}`,
      protocol ? `Protocol: ${protocol}` : 'Protocol not identified',
      decoded.parameters.length > 0 ? `Parameters:\n${params}` : 'No parameters',
      `Estimated gas: ${sim.gasUsed.toLocaleString()} units`,
      sim.balanceChanges.length > 0
        ? `Balance changes: ${sim.balanceChanges.map(c => `${c.delta} ${c.token.symbol}`).join(', ')}`
        : 'No balance changes detected',
      sim.success ? '✅ Simulation succeeded' : '❌ Simulation failed',
    ],
    warnings: decoded.contractVerified ? [] : ['⚠️ This contract is not verified on Etherscan'],
    actionType: 'unknown',
  };
}

// ─── Helpers ───

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function shortenValue(value: string): string {
  if (value.length <= 20) return value;
  if (value.startsWith('0x')) {
    return `${value.slice(0, 10)}...${value.slice(-8)}`;
  }
  return `${value.slice(0, 16)}...`;
}
