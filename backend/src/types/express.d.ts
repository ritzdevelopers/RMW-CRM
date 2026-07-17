import 'express';

declare global {
  namespace Express {
    interface AuthUser {
      id: number;
      email: string;
      role: string;
      permissions: string[];
    }
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
