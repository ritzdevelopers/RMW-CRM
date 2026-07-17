import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { pool, probeDb } from './db/pool.js';

async function bootstrap() {
  const db = await probeDb();
  if (db.ok) {
    logger.info('DB connected');
  } else {
    logger.warn(`DB connection failed (${db.error})`);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`Server connected to port ${env.port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
