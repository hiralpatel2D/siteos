import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { requireTodayConfirmation } from '../utils/dateGuard.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(requireAuth);

const SELECT = `
  SELECT i.*, p.name AS project_name
  FROM invoices i
  JOIN projects p ON p.id = i.project_id
`;

router.get('/', requirePermission('invoicing', 'view'), (req, res) => {
  const { q, projectId } = req.query;
  let sql = SELECT + ' WHERE 1=1';
  const params = [];
  if (projectId) { sql += ' AND i.project_id = ?'; params.push(projectId); }
  if (q) {
    sql += ' AND (i.invoice_no LIKE ? OR i.client_name LIKE ? OR p.name LIKE ? OR i.status LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY i.invoice_date DESC, i.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', requirePermission('invoicing', 'create'), (req, res) => {
  const { projectId, invoiceNo, invoiceDate, clientName, amount, taxAmount, status, dueDate } = req.body;
  if (!projectId || !invoiceNo || !invoiceDate || amount == null) {
    return res.status(400).json({ error: 'projectId, invoiceNo, invoiceDate, amount are required' });
  }
  const tax = taxAmount || 0;
  const total = Number(amount) + Number(tax);
  try {
    const id = db.prepare(`
      INSERT INTO invoices (project_id, invoice_no, invoice_date, client_name, amount, tax_amount, total_amount, status, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, invoiceNo, invoiceDate, clientName || null, amount, tax, total, status || 'draft', dueDate || null, req.user.id).lastInsertRowid;
    notify(null, 'invoice_created', `Invoice ${invoiceNo} created for ₹${total.toLocaleString('en-IN')}.`, '/invoicing');
    res.status(201).json({ id });
  } catch (e) {
    res.status(409).json({ error: 'Invoice number already exists' });
  }
});

router.put('/:id', requirePermission('invoicing', 'edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });
  const { projectId, invoiceNo, invoiceDate, clientName, amount, taxAmount, status, dueDate } = req.body;
  const amt = amount ?? existing.amount;
  const tax = taxAmount ?? existing.tax_amount;
  db.prepare(`
    UPDATE invoices SET project_id=?, invoice_no=?, invoice_date=?, client_name=?, amount=?, tax_amount=?, total_amount=?, status=?, due_date=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    projectId ?? existing.project_id, invoiceNo ?? existing.invoice_no, invoiceDate ?? existing.invoice_date,
    clientName ?? existing.client_name, amt, tax, Number(amt) + Number(tax), status ?? existing.status,
    dueDate ?? existing.due_date, req.params.id
  );
  res.json({ ok: true });
});

router.delete('/:id', requirePermission('invoicing', 'delete'), (req, res) => {
  if (!requireTodayConfirmation(req, res)) return;
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
