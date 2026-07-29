import { useEffect, useState } from 'react';

// Generic add/edit form modal driven by a field-definition array:
// { name, label, type: 'text'|'textarea'|'number'|'date'|'select', required, options: [{value,label}] }
export default function RegisterFormModal({ title, fields, initial, onDirtyChange, onSubmit, onRequestClose }) {
  const buildInitial = () => {
    const obj = {};
    for (const f of fields) obj[f.name] = initial?.[f.name] ?? (f.type === 'number' ? '' : '');
    return obj;
  };
  const [values, setValues] = useState(buildInitial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isDirty = () => JSON.stringify(values) !== JSON.stringify(buildInitial());

  useEffect(() => { onDirtyChange(isDirty()); /* eslint-disable-next-line */ }, [values]);

  // Warn on browser refresh/close while editing with unsaved changes.
  useEffect(() => {
    const handler = (e) => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const submit = async () => {
    const nextErrors = {};
    for (const f of fields) {
      if (f.required && (values[f.name] === '' || values[f.name] == null)) {
        nextErrors[f.name] = `${f.label} is required`;
      }
    }
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors({ _form: err?.response?.data?.error || 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Allows the parent's "unsaved changes" modal to trigger this form's own submit logic.
  useEffect(() => {
    const handler = () => submit();
    document.addEventListener('siteos:register-form-save', handler);
    return () => document.removeEventListener('siteos:register-form-save', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const setField = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onRequestClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {errors._form && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errors._form}</div>}
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}{f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : f.type === 'select' ? (
                <select
                  value={values[f.name] ?? ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select…</option>
                  {(f.options || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onRequestClose} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={submit} disabled={saving} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
