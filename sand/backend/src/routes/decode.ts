import { Router, Request, Response } from 'express';
import { decodeTransaction } from '../services/decodeService';
import { DecodeRequest } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { calldata, contractAddress, chainId } = req.body as DecodeRequest;
    if (!calldata || !contractAddress) {
      res.status(400).json({ error: 'Missing calldata or contractAddress' });
      return;
    }
    const result = await decodeTransaction({ calldata, contractAddress, chainId });
    res.json({ success: true, decoded: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
