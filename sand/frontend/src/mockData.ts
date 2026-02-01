import { Transaction } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '0xabc123',
    to: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    value: '0',
    data: '0x617ba037...',
    nonce: 42,
    submissionDate: '2026-02-01T05:30:00Z',
    confirmations: 1,
    confirmationsRequired: 2,
    isExecuted: false,
    simulation: {
      success: true, gasUsed: 245000, gasLimit: 350000,
      balanceChanges: [
        { address: '0xfd20...146d', token: { address: '0xA0b8...eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }, before: '50,000.00', after: '45,000.00', delta: '-5,000.00', deltaUsd: '-5,000.00' },
        { address: '0xfd20...146d', token: { address: '0x8787...4E2', symbol: 'aUSDC', name: 'Aave USDC', decimals: 6 }, before: '10,000.00', after: '15,000.00', delta: '+5,000.00', deltaUsd: '+5,000.00' },
      ],
      events: [{ address: '0xA0b8', name: 'Transfer', params: { from: '0xfd20', to: '0x8787', value: '5000' } }],
    },
    decoded: {
      functionName: 'supply',
      functionSignature: 'supply(address,uint256,address,uint16)',
      parameters: [
        { name: 'asset', type: 'address', value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', label: 'Token to deposit' },
        { name: 'amount', type: 'uint256', value: '5000000000', label: 'Amount to deposit' },
        { name: 'onBehalfOf', type: 'address', value: '0xfd20Df09db039286e54670a4f32e99fbc51a146d', label: 'Beneficiary' },
      ],
      protocol: { name: 'Aave V3 Pool', category: 'Lending' },
      contractVerified: true,
    },
    explanation: {
      summary: 'Deposit 5,000 USDC into Aave V3',
      details: ['Token: USDC', 'Amount: 5,000 USDC', 'Protocol: Aave V3 (Lending)', 'Estimated yield: ~3.2% APY', '✅ Simulation succeeded'],
      warnings: [],
      actionType: 'supply',
    },
    risk: {
      score: 'green',
      reasons: [
        { level: 'green', code: 'KNOWN', message: 'Recognized protocol: Aave V3 (Lending)', messageEs: 'Recognized protocol: Aave V3 (Lending)' },
        { level: 'green', code: 'VERIFIED', message: 'Source code verified on Etherscan', messageEs: 'Source code verified on Etherscan' },
        { level: 'green', code: 'SIM_OK', message: 'Simulation succeeded', messageEs: 'Simulation succeeded' },
      ],
      details: { isKnownProtocol: true, protocolName: 'Aave V3', isUnlimitedApproval: false, transferValueUsd: 5000 },
    },
  },
  {
    id: '0xdef456',
    to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    value: '0',
    data: '0x095ea7b3...',
    nonce: 43,
    submissionDate: '2026-02-01T05:45:00Z',
    confirmations: 1,
    confirmationsRequired: 2,
    isExecuted: false,
    simulation: {
      success: true, gasUsed: 46200, gasLimit: 60000,
      balanceChanges: [],
      events: [{ address: '0xA0b8', name: 'Approval', params: { owner: '0xfd20', spender: '0x1111', value: 'UNLIMITED' } }],
    },
    decoded: {
      functionName: 'approve',
      functionSignature: 'approve(address,uint256)',
      parameters: [
        { name: 'spender', type: 'address', value: '0x1111111254EEB25477B68fb85Ed929f73A960582', label: 'Authorized spender' },
        { name: 'amount', type: 'uint256', value: '115792089237316195423570985008687907853269984665640564039457584007913129639935', label: 'Amount' },
      ],
      protocol: { name: 'USDC', category: 'Token' },
      contractVerified: true,
    },
    explanation: {
      summary: 'Authorize 1inch to spend UNLIMITED USDC',
      details: ['Authorizes 0x1111...0582 (1inch Router V5)', 'Amount: ∞ (unlimited)', '✅ Simulation succeeded'],
      warnings: ['⚠️ UNLIMITED APPROVAL: Authorizes spending an unlimited amount of USDC'],
      actionType: 'approve',
    },
    risk: {
      score: 'red',
      reasons: [
        { level: 'red', code: 'UNLIMITED', message: 'Unlimited token approval. They can spend all your USDC.', messageEs: 'Unlimited token approval. They can spend all your USDC.' },
        { level: 'green', code: 'KNOWN', message: 'Recognized protocol: 1inch Router V5', messageEs: 'Recognized protocol: 1inch Router V5' },
      ],
      details: { isKnownProtocol: true, protocolName: '1inch', isUnlimitedApproval: true },
    },
  },
  {
    id: '0xghi789',
    to: '0xd3AaC075E3A46E6a8644b10A78e3787E06a68376',
    value: '0',
    data: '0xa9059cbb...',
    nonce: 44,
    submissionDate: '2026-02-01T06:00:00Z',
    confirmations: 1,
    confirmationsRequired: 2,
    isExecuted: false,
    simulation: {
      success: true, gasUsed: 52000, gasLimit: 65000,
      balanceChanges: [
        { address: '0xfd20...146d', token: { address: '0xd3Aa', symbol: 'TOKEN', name: 'Unknown Token', decimals: 18 }, before: '100,000', after: '0', delta: '-100,000', deltaUsd: '-15,000' },
      ],
      events: [],
    },
    decoded: {
      functionName: 'transfer',
      functionSignature: 'transfer(address,uint256)',
      parameters: [
        { name: 'to', type: 'address', value: '0xAbCdEf1234567890AbCdEf1234567890aBcDeF12', label: 'Destination' },
        { name: 'amount', type: 'uint256', value: '100000000000000000000000', label: 'Amount' },
      ],
      protocol: null,
      contractVerified: false,
    },
    explanation: {
      summary: 'Transfer 100,000 TOKEN to 0xAbCd...eF12',
      details: ['Destination: 0xAbCd...eF12', 'Amount: 100,000 TOKEN', 'Value: ~$15,000 USD'],
      warnings: [],
      actionType: 'transfer',
    },
    risk: {
      score: 'yellow',
      reasons: [
        { level: 'yellow', code: 'LARGE', message: 'Large transfer: ~$15,000 USD', messageEs: 'Large transfer: ~$15,000 USD' },
        { level: 'yellow', code: 'UNKNOWN', message: 'Unrecognized contract', messageEs: 'Unrecognized contract' },
      ],
      details: { isKnownProtocol: false, isUnlimitedApproval: false, transferValueUsd: 15000 },
    },
  },
];
