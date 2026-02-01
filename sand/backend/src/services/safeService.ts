import { SafeTransaction, SafeTransactionsResponse } from '../types';
import { SAFE_TX_SERVICE_URLS } from '../utils/constants';

/**
 * Fetch pending (queued) transactions from a Safe multisig
 */
export async function getPendingTransactions(
  safeAddress: string,
  chainId: number = 1
): Promise<SafeTransactionsResponse> {
  const baseUrl = SAFE_TX_SERVICE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported: ${Object.keys(SAFE_TX_SERVICE_URLS).join(', ')}`);
  }

  const url = `${baseUrl}/api/v1/safes/${safeAddress}/multisig-transactions/?executed=false&ordering=-nonce&limit=20`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Safe not found: ${safeAddress} on chain ${chainId}`);
      }
      throw new Error(`Safe Transaction Service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as SafeTransactionsResponse;
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Safe')) {
      throw error;
    }
    throw new Error(`Failed to fetch transactions from Safe Transaction Service: ${(error as Error).message}`);
  }
}

/**
 * Fetch all transactions (including executed) for a Safe
 */
export async function getAllTransactions(
  safeAddress: string,
  chainId: number = 1,
  limit: number = 20
): Promise<SafeTransactionsResponse> {
  const baseUrl = SAFE_TX_SERVICE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const url = `${baseUrl}/api/v1/safes/${safeAddress}/multisig-transactions/?ordering=-nonce&limit=${limit}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Safe Transaction Service error: ${response.status}`);
  }

  return response.json() as Promise<SafeTransactionsResponse>;
}

/**
 * Get Safe info (owners, threshold, etc.)
 */
export async function getSafeInfo(
  safeAddress: string,
  chainId: number = 1
): Promise<Record<string, unknown>> {
  const baseUrl = SAFE_TX_SERVICE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const url = `${baseUrl}/api/v1/safes/${safeAddress}/`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Safe not found or service error: ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}
