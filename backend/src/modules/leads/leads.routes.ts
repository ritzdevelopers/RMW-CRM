import { Router } from 'express';
import * as ctrl from './leads.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsSchema,
  changeStatusSchema,
  assignLeadSchema,
  addActivitySchema,
  bulkActionSchema,
} from './leads.schema.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('leads.read'), validate({ query: listLeadsSchema }), asyncHandler(ctrl.list));
router.post('/', requirePermission('leads.create'), validate({ body: createLeadSchema }), asyncHandler(ctrl.create));
router.post('/bulk', requirePermission('leads.update'), validate({ body: bulkActionSchema }), asyncHandler(ctrl.bulk));

router.get('/:id', requirePermission('leads.read'), asyncHandler(ctrl.getOne));
router.patch('/:id', requirePermission('leads.update'), validate({ body: updateLeadSchema }), asyncHandler(ctrl.update));
router.delete('/:id', requirePermission('leads.delete'), asyncHandler(ctrl.remove));

router.patch('/:id/status', requirePermission('leads.update'), validate({ body: changeStatusSchema }), asyncHandler(ctrl.changeStatus));
router.patch('/:id/assign', requirePermission('leads.assign'), validate({ body: assignLeadSchema }), asyncHandler(ctrl.assign));
router.post('/:id/activities', requirePermission('leads.update'), validate({ body: addActivitySchema }), asyncHandler(ctrl.addActivity));

export default router;
