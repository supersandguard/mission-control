import { SafeTransactionsResponse } from '../types';
import { SAFE_TX_SERVICE_URLS } from '../utils/constants';
import { ethers } from 'ethers';

/**
 * Helper to fetch with explicit redirect following (Node may not follow 308s)
 */
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    redirect: 'follow',
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  // Manual redirect handling for 308 (Node's fetch may not follow)
  if (response.status === 308 || response.status === 307) {
    const location = response.headers.get('location');
    if (location) {
      const redirectUrl = location.startsWith('http') ? location : new URL(location, url).toString();
      return fetch(redirectUrl, {
        ...options,
        redirect: 'follow',
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });
    }
  }

  return response;
}

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

  // EIP-55 checksum required by Safe Transaction Service
  const checksumAddress = ethers.getAddress(safeAddress);
  const url = `${baseUrl}/api/v1/safes/${checksumAddress}/multisig-transactions/?executed=false&ordering=-nonce&limit=20`;

  try {
    const response = await safeFetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Safe not found: ${safeAddress} on chain ${chainId}`);
      }
      throw new Error(`Safe Transaction Service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as SafeTransactionsResponse;

    // Filter out superseded transactions:
    // If executed=false returns txs, check if any nonce already has an executed tx
    // (i.e., the nonce was used by an on-chain rejection, making the original tx dead)
    if (data.results && data.results.length > 0) {
      const executedUrl = `${baseUrl}/api/v1/safes/${checksumAddress}/multisig-transactions/?executed=true&ordering=-nonce&limit=5`;
      try {
        const executedRes = await safeFetch(executedUrl);
        if (executedRes.ok) {
          const executedData = await executedRes.json() as SafeTransactionsResponse;
          const executedNonces = new Set(
            executedData.results?.map((tx: any) => tx.nonce) || []
          );
          // Remove pending txs whose nonce is already used by an executed tx
          data.results = data.results.filter((tx: any) => !executedNonces.has(tx.nonce));
          data.count = data.results.length;
        }
      } catch {
        // If we can't check executed txs, just return unfiltered (safe fallback)
      }
    }

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

  const checksumAddress = ethers.getAddress(safeAddress);
  const url = `${baseUrl}/api/v1/safes/${checksumAddress}/multisig-transactions/?ordering=-nonce&limit=${limit}`;

  const response = await safeFetch(url);

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

  const checksumAddress = ethers.getAddress(safeAddress);
  const url = `${baseUrl}/api/v1/safes/${checksumAddress}/`;

  const response = await safeFetch(url);

  if (!response.ok) {
    throw new Error(`Safe not found or service error: ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}
