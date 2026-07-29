import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function hasPermission(user, moduleName, action = 'view') {
  if (user.is_super_admin) return true;
  const row = db.prepare(`
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ? AND p.module = ? AND p.action = ?
  `).get(user.role_id, moduleName, action);
  return !!row;
}

// Project instruction #1: app-wide global search across every module the user can see.
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const like = `%${q}%`;
  const results = [];

  if (hasPermission(req.user, 'projects', 'view')) {
    for (const r of db.prepare('SELECT id, name, code FROM projects WHERE name LIKE ? OR code LIKE ? OR client_name LIKE ? LIMIT 10').all(like, like, like)) {
      results.push({ module: 'projects', id: r.id, title: r.name, subtitle: r.code, link: `/projects/${r.id}` });
    }
  }
  if (hasPermission(req.user, 'dashboard_dpr', 'view')) {
    for (const r of db.prepare(`
      SELECT d.id, d.report_date, p.name AS project_name FROM dpr d JOIN projects p ON p.id=d.project_id
      WHERE d.work_summary LIKE ? OR d.issues LIKE ? OR p.name LIKE ? LIMIT 10
    `).all(like, like, like)) {
      results.push({ module: 'dpr', id: r.id, title: `DPR — ${r.project_name}`, subtitle: r.report_date, link: `/dpr/${r.id}` });
    }
  }
  if (hasPermission(req.user, 'inventory', 'view')) {
    for (const r of db.prepare(`
      SELECT t.id, m.name AS material_name, p.name AS project_name FROM inventory_transactions t
      JOIN materials m ON m.id=t.material_id JOIN projects p ON p.id=t.project_id
      WHERE m.name LIKE ? OR t.vendor LIKE ? OR p.name LIKE ? LIMIT 10
    `).all(like, like, like)) {
      results.push({ module: 'inventory', id: r.id, title: r.material_name, subtitle: r.project_name, link: `/inventory/${r.id}` });
    }
  }
  if (hasPermission(req.user, 'attendance', 'view')) {
    for (const r of db.prepare(`
      SELECT a.id, a.labour_category, p.name AS project_name FROM labour_attendance a JOIN projects p ON p.id=a.project_id
      WHERE a.labour_category LIKE ? OR p.name LIKE ? LIMIT 10
    `).all(like, like)) {
      results.push({ module: 'attendance', id: r.id, title: r.labour_category, subtitle: r.project_name, link: `/attendance/${r.id}` });
    }
  }
  if (hasPermission(req.user, 'invoicing', 'view')) {
    for (const r of db.prepare('SELECT id, invoice_no, client_name FROM invoices WHERE invoice_no LIKE ? OR client_name LIKE ? LIMIT 10').all(like, like)) {
      results.push({ module: 'invoicing', id: r.id, title: r.invoice_no, subtitle: r.client_name, link: `/invoicing/${r.id}` });
    }
  }

  res.json({ results });
});

export default router;
