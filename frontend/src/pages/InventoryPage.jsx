import { useEffect, useState } from 'react';
import RegisterView from '../components/RegisterView';
import AddMaterialModal from '../components/AddMaterialModal';
import { inventoryApi, materialsApi } from '../api/modules';
import { formatDate, formatINR } from '../utils/format';
import { useProjects } from '../utils/useProjects';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const projects = useProjects();
  const { can } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMaterials = () => materialsApi.list().then(setMaterials).catch(() => {});
  useEffect(() => { loadMaterials(); }, []);

  const projectOptions = projects.map((p) => ({ value: String(p.id), label: p.name }));
  const materialOptions = materials.map((m) => ({ value: String(m.id), label: `${m.name} (${m.unit})` }));

  const fields = [
    { name: 'projectId', label: 'Project / Site', type: 'select', required: true, options: projectOptions },
    { name: 'materialId', label: 'Material', type: 'select', required: true, options: materialOptions },
    { name: 'txnType', label: 'Type', type: 'select', required: true, options: [{ value: 'in', label: 'Stock In' }, { value: 'out', label: 'Stock Out' }] },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'rate', label: 'Rate per unit (INR)', type: 'number' },
    { name: 'vendor', label: 'Vendor', type: 'text' },
    { name: 'txnDate', label: 'Date', type: 'date', required: true },
    { name: 'remarks', label: 'Remarks', type: 'textarea' },
  ];

  const api = {
    list: (params) => inventoryApi.list(params),
    create: (values) => inventoryApi.create({ ...values, quantity: Number(values.quantity), rate: Number(values.rate) || 0 }),
    update: (id, values) => inventoryApi.update(id, { ...values, quantity: Number(values.quantity), rate: Number(values.rate) || 0 }),
    remove: (id, confirmDate) => inventoryApi.remove(id, confirmDate),
  };

  return (
    <>
      <RegisterView
        key={refreshKey}
        moduleKey="inventory"
        title="Material & Inventory"
        api={api}
        emptyLabel="No inventory transactions yet — record a stock-in or stock-out entry to get started."
        getItemLabel={(item) => `${item.material_name} — ${item.txn_type === 'in' ? 'Stock In' : 'Stock Out'} on ${formatDate(item.txn_date)}`}
        extraToolbar={can('inventory', 'create') && (
          <button
            onClick={() => setShowAddMaterial(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            + Material
          </button>
        )}
        columns={[
          { key: 'txn_date', label: 'Date', render: (i) => formatDate(i.txn_date) },
          { key: 'project_name', label: 'Project' },
          { key: 'material_name', label: 'Material' },
          { key: 'txn_type', label: 'Type', render: (i) => <span className={i.txn_type === 'in' ? 'text-green-600' : 'text-orange-600'}>{i.txn_type === 'in' ? 'Stock In' : 'Stock Out'}</span> },
          { key: 'quantity', label: 'Quantity', render: (i) => `${i.quantity} ${i.unit}` },
          { key: 'rate', label: 'Rate', render: (i) => formatINR(i.rate) },
          { key: 'vendor', label: 'Vendor' },
        ]}
        renderCard={(i) => (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{i.material_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${i.txn_type === 'in' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {i.txn_type === 'in' ? 'Stock In' : 'Stock Out'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{i.project_name}</p>
            <div className="text-xs text-gray-500 flex items-center gap-3">
              <span>{i.quantity} {i.unit}</span>
              <span>{formatINR(i.rate)}/unit</span>
              <span>{formatDate(i.txn_date)}</span>
            </div>
            {i.vendor && <p className="text-xs text-gray-400">Vendor: {i.vendor}</p>}
          </>
        )}
        fields={fields}
      />
      {showAddMaterial && (
        <AddMaterialModal
          onClose={() => setShowAddMaterial(false)}
          onCreated={() => { loadMaterials(); setRefreshKey((k) => k + 1); }}
        />
      )}
    </>
  );
}
