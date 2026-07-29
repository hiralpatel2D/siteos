import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const MODULE_LABEL = {
  projects: 'Project', dpr: 'DPR', inventory: 'Inventory', attendance: 'Attendance', invoicing: 'Invoice',
};

// Project instruction #1: the app has a global search reachable from anywhere.
export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await client.get('/search', { params: { q } });
      setResults(data.results);
      setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (r) => {
    setOpen(false);
    setQ('');
    navigate(`/${r.module === 'dpr' ? 'dpr' : r.module}`);
  };

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        placeholder="Search projects, DPR, inventory, invoices…"
        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.module}-${r.id}`}
              onClick={() => go(r)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-800 truncate">{r.title}</span>
              <span className="text-xs text-gray-400 ml-2 shrink-0">{MODULE_LABEL[r.module] || r.module}{r.subtitle ? ` · ${r.subtitle}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && results.length === 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
          No matches found.
        </div>
      )}
    </div>
  );
}
