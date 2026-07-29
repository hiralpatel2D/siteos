import { useState } from 'react';
import { todayISO, todayDisplay } from '../utils/format';

// Project instruction #12: prompt to type today's date before any delete is allowed.
// impact (optional): { label, count }[] — linked-record counts so instruction #13
// ("check relationships aren't missed") is visible to the person doing the deleting,
// not just enforced silently server-side.
export default function ConfirmDeleteModal({ itemLabel, onConfirm, onCancel, impact }) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (typed.trim() !== todayDisplay()) {
      setError(`Please type today's date exactly as shown: ${todayDisplay()}`);
      return;
    }
    setBusy(true);
    try {
      await onConfirm(todayISO());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900">Confirm deletion</h3>
        <p className="mt-1.5 text-sm text-gray-600">
          You're about to permanently delete <span className="font-medium">{itemLabel}</span>. This can't be undone.
        </p>
        {impact && impact.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <p className="text-xs font-medium text-amber-800">This will also permanently delete:</p>
            <ul className="mt-1 text-xs text-amber-700 list-disc list-inside">
              {impact.map((row) => (
                <li key={row.label}>{row.count} {row.label}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-sm text-gray-700">
          Type today's date (<span className="font-mono font-semibold">{todayDisplay()}</span>) to confirm:
        </p>
        <input
          autoFocus
          value={typed}
          onChange={(e) => { setTyped(e.target.value); setError(''); }}
          placeholder={todayDisplay()}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
