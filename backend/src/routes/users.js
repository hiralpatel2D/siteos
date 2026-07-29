import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { requireAuth, requireSuperAdminOrAdmin } from '../middleware/auth.js';
import { requireTodayConfirmation } from '../utils/dateGuard.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireSuperAdminOrAdmin, (req, res) => {
  const { q } = req.query; // per-view search (project instruction #4)
  let rows;
  if (q) {
    rows = db.prepare(`
      SELECT u.id, u.name, u.email, u.is_active AS isActive, u.is_super_admin AS isSuperAdmin, r.name AS role
      FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.name LIKE ? OR u.email LIKE ? OR r.name LIKE ?
      ORDER BY u.name
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare(`
      SELECT u.id, u.name, u.email, u.is_active AS isActive, u.is_super_admin AS isSuperAdmin, r.name AS role
      FROM users u JOIN roles r ON r.id = u.role_id
      ORDER BY u.name
    `).all();
  }
  // better-sqlite3 returns 0/1 for boolean columns, not true JS booleans. Left uncoerced,
  // a falsy `0` for isSuperAdmin would make `{u.isSuperAdmin && <span>...}` render the
  // literal text "0" in the UI instead of nothing — coerce here so every consumer gets
  // real booleans.
  res.json(rows.map((r) => ({ ...r, isActive: !!r.isActive, isSuperAdmin: !!r.isSuperAdmin })));
});

router.post('/', requireSuperAdminOrAdmin, (req, res) => {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password || !roleId) {
    return res.status(400).json({ error: 'name, email, password, roleId are required' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = db.prepare(`
      INSERT INTO users (name, email, password_hash, role_id, is_super_admin, view_prefs)
      VALUES (?, ?, ?, ?, 0, '{}')
    `).run(name.trim(), email.toLowerCase().trim(), hash, roleId).lastInsertRowid;
    res.status(201).json({ id });
  } catch (e) {
    res.status(409).json({ error: 'Email already in use' });
  }
});

router.put('/:id', requireSuperAdminOrAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const { name, roleId, isActive } = req.body;

  if (target.is_super_admin && isActive === false) {
    return res.status(400).json({ error: 'Super Admin cannot be deactivated' });
  }

  db.prepare('UPDATE users SET name = COALESCE(?, name), role_id = COALESCE(?, role_id), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(name ?? null, target.is_super_admin ? target.role_id : (roleId ?? null), isActive === undefined ? null : (isActive ? 1 : 0), req.params.id);
  res.json({ ok: true });
});

// Project instruction #6: Super Admin can never be deleted. Enforced here regardless of caller.
router.delete('/:id', requireSuperAdminOrAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.is_super_admin) {
    return res.status(400).json({ error: 'Super Admin cannot be deleted' });
  }
  if (!requireTodayConfirmation(req, res)) return;
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
