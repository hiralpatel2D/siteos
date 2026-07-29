// Project instruction #11: if any changes are made, ask to save before discarding them.
export default function UnsavedChangesModal({ onSave, onDiscard, onCancel, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900">Unsaved changes</h3>
        <p className="mt-1.5 text-sm text-gray-600">You have unsaved changes. Do you want to save them before leaving?</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Keep editing
          </button>
          <button onClick={onDiscard} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
