import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Import routes inline to keep it bundled
import safeRouter from '../../backend/src/routes/safe';
import simulateRouter from '../../backend/src/routes/simulate';
import decodeRouter from '../../backend/src/routes/decode';
import explainRouter from '../../backend/src/routes/explain';
import riskRouter from '../../backend/src/routes/risk';
import pollRouter from '../../backend/src/routes/poll';
import paymentsRouter from '../../backend/src/routes/payments';
import stripeRouter from '../../backend/src/routes/stripe';

app.use('/api/safe', safeRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/decode', decodeRouter);
app.use('/api/explain', explainRouter);
app.use('/api/risk', riskRouter);
app.use('/api/poll', pollRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stripe', stripeRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SandGuard API', version: '0.3.0', runtime: 'netlify-functions' });
});

export const handler = serverless(app);
