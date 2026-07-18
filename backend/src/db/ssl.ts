import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SslOptions } from 'mysql2';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Aiven (and most managed MySQL) require TLS. Returns undefined when DB_SSL is off. */
export function getDbSslOptions(): SslOptions | undefined {
  if (!env.db.ssl) return undefined;

  const caPath = env.db.sslCa
    ? isAbsolute(env.db.sslCa)
      ? env.db.sslCa
      : join(process.cwd(), env.db.sslCa)
    : join(__dirname, '../../ca.pem');

  return {
    ca: readFileSync(caPath),
    rejectUnauthorized: true,
  };
}
