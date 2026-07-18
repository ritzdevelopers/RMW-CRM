import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SslOptions } from 'mysql2';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveCa(): string | Buffer {
  // Prefer inline PEM (Render / hosted envs — ca.pem is gitignored).
  if (env.db.sslCaCert.trim()) {
    return env.db.sslCaCert;
  }

  const caPath = env.db.sslCa
    ? isAbsolute(env.db.sslCa)
      ? env.db.sslCa
      : join(process.cwd(), env.db.sslCa)
    : join(__dirname, '../../ca.pem');

  if (!existsSync(caPath)) {
    throw new Error(
      `DB_SSL is enabled but no CA cert found. Set DB_CA_CERT (PEM contents) or place ca.pem at ${caPath}`,
    );
  }

  return readFileSync(caPath);
}

/** Aiven (and most managed MySQL) require TLS. Returns undefined when DB_SSL is off. */
export function getDbSslOptions(): SslOptions | undefined {
  if (!env.db.ssl) return undefined;

  return {
    ca: resolveCa(),
    rejectUnauthorized: true,
  };
}
