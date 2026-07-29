import RegisterView from '../components/RegisterView';
import { dprApi } from '../api/modules';
import { formatDate } from '../utils/format';
import { useProjects } from '../utils/useProjects';

export default function DprPage() {
  const projects = useProjects();
  const projectOptions = projects.map((p) => ({ value: String(p.id), label: p.name }));

  const fields = [
    { name: 'projectId', label: 'Project / Site', type: 'select', required: true, options: projectOptions },
    { name: 'reportDate', label: 'Report Date', type: 'date', required: true },
    { name: 'weather', label: 'Weather', type: 'text' },
    { name: 'manpowerCount', label: 'Manpower Count', type: 'number' },
    { name: 'workSummary', label: 'Work Summary', type: 'textarea', required: true },
    { name: 'issues', label: 'Issues / Blockers', type: 'textarea' },
  ];

  const api = {
    list: (params) => dprApi.list(params),
    create: (values) => dprApi.create({ ...values, manpowerCount: Number(values.manpowerCount) || 0 }),
    update: (id, values) => dprApi.update(id, { ...values, manpowerCount: Number(values.manpowerCount) || 0 }),
    remove: (id, confirmDate) => dprApi.remove(id, confirmDate),
  };

  return (
    <RegisterView
      moduleKey="dashboard_dpr"
      title="Daily Progress Report"
      api={api}
      emptyLabel="No daily progress reports yet — add today's report to get started."
      getItemLabel={(item) => `DPR for ${item.project_name} on ${formatDate(item.report_date)}`}
      columns={[
        { key: 'report_date', label: 'Date', render: (i) => formatDate(i.report_date) },
        { key: 'project_name', label: 'Project' },
        { key: 'weather', label: 'Weather' },
        { key: 'manpower_count', label: 'Manpower' },
        { key: 'work_summary', label: 'Work Summary', render: (i) => <span className="line-clamp-2 max-w-xs block">{i.work_summary}</span> },
        { key: 'issues', label: 'Issues', render: (i) => i.issues ? <span className="text-amber-600">{i.issues}</span> : '—' },
      ]}
      renderCard={(i) => (
        <>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{i.project_name}</span>
            <span className="text-xs text-gray-500">{formatDate(i.report_date)}</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{i.work_summary}</p>
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>Weather: {i.weather || '—'}</span>
            <span>Manpower: {i.manpower_count}</span>
          </div>
          {i.issues && <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">{i.issues}</div>}
        </>
      )}
      fields={fields}
    />
  );
}
