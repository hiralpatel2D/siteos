import { useEffect, useMemo, useState } from 'react';
import { rolesApi } from '../api/modules';

const MODULE_LABEL = {
  dashboard_dpr: 'Daily Progress Report',
  projects: 'Projects & Sites',
  inventory: 'Material & Inventory',
  attendance: 'Labour & Attendance',
  invoicing: 'Invoicing & Billing',
  roles_permissions: 'Roles & Permissions',
  users: 'Users',
  notifications: 'Notifications',
  reports: 'Reports',
};

// Project instruction #9: Roles & Permission matrix, accessible only to Super Admin/Admin.
// The matrix always reflects every (module, action) pair defined in the backend's schema.js,
// so newly added modules/features can never be silently missed from this page.
export default function RolesPermissionsPage() {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState({}); // key `${roleId}:${permissionId}` -> granted
  const [saving, setSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const res = await rolesApi.matrix();
    setData(res);
    setPending({});
  };
  useEffect(() => { load(); }, []);

  const dirty = Object.keys(pending).length > 0;

  const isGranted = (role, perm) => {
    const key = `${role.role.id}:${perm.permissionId}`;
    return key in pending ? pending[key] : perm.granted;
  };

  const toggle = (role, perm) => {
    if (role.role.isSystem) return;
    const key = `${role.role.id}:${perm.permissionId}`;
    setPending((p) => ({ ...p, [key]: !isGranted(role, perm) }));
  };

  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      for (const key of Object.keys(pending)) {
        const [roleId, permissionId] = key.split(':').map(Number);
        await rolesApi.setPermission({ roleId, permissionId, granted: pending[key] });
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => setPending({});

  const addRole = async () => {
    if (!newRoleName.trim()) return;
    setError('');
    try {
      await rolesApi.create({ name: newRoleName.trim() });
      setNewRoleName('');
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create role');
    }
  };

  const removeRole = async (role) => {
    if (role.isSystem) return;
    if (!confirm(`Delete role "${role.name}"? This only works if no users are assigned to it.`)) return;
    try {
      await rolesApi.remove(role.id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not delete role');
    }
  };

  const groupedActions = useMemo(() => (data ? data.actions : []), [data]);

  if (!data) return <div className="p-8 text-center text-sm text-gray-500">Loading permission matrix…</div>;

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Roles & Permissions</h1>
        <div className="flex items-center gap-2">
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="New role name"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button onClick={addRole} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            + Add Role
          </button>
        </div>
      </div>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

      <p className="text-sm text-gray-500 mb-4">
        Super Admin and Admin always have full access and can't be edited here. Toggle checkboxes for other roles, then save.
      </p>

      <div className="space-y-6">
        {data.matrix.map((roleEntry) => (
          <div key={roleEntry.role.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{roleEntry.role.name}</span>
                {roleEntry.role.isSystem && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">System role · full access</span>}
              </div>
              {!roleEntry.role.isSystem && (
                <button onClick={() => removeRole(roleEntry.role)} className="text-xs text-red-600 hover:underline">Delete role</button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">Module</th>
                    {groupedActions.map((a) => (
                      <th key={a} className="px-4 py-2 font-medium capitalize text-center">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.modules.map((moduleName) => {
                    const perms = roleEntry.permissions.filter((p) => p.module === moduleName);
                    return (
                      <tr key={moduleName}>
                        <td className="px-4 py-2 text-gray-700">{MODULE_LABEL[moduleName] || moduleName}</td>
                        {perms.map((perm) => (
                          <td key={perm.permissionId} className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              disabled={roleEntry.role.isSystem}
                              checked={isGranted(roleEntry, perm)}
                              onChange={() => toggle(roleEntry, perm)}
                              className="w-4 h-4 accent-blue-600 disabled:opacity-50"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 shadow-lg px-4 md:px-6 py-3 flex items-center justify-between z-30">
          <span className="text-sm text-gray-700">You have unsaved permission changes.</span>
          <div className="flex gap-2">
            <button onClick={discardChanges} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Discard</button>
            <button onClick={saveChanges} disabled={saving} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
