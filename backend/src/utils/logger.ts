/* Minimal structured logger — swap for pino/winston in production if desired. */
type Level = 'debug' | 'info' | 'warn' | 'error';

const pretty =
  // default: pretty in dev, json in prod
  (process.env.LOG_FORMAT ?? '').toLowerCase() !== 'json' && process.env.NODE_ENV !== 'production';

function log(level: Level, msg: string, meta?: unknown) {
  if (pretty) {
    const line = meta ? `${msg} ${safeMeta(meta)}` : msg;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  const entry = { ts: new Date().toISOString(), level, msg, ...(meta ? { meta } : {}) };
  const json = JSON.stringify(entry);
  if (level === 'error') console.error(json);
  else if (level === 'warn') console.warn(json);
  else console.log(json);
}

function safeMeta(meta: unknown): string {
  try {
    if (typeof meta === 'string') return `(${meta})`;
    if (typeof meta === 'number' || typeof meta === 'boolean') return `(${String(meta)})`;
    if (meta && typeof meta === 'object') {
      const obj = meta as Record<string, unknown>;
      const parts = Object.entries(obj)
        .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(' ');
      return parts ? `(${parts})` : '';
    }
    return `(${String(meta)})`;
  } catch {
    return '';
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
};
