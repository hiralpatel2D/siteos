import RegisterView from '../components/RegisterView';
import { invoicingApi } from '../api/modules';
import { formatDate, formatINR } from '../utils/format';
import { useProjects } from '../utils/useProjects';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_COLOR = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
};

export default function InvoicingPage() {
  const projects = useProjects();
  const projectOptions = projects.map((p) => ({ value: String(p.id), label: p.name }));

  const fields = [
    { name: 'projectId', label: 'Project / Site', type: 'select', required: true, options: projectOptions },
    { name: 'invoiceNo', label: 'Invoice No.', type: 'text', required: true },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'clientName', label: 'Client Name', type: 'text' },
    { name: 'amount', label: 'Amount before tax (INR)', type: 'number', required: true },
    { name: 'taxAmount', label: 'Tax Amount (INR)', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'dueDate', label: 'Due Date', type: 'date' },
  ];

  const api = {
    list: (params) => invoicingApi.list(params),
    create: (values) => invoicingApi.create({ ...values, amount: Number(values.amount), taxAmount: Number(values.taxAmount) || 0 }),
    update: (id, values) => invoicingApi.update(id, { ...values, amount: Number(values.amount), taxAmount: Number(values.taxAmount) || 0 }),
    remove: (id, confirmDate) => invoicingApi.remove(id, confirmDate),
  };

  return (
    <RegisterView
      moduleKey="invoicing"
      title="Invoicing & Billing"
      api={api}
      emptyLabel="No invoices yet — raise your first invoice against a project."
      getItemLabel={(item) => `Invoice ${item.invoice_no}`}
      columns={[
        { key: 'invoice_no', label: 'Invoice No.' },
        { key: 'invoice_date', label: 'Date', render: (i) => formatDate(i.invoice_date) },
        { key: 'project_name', label: 'Project' },
        { key: 'client_name', label: 'Client' },
        { key: 'total_amount', label: 'Total', render: (i) => formatINR(i.total_amount) },
        { key: 'status', label: 'Status', render: (i) => <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[i.status]}`}>{i.status}</span> },
        { key: 'due_date', label: 'Due', render: (i) => formatDate(i.due_date) },
      ]}
      renderCard={(i) => (
        <>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{i.invoice_no}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[i.status]}`}>{i.status}</span>
          </div>
          <p className="text-sm text-gray-600">{i.client_name} · {i.project_name}</p>
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>Date: {formatDate(i.invoice_date)}</span>
            <span>Due: {formatDate(i.due_date)}</span>
          </div>
          <p className="text-sm font-medium text-gray-800">{formatINR(i.total_amount)}</p>
        </>
      )}
      fields={fields}
    />
  );
}
