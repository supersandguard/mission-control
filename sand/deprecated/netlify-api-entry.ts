import serverless from 'serverless-http';
import app from './backend/src/index';

const handler = serverless(app);

export { handler };
