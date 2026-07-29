import { useEffect, useState } from 'react';
import { usersApi, rolesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import ViewToggle from '../components/ViewToggle';

export default function UsersPage() {
  const { user, setViewPref } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState(user?.viewPrefs?.users || 'row');
  const [modal, setModal] = useState(null); // null | 'create' | user
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    const [u, r] = await Promise.all([usersApi.list({ q: query || undefined }), rolesApi.list()]);
    setUsers(u);
    setRoles(r);
  };
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [query]);

  const changeView = async (v) => { setView(v); try { await setViewPref('users', v); } catch { /* noop */ } };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <ViewToggle view={view} onChange={changeView} />
          <button onClick={() => setModal('create')} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            + Add User
          </button>
        </div>
      </div>

      {users.length === 0 && <div className="text-sm text-gray-500 py-12 text-center border border-dashed rounded-xl bg-white">No users found.</div>}

      {users.length > 0 && view === 'row' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">{u.name}{u.isSuperAdmin ? <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Super Admin</span> : null}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">{u.role}</td>
                  <td className="px-4 py-2.5">{u.isActive ? <span className="text-green-600">Active</span> : <span className="text-gray-400">Inactive</span>}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => setModal(u)} className="text-blue-600 hover:underline mr-3 text-sm">Edit</button>
                    {!u.isSuperAdmin && <button onClick={() => setDeleteTarget(u)} className="text-red-600 hover:underline text-sm">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.length > 0 && view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{u.name}</span>
                {u.isSuperAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Super Admin</span>}
              </div>
              <p className="text-sm text-gray-600">{u.email}</p>
              <p className="text-xs text-gray-500">{u.role} · {u.isActive ? 'Active' : 'Inactive'}</p>
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setModal(u)} className="text-blue-600 hover:underline text-sm">Edit</button>
                {!u.isSuperAdmin && <button onClick={() => setDeleteTarget(u)} className="text-red-600 hover:underline text-sm">Delete</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <UserFormModal
          mode={modal === 'create' ? 'create' : 'edit'}
          initial={modal === 'create' ? null : modal}
          roles={roles}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}
    </div>
  );
}

function UserFormModal({ mode, initial, roles, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(initial ? roles.find((r) => r.name === initial.role)?.id || '' : '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const markDirty = (setter) => (v) => { setter(v); setDirty(true); };

  const submit = async () => {
    setError('');
    if (mode === 'create' && (!name.trim() || !email.trim() || !password.trim() || !roleId)) {
      setError('Name, email, password and role are required'); return;
    }
    setBusy(true);
    try {
      if (mode === 'create') {
        await usersApi.create({ name, email, password, roleId: Number(roleId) });
      } else {
        await usersApi.update(initial.id, { name, roleId: initial.isSuperAdmin ? undefined : Number(roleId), isActive: initial.isSuperAdmin ? true : isActive });
      }
      setDirty(false);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save user');
    } finally {
      setBusy(false);
    }
  };

  const requestClose = () => { if (dirty) setConfirmClose(true); else onClose(); };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{mode === 'create' ? 'Add User' : 'Edit User'}</h3>
        {error && <div className="mb-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-2.5">
          <input value={name} onChange={(e) => markDirty(setName)(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={email} disabled={mode === 'edit'} onChange={(e) => markDirty(setEmail)(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50" />
          {mode === 'create' && (
            <input value={password} onChange={(e) => markDirty(setPassword)(e.target.value)} type="password" placeholder="Password" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          )}
          {!initial?.isSuperAdmin && (
            <select value={roleId} onChange={(e) => markDirty(setRoleId)(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select role…</option>
              {roles.filter((r) => r.name !== 'Super Admin').map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          {mode === 'edit' && !initial?.isSuperAdmin && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isActive} onChange={(e) => markDirty(setIsActive)(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Active
            </label>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={requestClose} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={busy} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900">Unsaved changes</h3>
            <p className="mt-1.5 text-sm text-gray-600">You have unsaved changes. Do you want to save them before leaving?</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button onClick={() => setConfirmClose(false)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Keep editing</button>
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Discard</button>
              <button onClick={() => { setConfirmClose(false); submit(); }} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteUserModal({ user, onCancel, onDeleted }) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const todayDisplay = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  };

  const confirm = async () => {
    if (typed.trim() !== todayDisplay()) { setError(`Type today's date exactly: ${todayDisplay()}`); return; }
    setBusy(true);
    try {
      const [dd, mm, yyyy] = typed.trim().split('-');
      await usersApi.remove(user.id, `${yyyy}-${mm}-${dd}`);
      onDeleted();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not delete user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900">Confirm deletion</h3>
        <p className="mt-1.5 text-sm text-gray-600">Delete user <span className="font-medium">{user.name}</span>? This can't be undone.</p>
        <p className="mt-3 text-sm text-gray-700">Type today's date (<span className="font-mono font-semibold">{todayDisplay()}</span>) to confirm:</p>
        <input value={typed} onChange={(e) => { setTyped(e.target.value); setError(''); }} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={confirm} disabled={busy} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
