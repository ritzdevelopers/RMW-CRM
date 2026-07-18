import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getDbSslOptions } from './ssl.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const rawSql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  // Keep schema.sql and DB_NAME in sync (seed/pool use env.db.database).
  const dbName = env.db.database.replace(/`/g, '');
  const sql = rawSql
    .replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`/i, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    .replace(/USE `[^`]+`;/i, `USE \`${dbName}\`;`);

  // Connect WITHOUT a database so CREATE DATABASE works, allow multi-statements.
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    ssl: getDbSslOptions(),
  });

  logger.info(`Running schema migration into \`${dbName}\`…`);
  await conn.query(sql);
  await conn.end();
  logger.info('✅ Migration complete');
}

migrate().catch((err) => {
  logger.error('Migration failed', { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
