import type { Request } from 'express';
import { pool } from '../db/pool.js';
import { logger } from './logger.js';

interface AuditInput {
  actorId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  ip?: string | null;
  meta?: Record<string, unknown> | null;
}

/** Fire-and-forget audit log write (never blocks the request path). */
export function audit(input: AuditInput): void {
  pool
    .execute(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, ip_address, meta_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.actorId ?? null,
        input.action,
        input.entityType,
        input.entityId != null ? String(input.entityId) : null,
        input.ip ?? null,
        input.meta ? JSON.stringify(input.meta) : null,
      ],
    )
    .catch((err) => logger.error('audit log failed', { err: String(err) }));
}

export function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.ip ?? req.socket.remoteAddress ?? '';
}
