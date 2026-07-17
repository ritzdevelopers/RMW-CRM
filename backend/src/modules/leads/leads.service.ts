import { pool, query, queryOne, withTransaction } from '../../db/pool.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, paginate, buildSort } from '../../utils/pagination.js';
import type { CreateLeadInput, UpdateLeadInput } from './leads.schema.js';

const SORT_MAP: Record<string, string> = {
  created_at: 'l.created_at',
  updated_at: 'l.updated_at',
  name: 'l.name',
  score: 'l.score',
  next_follow_up_at: 'l.next_follow_up_at',
  status: 'l.status',
};

const SELECT_BASE = `
  SELECT l.*, 
         b.name AS builder_name,
         a.name AS assignee_name, a.avatar_url AS assignee_avatar,
         o.name AS owner_name
  FROM leads l
  LEFT JOIN builders b ON b.id = l.builder_id
  LEFT JOIN users a ON a.id = l.assigned_to
  LEFT JOIN users o ON o.id = l.owner_id
`;

interface Actor {
  id: number;
  role: string;
}

/** Sales executives / telecallers only see leads assigned to them. */
function scopeClause(actor: Actor): { clause: string; params: any[] } {
  const restricted = ['sales_executive', 'telecaller'];
  if (restricted.includes(actor.role)) {
    return { clause: ' AND (l.assigned_to = ? OR l.owner_id = ?)', params: [actor.id, actor.id] };
  }
  return { clause: '', params: [] };
}

export async function list(queryParams: Record<string, any>, actor: Actor) {
  const p = parsePagination(queryParams);
  const filters: string[] = ['1=1'];
  const params: any[] = [];

  if (queryParams.status) { filters.push('l.status = ?'); params.push(queryParams.status); }
  if (queryParams.source) { filters.push('l.source = ?'); params.push(queryParams.source); }
  if (queryParams.priority) { filters.push('l.priority = ?'); params.push(queryParams.priority); }
  if (queryParams.assignedTo) { filters.push('l.assigned_to = ?'); params.push(queryParams.assignedTo); }
  if (queryParams.builderId) { filters.push('l.builder_id = ?'); params.push(queryParams.builderId); }
  if (queryParams.search) {
    filters.push('(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.city LIKE ?)');
    const s = `%${queryParams.search}%`;
    params.push(s, s, s, s);
  }

  const scope = scopeClause(actor);
  const where = `WHERE ${filters.join(' AND ')}${scope.clause}`;
  const allParams = [...params, ...scope.params];

  const orderBy = buildSort(queryParams.sortBy, queryParams.order, SORT_MAP, 'l.created_at');

  const rows = await query(
    `${SELECT_BASE} ${where} ORDER BY ${orderBy} LIMIT ${p.pageSize} OFFSET ${p.offset}`,
    allParams,
  );
  const countRow = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM leads l ${where}`,
    allParams,
  );
  return paginate(rows, Number(countRow?.total ?? 0), p);
}

export async function getById(id: number, actor: Actor) {
  const scope = scopeClause(actor);
  const lead = await queryOne(
    `${SELECT_BASE} WHERE l.id = ?${scope.clause}`,
    [id, ...scope.params],
  );
  if (!lead) throw ApiError.notFound('Lead not found');
  const activities = await query(
    `SELECT la.*, u.name AS user_name, u.avatar_url AS user_avatar
     FROM lead_activities la LEFT JOIN users u ON u.id = la.user_id
     WHERE la.lead_id = ? ORDER BY la.created_at DESC`,
    [id],
  );
  return { ...lead, activities };
}

function toColumns(input: Partial<UpdateLeadInput>): { cols: string[]; vals: any[] } {
  const map: Record<string, any> = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    alt_phone: input.altPhone,
    source: input.source,
    campaign: input.campaign,
    status: input.status,
    score: input.score,
    priority: input.priority,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    property_type: input.propertyType,
    location_pref: input.locationPref,
    city: input.city,
    builder_id: input.builderId,
    assigned_to: input.assignedTo,
    expected_value: input.expectedValue,
    next_follow_up_at: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : input.nextFollowUpAt,
    lost_reason: (input as any).lostReason,
    notes: input.notes,
  };
  const cols: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { cols.push(k); vals.push(v); }
  }
  return { cols, vals };
}

export async function create(input: CreateLeadInput, actor: Actor) {
  return withTransaction(async (conn) => {
    const { cols, vals } = toColumns(input);
    cols.push('owner_id'); vals.push(actor.id);
    if (!input.assignedTo) { /* leave unassigned */ }
    const placeholders = cols.map(() => '?').join(', ');
    const [result]: any = await conn.execute(
      `INSERT INTO leads (${cols.join(', ')}) VALUES (${placeholders})`,
      vals,
    );
    const leadId = result.insertId as number;

    await conn.execute(
      `INSERT INTO lead_activities (lead_id, user_id, type, title, body)
       VALUES (?, ?, 'created', 'Lead created', ?)`,
      [leadId, actor.id, `Source: ${input.source}`],
    );
    if (input.assignedTo) {
      await conn.execute(
        `INSERT INTO lead_activities (lead_id, user_id, type, title, meta_json)
         VALUES (?, ?, 'assignment', 'Lead assigned', ?)`,
        [leadId, actor.id, JSON.stringify({ to: input.assignedTo })],
      );
    }
    const created = await queryOne(`${SELECT_BASE} WHERE l.id = ?`, [leadId]);
    return created;
  });
}

export async function update(id: number, input: UpdateLeadInput, actor: Actor) {
  await getById(id, actor); // ensures existence + scope
  const { cols, vals } = toColumns(input);
  if (cols.length === 0) return getById(id, actor);
  const setClause = cols.map((c) => `${c} = ?`).join(', ');
  await pool.execute(`UPDATE leads SET ${setClause} WHERE id = ?`, [...vals, id]);
  return getById(id, actor);
}

export async function changeStatus(id: number, status: string, lostReason: string | null, actor: Actor) {
  const lead: any = await getById(id, actor);
  const from = lead.status;
  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE leads SET status = ?, lost_reason = ?, last_contacted_at = NOW() WHERE id = ?`,
      [status, status === 'lost' ? lostReason : null, id],
    );
    await conn.execute(
      `INSERT INTO lead_activities (lead_id, user_id, type, title, meta_json)
       VALUES (?, ?, 'status_change', 'Status updated', ?)`,
      [id, actor.id, JSON.stringify({ from, to: status })],
    );
  });
  return getById(id, actor);
}

export async function assign(id: number, assignedTo: number | null, actor: Actor) {
  await getById(id, actor);
  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE leads SET assigned_to = ? WHERE id = ?`, [assignedTo, id]);
    await conn.execute(
      `INSERT INTO lead_activities (lead_id, user_id, type, title, meta_json)
       VALUES (?, ?, 'assignment', ?, ?)`,
      [id, actor.id, assignedTo ? 'Lead assigned' : 'Lead unassigned', JSON.stringify({ to: assignedTo })],
    );
    if (assignedTo) {
      await conn.execute(
        `INSERT INTO notifications (user_id, type, priority, title, body, link)
         VALUES (?, 'lead_assigned', 'high', 'New lead assigned to you', ?, ?)`,
        [assignedTo, `Lead #${id} is now yours`, `/leads/${id}`],
      );
    }
  });
  return getById(id, actor);
}

export async function addActivity(
  id: number,
  data: { type: string; title?: string | null; body?: string | null },
  actor: Actor,
) {
  await getById(id, actor);
  await pool.execute(
    `INSERT INTO lead_activities (lead_id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)`,
    [id, actor.id, data.type, data.title ?? null, data.body ?? null],
  );
  if (data.type === 'call' || data.type === 'meeting' || data.type === 'site_visit') {
    await pool.execute(`UPDATE leads SET last_contacted_at = NOW() WHERE id = ?`, [id]);
  }
  return getById(id, actor);
}

export async function remove(id: number, actor: Actor) {
  await getById(id, actor);
  await pool.execute(`DELETE FROM leads WHERE id = ?`, [id]);
}

export async function bulk(
  data: { ids: number[]; action: string; assignedTo?: number | null; status?: string },
  actor: Actor,
) {
  const placeholders = data.ids.map(() => '?').join(',');
  if (data.action === 'delete') {
    await pool.execute(`DELETE FROM leads WHERE id IN (${placeholders})`, data.ids);
  } else if (data.action === 'assign') {
    await pool.execute(
      `UPDATE leads SET assigned_to = ? WHERE id IN (${placeholders})`,
      [data.assignedTo ?? null, ...data.ids],
    );
  } else if (data.action === 'status' && data.status) {
    await pool.execute(
      `UPDATE leads SET status = ? WHERE id IN (${placeholders})`,
      [data.status, ...data.ids],
    );
  }
  void actor;
  return { affected: data.ids.length };
}
