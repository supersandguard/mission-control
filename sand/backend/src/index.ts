import express from 'express';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import safeRouter from './routes/safe';
import simulateRouter from './routes/simulate';
import decodeRouter from './routes/decode';
import explainRouter from './routes/explain';
import riskRouter from './routes/risk';
import policiesRouter from './routes/policies';
import pollRouter from './routes/poll';
import paymentsRouter from './routes/payments';
import stripeRouter from './routes/stripe';
import promoRouter from './routes/promo';
import daimoWebhookRouter from './routes/daimo-webhook';
import authRouter from './routes/auth';
import foundersRouter from './routes/founders';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(compression());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow iframe embedding (needed for Safe App Store) — no X-Frame-Options: DENY
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy — allow self, inline styles (Tailwind), Google Fonts, Safe App iframe embedding
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://supersandguard.com https://*.safe.global https://*.tenderly.co https://*.etherscan.io",
    "frame-ancestors 'self' https://app.safe.global https://*.safe.global",
  ].join('; '));
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Rate limiting (apply only to API routes)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP (dashboard makes ~4 calls per tx)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use(cors({
  origin: [
    'https://supersandguard.com',
    'https://www.supersandguard.com',
    // 'https://sandguard.netlify.app', // deprecated
    'https://web-production-9722f.up.railway.app',
    'https://app.safe.global',       // Safe App Store iframe
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// Apply rate limiting only to API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/safe', safeRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/decode', decodeRouter);
app.use('/api/explain', explainRouter);
app.use('/api/risk', riskRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/poll', pollRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/promo', promoRouter);
app.use('/api/webhooks', daimoWebhookRouter);
app.use('/api/founders', foundersRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SandGuard API' });
});

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// --- Serve Frontend Static Files ---
// Resolve the frontend dist directory (located at backend/frontend-dist)
// When running via tsx from backend/src/index.ts, __dirname = backend/src/
// frontend-dist is at backend/frontend-dist (copied there during build)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '..', 'frontend-dist');

if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Serving frontend from: ${frontendDistPath}`);
  // Serve static assets with smart caching
  app.use(express.static(frontendDistPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Hashed assets (in /assets/) are immutable — cache for 1 year
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // SPA fallback: serve index.html for any non-API route (no-cache so deploys are instant)
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.log(`⚠️  Frontend dist not found at ${frontendDistPath} - serving API only`);
}

// Export for serverless (Netlify Functions)
export default app;

// Start server only when run directly (not imported)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('/index.ts') ||
  process.argv[1].endsWith('/index.js') ||
  process.argv[1].endsWith('/server.cjs')
);

if (isDirectRun) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🛡️  SandGuard API running on http://localhost:${PORT}`);
  });
}
