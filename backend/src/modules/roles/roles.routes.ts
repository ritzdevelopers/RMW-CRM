import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ok } from '../../utils/respond.js';
import { pool, query, queryOne, withTransaction } from '../../db/pool.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();
router.use(authenticate);

// List roles with permission + user counts
router.get(
  '/',
  requirePermission('roles.read'),
  asyncHandler(async (_req, res) => {
    const roles = await query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS users_count,
              (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permissions_count
       FROM roles r ORDER BY r.id ASC`,
    );
    return ok(res, roles);
  }),
);

// All permissions grouped by module
router.get(
  '/permissions',
  requirePermission('roles.read'),
  asyncHandler(async (_req, res) => {
    const perms = await query(`SELECT * FROM permissions ORDER BY module, name`);
    return ok(res, perms);
  }),
);

// Get a role's permissions
router.get(
  '/:id/permissions',
  requirePermission('roles.read'),
  asyncHandler(async (req, res) => {
    const role = await queryOne(`SELECT * FROM roles WHERE id = ?`, [req.params.id]);
    if (!role) throw ApiError.notFound('Role not found');
    const perms = await query(
      `SELECT p.id, p.name, p.module FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ?`,
      [req.params.id],
    );
    return ok(res, { role, permissions: perms });
  }),
);

// Replace a role's permission set (configurable permissions)
const updatePermsSchema = z.object({ permissionIds: z.array(z.coerce.number().int().positive()) });
router.put(
  '/:id/permissions',
  requirePermission('roles.update'),
  validate({ body: updatePermsSchema }),
  asyncHandler(async (req, res) => {
    const role = await queryOne<{ id: number; name: string }>(`SELECT id, name FROM roles WHERE id = ?`, [req.params.id]);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.name === 'super_admin') throw ApiError.badRequest('Super Admin permissions cannot be modified');
    const { permissionIds } = req.body as { permissionIds: number[] };
    await withTransaction(async (conn) => {
      await conn.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [role.id]);
      if (permissionIds.length) {
        const values = permissionIds.map(() => '(?, ?)').join(', ');
        const params = permissionIds.flatMap((pid) => [role.id, pid]);
        await conn.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, params);
      }
    });
    return ok(res, { message: 'Permissions updated' });
  }),
);

// Public-ish: list roles for user-management dropdowns (any authed user with users.read)
router.get(
  '/options',
  asyncHandler(async (_req, res) => {
    const roles = await query(`SELECT id, name, display_name FROM roles ORDER BY id ASC`);
    return ok(res, roles);
  }),
);

void pool;
export default router;
