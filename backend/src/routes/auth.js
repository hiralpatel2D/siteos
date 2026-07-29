import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(user.role_id);
  const token = signToken({ sub: user.id });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role?.name,
      isSuperAdmin: !!user.is_super_admin,
      viewPrefs: JSON.parse(user.view_prefs || '{}'),
    },
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(user.role_id);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: role?.name,
    isSuperAdmin: !!user.is_super_admin,
    viewPrefs: JSON.parse(user.view_prefs || '{}'),
  });
});

// Lightweight permission list for the logged-in user, so the frontend can show/hide
// actions without needing Super Admin/Admin access to the full matrix endpoint.
router.get('/my-permissions', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.is_super_admin) {
    const all = db.prepare('SELECT module, action FROM permissions').all();
    return res.json({ isSuperAdmin: true, permissions: all });
  }
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(user.role_id);
  if (role.is_system) {
    const all = db.prepare('SELECT module, action FROM permissions').all();
    return res.json({ isSuperAdmin: false, role: role.name, permissions: all });
  }
  const perms = db.prepare(`
    SELECT p.module, p.action FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(user.role_id);
  res.json({ isSuperAdmin: false, role: role.name, permissions: perms });
});

// Persist per-user, per-module view preference (row vs card) — project instruction #8
router.put('/me/view-prefs', requireAuth, (req, res) => {
  const { module: moduleName, view } = req.body;
  if (!moduleName || !['row', 'card'].includes(view)) {
    return res.status(400).json({ error: 'module and view (row|card) required' });
  }
  const user = db.prepare('SELECT view_prefs FROM users WHERE id = ?').get(req.user.id);
  const prefs = JSON.parse(user.view_prefs || '{}');
  prefs[moduleName] = view;
  db.prepare('UPDATE users SET view_prefs = ? WHERE id = ?').run(JSON.stringify(prefs), req.user.id);
  res.json({ viewPrefs: prefs });
});

export default router;
