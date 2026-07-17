import { pool, query, queryOne, withTransaction } from '../../db/pool.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken, refreshTokenTtlMs } from '../../utils/jwt.js';
import { randomToken, hashToken } from '../../utils/tokens.js';
import { sendMail, verificationEmail, resetPasswordEmail } from '../../utils/mailer.js';
import { env } from '../../config/env.js';
import type { RegisterInput } from './auth.schema.js';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  avatar_url: string | null;
  role_id: number;
  role: string;
  status: string;
  email_verified_at: string | null;
}

async function getUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [email],
  );
}

export async function getUserById(id: number): Promise<Omit<UserRow, 'password_hash'> | null> {
  return queryOne(
    `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.role_id, r.name AS role,
            u.status, u.email_verified_at, u.last_login_at, u.created_at
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [id],
  );
}

/** Registers a new user with the default "sales_executive" role and sends a verify email. */
export async function register(input: RegisterInput) {
  const existing = await getUserByEmail(input.email);
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const role = await queryOne<{ id: number }>(
    `SELECT id FROM roles WHERE name = 'sales_executive' LIMIT 1`,
  );
  if (!role) throw ApiError.internal('Default role not configured. Run db:seed.');

  const passwordHash = await hashPassword(input.password);
  const result: any = await pool.execute(
    `INSERT INTO users (name, email, phone, password_hash, role_id, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [input.name, input.email, input.phone ?? null, passwordHash, role.id],
  );
  const userId = result[0].insertId as number;

  await issueEmailVerification(userId, input.email, input.name);
  return getUserById(userId);
}

async function issueEmailVerification(userId: number, email: string, name: string) {
  const raw = randomToken();
  await pool.execute(
    `INSERT INTO auth_tokens (user_id, type, token_hash, expires_at)
     VALUES (?, 'email_verify', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
    [userId, hashToken(raw)],
  );
  const url = `${env.appUrl}/verify-email?token=${raw}`;
  await sendMail({ to: email, subject: 'Verify your email — MPF CRM', html: verificationEmail(name, url) });
}

/** Creates an access token + a rotating refresh token (returns raw refresh token for cookie). */
export async function issueTokens(
  user: { id: number; email: string; role: string },
  ctx: { userAgent?: string; ip?: string; rememberMe?: boolean },
) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const rawRefresh = randomToken(48);
  const ttl = ctx.rememberMe ? refreshTokenTtlMs() : refreshTokenTtlMs();
  const expiresAt = new Date(Date.now() + ttl);

  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, hashToken(rawRefresh), ctx.userAgent ?? null, ctx.ip ?? null, expiresAt],
  );

  return { accessToken, refreshToken: rawRefresh, refreshExpiresAt: expiresAt };
}

export async function login(
  email: string,
  password: string,
  ctx: { userAgent?: string; ip?: string; rememberMe?: boolean },
) {
  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) throw ApiError.unauthorized('Invalid email or password');
  if (user.status === 'suspended') throw ApiError.forbidden('Account suspended');

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  await pool.execute(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id]);

  const tokens = await issueTokens(
    { id: user.id, email: user.email, role: user.role },
    ctx,
  );
  const safeUser = await getUserById(user.id);
  return { ...tokens, user: safeUser };
}

/** Rotates a refresh token: validates, revokes old, issues new. */
export async function refresh(rawToken: string, ctx: { userAgent?: string; ip?: string }) {
  const tokenHash = hashToken(rawToken);
  const row = await queryOne<{ id: number; user_id: number; expires_at: string; revoked_at: string | null }>(
    `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?`,
    [tokenHash],
  );
  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  return withTransaction(async (conn) => {
    await conn.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`, [row.id]);
    const user = await getUserById(row.user_id);
    if (!user) throw ApiError.unauthorized('User no longer exists');
    const tokens = await issueTokens(
      { id: user.id, email: user.email, role: (user as any).role },
      ctx,
    );
    return { ...tokens, user };
  });
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  await pool.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?`, [
    hashToken(rawToken),
  ]);
}

export async function verifyEmail(rawToken: string) {
  const row = await queryOne<{ id: number; user_id: number; expires_at: string; used_at: string | null }>(
    `SELECT id, user_id, expires_at, used_at FROM auth_tokens
     WHERE token_hash = ? AND type = 'email_verify'`,
    [hashToken(rawToken)],
  );
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    throw ApiError.badRequest('Invalid or expired verification link');
  }
  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE auth_tokens SET used_at = NOW() WHERE id = ?`, [row.id]);
    await conn.execute(`UPDATE users SET email_verified_at = NOW() WHERE id = ?`, [row.user_id]);
  });
}

export async function forgotPassword(email: string) {
  const user = await getUserByEmail(email);
  // Always succeed silently to avoid user enumeration.
  if (!user) return;
  const raw = randomToken();
  await pool.execute(
    `INSERT INTO auth_tokens (user_id, type, token_hash, expires_at)
     VALUES (?, 'password_reset', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
    [user.id, hashToken(raw)],
  );
  const url = `${env.appUrl}/reset-password?token=${raw}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your password — MPF CRM',
    html: resetPasswordEmail(user.name, url),
  });
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const row = await queryOne<{ id: number; user_id: number; expires_at: string; used_at: string | null }>(
    `SELECT id, user_id, expires_at, used_at FROM auth_tokens
     WHERE token_hash = ? AND type = 'password_reset'`,
    [hashToken(rawToken)],
  );
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset link');
  }
  const passwordHash = await hashPassword(newPassword);
  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE auth_tokens SET used_at = NOW() WHERE id = ?`, [row.id]);
    await conn.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, row.user_id]);
    // Revoke all active sessions for safety.
    await conn.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`, [
      row.user_id,
    ]);
  });
}

export async function changePassword(userId: number, current: string, next: string) {
  const user = await queryOne<{ password_hash: string | null }>(
    `SELECT password_hash FROM users WHERE id = ?`,
    [userId],
  );
  if (!user?.password_hash) throw ApiError.badRequest('Password change not available for this account');
  const valid = await verifyPassword(current, user.password_hash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');
  const hash = await hashPassword(next);
  await pool.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, userId]);
}

export async function resendVerification(userId: number) {
  const user = await getUserById(userId);
  if (!user) throw ApiError.notFound();
  if (user.email_verified_at) throw ApiError.badRequest('Email already verified');
  await issueEmailVerification(user.id, user.email, user.name);
}

/** Convenience for listing a user's active sessions. */
export async function listSessions(userId: number) {
  return query(
    `SELECT id, user_agent, ip_address, created_at, expires_at
     FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId],
  );
}
