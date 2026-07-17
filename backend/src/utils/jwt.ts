import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: number;          // user id
  role: string;         // role machine name
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as unknown as AccessTokenPayload;
}

/** Refresh tokens are opaque random strings hashed in DB; we still sign a wrapper
 *  so the cookie carries the raw token that we can look up. Here we keep it simple:
 *  the raw refresh token itself is a random string (see auth.service). */
export function refreshTokenTtlMs(): number {
  // parse "7d" / "15m" style — supports d/h/m/s
  const raw = env.jwt.refreshExpiresIn;
  const match = /^(\d+)([dhms])$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = unit === 'd' ? 86400000 : unit === 'h' ? 3600000 : unit === 'm' ? 60000 : 1000;
  return n * mult;
}
