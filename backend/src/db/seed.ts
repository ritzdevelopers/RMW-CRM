import { pool, query, queryOne } from './pool.js';
import { env } from '../config/env.js';
import { hashPassword } from '../utils/password.js';
import { logger } from '../utils/logger.js';

// ── Roles ──────────────────────────────────────────────
const ROLES: { name: string; display: string; description: string }[] = [
  { name: 'super_admin', display: 'Super Admin', description: 'Full system access' },
  { name: 'admin', display: 'Admin', description: 'Manage leads, builders, users & settings' },
  { name: 'sales_manager', display: 'Sales Manager', description: 'Distribute leads & view team reports' },
  { name: 'sales_executive', display: 'Sales Executive', description: 'Manage assigned leads' },
  { name: 'telecaller', display: 'Telecaller', description: 'Call and qualify leads' },
  { name: 'marketing', display: 'Marketing', description: 'Import leads & view campaign reports' },
  { name: 'customer_support', display: 'Customer Support', description: 'Assist and update leads' },
];

// ── Permissions ────────────────────────────────────────
const PERMISSIONS: { name: string; module: string; description: string }[] = [
  ['leads.read', 'leads', 'View leads'],
  ['leads.create', 'leads', 'Create leads'],
  ['leads.update', 'leads', 'Edit leads'],
  ['leads.delete', 'leads', 'Delete leads'],
  ['leads.assign', 'leads', 'Assign / distribute leads'],
  ['leads.export', 'leads', 'Export leads'],
  ['leads.import', 'leads', 'Import leads'],
  ['builders.read', 'builders', 'View builders'],
  ['builders.create', 'builders', 'Create builders'],
  ['builders.update', 'builders', 'Edit builders'],
  ['builders.delete', 'builders', 'Delete builders'],
  ['users.read', 'users', 'View users'],
  ['users.create', 'users', 'Create users'],
  ['users.update', 'users', 'Edit users'],
  ['users.delete', 'users', 'Delete users'],
  ['roles.read', 'roles', 'View roles & permissions'],
  ['roles.update', 'roles', 'Configure role permissions'],
  ['reports.read', 'reports', 'View reports & analytics'],
  ['settings.manage', 'settings', 'Manage system settings'],
].map(([name, module, description]) => ({ name, module, description }));

// ── Role → permission defaults ─────────────────────────
const ROLE_PERMS: Record<string, string[]> = {
  super_admin: PERMISSIONS.map((p) => p.name), // full
  admin: [
    'leads.read', 'leads.create', 'leads.update', 'leads.delete', 'leads.assign', 'leads.export', 'leads.import',
    'builders.read', 'builders.create', 'builders.update', 'builders.delete',
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'reports.read', 'settings.manage',
  ],
  sales_manager: [
    'leads.read', 'leads.create', 'leads.update', 'leads.delete', 'leads.assign', 'leads.export',
    'builders.read', 'builders.create', 'builders.update',
    'users.read', 'reports.read',
  ],
  sales_executive: ['leads.read', 'leads.create', 'leads.update', 'builders.read'],
  telecaller: ['leads.read', 'leads.create', 'leads.update', 'builders.read'],
  marketing: ['leads.read', 'leads.create', 'leads.import', 'leads.export', 'builders.read', 'reports.read'],
  customer_support: ['leads.read', 'leads.update', 'builders.read'],
};

async function upsertRoles() {
  for (const r of ROLES) {
    await pool.execute(
      `INSERT INTO roles (name, display_name, description, is_system)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description)`,
      [r.name, r.display, r.description],
    );
  }
  logger.info(`Seeded ${ROLES.length} roles`);
}

async function upsertPermissions() {
  for (const p of PERMISSIONS) {
    await pool.execute(
      `INSERT INTO permissions (name, module, description) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE module = VALUES(module), description = VALUES(description)`,
      [p.name, p.module, p.description],
    );
  }
  logger.info(`Seeded ${PERMISSIONS.length} permissions`);
}

async function mapRolePermissions() {
  const roles = await query<{ id: number; name: string }>(`SELECT id, name FROM roles`);
  const perms = await query<{ id: number; name: string }>(`SELECT id, name FROM permissions`);
  const permByName = new Map(perms.map((p) => [p.name, p.id]));

  for (const role of roles) {
    const wanted = ROLE_PERMS[role.name] ?? [];
    await pool.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [role.id]);
    for (const name of wanted) {
      const pid = permByName.get(name);
      if (pid) {
        await pool.execute(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          [role.id, pid],
        );
      }
    }
  }
  logger.info('Mapped role → permissions');
}

async function seedSuperAdmin() {
  const role = await queryOne<{ id: number }>(`SELECT id FROM roles WHERE name = 'super_admin'`);
  if (!role) throw new Error('super_admin role missing');
  const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [env.seed.email]);
  if (existing) {
    logger.info(`Super admin already exists (${env.seed.email})`);
    return;
  }
  const hash = await hashPassword(env.seed.password);
  await pool.execute(
    `INSERT INTO users (name, email, password_hash, role_id, status, email_verified_at)
     VALUES (?, ?, ?, ?, 'active', NOW())`,
    [env.seed.name, env.seed.email, hash, role.id],
  );
  logger.info(`✅ Super admin created: ${env.seed.email} / ${env.seed.password}`);
}

async function seedDemoData() {
  const countRow = await queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM builders`);
  if (Number(countRow?.total ?? 0) > 0) {
    logger.info('Demo data already present, skipping');
    return;
  }
  const admin = await queryOne<{ id: number }>(`SELECT id FROM users WHERE email = ?`, [env.seed.email]);
  const adminId = admin?.id ?? null;

  const builders = [
    ['Prestige Group', 'Bangalore', 'a', 42],
    ['Godrej Properties', 'Mumbai', 'a', 38],
    ['DLF Limited', 'Gurugram', 'a', 55],
    ['Sobha Realty', 'Bangalore', 'b', 21],
    ['Lodha Group', 'Mumbai', 'b', 30],
  ] as const;
  const builderIds: number[] = [];
  for (const [name, city, tier, projects] of builders) {
    const [r]: any = await pool.execute(
      `INSERT INTO builders (name, city, state, tier, projects_count, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [name, city, city, tier, projects, adminId],
    );
    builderIds.push(r.insertId);
  }

  const sources = ['website', 'meta', 'google', 'referral', 'walk_in'];
  const statuses = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'booked', 'lost'];
  const cities = ['Bangalore', 'Mumbai', 'Gurugram', 'Pune', 'Hyderabad'];
  const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Anjali Gupta', 'Karan Mehta', 'Divya Nair', 'Rohit Verma', 'Neha Joshi'];

  for (let i = 0; i < 40; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const value = status === 'booked' ? 5000000 + Math.floor(Math.random() * 15000000) : 0;
    await pool.execute(
      `INSERT INTO leads (name, email, phone, source, status, score, priority, budget_min, budget_max,
                          city, builder_id, assigned_to, owner_id, expected_value, next_follow_up_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [
        names[i % names.length] + ' ' + (i + 1),
        `lead${i + 1}@example.com`,
        `98${String(10000000 + i).slice(0, 8)}`,
        sources[Math.floor(Math.random() * sources.length)],
        status,
        Math.floor(Math.random() * 100),
        ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        3000000,
        8000000,
        cities[Math.floor(Math.random() * cities.length)],
        builderIds[Math.floor(Math.random() * builderIds.length)],
        adminId,
        adminId,
        value,
        Math.floor(Math.random() * 10) - 2,
      ],
    );
  }
  logger.info('✅ Seeded demo builders & leads');
}

async function main() {
  await upsertRoles();
  await upsertPermissions();
  await mapRolePermissions();
  await seedSuperAdmin();
  await seedDemoData();
  await pool.end();
  logger.info('🌱 Seed complete');
}

main().catch((err) => {
  logger.error('Seed failed', { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
