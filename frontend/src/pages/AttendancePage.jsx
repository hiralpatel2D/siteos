import RegisterView from '../components/RegisterView';
import { attendanceApi } from '../api/modules';
import { formatDate, formatINR } from '../utils/format';
import { useProjects } from '../utils/useProjects';

const CATEGORY_OPTIONS = [
  'Mason', 'Helper', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Bar Bender', 'Supervisor', 'Other',
].map((c) => ({ value: c, label: c }));

export default function AttendancePage() {
  const projects = useProjects();
  const projectOptions = projects.map((p) => ({ value: String(p.id), label: p.name }));

  const fields = [
    { name: 'projectId', label: 'Project / Site', type: 'select', required: true, options: projectOptions },
    { name: 'attendanceDate', label: 'Date', type: 'date', required: true },
    { name: 'labourCategory', label: 'Labour Category', type: 'select', required: true, options: CATEGORY_OPTIONS },
    { name: 'headcount', label: 'Headcount', type: 'number', required: true },
    { name: 'wageRate', label: 'Wage Rate per person (INR)', type: 'number', required: true },
  ];

  const api = {
    list: (params) => attendanceApi.list(params),
    create: (values) => attendanceApi.create({ ...values, headcount: Number(values.headcount), wageRate: Number(values.wageRate) }),
    update: (id, values) => attendanceApi.update(id, { ...values, headcount: Number(values.headcount), wageRate: Number(values.wageRate) }),
    remove: (id, confirmDate) => attendanceApi.remove(id, confirmDate),
  };

  return (
    <RegisterView
      moduleKey="attendance"
      title="Labour & Attendance"
      api={api}
      emptyLabel="No attendance entries yet — log today's headcount to get started."
      getItemLabel={(item) => `${item.labour_category} attendance on ${formatDate(item.attendance_date)}`}
      columns={[
        { key: 'attendance_date', label: 'Date', render: (i) => formatDate(i.attendance_date) },
        { key: 'project_name', label: 'Project' },
        { key: 'labour_category', label: 'Category' },
        { key: 'headcount', label: 'Headcount' },
        { key: 'wage_rate', label: 'Wage Rate', render: (i) => formatINR(i.wage_rate) },
        { key: 'total_amount', label: 'Total', render: (i) => formatINR(i.total_amount) },
      ]}
      renderCard={(i) => (
        <>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{i.labour_category}</span>
            <span className="text-xs text-gray-500">{formatDate(i.attendance_date)}</span>
          </div>
          <p className="text-sm text-gray-600">{i.project_name}</p>
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>{i.headcount} people</span>
            <span>{formatINR(i.wage_rate)}/person</span>
          </div>
          <p className="text-sm font-medium text-gray-800">Total: {formatINR(i.total_amount)}</p>
        </>
      )}
      fields={fields}
    />
  );
}
