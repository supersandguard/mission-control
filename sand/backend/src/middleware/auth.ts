import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSubscriptionByAddress, getSubscriptionByApiKey, Subscription } from '../services/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load or generate JWT secret
const JWT_SECRET_PATH = path.join(__dirname, '..', '..', 'data', '.jwt-secret');
let JWT_SECRET: string;

try {
  JWT_SECRET = fs.readFileSync(JWT_SECRET_PATH, 'utf8').trim();
} catch (error) {
  // Auto-generate secret if not found (first deploy)
  JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
  try {
    fs.mkdirSync(path.dirname(JWT_SECRET_PATH), { recursive: true });
    fs.writeFileSync(JWT_SECRET_PATH, JWT_SECRET, { mode: 0o600 });
    console.log('🔑 Generated new JWT secret');
  } catch (writeErr) {
    console.warn('⚠️ Could not persist JWT secret - using in-memory (tokens won\'t survive restarts)');
  }
}

export interface JWTPayload {
  userId: number;
  address: string;
  tier: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        address: string;
        tier: string;
        subscription: Subscription;
      };
    }
  }
}

export function signJWT(payload: { userId: number; address: string; tier: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization: Bearer header and validates it
 * Attaches user info to req.user if valid
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = verifyJWT(token);
    
    // Get fresh user data from database
    const subscription = getSubscriptionByAddress(decoded.address);
    
    if (!subscription) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if subscription is still active
    if (subscription.expires_at < Date.now()) {
      return res.status(401).json({ error: 'Subscription expired' });
    }

    // Attach user info to request
    req.user = {
      id: subscription.id,
      address: subscription.address,
      tier: subscription.plan as string,
      subscription
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      return res.status(500).json({ error: 'Token verification failed' });
    }
  }
}

/**
 * Optional JWT Authentication Middleware
 * Tries to extract JWT first, falls back to API key authentication
 * Used for existing routes that support both JWT and API key auth
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // Try JWT first
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyJWT(token);
      const subscription = getSubscriptionByAddress(decoded.address);
      
      if (subscription && subscription.expires_at >= Date.now()) {
        req.user = {
          id: subscription.id,
          address: subscription.address,
          tier: subscription.plan as string,
          subscription
        };
        return next();
      }
    } catch (error) {
      // JWT failed, fall through to API key check
    }
  }

  // Try API key from query params or body
  const apiKey = req.query.apiKey as string || req.body?.apiKey as string;
  
  if (apiKey) {
    const subscription = getSubscriptionByApiKey(apiKey);
    
    if (subscription && subscription.expires_at >= Date.now()) {
      req.user = {
        id: subscription.id,
        address: subscription.address,
        tier: subscription.plan as string,
        subscription
      };
      return next();
    }
  }

  // No valid authentication found, but that's okay for optional auth
  next();
}