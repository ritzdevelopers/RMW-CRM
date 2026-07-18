import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SslOptions } from 'mysql2';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function isCompletePem(value: string): boolean {
  return (
    value.includes('-----BEGIN CERTIFICATE-----') &&
    value.includes('-----END CERTIFICATE-----')
  );
}

function resolveCaFromFile(): Buffer {
  const caPath = env.db.sslCa
    ? isAbsolute(env.db.sslCa)
      ? env.db.sslCa
      : join(process.cwd(), env.db.sslCa)
    : join(__dirname, '../../ca.pem');

  if (!existsSync(caPath)) {
    throw new Error(
      `DB_SSL is enabled but no CA cert found. Set DB_CA_CERT (full PEM) or place ca.pem at ${caPath}`,
    );
  }

  return readFileSync(caPath);
}

function resolveCa(): string | Buffer {
  const inline = env.db.sslCaCert.trim();
  // dotenv truncates unquoted multiline values — only use a complete PEM.
  if (inline && isCompletePem(inline)) {
    return inline;
  }

  return resolveCaFromFile();
}

/** Aiven (and most managed MySQL) require TLS. Returns undefined when DB_SSL is off. */
export function getDbSslOptions(): SslOptions | undefined {
  if (!env.db.ssl) return undefined;

  return {
    ca: resolveCa(),
    rejectUnauthorized: true,
  };
}
