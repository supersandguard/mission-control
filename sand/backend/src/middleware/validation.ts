import { Request, Response, NextFunction } from 'express';

// Regular expressions for validation
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const VALID_CHAIN_IDS = [1, 8453, 10, 42161]; // Ethereum, Base, Optimism, Arbitrum
const HEX_STRING_REGEX = /^0x[a-fA-F0-9]*$/;

// Max payload sizes (in bytes)
const MAX_CALLDATA_SIZE = 100 * 1024; // 100KB
const MAX_DATA_SIZE = 100 * 1024; // 100KB

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

// Ethereum address validator
export function isValidEthereumAddress(address: string): boolean {
  return typeof address === 'string' && ETHEREUM_ADDRESS_REGEX.test(address);
}

// Chain ID validator
export function isValidChainId(chainId: number): boolean {
  return typeof chainId === 'number' && VALID_CHAIN_IDS.includes(chainId);
}

// Hex string validator
export function isValidHexString(hex: string): boolean {
  return typeof hex === 'string' && HEX_STRING_REGEX.test(hex);
}

// Calldata size validator
export function isValidCalldataSize(calldata: string): boolean {
  // Calculate byte size (remove 0x prefix, each 2 hex chars = 1 byte)
  const hexLength = calldata.startsWith('0x') ? calldata.length - 2 : calldata.length;
  const byteSize = hexLength / 2;
  return byteSize <= MAX_CALLDATA_SIZE;
}

// Data size validator
export function isValidDataSize(data: string): boolean {
  if (!data) return true; // Empty data is valid
  const hexLength = data.startsWith('0x') ? data.length - 2 : data.length;
  const byteSize = hexLength / 2;
  return byteSize <= MAX_DATA_SIZE;
}

// Generic validator function
export function validate(validations: Array<() => ValidationError | null>): void {
  const errors = validations
    .map(validation => validation())
    .filter((error): error is ValidationError => error !== null);

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
}

// Middleware to validate decode requests
export function validateDecodeRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { calldata, contractAddress, chainId } = req.body;

    validate([
      () => !calldata ? { field: 'calldata', message: 'Calldata is required' } : null,
      () => !contractAddress ? { field: 'contractAddress', message: 'Contract address is required' } : null,
      () => calldata && !isValidHexString(calldata) ? { field: 'calldata', message: 'Invalid hex string format' } : null,
      () => calldata && !isValidCalldataSize(calldata) ? { field: 'calldata', message: 'Calldata exceeds maximum size of 100KB' } : null,
      () => contractAddress && !isValidEthereumAddress(contractAddress) ? { field: 'contractAddress', message: 'Invalid Ethereum address format' } : null,
      () => chainId && !isValidChainId(chainId) ? { field: 'chainId', message: 'Invalid chain ID. Supported: 1, 8453, 10, 42161' } : null,
    ]);

    next();
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Middleware to validate simulate requests
export function validateSimulateRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { to, value, data, chainId, from } = req.body;

    validate([
      () => !to ? { field: 'to', message: 'To address is required' } : null,
      () => value === undefined || value === null ? { field: 'value', message: 'Value is required' } : null,
      () => to && !isValidEthereumAddress(to) ? { field: 'to', message: 'Invalid Ethereum address format' } : null,
      () => from && !isValidEthereumAddress(from) ? { field: 'from', message: 'Invalid Ethereum address format' } : null,
      () => data && !isValidHexString(data) ? { field: 'data', message: 'Invalid hex string format' } : null,
      () => data && !isValidDataSize(data) ? { field: 'data', message: 'Data exceeds maximum size of 100KB' } : null,
      () => chainId && !isValidChainId(chainId) ? { field: 'chainId', message: 'Invalid chain ID. Supported: 1, 8453, 10, 42161' } : null,
    ]);

    next();
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Middleware to validate explain requests
export function validateExplainRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { decoded, simulation, chainId } = req.body;

    validate([
      () => !decoded ? { field: 'decoded', message: 'Decoded transaction data is required' } : null,
      () => !simulation ? { field: 'simulation', message: 'Simulation data is required' } : null,
      () => chainId && !isValidChainId(chainId) ? { field: 'chainId', message: 'Invalid chain ID. Supported: 1, 8453, 10, 42161' } : null,
    ]);

    // Validate calldata size in decoded transaction if present
    if (decoded && decoded.calldata) {
      validate([
        () => !isValidHexString(decoded.calldata) ? { field: 'decoded.calldata', message: 'Invalid hex string format' } : null,
        () => !isValidCalldataSize(decoded.calldata) ? { field: 'decoded.calldata', message: 'Calldata exceeds maximum size of 100KB' } : null,
      ]);
    }

    next();
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Middleware to validate risk requests
export function validateRiskRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { to, value, data, chainId } = req.body;

    validate([
      () => !to ? { field: 'to', message: 'To address is required' } : null,
      () => to && !isValidEthereumAddress(to) ? { field: 'to', message: 'Invalid Ethereum address format' } : null,
      () => data && !isValidHexString(data) ? { field: 'data', message: 'Invalid hex string format' } : null,
      () => chainId && !isValidChainId(chainId) ? { field: 'chainId', message: 'Invalid chain ID. Supported: 1, 8453, 10, 42161' } : null,
    ]);

    next();
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Middleware to validate Safe address parameter
export function validateSafeAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const { safeAddress } = req.params;

    validate([
      () => !safeAddress ? { field: 'safeAddress', message: 'Safe address is required' } : null,
      () => safeAddress && !isValidEthereumAddress(safeAddress) ? { field: 'safeAddress', message: 'Invalid Ethereum address format' } : null,
    ]);

    next();
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    next(error);
  }
}