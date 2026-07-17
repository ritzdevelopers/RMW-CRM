import { Router } from 'express';
import * as ctrl from './builders.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createBuilderSchema, updateBuilderSchema, listBuildersSchema } from './builders.schema.js';

const router = Router();
router.use(authenticate);

router.get('/options', requirePermission('builders.read'), asyncHandler(ctrl.options));
router.get('/', requirePermission('builders.read'), validate({ query: listBuildersSchema }), asyncHandler(ctrl.list));
router.post('/', requirePermission('builders.create'), validate({ body: createBuilderSchema }), asyncHandler(ctrl.create));
router.get('/:id', requirePermission('builders.read'), asyncHandler(ctrl.getOne));
router.patch('/:id', requirePermission('builders.update'), validate({ body: updateBuilderSchema }), asyncHandler(ctrl.update));
router.delete('/:id', requirePermission('builders.delete'), asyncHandler(ctrl.remove));

export default router;
