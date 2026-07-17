import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound('Route not found'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (isDuplicateKey(err)) {
    apiError = ApiError.conflict('A record with these details already exists');
  } else {
    apiError = ApiError.internal();
    logger.error('Unhandled error', {
      path: req.path,
      method: req.method,
      error: err instanceof Error ? err.stack : String(err),
    });
  }

  res.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(!env.isProd && apiError.status >= 500 && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  });
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as any).code === 'ER_DUP_ENTRY';
}
