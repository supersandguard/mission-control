import { Router, Request, Response } from 'express';
import { getPendingTransactions } from '../services/safeService';
import { simulateTransaction } from '../services/simulationService';
import { decodeTransaction } from '../services/decodeService';
import { assessRisk } from '../services/riskService';

const router = Router();

interface EnrichedTx {
  safeTxHash: string;
  nonce: number;
  to: string;
  value: string;
  data: string;
  confirmations: number;
  confirmationsRequired: number;
  isExecuted: boolean;
  submissionDate: string;
  decoded?: any;
  simulation?: any;
  risk?: any;
  summary?: string;
}

/**
 * GET /api/poll/:address
 * 
 * Full enriched poll: fetches pending transactions, decodes, simulates, and scores risk.
 * Returns a ready-to-display summary for each transaction.
 * 
 * Use this from Clawdbot heartbeat to check for new pending txs.
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    const chainId = parseInt(req.query.chainId as string) || 8453;

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      res.status(400).json({ error: 'Invalid Safe address' });
      return;
    }

    const pending = await getPendingTransactions(address, chainId);
    
    if (pending.count === 0) {
      res.json({ success: true, count: 0, transactions: [], summary: 'No hay transacciones pendientes.' });
      return;
    }

    const enriched: EnrichedTx[] = [];

    for (const rawTx of pending.results.slice(0, 10)) { // max 10
      const tx: EnrichedTx = {
        safeTxHash: rawTx.safeTxHash,
        nonce: rawTx.nonce,
        to: rawTx.to,
        value: rawTx.value,
        data: rawTx.data || '0x',
        confirmations: rawTx.confirmations?.length || 0,
        confirmationsRequired: rawTx.confirmationsRequired,
        isExecuted: rawTx.isExecuted,
        submissionDate: rawTx.submissionDate,
      };

      try {
        // Decode
        const decoded = await decodeTransaction({
          calldata: tx.data,
          contractAddress: tx.to,
          chainId,
        });
        tx.decoded = decoded;

        // Simulate
        const simulation = await simulateTransaction({
          to: tx.to,
          value: tx.value,
          data: tx.data,
          chainId,
          from: address,
        });
        tx.simulation = simulation;

        // Risk
        const risk = assessRisk({
          to: tx.to,
          value: tx.value,
          data: tx.data,
          chainId,
          decoded,
          simulation,
        });
        tx.risk = risk;

        // Generate human-readable summary in Spanish
        const riskEmoji = risk.score === 'green' ? '🟢' : risk.score === 'yellow' ? '🟡' : '🔴';
        const funcName = decoded.functionName || 'Unknown';
        const protocol = decoded.protocol ? ` (${decoded.protocol.name})` : '';
        const warnings = risk.reasons
          .filter(r => r.level === 'red' || r.level === 'yellow')
          .map(r => r.messageEs)
          .join('; ');

        tx.summary = `${riskEmoji} #${tx.nonce}: ${funcName}${protocol}${warnings ? ' — ⚠️ ' + warnings : ''} [${tx.confirmations}/${tx.confirmationsRequired} firmas]`;
      } catch (e) {
        tx.summary = `❓ #${tx.nonce}: Error al analizar — ${(e as Error).message}`;
      }

      enriched.push(tx);
    }

    // Overall summary
    const redCount = enriched.filter(t => t.risk?.score === 'red').length;
    const yellowCount = enriched.filter(t => t.risk?.score === 'yellow').length;
    const greenCount = enriched.filter(t => t.risk?.score === 'green').length;

    const overallSummary = `📋 ${enriched.length} tx pendiente(s): ${redCount > 0 ? `🔴${redCount} peligro ` : ''}${yellowCount > 0 ? `🟡${yellowCount} cuidado ` : ''}${greenCount > 0 ? `🟢${greenCount} ok` : ''}`.trim();

    res.json({
      success: true,
      count: enriched.length,
      summary: overallSummary,
      transactions: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
