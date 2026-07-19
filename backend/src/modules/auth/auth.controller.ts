import type { Request, Response } from 'express';
import * as service from './auth.service.js';
import { ok, created } from '../../utils/respond.js';
import { env } from '../../config/env.js';
import { clientIp, audit } from '../../utils/audit.js';
import { ApiError } from '../../utils/ApiError.js';
import { refreshCookieOptions } from '../../utils/cookies.js';

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(env.cookie.refreshName, token, refreshCookieOptions(expiresAt));
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(env.cookie.refreshName, refreshCookieOptions());
}

export async function register(req: Request, res: Response) {
  const user = await service.register(req.body);
  audit({ actorId: (user as any)?.id, action: 'auth.register', entityType: 'user', entityId: (user as any)?.id, ip: clientIp(req) });
  return created(res, { user, message: 'Account created. Please verify your email.' });
}

export async function login(req: Request, res: Response) {
  const { email, password, rememberMe } = req.body;
  const result = await service.login(email, password, {
    userAgent: req.headers['user-agent'],
    ip: clientIp(req),
    rememberMe,
  });
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  audit({ actorId: (result.user as any)?.id, action: 'auth.login', entityType: 'user', entityId: (result.user as any)?.id, ip: clientIp(req) });
  return ok(res, { accessToken: result.accessToken, user: result.user });
}

export async function firebaseLogin(req: Request, res: Response) {
  const { idToken, rememberMe } = req.body;
  const result = await service.firebaseLogin(idToken, {
    userAgent: req.headers['user-agent'],
    ip: clientIp(req),
    rememberMe,
  });
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  audit({ actorId: (result.user as any)?.id, action: 'auth.firebase_login', entityType: 'user', entityId: (result.user as any)?.id, ip: clientIp(req) });
  return ok(res, { accessToken: result.accessToken, user: result.user });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[env.cookie.refreshName];
  if (!token) throw ApiError.unauthorized('No session');
  const result = await service.refresh(token, {
    userAgent: req.headers['user-agent'],
    ip: clientIp(req),
  });
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  return ok(res, { accessToken: result.accessToken, user: result.user });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[env.cookie.refreshName];
  await service.logout(token);
  clearRefreshCookie(res);
  return ok(res, { message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  const user = await service.getUserById(req.user!.id);
  return ok(res, { user, permissions: req.user!.permissions });
}

export async function verifyEmail(req: Request, res: Response) {
  await service.verifyEmail(req.body.token);
  return ok(res, { message: 'Email verified successfully' });
}

export async function resendVerification(req: Request, res: Response) {
  await service.resendVerification(req.user!.id);
  return ok(res, { message: 'Verification email sent' });
}

export async function forgotPassword(req: Request, res: Response) {
  await service.forgotPassword(req.body.email);
  return ok(res, { message: 'If an account exists, a reset link has been sent' });
}

export async function resetPassword(req: Request, res: Response) {
  await service.resetPassword(req.body.token, req.body.password);
  return ok(res, { message: 'Password reset successfully. You can now sign in.' });
}

export async function changePassword(req: Request, res: Response) {
  await service.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  audit({ actorId: req.user!.id, action: 'auth.change_password', entityType: 'user', entityId: req.user!.id, ip: clientIp(req) });
  return ok(res, { message: 'Password changed successfully' });
}

export async function sessions(req: Request, res: Response) {
  const list = await service.listSessions(req.user!.id);
  return ok(res, list);
}
