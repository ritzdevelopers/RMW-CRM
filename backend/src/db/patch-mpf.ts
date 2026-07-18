import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { getDbSslOptions } from './ssl.js';
import { logger } from '../utils/logger.js';

async function patchMpfIntegration() {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    ssl: getDbSslOptions(),
  });

  logger.info('Applying MPF integration patch…');

  await conn.query(`
    ALTER TABLE leads
      MODIFY COLUMN source ENUM(
        'website','meta','google','referral','walk_in','manual','import','other','my_property_fact'
      ) NOT NULL DEFAULT 'manual'
  `);

  const [cols]: any = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leads' AND COLUMN_NAME IN ('external_source', 'external_id')`,
    [env.db.database],
  );
  const existing = new Set(cols.map((c: { COLUMN_NAME: string }) => c.COLUMN_NAME));

  if (!existing.has('external_source')) {
    await conn.query(`ALTER TABLE leads ADD COLUMN external_source VARCHAR(32) NULL AFTER source`);
  }
  if (!existing.has('external_id')) {
    await conn.query(`ALTER TABLE leads ADD COLUMN external_id VARCHAR(64) NULL AFTER external_source`);
  }

  const [indexes]: any = await conn.query(`SHOW INDEX FROM leads WHERE Key_name = 'uq_lead_external'`);
  if (indexes.length === 0) {
    await conn.query(`CREATE UNIQUE INDEX uq_lead_external ON leads (external_source, external_id)`);
  }

  await conn.end();
  logger.info('✅ MPF integration patch complete');
}

patchMpfIntegration().catch((err) => {
  logger.error('MPF patch failed', { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
