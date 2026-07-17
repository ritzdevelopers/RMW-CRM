import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: false,
  enableKeepAlive: true,
});

/** Typed query helper returning rows. */
export async function query<T = any>(sql: string, params?: Record<string, any> | any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params as any);
  return rows as T[];
}

/** Query helper returning a single row (or null). */
export async function queryOne<T = any>(
  sql: string,
  params?: Record<string, any> | any[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run a set of statements inside a transaction. */
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function healthcheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

function formatDbError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (err instanceof Error) {
    const anyErr = err as any;
    const parts = [err.message];
    if (anyErr.code) parts.push(`code=${String(anyErr.code)}`);
    if (anyErr.errno) parts.push(`errno=${String(anyErr.errno)}`);
    if (anyErr.sqlState) parts.push(`sqlState=${String(anyErr.sqlState)}`);
    return parts.join(' ');
  }
  return String(err);
}

export async function probeDb(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatDbError(err) };
  }
}
