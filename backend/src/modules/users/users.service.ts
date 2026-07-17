import { pool, query, queryOne } from '../../db/pool.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import { parsePagination, paginate } from '../../utils/pagination.js';

const SAFE_SELECT = `
  SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.role_id, r.name AS role,
         r.display_name AS role_display, u.status, u.email_verified_at, u.last_login_at, u.created_at
  FROM users u JOIN roles r ON r.id = u.role_id
`;

export async function list(q: Record<string, any>) {
  const p = parsePagination(q);
  const filters: string[] = ['1=1'];
  const params: any[] = [];
  if (q.status) { filters.push('u.status = ?'); params.push(q.status); }
  if (q.roleId) { filters.push('u.role_id = ?'); params.push(q.roleId); }
  if (q.search) {
    filters.push('(u.name LIKE ? OR u.email LIKE ?)');
    const s = `%${q.search}%`;
    params.push(s, s);
  }
  const where = `WHERE ${filters.join(' AND ')}`;
  const rows = await query(
    `${SAFE_SELECT} ${where} ORDER BY u.created_at DESC LIMIT ${p.pageSize} OFFSET ${p.offset}`,
    params,
  );
  const countRow = await queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
  return paginate(rows, Number(countRow?.total ?? 0), p);
}

export async function getById(id: number) {
  const user = await queryOne(`${SAFE_SELECT} WHERE u.id = ?`, [id]);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function create(input: any) {
  const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [input.email]);
  if (existing) throw ApiError.conflict('Email already in use');
  const hash = await hashPassword(input.password);
  const [result]: any = await pool.execute(
    `INSERT INTO users (name, email, phone, password_hash, role_id, status, email_verified_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [input.name, input.email, input.phone ?? null, hash, input.roleId, input.status ?? 'active'],
  );
  return getById(result.insertId as number);
}

export async function update(id: number, input: any) {
  await getById(id);
  const map: Record<string, any> = {
    name: input.name,
    phone: input.phone,
    avatar_url: input.avatarUrl,
    role_id: input.roleId,
    status: input.status,
  };
  const cols: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { cols.push(`${k} = ?`); vals.push(v); }
  }
  if (cols.length === 0) return getById(id);
  await pool.execute(`UPDATE users SET ${cols.join(', ')} WHERE id = ?`, [...vals, id]);
  return getById(id);
}

export async function remove(id: number, actorId: number) {
  if (id === actorId) throw ApiError.badRequest('You cannot delete your own account');
  await getById(id);
  await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
}

/** Lightweight list of assignable sales users for dropdowns. */
export async function assignable() {
  return query(
    `SELECT u.id, u.name, u.avatar_url, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.status = 'active'
       AND r.name IN ('super_admin','admin','sales_manager','sales_executive','telecaller')
     ORDER BY u.name ASC`,
  );
}
