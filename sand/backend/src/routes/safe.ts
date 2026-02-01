import { Router, Request, Response } from 'express';
import { getPendingTransactions, getAllTransactions, getSafeInfo } from '../services/safeService';

const router = Router();

/**
 * GET /api/safe/:address/transactions
 * Fetch pending transactions for a Safe multisig
 * 
 * Query params:
 *   chainId: number (default 1)
 *   all: boolean (if true, include executed txs)
 */
router.get('/:address/transactions', async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    const chainId = parseInt(req.query.chainId as string) || 1;
    const includeAll = req.query.all === 'true';

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      res.status(400).json({
        error: 'Invalid Safe address',
        message: 'Provide a valid Ethereum address (0x...)',
      });
      return;
    }

    const data = includeAll
      ? await getAllTransactions(address, chainId)
      : await getPendingTransactions(address, chainId);

    res.json({
      success: true,
      chain: chainId,
      address,
      count: data.count,
      transactions: data.results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * GET /api/safe/:address/info
 * Get Safe configuration (owners, threshold, etc.)
 */
router.get('/:address/info', async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    const chainId = parseInt(req.query.chainId as string) || 1;

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      res.status(400).json({ error: 'Invalid Safe address' });
      return;
    }

    const info = await getSafeInfo(address, chainId);
    res.json({ success: true, ...info });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
