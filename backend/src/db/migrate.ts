import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');

  // Connect WITHOUT a database so CREATE DATABASE works, allow multi-statements.
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  logger.info('Running schema migration…');
  await conn.query(sql);
  await conn.end();
  logger.info('✅ Migration complete');
}

migrate().catch((err) => {
  logger.error('Migration failed', { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
