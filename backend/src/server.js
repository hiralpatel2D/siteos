import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { seedDatabase } from './db/seed.js';
import authRoutes from './routes/auth.js';
import rolesRoutes from './routes/roles.js';
import usersRoutes from './routes/users.js';
import projectsRoutes from './routes/projects.js';
import dprRoutes from './routes/dpr.js';
import inventoryRoutes from './routes/inventory.js';
import attendanceRoutes from './routes/attendance.js';
import invoicingRoutes from './routes/invoicing.js';
import notificationsRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';

// Auto-seed on boot if the database is empty. This matters a lot on free-tier
// hosts (Render, etc.) whose disk is wiped on every redeploy/restart — without
// this, the demo logins would vanish the first time the service spins back up.
seedDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'SiteOS API' }));

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/invoicing', invoicingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);

// Single-service deployment: if a built frontend exists (frontend/dist, copied to
// backend/public during the Render build step — see backend/package.json's
// "render-build" script), serve it here so the whole app is one web service on
// one free-tier host, instead of needing separate frontend/backend hosting.
const staticDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  console.log('Serving built frontend from', staticDir);
} else {
  console.log('No built frontend found at', staticDir, '— run the frontend separately in dev (npm run dev).');
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SiteOS API listening on http://localhost:${PORT}`);
});
