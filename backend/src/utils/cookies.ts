import type { CookieOptions } from 'express';
import { env } from '../config/env.js';

export function refreshCookieOptions(expiresAt?: Date): CookieOptions {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: env.apiPrefix + '/auth',
  };

  if (env.cookie.domain) {
    opts.domain = env.cookie.domain;
  }
  if (expiresAt) {
    opts.expires = expiresAt;
  }

  return opts;
}
