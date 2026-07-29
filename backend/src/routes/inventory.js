import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { requireTodayConfirmation } from '../utils/dateGuard.js';
import { checkLowStock } from '../utils/notify.js';

const router = Router();
router.use(requireAuth);

router.get('/materials', requirePermission('inventory', 'view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM materials ORDER BY name').all());
});

router.post('/materials', requirePermission('inventory', 'create'), (req, res) => {
  const { name, unit, category, minStock } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'name and unit are required' });
  const id = db.prepare('INSERT INTO materials (name, unit, category, min_stock) VALUES (?, ?, ?, ?)')
    .run(name, unit, category || null, minStock || 0).lastInsertRowid;
  res.status(201).json({ id });
});

const SELECT = `
  SELECT t.*, m.name AS material_name, m.unit, p.name AS project_name
  FROM inventory_transactions t
  JOIN materials m ON m.id = t.material_id
  JOIN projects p ON p.id = t.project_id
`;

router.get('/transactions', requirePermission('inventory', 'view'), (req, res) => {
  const { q, projectId } = req.query;
  let sql = SELECT + ' WHERE 1=1';
  const params = [];
  if (projectId) { sql += ' AND t.project_id = ?'; params.push(projectId); }
  if (q) {
    sql += ' AND (m.name LIKE ? OR p.name LIKE ? OR t.vendor LIKE ? OR t.remarks LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY t.txn_date DESC, t.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/transactions', requirePermission('inventory', 'create'), (req, res) => {
  const { projectId, materialId, txnType, quantity, rate, vendor, txnDate, remarks } = req.body;
  if (!projectId || !materialId || !txnType || !quantity || !txnDate) {
    return res.status(400).json({ error: 'projectId, materialId, txnType, quantity, txnDate are required' });
  }
  if (!['in', 'out'].includes(txnType)) return res.status(400).json({ error: 'txnType must be in or out' });

  const id = db.prepare(`
    INSERT INTO inventory_transactions (project_id, material_id, txn_type, quantity, rate, vendor, txn_date, remarks, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(projectId, materialId, txnType, quantity, rate || 0, vendor || null, txnDate, remarks || null, req.user.id).lastInsertRowid;

  if (txnType === 'out') checkLowStock(materialId, projectId);
  res.status(201).json({ id });
});

router.put('/transactions/:id', requirePermission('inventory', 'edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM inventory_transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });
  const { projectId, materialId, txnType, quantity, rate, vendor, txnDate, remarks } = req.body;
  db.prepare(`
    UPDATE inventory_transactions SET project_id=?, material_id=?, txn_type=?, quantity=?, rate=?, vendor=?, txn_date=?, remarks=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    projectId ?? existing.project_id, materialId ?? existing.material_id, txnType ?? existing.txn_type,
    quantity ?? existing.quantity, rate ?? existing.rate, vendor ?? existing.vendor,
    txnDate ?? existing.txn_date, remarks ?? existing.remarks, req.params.id
  );
  checkLowStock(materialId ?? existing.material_id, projectId ?? existing.project_id);
  res.json({ ok: true });
});

router.delete('/transactions/:id', requirePermission('inventory', 'delete'), (req, res) => {
  if (!requireTodayConfirmation(req, res)) return;
  const existing = db.prepare('SELECT * FROM inventory_transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });
  db.prepare('DELETE FROM inventory_transactions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Current stock balance per material per project (used for low-stock badges in UI)
router.get('/balances', requirePermission('inventory', 'view'), (req, res) => {
  const rows = db.prepare(`
    SELECT
      m.id AS material_id, m.name AS material_name, m.unit, m.min_stock,
      t.project_id, p.name AS project_name,
      COALESCE(SUM(CASE WHEN t.txn_type='in' THEN t.quantity ELSE -t.quantity END), 0) AS balance
    FROM inventory_transactions t
    JOIN materials m ON m.id = t.material_id
    JOIN projects p ON p.id = t.project_id
    GROUP BY m.id, t.project_id
    ORDER BY m.name
  `).all();
  res.json(rows);
});

export default router;
