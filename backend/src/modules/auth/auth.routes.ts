import { Router } from 'express';
import * as ctrl from './auth.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from './auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(ctrl.register));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(ctrl.login));
router.post('/refresh', asyncHandler(ctrl.refresh));
router.post('/logout', asyncHandler(ctrl.logout));

router.post('/verify-email', validate({ body: verifyEmailSchema }), asyncHandler(ctrl.verifyEmail));
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), asyncHandler(ctrl.forgotPassword));
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), asyncHandler(ctrl.resetPassword));

// Authenticated
router.get('/me', authenticate, asyncHandler(ctrl.me));
router.post('/resend-verification', authenticate, asyncHandler(ctrl.resendVerification));
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(ctrl.changePassword));
router.get('/sessions', authenticate, asyncHandler(ctrl.sessions));

export default router;
