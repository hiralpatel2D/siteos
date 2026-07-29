// Project instruction #2: currency is INR. #3: dates are shown as DD-MM-YYYY.

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '₹0';
  return inrFormatter.format(Number(amount));
}

// Accepts an ISO date (YYYY-MM-DD or full timestamp) and renders DD-MM-YYYY.
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// DD-MM-YYYY plus the day name — used only on prominent single headers (e.g. the DPR
// landing page date) so it reads naturally, never on dense table/card date fields
// where the extra text would just be clutter.
export function formatDateWithDay(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
  return `${formatDate(isoDate)}, ${dayName}`;
}

// Today's date as ISO (YYYY-MM-DD), used for the delete-confirmation prompt and default form values.
export function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// DD-MM-YYYY as displayed to the user for the "type today's date" delete confirmation.
export function todayDisplay() {
  return formatDate(todayISO());
}
