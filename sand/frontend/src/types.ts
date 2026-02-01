export type RiskLevel = 'green' | 'yellow' | 'red';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface BalanceChange {
  address: string;
  token: TokenInfo;
  before: string;
  after: string;
  delta: string;
  deltaUsd: string;
}

export interface SimulationResult {
  success: boolean;
  gasUsed: number;
  gasLimit: number;
  balanceChanges: BalanceChange[];
  events: { address: string; name: string; params: Record<string, string> }[];
}

export interface DecodedParameter {
  name: string;
  type: string;
  value: string;
  label?: string;
}

export interface DecodedTransaction {
  functionName: string;
  functionSignature: string;
  parameters: DecodedParameter[];
  protocol: { name: string; category: string } | null;
  contractVerified: boolean;
}

export interface ExplanationResult {
  summary: string;
  details: string[];
  warnings: string[];
  actionType: string;
}

export interface RiskReason {
  level: RiskLevel;
  code: string;
  message?: string;
  messageEs: string;
}

export interface RiskResult {
  score: RiskLevel;
  reasons: RiskReason[];
  details: {
    isKnownProtocol: boolean;
    protocolName?: string;
    isUnlimitedApproval: boolean;
    transferValueUsd?: number;
  };
}

export interface Transaction {
  id: string;
  to: string;
  value: string;
  data: string;
  nonce: number;
  submissionDate: string;
  confirmations: number;
  confirmationsRequired: number;
  isExecuted: boolean;
  simulation?: SimulationResult;
  decoded?: DecodedTransaction;
  explanation?: ExplanationResult;
  risk?: RiskResult;
}
