import path from 'path';
import express from 'express';
import cors from 'cors';
import { middleware as openApiValidator } from 'express-openapi-validator';
import authController from './controllers/auth.controller';
import postController from './controllers/post.controller';
import { activityTracker } from './middleware/activityTracker.middleware';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
app.use(express.json());

// Validate all requests against the OpenAPI spec before they reach any route handler.
// Malformed bodies, missing required fields, and wrong enum values are rejected with 400
// before any service code runs.
// ignorePaths skips validation for test-only and health routes not in the spec.
app.use(
  openApiValidator({
    apiSpec: path.join(__dirname, '../openapi.yaml'),
    validateRequests: true,
    validateResponses: false,
    ignorePaths: /^\/(health|api\/test)(\/.*)?$/,
  }),
);

// Public routes
app.use('/api/auth', authController());

// Test-only seed/cleanup routes — stripped from production builds
if (process.env.NODE_ENV === 'test') {
  const testController = require('./controllers/test.controller').default;
  app.use('/api/test', testController());
}

// Protected routes — JWT required + activity tracking on every request
app.use('/api', authMiddleware, activityTracker);
app.use('/api/posts', postController());

app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });

// Forward express-openapi-validator errors as clean JSON
app.use((err: { status?: number; message?: string; errors?: unknown[] }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status ?? 500).json({ error: err.message, errors: err.errors });
});

export default app;
