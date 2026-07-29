import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireSuperAdminOrAdmin } from '../middleware/auth.js';
import { MODULES, ACTIONS } from '../db/schema.js';

const router = Router();
router.use(requireAuth, requireSuperAdminOrAdmin);

// Full permission matrix: every role x every (module, action), with a granted boolean.
// This always reflects MODULES/ACTIONS from schema.js (kept in sync at boot), so a
// newly added module/feature shows up here automatically instead of being missed.
router.get('/matrix', (req, res) => {
  const roles = db.prepare('SELECT * FROM roles ORDER BY is_system DESC, name').all();
  const permissions = db.prepare('SELECT * FROM permissions ORDER BY module, action').all();
  const grants = db.prepare('SELECT role_id, permission_id FROM role_permissions').all();
  const grantSet = new Set(grants.map(g => `${g.role_id}:${g.permission_id}`));

  const matrix = roles.map(role => ({
    role: { id: role.id, name: role.name, isSystem: !!role.is_system },
    permissions: permissions.map(p => ({
      permissionId: p.id,
      module: p.module,
      action: p.action,
      granted: role.is_system ? true : grantSet.has(`${role.id}:${p.id}`),
      // Super Admin & Admin are always fully granted and not editable — enforced server-side too.
      locked: !!role.is_system,
    })),
  }));

  res.json({ modules: MODULES, actions: ACTIONS, matrix });
});

router.put('/matrix', (req, res) => {
  // body: { roleId, permissionId, granted }
  const { roleId, permissionId, granted } = req.body;
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.is_system) return res.status(400).json({ error: 'Super Admin / Admin permissions cannot be edited' });

  if (granted) {
    db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(roleId, permissionId);
  } else {
    db.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(roleId, permissionId);
  }
  res.json({ ok: true });
});

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT id, name, is_system AS isSystem FROM roles ORDER BY is_system DESC, name').all());
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Role name required' });
  try {
    const id = db.prepare('INSERT INTO roles (name, is_system) VALUES (?, 0)').run(name.trim()).lastInsertRowid;
    res.status(201).json({ id, name: name.trim(), isSystem: false });
  } catch (e) {
    res.status(409).json({ error: 'Role name already exists' });
  }
});

router.delete('/:id', (req, res) => {
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.is_system) return res.status(400).json({ error: 'Super Admin / Admin roles cannot be deleted' });
  const inUse = db.prepare('SELECT COUNT(*) AS c FROM users WHERE role_id = ?').get(req.params.id);
  if (inUse.c > 0) return res.status(400).json({ error: 'Role is assigned to users and cannot be deleted' });
  db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
