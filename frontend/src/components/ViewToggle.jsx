// Row vs Card view toggle — project instruction #8 (every register has both views,
// and the last-selected preference is remembered per user/per module).
export default function ViewToggle({ view, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => onChange('row')}
        className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
          view === 'row' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
        title="Row view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        Rows
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 border-l border-gray-300 ${
          view === 'card' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
        title="Card view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>
        Cards
      </button>
    </div>
  );
}
