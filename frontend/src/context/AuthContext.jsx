import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]); // [{module, action}]
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('siteos_token');
    if (!token) { setLoading(false); return; }
    try {
      const [{ data: me }, { data: perms }] = await Promise.all([
        client.get('/auth/me'),
        client.get('/auth/my-permissions'),
      ]);
      setUser(me);
      setIsSuperAdmin(!!perms.isSuperAdmin);
      setPermissions(perms.permissions || []);
    } catch {
      localStorage.removeItem('siteos_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('siteos_token', data.token);
    setUser(data.user);
    await loadSession();
  };

  const logout = () => {
    localStorage.removeItem('siteos_token');
    setUser(null);
    setPermissions([]);
    setIsSuperAdmin(false);
    window.location.href = '/login';
  };

  const can = useCallback((moduleName, action = 'view') => {
    if (isSuperAdmin) return true;
    return permissions.some((p) => p.module === moduleName && p.action === action);
  }, [permissions, isSuperAdmin]);

  const setViewPref = async (moduleName, view) => {
    const { data } = await client.put('/auth/me/view-prefs', { module: moduleName, view });
    setUser((u) => ({ ...u, viewPrefs: data.viewPrefs }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, isSuperAdmin, setViewPref }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
