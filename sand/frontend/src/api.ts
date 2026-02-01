const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchPendingTransactions(safeAddress: string, chainId = 8453) {
  const res = await fetch(`${API_BASE}/api/safe/${safeAddress}/transactions?chainId=${chainId}`);
  return res.json();
}

export async function fetchSafeInfo(safeAddress: string, chainId = 8453) {
  const res = await fetch(`${API_BASE}/api/safe/${safeAddress}/info?chainId=${chainId}`);
  return res.json();
}

export async function simulateTransaction(tx: { to: string; value: string; data: string; chainId: number; from?: string }) {
  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  return res.json();
}

export async function decodeTransaction(calldata: string, contractAddress: string, chainId = 1) {
  const res = await fetch(`${API_BASE}/api/decode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calldata, contractAddress, chainId }),
  });
  return res.json();
}

export async function assessRisk(tx: { to: string; value: string; data: string; chainId?: number }) {
  const res = await fetch(`${API_BASE}/api/risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  return res.json();
}

export async function explainTransaction(decoded: any, simulation: any, chainId = 1) {
  const res = await fetch(`${API_BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decoded, simulation, chainId }),
  });
  return res.json();
}
