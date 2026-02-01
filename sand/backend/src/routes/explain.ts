import { Router, Request, Response } from 'express';
import { explainTransaction } from '../services/explainService';
import { ExplainRequest } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { decoded, simulation, chainId } = req.body as ExplainRequest;
    if (!decoded || !simulation) {
      res.status(400).json({ error: 'Missing decoded or simulation data' });
      return;
    }
    const result = explainTransaction({ decoded, simulation, chainId });
    res.json({ success: true, explanation: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
