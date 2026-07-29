import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ViewToggle from './ViewToggle';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import UnsavedChangesModal from './UnsavedChangesModal';
import RegisterFormModal from './RegisterFormModal';

// Generic register (list) component shared by DPR / Inventory / Attendance / Invoicing.
// Encapsulates: row+card view w/ remembered preference, per-view search, add/edit form
// with unsaved-changes guarding, and delete-with-today's-date confirmation.
//
// api: { list(params) => Promise<items>, create(payload), update(id, payload), remove(id, confirmDate) }
// columns: [{ key, label, render?(item) }]  -- used for row/table view
// renderCard(item) -> JSX                    -- used for card view
// fields: form field definitions passed straight through to RegisterFormModal
// getItemLabel(item) -> string used in the delete confirmation copy
export default function RegisterView({
  moduleKey,
  title,
  api,
  columns,
  renderCard,
  fields,
  getItemLabel,
  emptyLabel = 'No records yet.',
  extraToolbar = null,
  headerExtra = null,
  getImpact = null,
}) {
  const { user, can, setViewPref } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  // Respect an explicitly saved preference first. If the user has never chosen a
  // view for this module, default to Cards on narrow (mobile) screens and Rows on
  // wider ones — a row/table is genuinely hard to scan on a phone, Cards read
  // better there, but we never override a preference the user actually picked.
  const [view, setView] = useState(
    user?.viewPrefs?.[moduleKey] || (typeof window !== 'undefined' && window.innerWidth < 640 ? 'card' : 'row')
  );
  const [tableScroll, setTableScroll] = useState({ atStart: true, atEnd: true, scrollable: false });
  const tableScrollRef = useRef(null);

  const updateTableScroll = useCallback((el) => {
    if (!el) return;
    const scrollable = el.scrollWidth > el.clientWidth + 2;
    setTableScroll({
      scrollable,
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft >= el.scrollWidth - el.clientWidth - 2,
    });
  }, []);

  // Re-check scrollability whenever the table's content or size changes (e.g. after
  // data loads, or the window is resized/rotated) — not just on manual scroll.
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el || view !== 'row') return;
    updateTableScroll(el);
    const observer = new ResizeObserver(() => updateTableScroll(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, items, updateTableScroll]);
  const [formState, setFormState] = useState(null); // null | 'create' | item
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteImpact, setDeleteImpact] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const canCreate = can(moduleKey, 'create');
  const canEdit = can(moduleKey, 'edit');
  const canDelete = can(moduleKey, 'delete');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list({ q: query || undefined });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [api, query]);

  useEffect(() => { load(); }, [load]);

  // Debounce the per-view search box a touch so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const changeView = async (v) => {
    setView(v);
    try { await setViewPref(moduleKey, v); } catch { /* non-fatal */ }
  };

  const requestCloseForm = () => {
    if (dirty) { setPendingClose(true); return; }
    setFormState(null);
  };

  const handleSubmit = async (payload) => {
    if (formState === 'create') {
      await api.create(payload);
    } else {
      await api.update(formState.id, payload);
    }
    setDirty(false);
    setFormState(null);
    setPendingClose(false);
    await load();
  };

  const openDelete = (item) => {
    setDeleteTarget(item);
    setDeleteImpact(null);
    if (getImpact) {
      getImpact(item.id).then(setDeleteImpact).catch(() => {});
    }
  };

  const handleDeleteConfirm = async (confirmDate) => {
    await api.remove(deleteTarget.id, confirmDate);
    setDeleteTarget(null);
    setDeleteImpact(null);
    await load();
  };

  const emptyState = useMemo(() => !loading && items.length === 0, [loading, items]);

  return (
    <div className="p-4 md:p-6">
      {headerExtra}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="w-56 rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-2.5 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <ViewToggle view={view} onChange={changeView} />
          {extraToolbar}
          {canCreate && (
            <button
              onClick={() => setFormState('create')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500 py-8 text-center">Loading…</div>}
      {emptyState && <div className="text-sm text-gray-500 py-12 text-center border border-dashed rounded-xl bg-white">{emptyLabel}</div>}

      {!loading && items.length > 0 && view === 'row' && (
        <div className="relative">
          <div
            className="overflow-x-auto rounded-xl border border-gray-200 bg-white"
            onScroll={(e) => updateTableScroll(e.currentTarget)}
            ref={tableScrollRef}
          >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 font-medium whitespace-nowrap">{c.label}</th>
                ))}
                {(canEdit || canDelete) && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 whitespace-nowrap text-gray-800">
                      {c.render ? c.render(item) : (item[c.key] ?? '—')}
                    </td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {canEdit && (
                        <button onClick={() => setFormState(item)} className="text-blue-600 hover:underline mr-3 text-sm">Edit</button>
                      )}
                      {canDelete && (
                        <button onClick={() => openDelete(item)} className="text-red-600 hover:underline text-sm">Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {tableScroll.scrollable && !tableScroll.atEnd && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 rounded-r-xl bg-gradient-to-l from-white to-transparent" />
          )}
          {tableScroll.scrollable && !tableScroll.atStart && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 rounded-l-xl bg-gradient-to-r from-white to-transparent" />
          )}
          {tableScroll.scrollable && (
            <p className="mt-1 text-xs text-gray-400 md:hidden">← scroll for more →</p>
          )}
        </div>
      )}

      {!loading && items.length > 0 && view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
              {renderCard(item)}
              {(canEdit || canDelete) && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end gap-3">
                  {canEdit && <button onClick={() => setFormState(item)} className="text-blue-600 hover:underline text-sm">Edit</button>}
                  {canDelete && <button onClick={() => openDelete(item)} className="text-red-600 hover:underline text-sm">Delete</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formState && (
        <RegisterFormModal
          title={formState === 'create' ? `Add ${title}` : `Edit ${title}`}
          fields={fields}
          initial={formState === 'create' ? {} : formState}
          onDirtyChange={setDirty}
          onSubmit={handleSubmit}
          onRequestClose={requestCloseForm}
        />
      )}

      {pendingClose && (
        <UnsavedChangesModal
          onCancel={() => setPendingClose(false)}
          onDiscard={() => { setPendingClose(false); setDirty(false); setFormState(null); }}
          onSave={() => document.dispatchEvent(new CustomEvent('siteos:register-form-save'))}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          itemLabel={getItemLabel(deleteTarget)}
          impact={deleteImpact}
          onCancel={() => { setDeleteTarget(null); setDeleteImpact(null); }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
