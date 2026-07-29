import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { requireTodayConfirmation } from '../utils/dateGuard.js';

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('projects', 'view'), (req, res) => {
  const { q } = req.query;
  const base = 'SELECT * FROM projects';
  const rows = q
    ? db.prepare(`${base} WHERE name LIKE ? OR code LIKE ? OR client_name LIKE ? OR location LIKE ? ORDER BY created_at DESC`)
        .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare(`${base} ORDER BY created_at DESC`).all();
  res.json(rows);
});

router.get('/:id', requirePermission('projects', 'view'), (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Project not found' });
  res.json(row);
});

router.post('/', requirePermission('projects', 'create'), (req, res) => {
  const { name, code, location, clientName, startDate, endDate, budget, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = db.prepare(`
    INSERT INTO projects (name, code, location, client_name, start_date, end_date, budget, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, code || null, location || null, clientName || null, startDate || null, endDate || null, budget || 0, status || 'active', req.user.id).lastInsertRowid;
  res.status(201).json({ id });
});

router.put('/:id', requirePermission('projects', 'edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  const { name, code, location, clientName, startDate, endDate, budget, status } = req.body;
  db.prepare(`
    UPDATE projects SET name=?, code=?, location=?, client_name=?, start_date=?, end_date=?, budget=?, status=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    name ?? existing.name, code ?? existing.code, location ?? existing.location, clientName ?? existing.client_name,
    startDate ?? existing.start_date, endDate ?? existing.end_date, budget ?? existing.budget, status ?? existing.status,
    req.params.id
  );
  res.json({ ok: true });
});

// Deleting a project cascades to its DPR/inventory/attendance/invoices (FK ON DELETE CASCADE) —
// item #13: relationships must be respected, so we warn the caller how many linked rows exist.
router.get('/:id/impact', requirePermission('projects', 'delete'), (req, res) => {
  const id = req.params.id;
  const counts = {
    dpr: db.prepare('SELECT COUNT(*) AS c FROM dpr WHERE project_id = ?').get(id).c,
    inventoryTransactions: db.prepare('SELECT COUNT(*) AS c FROM inventory_transactions WHERE project_id = ?').get(id).c,
    attendance: db.prepare('SELECT COUNT(*) AS c FROM labour_attendance WHERE project_id = ?').get(id).c,
    invoices: db.prepare('SELECT COUNT(*) AS c FROM invoices WHERE project_id = ?').get(id).c,
  };
  res.json(counts);
});

router.delete('/:id', requirePermission('projects', 'delete'), (req, res) => {
  if (!requireTodayConfirmation(req, res)) return;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
