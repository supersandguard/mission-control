import { ExplainRequest, ExplanationResult, DecodedTransaction, SimulationResult } from '../types';
import { MAX_UINT256_DECIMAL } from '../utils/constants';

/**
 * Generate a human-readable Spanish explanation of a transaction.
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
  const spender = decoded.parameters.find(p => p.name === 'spender')?.value || 'dirección desconocida';
  const amount = decoded.parameters.find(p => p.name === 'amount' || p.name === 'value')?.value || '0';
  const protocol = decoded.protocol?.name || 'protocolo desconocido';
  const isUnlimited = amount === MAX_UINT256_DECIMAL || amount.includes('ffffffff');

  const amountDesc = isUnlimited ? 'ILIMITADA' : amount;
  const tokenName = decoded.protocol?.category === 'Token' ? decoded.protocol.name : 'token';

  const warnings: string[] = [];
  if (isUnlimited) {
    warnings.push('⚠️ APROBACIÓN ILIMITADA: Se autoriza gastar una cantidad ilimitada de tokens. Considera aprobar solo la cantidad necesaria.');
  }

  return {
    summary: `Autorizar a ${protocol} para gastar ${isUnlimited ? 'una cantidad ilimitada de' : amountDesc} ${tokenName}`,
    details: [
      `Se autoriza a la dirección ${shortenAddress(spender)} para gastar tokens en tu nombre`,
      `Cantidad autorizada: ${isUnlimited ? '∞ (ilimitada)' : amountDesc}`,
      decoded.protocol ? `Protocolo detectado: ${decoded.protocol.name} (${decoded.protocol.category})` : 'Protocolo no identificado',
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
    ],
    warnings,
    actionType: 'approve',
  };
}

function explainTransfer(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const to = decoded.parameters.find(p => p.name === 'to')?.value || 'dirección desconocida';
  const amount = decoded.parameters.find(p => p.name === 'amount' || p.name === 'value')?.value || '0';

  const balanceChange = sim.balanceChanges[0];
  const tokenSymbol = balanceChange?.token.symbol || 'tokens';
  const usdValue = balanceChange?.deltaUsd || '0';

  return {
    summary: `Transferir ${amount} ${tokenSymbol} a ${shortenAddress(to)}`,
    details: [
      `Destino: ${to}`,
      `Cantidad: ${amount} ${tokenSymbol}`,
      usdValue !== '0' ? `Valor estimado: $${Math.abs(parseFloat(usdValue)).toFixed(2)} USD` : '',
      `Gas estimado: ${sim.gasUsed.toLocaleString()} unidades`,
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
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

  const protocol = decoded.protocol?.name || 'DEX desconocido';

  return {
    summary: `Intercambiar ${fromAmount} ${fromToken} por ~${toAmount} ${toToken} en ${protocol}`,
    details: [
      `Envías: ${fromAmount} ${fromToken}${outgoing?.deltaUsd ? ` (~$${Math.abs(parseFloat(outgoing.deltaUsd)).toFixed(2)} USD)` : ''}`,
      `Recibes: ~${toAmount} ${toToken}${incoming?.deltaUsd ? ` (~$${parseFloat(incoming.deltaUsd).toFixed(2)} USD)` : ''}`,
      `Protocolo: ${protocol}`,
      `Gas estimado: ${sim.gasUsed.toLocaleString()} unidades`,
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
    ],
    warnings: [],
    actionType: 'swap',
  };
}

function explainSupply(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'protocolo de préstamos';

  return {
    summary: `Depositar ${amount} tokens en ${protocol}`,
    details: [
      `Token: ${shortenAddress(asset)}`,
      `Cantidad: ${amount}`,
      `Protocolo: ${protocol}`,
      'Los tokens depositados generarán rendimiento',
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
    ],
    warnings: [],
    actionType: 'supply',
  };
}

function explainWithdraw(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'protocolo de préstamos';

  return {
    summary: `Retirar ${amount} tokens de ${protocol}`,
    details: [
      `Token: ${shortenAddress(asset)}`,
      `Cantidad: ${amount}`,
      `Protocolo: ${protocol}`,
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
    ],
    warnings: [],
    actionType: 'withdraw',
  };
}

function explainBorrow(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const asset = decoded.parameters.find(p => p.name === 'asset')?.value || '';
  const amount = decoded.parameters.find(p => p.name === 'amount')?.value || '0';
  const protocol = decoded.protocol?.name || 'protocolo de préstamos';
  const rateMode = decoded.parameters.find(p => p.name === 'interestRateMode')?.value;
  const rateType = rateMode === '1' ? 'tasa estable' : rateMode === '2' ? 'tasa variable' : 'tasa desconocida';

  return {
    summary: `Pedir prestado ${amount} tokens en ${protocol} (${rateType})`,
    details: [
      `Token: ${shortenAddress(asset)}`,
      `Cantidad: ${amount}`,
      `Tipo de interés: ${rateType}`,
      `Protocolo: ${protocol}`,
      '⚠️ Esto crea una deuda que debe ser pagada con intereses',
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
    ],
    warnings: ['Se creará una posición de deuda. Asegúrate de tener suficiente colateral.'],
    actionType: 'borrow',
  };
}

function explainNativeTransfer(decoded: DecodedTransaction, sim: SimulationResult): ExplanationResult {
  const outgoing = sim.balanceChanges.find(c => c.delta.startsWith('-'));
  const incoming = sim.balanceChanges.find(c => c.delta.startsWith('+'));
  const amount = outgoing ? Math.abs(parseFloat(outgoing.delta)).toString() : '0';
  const to = incoming?.address || 'dirección desconocida';

  return {
    summary: `Enviar ${amount} ETH a ${shortenAddress(to)}`,
    details: [
      `Destino: ${to}`,
      `Cantidad: ${amount} ETH`,
      outgoing?.deltaUsd ? `Valor: ~$${Math.abs(parseFloat(outgoing.deltaUsd)).toFixed(2)} USD` : '',
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
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
    summary: `Ejecutar función "${decoded.functionName}"${protocol ? ` en ${protocol}` : ''}`,
    details: [
      `Función: ${decoded.functionSignature || decoded.functionName}`,
      protocol ? `Protocolo: ${protocol}` : 'Protocolo no identificado',
      decoded.parameters.length > 0 ? `Parámetros:\n${params}` : 'Sin parámetros',
      `Gas estimado: ${sim.gasUsed.toLocaleString()} unidades`,
      sim.balanceChanges.length > 0
        ? `Cambios de balance: ${sim.balanceChanges.map(c => `${c.delta} ${c.token.symbol}`).join(', ')}`
        : 'Sin cambios de balance detectados',
      sim.success ? '✅ La simulación fue exitosa' : '❌ La simulación falló',
    ],
    warnings: decoded.contractVerified ? [] : ['⚠️ Este contrato no está verificado en Etherscan'],
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
