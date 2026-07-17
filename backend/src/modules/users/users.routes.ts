import { Router } from 'express';
import * as ctrl from './users.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, updateProfileSchema, listUsersSchema } from './users.schema.js';

const router = Router();
router.use(authenticate);

// Self-service profile (any authenticated user)
router.patch('/me/profile', validate({ body: updateProfileSchema }), asyncHandler(ctrl.updateProfile));
router.get('/assignable', asyncHandler(ctrl.assignable));

// Admin user management
router.get('/', requirePermission('users.read'), validate({ query: listUsersSchema }), asyncHandler(ctrl.list));
router.post('/', requirePermission('users.create'), validate({ body: createUserSchema }), asyncHandler(ctrl.create));
router.get('/:id', requirePermission('users.read'), asyncHandler(ctrl.getOne));
router.patch('/:id', requirePermission('users.update'), validate({ body: updateUserSchema }), asyncHandler(ctrl.update));
router.delete('/:id', requirePermission('users.delete'), asyncHandler(ctrl.remove));

export default router;
