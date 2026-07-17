import crypto from 'node:crypto';

/** Generate a cryptographically-random opaque token (url-safe). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** SHA-256 hash of a token for at-rest storage (never store raw tokens). */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
