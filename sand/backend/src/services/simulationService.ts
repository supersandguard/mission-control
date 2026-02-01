import { SimulationRequest, SimulationResult, BalanceChange, SimulationEvent } from '../types';
import { ethers } from 'ethers';

/**
 * Simulate a transaction using Tenderly (or mock for now).
 * 
 * When TENDERLY_ACCESS_KEY is set, calls the real Tenderly API.
 * Otherwise returns realistic mock data.
 */
export async function simulateTransaction(req: SimulationRequest): Promise<SimulationResult> {
  const tenderlyKey = process.env.TENDERLY_ACCESS_KEY;
  const tenderlyAccount = process.env.TENDERLY_ACCOUNT;
  const tenderlyProject = process.env.TENDERLY_PROJECT;

  if (tenderlyKey && tenderlyAccount && tenderlyProject) {
    return simulateWithTenderly(req, tenderlyKey, tenderlyAccount, tenderlyProject);
  }

  return generateMockSimulation(req);
}

/**
 * Real Tenderly simulation (when API key is available)
 */
async function simulateWithTenderly(
  req: SimulationRequest,
  apiKey: string,
  account: string,
  project: string
): Promise<SimulationResult> {
  const url = `https://api.tenderly.co/api/v1/account/${account}/project/${project}/simulate`;

  const body = {
    network_id: String(req.chainId),
    from: req.from || '0x0000000000000000000000000000000000000001',
    to: req.to,
    input: req.data,
    value: req.value || '0',
    save: false,
    save_if_fails: false,
    simulation_type: 'full',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Tenderly API error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as any;
    return parseTenderlyResponse(data);
  } catch (error) {
    console.error('Tenderly simulation failed, falling back to mock:', error);
    return generateMockSimulation(req);
  }
}

/**
 * Parse Tenderly API response into our standard format
 */
function parseTenderlyResponse(data: any): SimulationResult {
  const tx = data.transaction;
  const balanceChanges: BalanceChange[] = [];
  const events: SimulationEvent[] = [];

  // Parse asset changes
  if (tx?.transaction_info?.asset_changes) {
    for (const change of tx.transaction_info.asset_changes) {
      balanceChanges.push({
        address: change.from || change.to || '',
        token: {
          address: change.token_info?.contract_address || ethers.ZeroAddress,
          symbol: change.token_info?.symbol || 'UNKNOWN',
          name: change.token_info?.name || 'Unknown Token',
          decimals: change.token_info?.decimals || 18,
        },
        before: change.raw_amount || '0',
        after: '0',
        delta: change.amount || '0',
        deltaUsd: change.dollar_value || '0',
      });
    }
  }

  // Parse logs/events
  if (tx?.transaction_info?.logs) {
    for (const log of tx.transaction_info.logs) {
      events.push({
        address: log.raw?.address || '',
        name: log.name || 'Unknown',
        params: log.inputs?.reduce((acc: Record<string, string>, inp: any) => {
          acc[inp.soltype?.name || 'param'] = inp.value || '';
          return acc;
        }, {}) || {},
        topic: log.raw?.topics?.[0] || '',
      });
    }
  }

  return {
    success: tx?.status === true,
    gasUsed: tx?.gas_used || 0,
    gasLimit: tx?.gas || 0,
    balanceChanges,
    events,
  };
}

/**
 * Generate realistic mock simulation data based on the transaction
 */
function generateMockSimulation(req: SimulationRequest): SimulationResult {
  const selector = req.data?.slice(0, 10) || '0x';

  // ERC20 approve
  if (selector === '0x095ea7b3') {
    return mockApproveSimulation(req);
  }

  // ERC20 transfer
  if (selector === '0xa9059cbb') {
    return mockTransferSimulation(req);
  }

  // Uniswap-style swap
  if (['0x38ed1739', '0x7ff36ab5', '0x18cbafe5', '0x5ae401dc', '0x04e45aaf'].includes(selector)) {
    return mockSwapSimulation(req);
  }

  // Default: ETH transfer or unknown
  return mockEthTransferSimulation(req);
}

function mockApproveSimulation(req: SimulationRequest): SimulationResult {
  const spender = '0x' + (req.data?.slice(34, 74) || '0'.repeat(40));
  const amount = req.data?.slice(74) || '0';
  const isUnlimited = amount.replace(/^0+/, '') === '' || 
    req.data?.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

  return {
    success: true,
    gasUsed: 46_200,
    gasLimit: 60_000,
    balanceChanges: [],
    events: [
      {
        address: req.to,
        name: 'Approval',
        params: {
          owner: req.from || '0x0000000000000000000000000000000000000001',
          spender,
          value: isUnlimited ? 'UNLIMITED' : ethers.formatUnits(BigInt('0x' + amount.replace(/^0+/, '') || '0'), 18),
        },
        topic: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      },
    ],
  };
}

function mockTransferSimulation(req: SimulationRequest): SimulationResult {
  const recipient = '0x' + (req.data?.slice(34, 74) || '0'.repeat(40));
  const amountHex = req.data?.slice(74)?.replace(/^0+/, '') || '0';
  const amount = amountHex ? BigInt('0x' + amountHex) : 0n;

  return {
    success: true,
    gasUsed: 52_300,
    gasLimit: 65_000,
    balanceChanges: [
      {
        address: req.from || '0x0000000000000000000000000000000000000001',
        token: {
          address: req.to,
          symbol: 'TOKEN',
          name: 'ERC20 Token',
          decimals: 18,
        },
        before: ethers.formatUnits(amount * 10n, 18),
        after: ethers.formatUnits(amount * 9n, 18),
        delta: '-' + ethers.formatUnits(amount, 18),
        deltaUsd: '-0.00',
      },
      {
        address: recipient,
        token: {
          address: req.to,
          symbol: 'TOKEN',
          name: 'ERC20 Token',
          decimals: 18,
        },
        before: '0',
        after: ethers.formatUnits(amount, 18),
        delta: '+' + ethers.formatUnits(amount, 18),
        deltaUsd: '0.00',
      },
    ],
    events: [
      {
        address: req.to,
        name: 'Transfer',
        params: {
          from: req.from || '0x0000000000000000000000000000000000000001',
          to: recipient,
          value: ethers.formatUnits(amount, 18),
        },
        topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      },
    ],
  };
}

function mockSwapSimulation(req: SimulationRequest): SimulationResult {
  const sender = req.from || '0x0000000000000000000000000000000000000001';

  return {
    success: true,
    gasUsed: 185_400,
    gasLimit: 250_000,
    balanceChanges: [
      {
        address: sender,
        token: {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        before: '10000.00',
        after: '9000.00',
        delta: '-1000.00',
        deltaUsd: '-1000.00',
      },
      {
        address: sender,
        token: {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
        before: '5.0',
        after: '5.312',
        delta: '+0.312',
        deltaUsd: '+1002.50',
      },
    ],
    events: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        name: 'Transfer',
        params: { from: sender, to: req.to, value: '1000.00' },
        topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      },
      {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        name: 'Transfer',
        params: { from: req.to, to: sender, value: '0.312' },
        topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      },
      {
        address: req.to,
        name: 'Swap',
        params: {
          sender,
          amount0In: '1000000000',
          amount1In: '0',
          amount0Out: '0',
          amount1Out: '312000000000000000',
          to: sender,
        },
        topic: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
      },
    ],
  };
}

function mockEthTransferSimulation(req: SimulationRequest): SimulationResult {
  const sender = req.from || '0x0000000000000000000000000000000000000001';
  const valueWei = BigInt(req.value || '0');
  const valueEth = ethers.formatEther(valueWei);

  return {
    success: true,
    gasUsed: 21_000,
    gasLimit: 21_000,
    balanceChanges: [
      {
        address: sender,
        token: {
          address: ethers.ZeroAddress,
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
        },
        before: '10.0',
        after: (10 - parseFloat(valueEth)).toFixed(6),
        delta: '-' + valueEth,
        deltaUsd: '-' + (parseFloat(valueEth) * 3200).toFixed(2),
      },
      {
        address: req.to,
        token: {
          address: ethers.ZeroAddress,
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
        },
        before: '0.5',
        after: (0.5 + parseFloat(valueEth)).toFixed(6),
        delta: '+' + valueEth,
        deltaUsd: '+' + (parseFloat(valueEth) * 3200).toFixed(2),
      },
    ],
    events: [],
  };
}
