import RegisterView from '../components/RegisterView';
import { projectsApi } from '../api/modules';
import { formatDate, formatINR } from '../utils/format';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

export default function ProjectsPage() {
  const fields = [
    { name: 'name', label: 'Project Name', type: 'text', required: true },
    { name: 'code', label: 'Project Code', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'clientName', label: 'Client Name', type: 'text' },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'endDate', label: 'Expected End Date', type: 'date' },
    { name: 'budget', label: 'Budget (INR)', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  ];

  const api = {
    list: (params) => projectsApi.list(params),
    create: (values) => projectsApi.create({ ...values, budget: Number(values.budget) || 0 }),
    update: (id, values) => projectsApi.update(id, { ...values, budget: Number(values.budget) || 0 }),
    remove: (id, confirmDate) => projectsApi.remove(id, confirmDate),
  };

  return (
    <RegisterView
      moduleKey="projects"
      title="Projects & Sites"
      api={api}
      emptyLabel="No projects yet — add your first site to start recording DPRs, inventory and invoices against it."
      getItemLabel={(item) => item.name}
      columns={[
        { key: 'name', label: 'Project' },
        { key: 'code', label: 'Code' },
        { key: 'client_name', label: 'Client' },
        { key: 'location', label: 'Location' },
        { key: 'start_date', label: 'Start Date', render: (i) => formatDate(i.start_date) },
        { key: 'budget', label: 'Budget', render: (i) => formatINR(i.budget) },
        { key: 'status', label: 'Status' },
      ]}
      renderCard={(i) => (
        <>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{i.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">{i.status.replace('_', ' ')}</span>
          </div>
          <p className="text-sm text-gray-600">{i.client_name} · {i.location}</p>
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>Start: {formatDate(i.start_date)}</span>
            <span>Budget: {formatINR(i.budget)}</span>
          </div>
        </>
      )}
      fields={fields}
    />
  );
}
