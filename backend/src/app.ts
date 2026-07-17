import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { openapiSpec } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { healthcheck } from './db/pool.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(globalLimiter);

  // Health
  app.get('/health', async (_req, res) => {
    const db = await healthcheck();
    res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db, ts: new Date().toISOString() });
  });

  // API docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'MPF CRM API' }));
  app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

  // API routes
  app.use(env.apiPrefix, routes);

  // 404 + error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
