# SiteOS — Construction Operating System

A mini ERP for small construction companies. Daily Progress Reports (DPR) as the
landing page, Projects/Sites, Material & Inventory, Labour & Attendance,
Invoicing & Billing, Roles & Permissions, Users, global search and
notifications.

## Stack (kept deliberately cheap to run)

- **Backend:** Node.js + Express + SQLite (via `better-sqlite3`) + JWT auth.
  No external database service required — the whole thing runs from a single
  file (`backend/data/siteos.db`), which keeps hosting costs near-zero (a
  small VPS or even a free-tier host is enough). Swap in PostgreSQL later
  by changing `backend/src/db/index.js` if/when the company outgrows SQLite.
- **Frontend:** React + Vite + Tailwind CSS v4 + React Router.

## Project requirements this build implements

1. Global search (top bar, every page) across Projects, DPR, Inventory, Attendance, Invoices.
2. Currency shown throughout as INR (`₹`, Indian digit grouping).
3. Dates displayed as `DD-MM-YYYY` everywhere in the UI (native date pickers
   still use the browser's own locale format for the picker widget itself —
   that's an HTML `<input type="date">` limitation, not a data/display issue).
4. Every register page has its own search box.
5. Minimum-resource data entry — lean forms, sensible defaults, no redundant fields.
6. Super Admin can never be deleted or deactivated (enforced both in the UI and on the server).
7. Responsive layout (mobile hamburger sidebar, card view scales down to one column).
8. Every register has Row and Card views; the last-selected view is remembered
   per user, per module (stored server-side on the user record, so it follows
   you across devices/browsers).
9. Roles & Permissions is reachable only by Super Admin/Admin. The permission
   matrix is generated from a single source of truth
   (`backend/src/db/schema.js` → `MODULES`/`ACTIONS`) and re-synced on every
   server boot, so a newly added module/action can never be silently missing
   from the matrix.
10. Daily Progress Report is the landing/home page after login.
11. Add/edit forms track dirty state; closing with unsaved changes prompts
    Save / Discard / Keep editing. Browser refresh/close is also guarded
    while a form has unsaved changes.
12. Every delete requires typing today's date (shown in DD-MM-YYYY) before it
    goes through — enforced again on the server, not just the UI dialog.
13. Deleting a Project shows the count of linked DPR/Inventory/Attendance/
    Invoice records before you confirm, since those all cascade with it.
14. This README + the in-app "Suggest before output" pattern: significant
    features were proposed and confirmed with the user before being built
    (see the chat for the scoping questions asked up front).
15. Notification bell with unread badge; low-stock and invoice/DPR-issue
    events raise notifications automatically.

## Roles seeded

| Role | Access |
|---|---|
| Super Admin | Full access to everything, cannot be deleted/deactivated |
| Admin | Full access to everything (editable roles/users, but not itself lockable) |
| Site Engineer | DPR, Inventory, Attendance (view/create/edit), Projects/Reports/Notifications (view) |
| Accountant | Invoicing (full), DPR/Projects/Reports (view) |

Demo logins (password for all: `Admin@123`):

- `superadmin@siteos.app`
- `admin@siteos.app`
- `engineer@siteos.app`
- `accounts@siteos.app`

## Running it locally

```bash
# Backend
cd backend
npm install
npm run seed   # creates backend/data/siteos.db with roles + demo data (safe to re-run; skips if data exists)
npm start      # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev    # http://localhost:5173  (proxies /api to localhost:4000)
```

Open http://localhost:5173, log in with one of the demo accounts above.

To reset all data, stop the backend and delete `backend/data/siteos.db*`,
then run `npm run seed` again.

## What's next (not in this first pass)

- Reports/analytics module (the `reports` permission exists in the matrix
  already so it's ready to wire up).
- File attachments on DPR entries (photos of site progress).
- Email/SMS notification delivery (currently in-app only).
- Full route-level "unsaved changes" guarding for browser back/forward — the
  current implementation guards the add/edit modals and the permission
  matrix page, plus warns on tab close/refresh; a global router-level guard
  can be added if it turns out to matter in practice.
- PostgreSQL swap-in for multi-server deployments (SQLite is fine for a
  single small company on one server, which is the stated scope).

## Project structure

```
siteos/
  backend/
    src/
      db/            schema, seed data, sqlite connection
      middleware/     auth + permission guards
      routes/         auth, roles, users, projects, dpr, inventory, attendance, invoicing, notifications, search
      utils/          jwt, date-guard (delete confirmation), notify helpers
      server.js
  frontend/
    src/
      api/            axios client + per-module API wrappers
      components/      Layout, RegisterView (generic register list), modals, search, notifications
      context/         AuthContext (login, permissions, view prefs)
      pages/           one page per module
      utils/          currency/date formatting, projects hook
```
