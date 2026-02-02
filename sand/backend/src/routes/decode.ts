import { Router, Request, Response } from 'express';
import { decodeTransaction } from '../services/decodeService';
import { DecodeRequest } from '../types';

const router = Router();

function sanitize(input: string): string {
  return input.replace(/[<>"'&]/g, '');
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { calldata, contractAddress, chainId } = req.body as DecodeRequest;
    if (!calldata || !contractAddress) {
      res.status(400).json({ error: 'Missing calldata or contractAddress' });
      return;
    }
    const sanitizedCalldata = sanitize(calldata);
    const sanitizedContractAddress = sanitize(contractAddress);
    const result = await decodeTransaction({ calldata: sanitizedCalldata, contractAddress: sanitizedContractAddress, chainId });
    res.json({ success: true, decoded: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
