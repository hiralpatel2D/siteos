import { db } from '../db/index.js';

// userId = null broadcasts to all users. Item #15: notification capability.
export function notify(userId, type, message, link = null) {
  db.prepare('INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)')
    .run(userId, type, message, link);
}

export function checkLowStock(materialId, projectId) {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(materialId);
  if (!material) return;
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN txn_type = 'in' THEN quantity ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN txn_type = 'out' THEN quantity ELSE 0 END), 0) AS balance
    FROM inventory_transactions WHERE material_id = ? AND project_id = ?
  `).get(materialId, projectId);

  if (totals.balance <= material.min_stock) {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(projectId);
    notify(null, 'low_stock', `${material.name} stock is low on ${project?.name || 'project'} (balance: ${totals.balance} ${material.unit}).`, '/inventory');
  }
}
