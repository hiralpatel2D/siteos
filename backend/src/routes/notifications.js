import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? OR user_id IS NULL
    ORDER BY created_at DESC LIMIT 100
  `).all(req.user.id);
  res.json(rows);
});

router.get('/unread-count', (req, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS c FROM notifications
    WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0
  `).get(req.user.id);
  res.json({ count: row.c });
});

router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL').run(req.user.id);
  res.json({ ok: true });
});

export default router;
