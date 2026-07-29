import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { requireTodayConfirmation } from '../utils/dateGuard.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(requireAuth);

const SELECT = `
  SELECT d.*, p.name AS project_name, u.name AS created_by_name
  FROM dpr d
  JOIN projects p ON p.id = d.project_id
  LEFT JOIN users u ON u.id = d.created_by
`;

router.get('/', requirePermission('dashboard_dpr', 'view'), (req, res) => {
  const { q, projectId } = req.query;
  let sql = SELECT + ' WHERE 1=1';
  const params = [];
  if (projectId) { sql += ' AND d.project_id = ?'; params.push(projectId); }
  if (q) {
    sql += ' AND (p.name LIKE ? OR d.work_summary LIKE ? OR d.issues LIKE ? OR d.weather LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY d.report_date DESC, d.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', requirePermission('dashboard_dpr', 'view'), (req, res) => {
  const row = db.prepare(SELECT + ' WHERE d.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'DPR entry not found' });
  res.json(row);
});

router.post('/', requirePermission('dashboard_dpr', 'create'), (req, res) => {
  const { projectId, reportDate, weather, workSummary, manpowerCount, issues } = req.body;
  if (!projectId || !reportDate || !workSummary) {
    return res.status(400).json({ error: 'projectId, reportDate, workSummary are required' });
  }
  const id = db.prepare(`
    INSERT INTO dpr (project_id, report_date, weather, work_summary, manpower_count, issues, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(projectId, reportDate, weather || null, workSummary, manpowerCount || 0, issues || null, req.user.id).lastInsertRowid;

  if (issues && issues.trim()) {
    notify(null, 'dpr_issue', `Issue flagged in DPR for ${reportDate}: ${issues.slice(0, 120)}`, '/dpr');
  }
  res.status(201).json({ id });
});

router.put('/:id', requirePermission('dashboard_dpr', 'edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM dpr WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'DPR entry not found' });
  const { projectId, reportDate, weather, workSummary, manpowerCount, issues } = req.body;
  db.prepare(`
    UPDATE dpr SET project_id=?, report_date=?, weather=?, work_summary=?, manpower_count=?, issues=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    projectId ?? existing.project_id, reportDate ?? existing.report_date, weather ?? existing.weather,
    workSummary ?? existing.work_summary, manpowerCount ?? existing.manpower_count, issues ?? existing.issues,
    req.params.id
  );
  res.json({ ok: true });
});

router.delete('/:id', requirePermission('dashboard_dpr', 'delete'), (req, res) => {
  if (!requireTodayConfirmation(req, res)) return;
  const existing = db.prepare('SELECT * FROM dpr WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'DPR entry not found' });
  db.prepare('DELETE FROM dpr WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
