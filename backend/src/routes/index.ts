import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import rolesRoutes from '../modules/roles/roles.routes.js';
import leadsRoutes from '../modules/leads/leads.routes.js';
import buildersRoutes from '../modules/builders/builders.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import searchRoutes from '../modules/search/search.routes.js';

import integrationsRoutes from '../modules/integrations/integrations.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/leads', leadsRoutes);
router.use('/builders', buildersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/integrations', integrationsRoutes);

export default router;
