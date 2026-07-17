export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details?: unknown) {
    return new ApiError(400, msg, 'bad_request', details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg, 'unauthorized');
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg, 'forbidden');
  }
  static notFound(msg = 'Not found') {
    return new ApiError(404, msg, 'not_found');
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg, 'conflict');
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg, 'rate_limited');
  }
  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg, 'internal_error');
  }
}
