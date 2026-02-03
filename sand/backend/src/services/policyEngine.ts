import { DecodedTransaction } from '../types';

export type PolicySeverity = 'LOW' | 'MEDIUM' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface PolicyResult {
  policyId: string;
  name: string;
  severity: PolicySeverity;
  triggered: boolean;
  message: string;
}

export interface PolicyEvaluationRequest {
  to: string;
  data: string;
  value: string;
  decoded?: DecodedTransaction;
}

/**
 * Known malicious function signatures
 * These are common exploit patterns seen in the wild
 */
const KNOWN_MALICIOUS_SIGNATURES = new Set([
  '0x70a08231', // balanceOf - often used in reentrancy attacks
  '0x18160ddd', // totalSupply - used in flash loan exploits  
  '0x095ea7b3', // approve - when combined with unusual patterns
  '0x23b872dd', // transferFrom - often seen in token draining
  '0xa22cb465', // setApprovalForAll - NFT drain signature
  '0x42842e0e', // safeTransferFrom - NFT transfers
  '0xf242432a', // safeTransferFrom ERC1155
  // Add more as discovered
]);

/**
 * Function signatures for ownership transfers
 */
const OWNERSHIP_TRANSFER_SIGNATURES = new Set([
  '0xf2fde38b', // transferOwnership(address)
  '0x8da5cb5b', // owner() - view function but indicates ownership pattern
  '0x715018a6', // renounceOwnership()
  '0x13af4035', // setOwner(address)
  '0xa6f9dae1', // changeOwner(address)
  '0x893d20e8', // changeOwner(address) - alternative signature
]);

/**
 * Function signatures for proxy upgrades
 */
const PROXY_UPGRADE_SIGNATURES = new Set([
  '0x3659cfe6', // upgradeTo(address)
  '0x4f1ef286', // upgradeToAndCall(address,bytes)
  '0x99a88ec4', // upgrade(address)
  '0x6a627842', // mint(address,uint256)
  '0x5c60da1b', // implementation()
]);

/**
 * Evaluate policies against a transaction
 */
export function evaluatePolicies(tx: PolicyEvaluationRequest): PolicyResult[] {
  const results: PolicyResult[] = [];

  // Policy 1: Unlimited Token Approval
  const unlimitedApprovalResult = checkUnlimitedTokenApproval(tx);
  results.push(unlimitedApprovalResult);

  // Policy 2: Ownership Transfer
  const ownershipTransferResult = checkOwnershipTransfer(tx);
  results.push(ownershipTransferResult);

  // Policy 3: Proxy Upgrade
  const proxyUpgradeResult = checkProxyUpgrade(tx);
  results.push(proxyUpgradeResult);

  // Policy 4: Large Value Transfer
  const largeValueResult = checkLargeValueTransfer(tx);
  results.push(largeValueResult);

  // Policy 5: Known Malicious Signatures
  const maliciousSignatureResult = checkKnownMaliciousSignatures(tx);
  results.push(maliciousSignatureResult);

  return results;
}

/**
 * Policy 1: Check for unlimited token approvals
 */
function checkUnlimitedTokenApproval(tx: PolicyEvaluationRequest): PolicyResult {
  const policy: PolicyResult = {
    policyId: 'unlimited-approval',
    name: 'Unlimited Token Approval',
    severity: 'HIGH',
    triggered: false,
    message: 'Transaction does not contain unlimited token approval'
  };

  if (!tx.data || tx.data.length < 10) return policy;

  const selector = tx.data.slice(0, 10);
  if (selector !== '0x095ea7b3') return policy; // not an approval

  // Check for max uint256 in raw calldata
  const amountHex = tx.data.slice(74); // after selector (4 bytes) + address (32 bytes)
  const isMaxUint256 = amountHex && 
    amountHex.replace(/^0+/, '').toLowerCase() === 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  if (isMaxUint256) {
    policy.triggered = true;
    policy.message = 'CRITICAL: Unlimited token approval detected. Spender can drain all tokens of this type.';
    return policy;
  }

  // Check decoded parameters if available
  if (tx.decoded) {
    const amountParam = tx.decoded.parameters.find(p => p.name === 'amount' || p.name === 'value');
    if (amountParam && 
        (amountParam.value === '115792089237316195423570985008687907853269984665640564039457584007913129639935' || 
         amountParam.value.includes('ffffffff'))) {
      policy.triggered = true;
      policy.message = 'CRITICAL: Unlimited token approval detected. Spender can drain all tokens of this type.';
    }
  }

  return policy;
}

/**
 * Policy 2: Check for ownership transfer functions
 */
function checkOwnershipTransfer(tx: PolicyEvaluationRequest): PolicyResult {
  const policy: PolicyResult = {
    policyId: 'ownership-transfer',
    name: 'Ownership Transfer',
    severity: 'HIGH',
    triggered: false,
    message: 'Transaction does not transfer ownership'
  };

  if (!tx.data || tx.data.length < 10) return policy;

  const selector = tx.data.slice(0, 10);
  
  if (OWNERSHIP_TRANSFER_SIGNATURES.has(selector)) {
    policy.triggered = true;
    
    // Try to identify specific function if decoded
    if (tx.decoded) {
      const functionName = tx.decoded.functionName;
      policy.message = `HIGH RISK: Ownership transfer detected via ${functionName}. This permanently changes contract control.`;
    } else {
      policy.message = 'HIGH RISK: Ownership transfer function detected. This permanently changes contract control.';
    }
  }

  return policy;
}

/**
 * Policy 3: Check for proxy upgrade functions
 */
function checkProxyUpgrade(tx: PolicyEvaluationRequest): PolicyResult {
  const policy: PolicyResult = {
    policyId: 'proxy-upgrade',
    name: 'Proxy Upgrade',
    severity: 'HIGH',
    triggered: false,
    message: 'Transaction does not upgrade proxy implementation'
  };

  if (!tx.data || tx.data.length < 10) return policy;

  const selector = tx.data.slice(0, 10);
  
  if (PROXY_UPGRADE_SIGNATURES.has(selector)) {
    policy.triggered = true;
    
    if (tx.decoded) {
      const functionName = tx.decoded.functionName;
      policy.message = `HIGH RISK: Proxy upgrade detected via ${functionName}. This changes the contract's implementation code.`;
    } else {
      policy.message = 'HIGH RISK: Proxy upgrade function detected. This changes the contract\'s implementation code.';
    }
  }

  return policy;
}

/**
 * Policy 4: Check for large value transfers (>10 ETH)
 */
function checkLargeValueTransfer(tx: PolicyEvaluationRequest): PolicyResult {
  const policy: PolicyResult = {
    policyId: 'large-value',
    name: 'Large Value Transfer',
    severity: 'WARNING',
    triggered: false,
    message: 'Transfer value is within normal range'
  };

  if (!tx.value || tx.value === '0') return policy;

  try {
    const valueInEth = Number(BigInt(tx.value)) / 1e18;
    const threshold = 10; // 10 ETH
    
    if (valueInEth > threshold) {
      policy.triggered = true;
      policy.message = `WARNING: Large value transfer detected: ${valueInEth.toFixed(4)} ETH (>${threshold} ETH threshold)`;
    }
  } catch (error) {
    // Unable to parse value, return safe default
  }

  return policy;
}

/**
 * Policy 5: Check for known malicious function signatures
 */
function checkKnownMaliciousSignatures(tx: PolicyEvaluationRequest): PolicyResult {
  const policy: PolicyResult = {
    policyId: 'malicious-signature',
    name: 'Known Malicious Signature',
    severity: 'CRITICAL',
    triggered: false,
    message: 'Function signature is not flagged as malicious'
  };

  if (!tx.data || tx.data.length < 10) return policy;

  const selector = tx.data.slice(0, 10);
  
  if (KNOWN_MALICIOUS_SIGNATURES.has(selector)) {
    policy.triggered = true;
    
    if (tx.decoded) {
      const functionName = tx.decoded.functionName;
      policy.message = `CRITICAL: Known exploit signature detected: ${functionName} (${selector}). This pattern is commonly used in attacks.`;
    } else {
      policy.message = `CRITICAL: Known exploit signature detected: ${selector}. This pattern is commonly used in attacks.`;
    }
  }

  return policy;
}