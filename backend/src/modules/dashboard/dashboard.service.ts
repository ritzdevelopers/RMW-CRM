import { query, queryOne } from '../../db/pool.js';

interface Actor {
  id: number;
  role: string;
}

function scope(actor: Actor) {
  const restricted = ['sales_executive', 'telecaller'];
  if (restricted.includes(actor.role)) {
    return { clause: 'WHERE (assigned_to = ? OR owner_id = ?)', params: [actor.id, actor.id] };
  }
  return { clause: '', params: [] as any[] };
}

export async function overview(actor: Actor) {
  const s = scope(actor);

  const totals = await queryOne<any>(
    `SELECT
       COUNT(*) AS totalLeads,
       SUM(status IN ('contacted','qualified','site_visit','negotiation')) AS activeDeals,
       SUM(status = 'booked') AS bookedDeals,
       SUM(status = 'site_visit') AS siteVisits,
       COALESCE(SUM(CASE WHEN status = 'booked' THEN expected_value ELSE 0 END), 0) AS revenue,
       SUM(DATE(next_follow_up_at) = CURDATE()) AS todayFollowUps
     FROM leads ${s.clause}`,
    s.params,
  );

  const funnel = await query(
    `SELECT status, COUNT(*) AS count FROM leads ${s.clause} GROUP BY status`,
    s.params,
  );

  const sources = await query(
    `SELECT source, COUNT(*) AS count FROM leads ${s.clause} GROUP BY source ORDER BY count DESC`,
    s.params,
  );

  // Last 6 months lead trend
  const trendWhere = s.clause ? `${s.clause} AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)` : `WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`;
  const trend = await query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
            COUNT(*) AS leads,
            SUM(status = 'booked') AS booked
     FROM leads ${trendWhere}
     GROUP BY month ORDER BY month ASC`,
    s.params,
  );

  return {
    stats: {
      totalLeads: Number(totals?.totalLeads ?? 0),
      activeDeals: Number(totals?.activeDeals ?? 0),
      bookedDeals: Number(totals?.bookedDeals ?? 0),
      siteVisits: Number(totals?.siteVisits ?? 0),
      revenue: Number(totals?.revenue ?? 0),
      todayFollowUps: Number(totals?.todayFollowUps ?? 0),
    },
    funnel,
    sources,
    trend,
  };
}

export async function teamPerformance(actor: Actor) {
  // Only managers/admins see the full team board.
  if (['sales_executive', 'telecaller'].includes(actor.role)) return [];
  return query(
    `SELECT u.id, u.name, u.avatar_url,
            COUNT(l.id) AS totalLeads,
            SUM(l.status = 'booked') AS booked,
            COALESCE(SUM(CASE WHEN l.status = 'booked' THEN l.expected_value ELSE 0 END), 0) AS revenue
     FROM users u
     LEFT JOIN leads l ON l.assigned_to = u.id
     JOIN roles r ON r.id = u.role_id
     WHERE r.name IN ('sales_manager','sales_executive','telecaller')
     GROUP BY u.id, u.name, u.avatar_url
     ORDER BY revenue DESC
     LIMIT 10`,
  );
}

export async function todaysTasks(actor: Actor) {
  const restricted = ['sales_executive', 'telecaller'];
  const where = restricted.includes(actor.role)
    ? `WHERE DATE(l.next_follow_up_at) <= CURDATE() AND l.status NOT IN ('booked','lost') AND (l.assigned_to = ? OR l.owner_id = ?)`
    : `WHERE DATE(l.next_follow_up_at) <= CURDATE() AND l.status NOT IN ('booked','lost')`;
  const params = restricted.includes(actor.role) ? [actor.id, actor.id] : [];
  return query(
    `SELECT l.id, l.name, l.phone, l.status, l.priority, l.next_follow_up_at, a.name AS assignee_name
     FROM leads l LEFT JOIN users a ON a.id = l.assigned_to
     ${where}
     ORDER BY l.next_follow_up_at ASC LIMIT 15`,
    params,
  );
}

export async function recentActivities(actor: Actor) {
  const restricted = ['sales_executive', 'telecaller'];
  const where = restricted.includes(actor.role) ? `WHERE la.user_id = ?` : '';
  const params = restricted.includes(actor.role) ? [actor.id] : [];
  return query(
    `SELECT la.id, la.type, la.title, la.created_at, l.id AS lead_id, l.name AS lead_name,
            u.name AS user_name, u.avatar_url AS user_avatar
     FROM lead_activities la
     JOIN leads l ON l.id = la.lead_id
     LEFT JOIN users u ON u.id = la.user_id
     ${where}
     ORDER BY la.created_at DESC LIMIT 12`,
    params,
  );
}
