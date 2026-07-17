import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { ok } from '../../utils/respond.js';
import { pool, query, queryOne } from '../../db/pool.js';
import { parsePagination, paginate } from '../../utils/pagination.js';

const router = Router();
router.use(authenticate);

// List (with unread filter + pagination)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const p = parsePagination(req.query);
    const onlyUnread = req.query.unread === 'true';
    const where = onlyUnread ? 'WHERE user_id = ? AND read_at IS NULL' : 'WHERE user_id = ?';
    const rows = await query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ${p.pageSize} OFFSET ${p.offset}`,
      [req.user!.id],
    );
    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM notifications ${where}`,
      [req.user!.id],
    );
    return ok(res, paginate(rows, Number(countRow?.total ?? 0), p));
  }),
);

// Unread count
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const row = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL`,
      [req.user!.id],
    );
    return ok(res, { count: Number(row?.total ?? 0) });
  }),
);

// Mark one read
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await pool.execute(
      `UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ? AND read_at IS NULL`,
      [req.params.id, req.user!.id],
    );
    return ok(res, { message: 'ok' });
  }),
);

// Mark all read
router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await pool.execute(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
      [req.user!.id],
    );
    return ok(res, { message: 'ok' });
  }),
);

export default router;
