import { Router, Request, Response } from 'express'
import { redeemPromoCode, getAllPromoCodes } from '../services/db'

const router = Router()

// POST /api/promo/redeem - Redeem a promo code
router.post('/redeem', (req: Request, res: Response) => {
  const { code, address } = req.body

  if (!code || !address) {
    return res.status(400).json({ error: 'code and address are required' })
  }

  const result = redeemPromoCode(code.toUpperCase().trim(), address)

  if ('error' in result) {
    return res.status(400).json(result)
  }

  return res.json({
    status: 'activated',
    apiKey: result.apiKey,
    expiresAt: new Date(result.expiresAt).toISOString(),
    plan: 'pro',
    message: 'Promo code redeemed! Your 90-day trial is active.'
  })
})

// GET /api/promo/validate/:code - Check if a code is valid (without redeeming)
router.get('/validate/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase().trim()
  const promos = getAllPromoCodes()
  const promo = promos.find(p => p.code === code && p.active)

  if (!promo) {
    return res.json({ valid: false, message: 'Invalid code' })
  }

  if (promo.used_count >= promo.max_uses) {
    return res.json({ valid: false, message: 'Code already used' })
  }

  return res.json({
    valid: true,
    plan: promo.plan,
    durationDays: promo.duration_days,
    message: `Valid! ${promo.duration_days}-day ${promo.plan} access`
  })
})

export default router
