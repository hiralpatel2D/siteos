import { useState } from 'react';
import { materialsApi } from '../api/modules';

// Lightweight modal for adding a new material type to the shared materials master list.
export default function AddMaterialModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [minStock, setMinStock] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !unit.trim()) { setError('Name and unit are required'); return; }
    setBusy(true);
    try {
      await materialsApi.create({ name, unit, category, minStock: Number(minStock) || 0 });
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not add material');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Material</h3>
        {error && <div className="mb-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Material name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (bags, kg, cft…)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={minStock} onChange={(e) => setMinStock(e.target.value)} type="number" placeholder="Minimum stock threshold" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={busy} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
