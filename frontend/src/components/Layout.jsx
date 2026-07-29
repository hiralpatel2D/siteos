import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const NAV = [
  { to: '/dpr', label: 'Daily Progress Report', module: 'dashboard_dpr' },
  { to: '/projects', label: 'Projects & Sites', module: 'projects' },
  { to: '/inventory', label: 'Material & Inventory', module: 'inventory' },
  { to: '/attendance', label: 'Labour & Attendance', module: 'attendance' },
  { to: '/invoicing', label: 'Invoicing & Billing', module: 'invoicing' },
  { to: '/roles', label: 'Roles & Permissions', module: 'roles_permissions', adminOnly: true },
  { to: '/users', label: 'Users', module: 'users', adminOnly: true },
];

export default function Layout() {
  const { user, can, isSuperAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((n) => {
    if (n.adminOnly) return isSuperAdmin || can(n.module, 'view') || can('roles_permissions', 'view');
    return can(n.module, 'view');
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-200 transform transition-transform md:translate-x-0 md:static ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <span className="text-white font-semibold text-lg">SiteOS</span>
        </div>
        <nav className="p-3 space-y-1">
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <div className="text-xs text-gray-400 px-1">{user?.name}</div>
          <div className="text-xs text-gray-500 px-1 mb-2">{user?.role}{isSuperAdmin ? ' · Super Admin' : ''}</div>
          <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800">
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4 md:px-6 sticky top-0 z-20">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
