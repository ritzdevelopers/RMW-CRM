import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { queryOne } from '../db/pool.js';

/** Authenticates the request via Bearer access token and loads role + permissions. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing access token');
    }
    const token = header.slice(7);

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    const row = await queryOne<{ role: string; permissions: string | null; status: string }>(
      `SELECT r.name AS role, u.status AS status,
              GROUP_CONCAT(p.name) AS permissions
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = ?
       GROUP BY u.id, r.name, u.status`,
      [payload.sub],
    );

    if (!row) throw ApiError.unauthorized('User no longer exists');
    if (row.status === 'suspended') throw ApiError.forbidden('Account suspended');

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: row.role,
      permissions: row.permissions ? row.permissions.split(',') : [],
    };
    next();
  } catch (err) {
    next(err);
  }
}
