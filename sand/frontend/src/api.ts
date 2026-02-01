function getApiBase(): string {
  // Priority: localStorage -> env var -> empty (relative)
  const config = localStorage.getItem('sand-config')
  if (config) {
    try {
      const parsed = JSON.parse(config)
      if (parsed.apiUrl && parsed.apiUrl.trim()) {
        return parsed.apiUrl.trim()
      }
    } catch (error) {
      console.warn('Failed to parse sand-config:', error)
    }
  }
  
  return import.meta.env.VITE_API_URL || '';
}

export async function testConnection(apiUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (error) {
    console.warn('Connection test failed:', error)
    return false;
  }
}

export async function fetchHealth() {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchPendingTransactions(safeAddress: string, chainId = 1) {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/safe/${safeAddress}/transactions?chainId=${chainId}`);
  return res.json();
}

export async function fetchSafeInfo(safeAddress: string, chainId = 1) {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/safe/${safeAddress}/info?chainId=${chainId}`);
  return res.json();
}

export async function simulateTransaction(tx: { to: string; value: string; data: string; chainId: number; from?: string }) {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  return res.json();
}

export async function decodeTransaction(calldata: string, contractAddress: string, chainId = 1) {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/decode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calldata, contractAddress, chainId }),
  });
  return res.json();
}

export async function assessRisk(tx: { to: string; value: string; data: string; chainId?: number }) {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  return res.json();
}

export async function explainTransaction(decoded: any, simulation: any, chainId = 1) {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decoded, simulation, chainId }),
  });
  return res.json();
}
