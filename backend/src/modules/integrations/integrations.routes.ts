import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { mpfEnquiryWebhookSchema } from './mpf.schema.js';
import * as ctrl from './mpf.controller.js';

const router = Router();

router.post(
  '/mpf/enquiry',
  validate({ body: mpfEnquiryWebhookSchema }),
  asyncHandler(ctrl.webhook),
);

router.post(
  '/mpf/sync',
  authenticate,
  requirePermission('leads.import'),
  asyncHandler(ctrl.syncFromMpf),
);

export default router;
