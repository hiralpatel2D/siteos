import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../api/modules';
import { formatDate, formatINR } from '../utils/format';
import { useAuth } from '../context/AuthContext';

// Project drill-down — closes the biggest structural gap vs. the competitor app we
// benchmarked against: clicking a project should feel like a dashboard (assigned
// labour, recent site activity, financial summary), not just a plain record.
export default function ProjectDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    projectsApi.dashboard(id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Could not load this project. It may have been deleted.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading project…</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Link to="/projects" className="text-sm text-blue-600 hover:underline">← Back to Projects</Link>
        <p className="mt-3 text-sm text-red-600">{error || 'Project not found.'}</p>
      </div>
    );
  }

  const { project, recentDpr, labour, invoicing, counts } = data;
  const statusColor = project.status === 'active' ? 'bg-green-50 text-green-700' : project.status === 'on_hold' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700';

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <Link to="/projects" className="text-sm text-blue-600 hover:underline">← Back to Projects</Link>

      <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{project.code || '—'} · {project.client_name || 'No client set'}{project.location ? ` · ${project.location}` : ''}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${statusColor}`}>{(project.status || '').replace('_', ' ')}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Start Date</p>
            <p className="text-gray-800">{formatDate(project.start_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Expected End</p>
            <p className="text-gray-800">{formatDate(project.end_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Budget</p>
            <p className="text-gray-800">{formatINR(project.budget)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Invoiced so far</p>
            <p className="text-gray-800">{formatINR(invoicing.totalInvoiced)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Labour */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Assigned Labour</h2>
            {can('attendance', 'view') && (
              <Link to="/attendance" className="text-xs text-blue-600 hover:underline">View all →</Link>
            )}
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <div>
              <p className="text-lg font-semibold text-gray-900">{labour.totalHeadcountToday}</p>
              <p className="text-xs text-gray-400">on site today</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{labour.daysLogged}</p>
              <p className="text-xs text-gray-400">days logged</p>
            </div>
          </div>
          {labour.recent.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No labour attendance recorded for this project yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {labour.recent.map((r) => (
                <li key={r.id} className="py-1.5 flex items-center justify-between">
                  <span className="text-gray-700">{r.labour_category} · {r.headcount} people</span>
                  <span className="text-xs text-gray-400">{formatDate(r.attendance_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent site activity (DPR) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Recent Site Activity</h2>
            {can('dashboard_dpr', 'view') && (
              <Link to="/dpr" className="text-xs text-blue-600 hover:underline">View all →</Link>
            )}
          </div>
          {recentDpr.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No daily progress reports recorded for this project yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {recentDpr.map((r) => (
                <li key={r.id} className="py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatDate(r.report_date)}</span>
                    <span className="text-xs text-gray-400">Manpower: {r.manpower_count}</span>
                  </div>
                  <p className="text-gray-700 line-clamp-1">{r.work_summary}</p>
                  {r.issues && <p className="text-amber-600 text-xs mt-0.5">{r.issues}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Invoicing */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Invoicing Summary</h2>
            {can('invoicing', 'view') && (
              <Link to="/invoicing" className="text-xs text-blue-600 hover:underline">View all →</Link>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-lg font-semibold text-gray-900">{formatINR(invoicing.totalInvoiced)}</p>
              <p className="text-xs text-gray-400">total invoiced ({invoicing.invoiceCount})</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-700">{formatINR(invoicing.totalPaid)}</p>
              <p className="text-xs text-gray-400">paid</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-700">{formatINR(invoicing.totalInvoiced - invoicing.totalPaid)}</p>
              <p className="text-xs text-gray-400">outstanding</p>
            </div>
          </div>
          {invoicing.recent.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No invoices raised for this project yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs">
                    <th className="py-1 pr-4 font-medium">Invoice</th>
                    <th className="py-1 pr-4 font-medium">Date</th>
                    <th className="py-1 pr-4 font-medium">Client</th>
                    <th className="py-1 pr-4 font-medium">Amount</th>
                    <th className="py-1 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoicing.recent.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-1.5 pr-4 whitespace-nowrap text-gray-800">{inv.invoice_no}</td>
                      <td className="py-1.5 pr-4 whitespace-nowrap text-gray-600">{formatDate(inv.invoice_date)}</td>
                      <td className="py-1.5 pr-4 whitespace-nowrap text-gray-600">{inv.client_name || '—'}</td>
                      <td className="py-1.5 pr-4 whitespace-nowrap text-gray-800">{formatINR(inv.total_amount)}</td>
                      <td className="py-1.5 whitespace-nowrap capitalize text-gray-600">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Total linked records: {counts.dpr} DPR · {counts.attendance} attendance · {counts.invoices} invoices · {counts.inventoryTransactions} inventory transactions.
      </p>
    </div>
  );
}
