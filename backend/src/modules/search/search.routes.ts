import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { ok } from '../../utils/respond.js';
import { query } from '../../db/pool.js';

const router = Router();
router.use(authenticate);

/**
 * Global search (Ctrl+K). Searches leads and builders (and users for admins).
 * Returns grouped, highlighted-ready results.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const term = String(req.query.q ?? '').trim();
    if (term.length < 2) return ok(res, { leads: [], builders: [], users: [] });
    const like = `%${term}%`;
    const restricted = ['sales_executive', 'telecaller'].includes(req.user!.role);

    const leads = await query(
      `SELECT id, name, phone, email, status FROM leads
       WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ?)
       ${restricted ? 'AND (assigned_to = ? OR owner_id = ?)' : ''}
       ORDER BY updated_at DESC LIMIT 6`,
      restricted ? [like, like, like, req.user!.id, req.user!.id] : [like, like, like],
    );

    const builders = await query(
      `SELECT id, name, city, status FROM builders
       WHERE name LIKE ? OR city LIKE ? OR contact_person LIKE ?
       ORDER BY updated_at DESC LIMIT 6`,
      [like, like, like],
    );

    let users: any[] = [];
    if (!restricted) {
      users = await query(
        `SELECT u.id, u.name, u.email, r.display_name AS role FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.name LIKE ? OR u.email LIKE ? LIMIT 5`,
        [like, like],
      );
    }

    return ok(res, { leads, builders, users });
  }),
);

export default router;
