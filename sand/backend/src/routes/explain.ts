import { Router, Request, Response } from 'express';
import { explainTransaction } from '../services/explainService';
import { decodeTransaction } from '../services/decodeService';
import { simulateTransaction } from '../services/simulationService';
import { ExplainRequest } from '../types';
import { 
  isValidEthereumAddress, 
  isValidChainId, 
  isValidHexString, 
  isValidCalldataSize,
  ValidationException
} from '../middleware/validation';

const router = Router();

function sanitize(input: string): string {
  return input.replace(/[<>"'&]/g, '');
}

/**
 * POST /api/explain
 * 
 * Accepts EITHER:
 *   1. { decoded, simulation, chainId }  — original format (pre-decoded data)
 *   2. { calldata, contractAddress, chainId, from?, value? } — standalone mode
 *      Internally calls decode → simulate → explain in one shot.
 *      Developer-friendly for agents and integrations.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { decoded, simulation, calldata, contractAddress, chainId = 1, from, value } = req.body;

    // Mode 1: Pre-decoded data provided
    if (decoded && simulation) {
      const result = explainTransaction({ decoded, simulation, chainId });
      res.json({ success: true, explanation: result });
      return;
    }

    // Mode 2: Standalone — calldata + contractAddress
    if (calldata && contractAddress) {
      const sanitizedCalldata = sanitize(calldata);
      const sanitizedAddress = sanitize(contractAddress);
      const sanitizedFrom = from ? sanitize(from) : undefined;

      // Step 1: Decode
      const decodedResult = await decodeTransaction({
        calldata: sanitizedCalldata,
        contractAddress: sanitizedAddress,
        chainId,
      });

      // Step 2: Simulate
      const simulationResult = await simulateTransaction({
        to: sanitizedAddress,
        value: value || '0',
        data: sanitizedCalldata,
        chainId,
        from: sanitizedFrom,
      });

      // Step 3: Explain
      const explanation = explainTransaction({
        decoded: decodedResult,
        simulation: simulationResult,
        chainId,
      });

      res.json({
        success: true,
        explanation,
        decoded: decodedResult,
        simulation: simulationResult,
      });
      return;
    }

    res.status(400).json({
      error: 'Provide either { decoded, simulation } or { calldata, contractAddress } for standalone mode',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
