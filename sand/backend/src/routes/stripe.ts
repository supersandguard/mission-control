import { Router, Request, Response } from 'express'
import { activateSubscription, deactivateByStripeSubscription, getSubscriptionByEmail } from '../services/db'

const router = Router()

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ''
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://supersandguard.com'

// Helper: call Stripe API
async function stripeRequest(endpoint: string, method: string, body?: Record<string, string>) {
  const opts: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
  if (body) {
    opts.body = new URLSearchParams(body).toString()
  }
  const resp = await fetch(`https://api.stripe.com/v1${endpoint}`, opts)
  return resp.json()
}

// POST /api/stripe/create-checkout
router.post('/create-checkout', async (req: Request, res: Response) => {
  if (!STRIPE_SECRET_KEY) {
    return res.status(503).json({ 
      error: 'Stripe not configured yet',
      message: 'Credit card payments coming soon. Pay with ETH in the meantime.',
      ethPaymentUrl: '/api/payments/info'
    })
  }

  try {
    const { email } = req.body

    const params: Record<string, string> = {
      'mode': 'subscription',
      'success_url': `${FRONTEND_URL}/app?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${FRONTEND_URL}/login?payment=cancelled`,
    }

    if (STRIPE_PRICE_ID) {
      params['line_items[0][price]'] = STRIPE_PRICE_ID
      params['line_items[0][quantity]'] = '1'
    }
    if (email) {
      params['customer_email'] = email
    }

    const session = await stripeRequest('/checkout/sessions', 'POST', params)
    
    if (session.error) {
      return res.status(400).json({ error: session.error.message })
    }

    return res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// POST /api/stripe/webhook - Handle Stripe webhooks
router.post('/webhook', async (req: Request, res: Response) => {
  // TODO: Verify webhook signature with STRIPE_WEBHOOK_SECRET
  const event = req.body

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const email = session.customer_email || session.customer_details?.email
        const customerId = session.customer
        const subscriptionId = session.subscription

        if (email) {
          // Use email as the "address" for Stripe customers
          const { apiKey, expiresAt } = activateSubscription({
            address: `stripe:${email}`,
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: 'pro',
          })
          console.log(`✅ Stripe subscription activated for ${email}, key: ${apiKey.slice(0, 8)}...`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        deactivateByStripeSubscription(sub.id)
        console.log(`❌ Stripe subscription cancelled: ${sub.id}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        if (sub.cancel_at_period_end) {
          console.log(`⚠️ Stripe subscription will cancel at period end: ${sub.id}`)
        }
        break
      }

      default:
        // Ignore other events
        break
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  res.json({ received: true })
})

// GET /api/stripe/status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: !!STRIPE_SECRET_KEY,
    priceId: STRIPE_PRICE_ID ? 'set' : 'not set',
    monthlyPriceUsd: 20
  })
})

// GET /api/stripe/subscription/:email - Check subscription by email
router.get('/subscription/:email', (req: Request, res: Response) => {
  const email = req.params.email.toLowerCase()
  const sub = getSubscriptionByEmail(email)
  
  if (!sub || sub.expires_at < Date.now()) {
    return res.json({ status: 'inactive' })
  }

  return res.json({
    status: 'active',
    plan: sub.plan,
    expiresAt: new Date(sub.expires_at).toISOString(),
    apiKey: sub.api_key,
  })
})

export default router
