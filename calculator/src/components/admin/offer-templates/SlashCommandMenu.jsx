import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

// ── Slash Command Menu React Component ─────────────

const SOURCE_LABELS = {
  ru: {
    client: 'Клиент',
    project: 'Проект',
    specification: 'Спецификация',
    invoice: 'Счёт',
    manual: 'Ручные',
    computed: 'Вычисляемые',
  },
  en: {
    client: 'Client',
    project: 'Project',
    specification: 'Specification',
    invoice: 'Invoice',
    manual: 'Manual',
    computed: 'Computed',
  },
};

// Helper to get localized label
function getLocalizedLabel(variable, lang) {
  if (lang === 'en' && variable.label_en) {
    return variable.label_en;
  }
  return variable.label;
}

const TYPE_ICONS = {
  currency: '$',
  date: 'D',
  table: '≡',
  number: '#',
  text: 'T',
};

export function SlashCommandMenu({ isOpen, coords, query, variables, contentLang = 'en', onSelect, onClose }) {
  const menuRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef([]);

  // Build flat selectable items + display items
  const { displayItems, selectableItems } = buildItems(variables, query, contentLang);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Position the menu
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current || !coords) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();

    let top = coords.top + 4;
    let left = coords.left;

    if (top + rect.height > window.innerHeight - 20) {
      top = coords.top - rect.height - 8;
    }
    if (left + rect.width > window.innerWidth - 20) {
      left = window.innerWidth - rect.width - 20;
    }
    if (left < 8) left = 8;

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }, [isOpen, coords, displayItems.length]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Keyboard navigation — capture phase so it fires before TipTap
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || selectableItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % selectableItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + selectableItems.length) % selectableItems.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (selectableItems[selectedIndex]) {
          onSelect(selectableItems[selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
    },
    [isOpen, selectableItems, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || selectableItems.length === 0) return null;

  // Map selectable index to a set for fast lookup
  const selectableSet = new Set(selectableItems.map((s) => s._itemIndex));

  let selectableCounter = -1;

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-neutral-200/80 py-1.5 w-64 max-h-72 overflow-y-auto"
      style={{ top: 0, left: 0 }}
    >
      {/* Header */}
      <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
        {query ? `«${query}»` : 'Вставить переменную'}
      </div>

      {displayItems.map((item, i) => {
        if (item.type === 'divider') {
          return (
            <div key={`div-${i}`} className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5 border-t border-neutral-100 pt-1.5">
              {item.label}
            </div>
          );
        }

        // Track which selectable index this corresponds to
        if (selectableSet.has(i)) selectableCounter++;
        const isSelected = selectableCounter === selectedIndex;

        return (
          <button
            key={item.key || i}
            ref={(el) => {
              if (isSelected) itemRefs.current[selectedIndex] = el;
            }}
            onMouseEnter={() => {
              if (selectableSet.has(i)) setSelectedIndex(selectableCounter);
            }}
            onClick={() => onSelect(item)}
            className={`w-full text-left px-3 py-1.5 flex items-center gap-2.5 transition-colors ${
              isSelected ? 'bg-emerald-50' : 'hover:bg-neutral-50'
            }`}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-emerald-100 text-emerald-700"
            >
              {TYPE_ICONS[item.variable?.value_type] || 'T'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-neutral-800 truncate">{item.label}</div>
              <div className="text-[11px] text-neutral-400 truncate font-mono">{`{{${item.key}}}`}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Build items list from variables ────────────────

function buildItems(variables, query, contentLang = 'en') {
  const displayItems = [];
  const selectableItems = [];
  const q = (query || '').toLowerCase().trim();
  const sourceLabels = SOURCE_LABELS[contentLang] || SOURCE_LABELS.en;

  // Group variables by source
  const grouped = {};
  for (const v of variables || []) {
    const localizedLabel = getLocalizedLabel(v, contentLang);
    if (q && !localizedLabel.toLowerCase().includes(q) && !v.key.toLowerCase().includes(q)) continue;

    const src = v.data_source;
    if (!grouped[src]) grouped[src] = [];
    grouped[src].push({ ...v, _localizedLabel: localizedLabel });
  }

  for (const [source, vars] of Object.entries(grouped)) {
    displayItems.push({
      type: 'divider',
      label: sourceLabels[source] || source,
    });
    for (const v of vars) {
      const item = {
        type: 'variable',
        key: v.key,
        label: v._localizedLabel,
        variable: v,
        _itemIndex: displayItems.length,
      };
      displayItems.push(item);
      selectableItems.push(item);
    }
  }

  return { displayItems, selectableItems };
}

export default SlashCommandMenu;
