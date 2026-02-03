import { Router, Request, Response } from 'express';
import { authenticateJWT, signJWT } from '../middleware/auth';
import { 
  getSubscriptionByAddress, 
  getSubscriptionByApiKey, 
  activateSubscription, 
  createFreeSubscription,
  Subscription 
} from '../services/db';

const router = Router();

/**
 * POST /api/auth/login
 * Accepts { address: string, apiKey?: string }
 * Validates against DB and returns JWT + user info
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { address, apiKey } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const addr = address.toLowerCase();
    let subscription: Subscription | undefined;

    // If API key provided, validate it matches the address
    if (apiKey) {
      subscription = getSubscriptionByApiKey(apiKey);
      if (!subscription || subscription.address !== addr) {
        return res.status(401).json({ error: 'Invalid API key for this address' });
      }
    } else {
      // Look up subscription by address
      subscription = getSubscriptionByAddress(addr);
      if (!subscription) {
        return res.status(404).json({ error: 'No subscription found for this address' });
      }
    }

    // Check if subscription is active
    if (subscription.expires_at < Date.now()) {
      return res.status(401).json({ error: 'Subscription expired' });
    }

    // Generate JWT
    const token = signJWT({
      userId: subscription.id,
      address: subscription.address,
      tier: subscription.plan
    });

    // Update last login
    const db = (await import('../services/db')).default;
    db.prepare('UPDATE subscriptions SET last_login = ? WHERE id = ?')
      .run(Date.now(), subscription.id);

    res.json({
      success: true,
      token,
      user: {
        id: subscription.id,
        address: subscription.address,
        tier: subscription.plan,
        apiKey: subscription.api_key,
        expiresAt: subscription.expires_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/signup
 * Accepts { address: string, tier?: string }
 * Creates user in DB and returns JWT + user info
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { address, tier = 'scout' } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const addr = address.toLowerCase();

    // Check if user already exists
    const existing = getSubscriptionByAddress(addr);
    if (existing) {
      return res.status(409).json({ error: 'User already exists for this address' });
    }

    // Create subscription based on tier
    let subscription: { apiKey: string; expiresAt?: number; plan?: string };
    
    if (tier === 'scout') {
      // Free tier - unlimited duration
      subscription = createFreeSubscription(addr);
    } else {
      // Paid tier - default 30 days
      const result = activateSubscription({
        address: addr,
        plan: tier,
        durationMs: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      subscription = { ...result, plan: tier };
    }

    // Get the created subscription record
    const subscriptionRecord = getSubscriptionByAddress(addr)!;

    // Generate JWT
    const token = signJWT({
      userId: subscriptionRecord.id,
      address: subscriptionRecord.address,
      tier: subscriptionRecord.plan
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: subscriptionRecord.id,
        address: subscriptionRecord.address,
        tier: subscriptionRecord.plan,
        apiKey: subscriptionRecord.api_key,
        expiresAt: subscriptionRecord.expires_at
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * GET /api/auth/me
 * Requires JWT, returns current user info
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = req.user!; // authenticateJWT ensures this exists

    res.json({
      success: true,
      user: {
        id: user.id,
        address: user.address,
        tier: user.tier,
        apiKey: user.subscription.api_key,
        expiresAt: user.subscription.expires_at,
        email: user.subscription.email,
        plan: user.subscription.plan,
        createdAt: user.subscription.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh token before expiry
 */
router.post('/refresh', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = req.user!; // authenticateJWT ensures this exists

    // Generate new JWT
    const token = signJWT({
      userId: user.id,
      address: user.address,
      tier: user.tier
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        address: user.address,
        tier: user.tier,
        apiKey: user.subscription.api_key,
        expiresAt: user.subscription.expires_at
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export default router;