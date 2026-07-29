import { useEffect, useState } from 'react';
import RegisterView from '../components/RegisterView';
import { dprApi, attendanceApi } from '../api/modules';
import { formatDate, formatDateWithDay, todayISO } from '../utils/format';
import { useProjects } from '../utils/useProjects';
import { useAuth } from '../context/AuthContext';

export default function DprPage() {
  const projects = useProjects();
  const { user } = useAuth();
  const [todaySummary, setTodaySummary] = useState(null);
  const projectOptions = projects.map((p) => ({ value: String(p.id), label: p.name }));

  useEffect(() => {
    attendanceApi.todaySummary().then(setTodaySummary).catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

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
      headerExtra={(
        <div className="mb-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-sm text-gray-500">Hi, {firstName} 👋</p>
            <p className="text-xs text-gray-400">{formatDateWithDay(todayISO())}</p>
          </div>
          {todaySummary && todaySummary.totalHeadcount > 0 && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1">
              👷 {todaySummary.totalHeadcount} on site today across {todaySummary.projectsCovered} project{todaySummary.projectsCovered === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}
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
