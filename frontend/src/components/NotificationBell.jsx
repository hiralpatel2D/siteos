import { useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { formatDate } from '../utils/format';

// Project instruction #15: notification capabilities, reachable from anywhere in the app.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    const [{ data: list }, { data: unread }] = await Promise.all([
      client.get('/notifications'),
      client.get('/notifications/unread-count'),
    ]);
    setItems(list);
    setCount(unread.count);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markAllRead = async () => {
    await client.put('/notifications/read-all');
    load();
  };

  const markRead = async (n) => {
    if (!n.is_read) { await client.put(`/notifications/${n.id}/read`); load(); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
          </div>
          {items.length === 0 && <div className="px-3 py-6 text-sm text-gray-500 text-center">You're all caught up.</div>}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              className={`w-full text-left px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${n.is_read ? '' : 'bg-blue-50/60'}`}
            >
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
