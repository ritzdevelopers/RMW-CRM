import { pool } from './pool.js';
import { logger } from '../utils/logger.js';

async function cleanDemoData() {
  const [leadResult]: any = await pool.execute(
    `DELETE FROM leads WHERE email LIKE '%@example.com'`,
  );
  const [builderResult]: any = await pool.execute(
    `DELETE FROM builders WHERE name IN ('Prestige Group', 'Godrej Properties', 'DLF Limited', 'Sobha Realty', 'Lodha Group')
     AND id NOT IN (SELECT DISTINCT builder_id FROM leads WHERE builder_id IS NOT NULL)`,
  );

  logger.info(`Removed ${leadResult.affectedRows ?? 0} demo lead(s)`);
  logger.info(`Removed ${builderResult.affectedRows ?? 0} unused demo builder(s)`);
  await pool.end();
}

cleanDemoData().catch((err) => {
  logger.error('Demo cleanup failed', { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
