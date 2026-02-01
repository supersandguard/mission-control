import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import safeRouter from './routes/safe';
import simulateRouter from './routes/simulate';
import decodeRouter from './routes/decode';
import explainRouter from './routes/explain';
import riskRouter from './routes/risk';
import pollRouter from './routes/poll';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/safe', safeRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/decode', decodeRouter);
app.use('/api/explain', explainRouter);
app.use('/api/risk', riskRouter);
app.use('/api/poll', pollRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SandGuard API', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.log(`🛡️  SandGuard API running on http://localhost:${PORT}`);
});
