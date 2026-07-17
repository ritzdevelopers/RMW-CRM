import { pool, query, queryOne } from '../../db/pool.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, paginate, buildSort } from '../../utils/pagination.js';
import type { CreateBuilderInput, UpdateBuilderInput } from './builders.schema.js';

const SORT_MAP: Record<string, string> = {
  created_at: 'created_at',
  name: 'name',
  projects_count: 'projects_count',
  tier: 'tier',
  status: 'status',
};

export async function list(q: Record<string, any>) {
  const p = parsePagination(q);
  const filters: string[] = ['1=1'];
  const params: any[] = [];
  if (q.status) { filters.push('status = ?'); params.push(q.status); }
  if (q.tier) { filters.push('tier = ?'); params.push(q.tier); }
  if (q.city) { filters.push('city = ?'); params.push(q.city); }
  if (q.search) {
    filters.push('(name LIKE ? OR legal_name LIKE ? OR contact_person LIKE ? OR city LIKE ?)');
    const s = `%${q.search}%`;
    params.push(s, s, s, s);
  }
  const where = `WHERE ${filters.join(' AND ')}`;
  const orderBy = buildSort(q.sortBy, q.order, SORT_MAP, 'created_at');

  const rows = await query(
    `SELECT * FROM builders ${where} ORDER BY ${orderBy} LIMIT ${p.pageSize} OFFSET ${p.offset}`,
    params,
  );
  const countRow = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM builders ${where}`,
    params,
  );
  return paginate(rows, Number(countRow?.total ?? 0), p);
}

export async function getById(id: number) {
  const builder = await queryOne(`SELECT * FROM builders WHERE id = ?`, [id]);
  if (!builder) throw ApiError.notFound('Builder not found');
  const leadCount = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM leads WHERE builder_id = ?`,
    [id],
  );
  return { ...builder, linkedLeads: Number(leadCount?.total ?? 0) };
}

function toColumns(input: Partial<UpdateBuilderInput>) {
  const map: Record<string, any> = {
    name: input.name,
    legal_name: input.legalName,
    logo_url: input.logoUrl,
    email: input.email,
    phone: input.phone,
    website: input.website,
    rera_number: input.reraNumber,
    city: input.city,
    state: input.state,
    address: input.address,
    contact_person: input.contactPerson,
    status: input.status,
    tier: input.tier,
    projects_count: input.projectsCount,
    notes: input.notes,
  };
  const cols: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { cols.push(k); vals.push(v); }
  }
  return { cols, vals };
}

export async function create(input: CreateBuilderInput, createdBy: number) {
  const { cols, vals } = toColumns(input);
  cols.push('created_by'); vals.push(createdBy);
  const placeholders = cols.map(() => '?').join(', ');
  const [result]: any = await pool.execute(
    `INSERT INTO builders (${cols.join(', ')}) VALUES (${placeholders})`,
    vals,
  );
  return getById(result.insertId as number);
}

export async function update(id: number, input: UpdateBuilderInput) {
  await getById(id);
  const { cols, vals } = toColumns(input);
  if (cols.length === 0) return getById(id);
  const setClause = cols.map((c) => `${c} = ?`).join(', ');
  await pool.execute(`UPDATE builders SET ${setClause} WHERE id = ?`, [...vals, id]);
  return getById(id);
}

export async function remove(id: number) {
  await getById(id);
  await pool.execute(`DELETE FROM builders WHERE id = ?`, [id]);
}

/** Lightweight list for dropdowns. */
export async function options() {
  return query(`SELECT id, name FROM builders WHERE status = 'active' ORDER BY name ASC LIMIT 500`);
}
