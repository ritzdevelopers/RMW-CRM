import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

const SUPER_ADMIN = 'super_admin';

/** Requires the user to hold ALL of the given permissions (super_admin bypasses). */
export function requirePermission(...needed: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === SUPER_ADMIN) return next();
    const has = needed.every((p) => req.user!.permissions.includes(p));
    if (!has) return next(ApiError.forbidden('You do not have permission to perform this action'));
    next();
  };
}

/** Requires the user to hold one of the given roles (super_admin bypasses). */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === SUPER_ADMIN) return next();
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role'));
    }
    next();
  };
}
