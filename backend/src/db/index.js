import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSchema, MODULES, ACTIONS } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SITEOS_DB_PATH || path.join(__dirname, '..', '..', 'data', 'siteos.db');

import fs from 'node:fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
initSchema(db);

// Project instruction #9 / #13: whenever the module/action list changes in code,
// the permission matrix must never silently miss the new combinations. Run this
// sync on every boot so Super Admin/Admin's matrix always reflects the latest
// feature set — new (module, action) pairs are added (unassigned to any role
// until explicitly granted); nothing existing is ever removed here.
function syncPermissionMatrix() {
  const insert = db.prepare('INSERT OR IGNORE INTO permissions (module, action) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const moduleName of MODULES) {
      for (const action of ACTIONS) {
        insert.run(moduleName, action);
      }
    }
  });
  tx();
}
syncPermissionMatrix();
