// ─── Safe Transaction Types ───

export interface SafeTransaction {
  safe: string;
  to: string;
  value: string;
  data: string | null;
  operation: number;
  gasToken: string;
  safeTxGas: number;
  baseGas: number;
  gasPrice: string;
  refundReceiver: string;
  nonce: number;
  executionDate: string | null;
  submissionDate: string;
  modified: string;
  blockNumber: number | null;
  transactionHash: string | null;
  safeTxHash: string;
  executor: string | null;
  isExecuted: boolean;
  isSuccessful: boolean | null;
  ethGasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasUsed: number | null;
  fee: string | null;
  origin: string | null;
  dataDecoded: DecodedData | null;
  confirmationsRequired: number;
  confirmations: Confirmation[];
  trusted: boolean;
  signatures: string | null;
}

export interface DecodedData {
  method: string;
  parameters: DecodedParam[];
}

export interface DecodedParam {
  name: string;
  type: string;
  value: string;
}

export interface Confirmation {
  owner: string;
  submissionDate: string;
  transactionHash: string | null;
  signature: string;
  signatureType: string;
}

export interface SafeTransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SafeTransaction[];
}

// ─── Simulation Types ───

export interface SimulationRequest {
  to: string;
  value: string;
  data: string;
  chainId: number;
  from?: string;
}

export interface BalanceChange {
  address: string;
  token: TokenInfo;
  before: string;
  after: string;
  delta: string;
  deltaUsd: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

export interface SimulationEvent {
  address: string;
  name: string;
  params: Record<string, string>;
  topic: string;
}

export interface SimulationResult {
  success: boolean;
  gasUsed: number;
  gasLimit: number;
  balanceChanges: BalanceChange[];
  events: SimulationEvent[];
  error?: string;
  rawTrace?: string;
}

// ─── Decode Types ───

export interface DecodeRequest {
  calldata: string;
  contractAddress: string;
  chainId?: number;
}

export interface DecodedTransaction {
  functionName: string;
  functionSignature: string;
  parameters: DecodedParameter[];
  protocol: ProtocolInfo | null;
  contractVerified: boolean;
}

export interface DecodedParameter {
  name: string;
  type: string;
  value: string;
  label?: string; // human-readable label
}

export interface ProtocolInfo {
  name: string;
  category: string; // "DEX", "Lending", "Bridge", "NFT", "Token"
  logoUrl?: string;
  website?: string;
}

// ─── Explain Types ───

export interface ExplainRequest {
  decoded: DecodedTransaction;
  simulation: SimulationResult;
  chainId?: number;
}

export interface ExplanationResult {
  summary: string;        // one-line Spanish summary
  details: string[];      // bullet points with details
  warnings: string[];     // any warnings
  actionType: string;     // "swap", "approve", "transfer", "mint", etc.
}

// ─── Risk Types ───

export interface RiskRequest {
  to: string;
  value: string;
  data: string;
  chainId?: number;
  decoded?: DecodedTransaction;
  simulation?: SimulationResult;
  contractAge?: number;     // days since deployment
  contractVerified?: boolean;
}

export type RiskLevel = 'green' | 'yellow' | 'red';

export interface RiskReason {
  level: RiskLevel;
  code: string;
  message: string;
  messageEs: string;
}

export interface RiskResult {
  score: RiskLevel;
  reasons: RiskReason[];
  details: {
    contractAge?: number;
    contractVerified?: boolean;
    isKnownProtocol: boolean;
    protocolName?: string;
    transferValueUsd?: number;
    isUnlimitedApproval: boolean;
  };
}
