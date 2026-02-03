import { RiskRequest, RiskResult, RiskReason, RiskLevel, DecodedTransaction } from '../types';
import { KNOWN_PROTOCOLS, MAX_UINT256_DECIMAL } from '../utils/constants';

// Threshold for "large transfer" in USD
const LARGE_TRANSFER_THRESHOLD = 10_000;

// Threshold for "new contract" in days
const NEW_CONTRACT_THRESHOLD = 7;

/**
 * Assess risk level for a transaction
 */
export function assessRisk(req: RiskRequest): RiskResult {
  const reasons: RiskReason[] = [];

  const contractAddr = req.to.toLowerCase();
  const isKnown = contractAddr in KNOWN_PROTOCOLS;
  const protocol = KNOWN_PROTOCOLS[contractAddr];

  // ─── Analyze calldata ───
  const selector = req.data?.slice(0, 10) || '0x';
  const isApproval = selector === '0x095ea7b3';
  const isUnlimitedApproval = checkUnlimitedApproval(req.data, req.decoded);

  // Determine if function is unknown
  const isUnknownFunction = req.decoded
    ? req.decoded.functionName.startsWith('Unknown') || req.decoded.functionSource === 'raw'
    : false;

  const isUnverified = req.contractVerified === false || (req.decoded?.contractVerified === false);

  // ─── RED flags ───

  // 1. Unlimited approval
  if (isUnlimitedApproval) {
    reasons.push({
      level: 'red',
      code: 'UNLIMITED_APPROVAL',
      message: 'Unlimited token approval detected. The spender can drain all tokens of this type.',
      messageEs: 'Unlimited token approval detected. The spender can drain all tokens of this type.',
    });
  }

  // 2. Unverified contract + unknown function = RED (most dangerous combo)
  if (isUnverified && !isKnown && isUnknownFunction) {
    reasons.push({
      level: 'red',
      code: 'UNVERIFIED_UNKNOWN',
      message: 'Unverified contract calling an unknown function. Cannot determine what this transaction does. HIGH RISK.',
      messageEs: 'Unverified contract calling an unknown function. Cannot determine what this transaction does. HIGH RISK.',
    });
  }
  // 3. Unverified contract (but function is known via 4byte or similar)
  else if (isUnverified && !isKnown) {
    reasons.push({
      level: 'red',
      code: 'UNVERIFIED_CONTRACT',
      message: 'Contract is not verified on block explorer. Cannot inspect source code.',
      messageEs: 'Contract is not verified on block explorer. Cannot inspect source code.',
    });
  }

  // 4. Unknown function on verified contract
  if (isUnknownFunction && !isUnverified) {
    reasons.push({
      level: 'yellow',
      code: 'UNKNOWN_FUNCTION',
      message: 'Function could not be identified. The calldata does not match any known function signature.',
      messageEs: 'Function could not be identified. The calldata does not match any known function signature.',
    });
  }

  // 5. Very new contract (< 7 days)
  if (req.contractAge !== undefined && req.contractAge < NEW_CONTRACT_THRESHOLD) {
    reasons.push({
      level: 'red',
      code: 'NEW_CONTRACT',
      message: `Contract deployed ${req.contractAge} day(s) ago. Very new contracts are higher risk.`,
      messageEs: `Contract deployed ${req.contractAge} day(s) ago. Very new contracts are higher risk.`,
    });
  }

  // 6. Simulation failed
  if (req.simulation && !req.simulation.success) {
    reasons.push({
      level: 'red',
      code: 'SIMULATION_FAILED',
      message: 'Transaction simulation failed. The transaction would likely revert on-chain.',
      messageEs: 'Transaction simulation failed. The transaction would likely revert on-chain.',
    });
  }

  // 7. Proxy without verified implementation
  if (req.decoded?.isSafeProxy === false && isUnverified && !isKnown) {
    // Check heuristic: if decoded has functionSource but contract is unverified, it might be a proxy
    // Only add if we haven't already flagged unverified
    if (req.decoded?.functionSource === '4byte') {
      reasons.push({
        level: 'yellow',
        code: 'FUNCTION_FROM_4BYTE',
        message: 'Function name found in signature database but NOT from verified source code. Name may not be accurate.',
        messageEs: 'Function name found in signature database but NOT from verified source code. Name may not be accurate.',
      });
    }
  }

  // ─── YELLOW flags ───

  // 8. Large transfer value
  const transferValueUsd = estimateTransferValueUsd(req);
  if (transferValueUsd > LARGE_TRANSFER_THRESHOLD) {
    reasons.push({
      level: 'yellow',
      code: 'LARGE_TRANSFER',
      message: `Large transfer detected: ~$${transferValueUsd.toLocaleString()} USD`,
      messageEs: `Large transfer detected: ~$${transferValueUsd.toLocaleString()} USD`,
    });
  }

  // 9. Unknown protocol (verified but not in our list)
  if (!isKnown && !isApproval && !isUnverified) {
    reasons.push({
      level: 'yellow',
      code: 'UNKNOWN_PROTOCOL',
      message: 'Contract is not a recognized protocol. Proceed with caution.',
      messageEs: 'Contract is not a recognized protocol. Proceed with caution.',
    });
  }

  // 10. Approval to unknown contract
  if (isApproval && !isUnlimitedApproval && !isKnown) {
    reasons.push({
      level: 'yellow',
      code: 'APPROVAL_UNKNOWN_SPENDER',
      message: 'Token approval to an unrecognized contract.',
      messageEs: 'Token approval to an unrecognized contract.',
    });
  }

  // 11. High gas usage (possible complex interaction)
  if (req.simulation && req.simulation.gasUsed > 500_000) {
    reasons.push({
      level: 'yellow',
      code: 'HIGH_GAS',
      message: `High gas usage (${req.simulation.gasUsed.toLocaleString()}). Complex transaction.`,
      messageEs: `High gas usage (${req.simulation.gasUsed.toLocaleString()}). Complex transaction.`,
    });
  }

  // ─── GREEN signals ───

  if (isKnown) {
    reasons.push({
      level: 'green',
      code: 'KNOWN_PROTOCOL',
      message: `Recognized protocol: ${protocol!.name} (${protocol!.category})`,
      messageEs: `Recognized protocol: ${protocol!.name} (${protocol!.category})`,
    });
  }

  if (req.contractVerified === true || (req.decoded?.contractVerified === true)) {
    reasons.push({
      level: 'green',
      code: 'VERIFIED_CONTRACT',
      message: 'Contract source code is verified on block explorer.',
      messageEs: 'Contract source code is verified on block explorer.',
    });
  }

  if (req.decoded?.isSafeProxy) {
    reasons.push({
      level: 'green',
      code: 'SAFE_PROXY',
      message: 'Target is a Safe multisig wallet.',
      messageEs: 'Target is a Safe multisig wallet.',
    });
  }

  if (req.simulation?.success && reasons.every(r => r.level !== 'red')) {
    reasons.push({
      level: 'green',
      code: 'SIMULATION_OK',
      message: 'Transaction simulation succeeded.',
      messageEs: 'Transaction simulation succeeded.',
    });
  }

  // ─── Calculate overall score ───
  const score = calculateOverallScore(reasons);

  return {
    score,
    reasons,
    details: {
      contractAge: req.contractAge,
      contractVerified: req.contractVerified ?? req.decoded?.contractVerified,
      isKnownProtocol: isKnown,
      protocolName: protocol?.name,
      transferValueUsd,
      isUnlimitedApproval,
    },
  };
}

/**
 * Check if the approval amount is unlimited (max uint256)
 */
function checkUnlimitedApproval(data: string | undefined, decoded?: DecodedTransaction): boolean {
  if (!data || data.length < 10) return false;

  const selector = data.slice(0, 10);
  if (selector !== '0x095ea7b3') return false; // not an approval

  // Check raw calldata for max uint256
  const amountHex = data.slice(74); // after selector (4 bytes) + address (32 bytes)
  if (amountHex && amountHex.replace(/^0+/, '').toLowerCase() === 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') {
    return true;
  }

  // Check decoded parameters
  if (decoded) {
    const amount = decoded.parameters.find(p => p.name === 'amount' || p.name === 'value');
    if (amount && (amount.value === MAX_UINT256_DECIMAL || amount.value.includes('ffffffff'))) {
      return true;
    }
  }

  return false;
}

/**
 * Estimate transfer value in USD (rough heuristic)
 */
function estimateTransferValueUsd(req: RiskRequest): number {
  // If we have simulation data with USD values, use those
  if (req.simulation?.balanceChanges) {
    const maxUsd = Math.max(
      ...req.simulation.balanceChanges.map(c => Math.abs(parseFloat(c.deltaUsd) || 0)),
      0
    );
    if (maxUsd > 0) return maxUsd;
  }

  // Rough ETH estimate: value in wei * ~$3200
  if (req.value && req.value !== '0') {
    try {
      const ethValue = parseFloat(req.value) / 1e18;
      return ethValue * 3200; // rough ETH price
    } catch {
      return 0;
    }
  }

  return 0;
}

/**
 * Calculate overall risk score from individual reasons
 */
function calculateOverallScore(reasons: RiskReason[]): RiskLevel {
  const hasRed = reasons.some(r => r.level === 'red');
  const hasYellow = reasons.some(r => r.level === 'yellow');

  if (hasRed) return 'red';
  if (hasYellow) return 'yellow';
  return 'green';
}
