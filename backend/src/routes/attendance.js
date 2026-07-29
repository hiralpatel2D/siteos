import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { requireTodayConfirmation } from '../utils/dateGuard.js';

const router = Router();
router.use(requireAuth);

const SELECT = `
  SELECT a.*, p.name AS project_name
  FROM labour_attendance a
  JOIN projects p ON p.id = a.project_id
`;

router.get('/', requirePermission('attendance', 'view'), (req, res) => {
  const { q, projectId } = req.query;
  let sql = SELECT + ' WHERE 1=1';
  const params = [];
  if (projectId) { sql += ' AND a.project_id = ?'; params.push(projectId); }
  if (q) {
    sql += ' AND (p.name LIKE ? OR a.labour_category LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY a.attendance_date DESC, a.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', requirePermission('attendance', 'create'), (req, res) => {
  const { projectId, attendanceDate, labourCategory, headcount, wageRate } = req.body;
  if (!projectId || !attendanceDate || !labourCategory || headcount == null || wageRate == null) {
    return res.status(400).json({ error: 'projectId, attendanceDate, labourCategory, headcount, wageRate are required' });
  }
  const totalAmount = Number(headcount) * Number(wageRate);
  const id = db.prepare(`
    INSERT INTO labour_attendance (project_id, attendance_date, labour_category, headcount, wage_rate, total_amount, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(projectId, attendanceDate, labourCategory, headcount, wageRate, totalAmount, req.user.id).lastInsertRowid;
  res.status(201).json({ id });
});

router.put('/:id', requirePermission('attendance', 'edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM labour_attendance WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Attendance entry not found' });
  const { projectId, attendanceDate, labourCategory, headcount, wageRate } = req.body;
  const hc = headcount ?? existing.headcount;
  const wr = wageRate ?? existing.wage_rate;
  db.prepare(`
    UPDATE labour_attendance SET project_id=?, attendance_date=?, labour_category=?, headcount=?, wage_rate=?, total_amount=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    projectId ?? existing.project_id, attendanceDate ?? existing.attendance_date, labourCategory ?? existing.labour_category,
    hc, wr, Number(hc) * Number(wr), req.params.id
  );
  res.json({ ok: true });
});

router.delete('/:id', requirePermission('attendance', 'delete'), (req, res) => {
  if (!requireTodayConfirmation(req, res)) return;
  const existing = db.prepare('SELECT * FROM labour_attendance WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Attendance entry not found' });
  db.prepare('DELETE FROM labour_attendance WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
