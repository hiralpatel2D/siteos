import { verifyToken } from '../utils/jwt.js';
import { db } from '../db/index.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = db.prepare('SELECT id, name, email, role_id, is_super_admin, is_active FROM users WHERE id = ?').get(payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Returns middleware that checks the current user's role has `action` on `module`.
// Super Admin always passes (full-access, cannot be locked out of own system).
export function requirePermission(moduleName, action) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.is_super_admin) return next();

    const row = db.prepare(`
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.module = ? AND p.action = ?
    `).get(req.user.role_id, moduleName, action);

    if (!row) {
      return res.status(403).json({ error: `Not permitted: ${action} on ${moduleName}` });
    }
    next();
  };
}

// Only Super Admin or Admin role may manage roles & permission matrix (project instruction #9)
export function requireSuperAdminOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.is_super_admin) return next();
  const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(req.user.role_id);
  if (role && role.name === 'Admin') return next();
  return res.status(403).json({ error: 'Only Super Admin or Admin can access this' });
}
