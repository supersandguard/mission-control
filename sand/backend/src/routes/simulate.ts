import { Router, Request, Response } from 'express';
import { simulateTransaction } from '../services/simulationService';
import { SimulationRequest } from '../types';

const router = Router();

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

    if (!data && (!value || value === '0')) {
      res.status(400).json({
        error: 'Transaction must have calldata or value',
      });
      return;
    }

    const result = await simulateTransaction({
      to,
      value: value || '0',
      data: data || '0x',
      chainId: chainId || 1,
      from,
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
