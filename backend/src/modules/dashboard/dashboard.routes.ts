import { Router } from 'express';
import * as service from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { ok } from '../../utils/respond.js';

const router = Router();
router.use(authenticate);

const actor = (req: any) => ({ id: req.user.id, role: req.user.role });

router.get('/overview', asyncHandler(async (req, res) => ok(res, await service.overview(actor(req)))));
router.get('/team', asyncHandler(async (req, res) => ok(res, await service.teamPerformance(actor(req)))));
router.get('/tasks', asyncHandler(async (req, res) => ok(res, await service.todaysTasks(actor(req)))));
router.get('/activities', asyncHandler(async (req, res) => ok(res, await service.recentActivities(actor(req)))));

export default router;
