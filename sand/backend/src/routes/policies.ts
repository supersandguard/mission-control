import { Router, Request, Response } from 'express';
import { evaluatePolicies, PolicyEvaluationRequest } from '../services/policyEngine';

const router = Router();

/**
 * POST /api/policies/evaluate
 * Evaluate policies against a transaction
 */
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const policyReq = req.body as PolicyEvaluationRequest;
    
    // Validate required fields
    if (!policyReq.to) {
      res.status(400).json({ error: 'Missing "to" address' });
      return;
    }
    
    if (!policyReq.data) {
      res.status(400).json({ error: 'Missing "data" field' });
      return;
    }
    
    if (!policyReq.value) {
      res.status(400).json({ error: 'Missing "value" field' });
      return;
    }
    
    const policies = evaluatePolicies(policyReq);
    
    res.json({ 
      success: true, 
      policies,
      summary: {
        total: policies.length,
        triggered: policies.filter(p => p.triggered).length,
        critical: policies.filter(p => p.triggered && p.severity === 'CRITICAL').length,
        high: policies.filter(p => p.triggered && p.severity === 'HIGH').length,
        warning: policies.filter(p => p.triggered && p.severity === 'WARNING').length,
        medium: policies.filter(p => p.triggered && p.severity === 'MEDIUM').length,
        low: policies.filter(p => p.triggered && p.severity === 'LOW').length,
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

export default router;