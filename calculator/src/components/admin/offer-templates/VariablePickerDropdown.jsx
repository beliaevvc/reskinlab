import { useState, useRef, useEffect } from 'react';

const SOURCE_LABELS = {
  client: 'Client',
  project: 'Project',
  specification: 'Specification',
  invoice: 'Invoice',
  manual: 'Manual',
  computed: 'Computed',
};

const SOURCE_COLORS = {
  client: 'bg-blue-50 text-blue-700',
  project: 'bg-purple-50 text-purple-700',
  specification: 'bg-amber-50 text-amber-700',
  invoice: 'bg-emerald-50 text-emerald-700',
  manual: 'bg-neutral-50 text-neutral-700',
  computed: 'bg-pink-50 text-pink-700',
};

export function VariablePickerDropdown({ variables, onSelect, triggerRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [triggerRef]);

  const toggle = () => {
    setIsOpen(!isOpen);
    setSearch('');
  };

  const filtered = variables?.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase())
  );

  // Group by data_source
  const grouped = {};
  for (const v of filtered || []) {
    const src = v.data_source;
    if (!grouped[src]) grouped[src] = [];
    grouped[src].push(v);
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="px-2 py-1 text-xs font-medium rounded border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1"
        title="Insert variable"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        Variable
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 z-50 bg-white border border-neutral-200 rounded shadow-lg w-72 max-h-80 overflow-hidden flex flex-col"
        >
          {/* Search */}
          <div className="p-2 border-b border-neutral-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search variables..."
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {Object.keys(grouped).length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-neutral-400">No variables found</div>
            ) : (
              Object.entries(grouped).map(([source, vars]) => (
                <div key={source}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 uppercase bg-neutral-50">
                    {SOURCE_LABELS[source] || source}
                  </div>
                  {vars.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onSelect(v);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-sm font-medium text-neutral-900 group-hover:text-emerald-700">
                          {v.label}
                        </span>
                        <span className="text-xs text-neutral-400 ml-2 font-mono">
                          {`{{${v.key}}}`}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          SOURCE_COLORS[source] || 'bg-neutral-50 text-neutral-500'
                        }`}
                      >
                        {v.value_type}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VariablePickerDropdown;
