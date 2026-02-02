import { Router, Request, Response } from 'express';
import { simulateTransaction } from '../services/simulationService';
import { SimulationRequest } from '../types';

const router = Router();

function sanitize(input: string): string {
  return input.replace(/[<>"'&]/g, '');
}

/**
 * POST /api/simulate
 * Simulate a transaction and return balance changes + events
 * 
 * Body: { to, value, data, chainId, from? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { to, value, data, chainId, from } = req.body as SimulationRequest;

    // Validate required fields
    if (!to || !to.startsWith('0x')) {
      res.status(400).json({
        error: 'Missing or invalid "to" address',
      });
      return;
    }

    // Validate from address format
    if (from && !/^0x[a-fA-F0-9]{40}$/.test(from)) {
      res.status(400).json({ error: 'Invalid from address' });
      return;
    }

    if (!data && (!value || value === '0')) {
      res.status(400).json({
        error: 'Transaction must have calldata or value',
      });
      return;
    }

    const sanitizedTo = sanitize(to);
    const sanitizedData = data ? sanitize(data) : '0x';
    const sanitizedFrom = from ? sanitize(from) : undefined;

    const result = await simulateTransaction({
      to: sanitizedTo,
      value: value || '0',
      data: sanitizedData,
      chainId: chainId || 1,
      from: sanitizedFrom,
    });

    res.json({
      success: true,
      simulation: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Simulation failed';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
