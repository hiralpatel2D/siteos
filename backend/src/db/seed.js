import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { MODULES, ACTIONS } from './schema.js';

export function seedDatabase() {
  const existingUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (existingUsers.c > 0) {
    console.log('Seed skipped — data already present.');
    return;
  }

  const insertRole = db.prepare('INSERT INTO roles (name, is_system) VALUES (?, ?)');
  const superAdminRoleId = insertRole.run('Super Admin', 1).lastInsertRowid;
  const adminRoleId = insertRole.run('Admin', 1).lastInsertRowid;
  const siteEngineerRoleId = insertRole.run('Site Engineer', 0).lastInsertRowid;
  const accountantRoleId = insertRole.run('Accountant', 0).lastInsertRowid;

  // Permissions rows are already created by syncPermissionMatrix() when ./index.js was imported —
  // just look up their ids here.
  const findPerm = db.prepare('SELECT id FROM permissions WHERE module = ? AND action = ?');
  const permIds = {};
  for (const mod of MODULES) {
    for (const action of ACTIONS) {
      permIds[`${mod}:${action}`] = findPerm.get(mod, action).id;
    }
  }

  const grant = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');

  // Super Admin + Admin: full matrix
  for (const permId of Object.values(permIds)) {
    grant.run(superAdminRoleId, permId);
    grant.run(adminRoleId, permId);
  }

  // Site Engineer: DPR, projects (view), inventory, attendance — no roles/users/invoicing edit
  const engineerGrants = [
    'dashboard_dpr:view', 'dashboard_dpr:create', 'dashboard_dpr:edit',
    'projects:view',
    'inventory:view', 'inventory:create', 'inventory:edit',
    'attendance:view', 'attendance:create', 'attendance:edit',
    'notifications:view',
    'reports:view',
  ];
  for (const key of engineerGrants) grant.run(siteEngineerRoleId, permIds[key]);

  // Accountant: invoicing full, DPR/projects/reports view only
  const accountantGrants = [
    'dashboard_dpr:view',
    'projects:view',
    'invoicing:view', 'invoicing:create', 'invoicing:edit', 'invoicing:delete',
    'notifications:view',
    'reports:view',
  ];
  for (const key of accountantGrants) grant.run(accountantRoleId, permIds[key]);

  const passwordHash = bcrypt.hashSync('Admin@123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role_id, is_super_admin, view_prefs)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const superAdminId = insertUser.run('Super Admin', 'superadmin@siteos.app', passwordHash, superAdminRoleId, 1, '{}').lastInsertRowid;
  insertUser.run('Site Admin', 'admin@siteos.app', bcrypt.hashSync('Admin@123', 10), adminRoleId, 0, '{}');
  insertUser.run('Ramesh Engineer', 'engineer@siteos.app', bcrypt.hashSync('Admin@123', 10), siteEngineerRoleId, 0, '{}');
  insertUser.run('Priya Accounts', 'accounts@siteos.app', bcrypt.hashSync('Admin@123', 10), accountantRoleId, 0, '{}');

  // Sample projects
  const insertProject = db.prepare(`
    INSERT INTO projects (name, code, location, client_name, start_date, end_date, budget, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const p1 = insertProject.run('Shivam Residency', 'PRJ-001', 'Pune, Maharashtra', 'Shivam Developers', '2026-01-05', null, 45000000, 'active', superAdminId).lastInsertRowid;
  const p2 = insertProject.run('Riverside Commercial Complex', 'PRJ-002', 'Nashik, Maharashtra', 'Riverside Group', '2026-03-10', null, 78000000, 'active', superAdminId).lastInsertRowid;

  // Sample DPR entries
  const insertDpr = db.prepare(`
    INSERT INTO dpr (project_id, report_date, weather, work_summary, manpower_count, issues, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertDpr.run(p1, '2026-07-27', 'Clear', 'Column shuttering completed for 3rd floor, rebar work in progress.', 24, 'Cement delivery delayed by a day.', superAdminId);
  insertDpr.run(p1, '2026-07-28', 'Light rain', 'Slab concreting for 2nd floor completed.', 30, null, superAdminId);
  insertDpr.run(p2, '2026-07-28', 'Clear', 'Excavation for basement completed, footing layout marked.', 18, 'Need surveyor confirmation before footing pour.', superAdminId);

  // Sample materials + inventory
  const insertMaterial = db.prepare('INSERT INTO materials (name, unit, category, min_stock) VALUES (?, ?, ?, ?)');
  const cement = insertMaterial.run('OPC 53 Grade Cement', 'bags', 'Cement', 200).lastInsertRowid;
  const steel = insertMaterial.run('TMT Steel 12mm', 'kg', 'Steel', 2000).lastInsertRowid;
  const sand = insertMaterial.run('River Sand', 'cft', 'Aggregate', 500).lastInsertRowid;

  const insertTxn = db.prepare(`
    INSERT INTO inventory_transactions (project_id, material_id, txn_type, quantity, rate, vendor, txn_date, remarks, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTxn.run(p1, cement, 'in', 500, 380, 'Ambuja Cement Dealer', '2026-07-20', 'Bulk delivery', superAdminId);
  insertTxn.run(p1, cement, 'out', 120, 380, null, '2026-07-27', 'Used in slab concreting', superAdminId);
  insertTxn.run(p1, steel, 'in', 5000, 68, 'Tata Steel Distributor', '2026-07-15', null, superAdminId);
  insertTxn.run(p2, sand, 'in', 1200, 55, 'Local Sand Supplier', '2026-07-22', null, superAdminId);

  // Sample attendance
  const insertAttendance = db.prepare(`
    INSERT INTO labour_attendance (project_id, attendance_date, labour_category, headcount, wage_rate, total_amount, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAttendance.run(p1, '2026-07-28', 'Mason', 8, 750, 6000, superAdminId);
  insertAttendance.run(p1, '2026-07-28', 'Helper', 16, 500, 8000, superAdminId);
  insertAttendance.run(p2, '2026-07-28', 'Electrician', 4, 900, 3600, superAdminId);

  // Sample invoices
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (project_id, invoice_no, invoice_date, client_name, amount, tax_amount, total_amount, status, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInvoice.run(p1, 'INV-2026-001', '2026-07-15', 'Shivam Developers', 2500000, 450000, 2950000, 'sent', '2026-08-14', superAdminId);
  insertInvoice.run(p2, 'INV-2026-002', '2026-07-20', 'Riverside Group', 4000000, 720000, 4720000, 'draft', '2026-08-19', superAdminId);

  // Sample notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)
  `);
  insertNotif.run(null, 'low_stock', 'OPC 53 Grade Cement stock is below minimum threshold on Shivam Residency.', '/inventory');
  insertNotif.run(null, 'invoice_due', 'Invoice INV-2026-001 is due on 14-08-2026.', '/invoicing');
  insertNotif.run(null, 'dpr_reminder', "Don't forget to submit today's Daily Progress Report.", '/dpr');

  console.log('Database seeded successfully.');
  console.log('Login: superadmin@siteos.app / Admin@123 (Super Admin)');
  console.log('Login: admin@siteos.app / Admin@123 (Admin)');
  console.log('Login: engineer@siteos.app / Admin@123 (Site Engineer)');
  console.log('Login: accounts@siteos.app / Admin@123 (Accountant)');
}

// Only auto-run when this file is executed directly (`npm run seed`), not when imported by server.js.
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
