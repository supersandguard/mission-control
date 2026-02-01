import { Router, Request, Response } from 'express';
import { assessRisk } from '../services/riskService';
import { RiskRequest } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const riskReq = req.body as RiskRequest;
    if (!riskReq.to) {
      res.status(400).json({ error: 'Missing "to" address' });
      return;
    }
    const result = assessRisk(riskReq);
    res.json({ success: true, risk: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
