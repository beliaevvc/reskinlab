import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePriceConfigs, useUpdatePriceConfig } from '../../hooks/usePricing';
import { formatCurrency } from '../../lib/utils';
import { logPriceChange } from '../../lib/auditLog';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Minimum Order',
  'Concept Document',
  'Symbols',
  'Backgrounds',
  'Pop-ups',
  'UI Menus',
  'Marketing',
  'Styles',
  'Animations',
  'Usage Rights',
  'Payment',
  'Revisions',
  'Urgency',
  'Volume Discounts',
  'Global',
];

// Categories that have base price + complexity/surcharge pairs
const PAIRED_CATEGORIES = ['Concept Document', 'Symbols', 'Backgrounds', 'Pop-ups', 'UI Menus', 'Marketing'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfigType(name) {
  if (name.includes('base') || name.includes('price') || name.includes('amount')) return 'price';
  if (name.includes('coeff') || name.includes('complexity')) return 'coefficient';
  if (name.includes('percent') || name.includes('rate')) return 'percent';
  return 'other';
}

function formatConfigValue(value, type) {
  if (type === 'price') return formatCurrency(value);
  if (type === 'percent') {
    const display = value < 1 ? +(value * 100).toFixed(4) : value;
    return `${display}%`;
  }
  if (type === 'coefficient') return `×${value}`;
  return value;
}

function getDisplayName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/coeff$/i, '')
    .replace(/base$/i, '')
    .trim();
}

function getHumanName(config) {
  // Priority: display_name > parsed description > cleaned config name
  if (config.display_name) {
    return config.display_name;
  }
  
  if (config.description) {
    return config.description
      .replace(/ base price$/i, '')
      .replace(/ complexity coefficient$/i, '')
      .replace(/ complexity$/i, '')
      .replace(/ coefficient$/i, '')
      .replace(/ — .*$/, '')
      .trim();
  }
  
  return config.name
    .replace(/_/g, ' ')
    .replace(/coeff$/i, '')
    .replace(/base$/i, '')
    .replace(/complexity$/i, '')
    .replace(/percent$/i, '')
    .trim();
}

function getCategoryStats(configs) {
  let prices = 0, coeffs = 0, percents = 0;
  for (const c of configs) {
    const t = getConfigType(c.name);
    if (t === 'price') prices++;
    else if (t === 'coefficient') coeffs++;
    else if (t === 'percent') percents++;
  }
  return { prices, coeffs, percents, total: configs.length };
}

// Group configs by item_id for paired display
function groupByItemId(configs) {
  const groups = {};
  const standalone = [];
  
  for (const config of configs) {
    const itemId = config.config_data?.item_id;
    if (itemId) {
      if (!groups[itemId]) groups[itemId] = { base: null, secondary: null, secondaryType: null };
      // Check config_type first, then fall back to name pattern
      if (config.config_type === 'item_price' || config.name.endsWith('_base')) {
        groups[itemId].base = config;
      } else if (config.config_type === 'complexity' || config.name.endsWith('_complexity')) {
        groups[itemId].secondary = config;
        groups[itemId].secondaryType = 'complexity';
      } else if (config.config_type === 'surcharge' || config.name.includes('surcharge')) {
        groups[itemId].secondary = config;
        groups[itemId].secondaryType = 'surcharge';
      } else {
        standalone.push(config);
      }
    } else {
      standalone.push(config);
    }
  }
  
  // Convert to array of pairs
  const pairs = Object.values(groups).filter(g => g.base || g.secondary);
  return { pairs, standalone };
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function PencilIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function TableIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ config, onSave, onClose, isSaving }) {
  const type = getConfigType(config.name);
  const humanName = getHumanName(config);
  
  const [value, setValue] = useState(config.value.toString());
  const [displayName, setDisplayName] = useState(config.display_name || '');
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSave(config.id, parseFloat(value), displayName.trim() || null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onSave, config.id, value, displayName]);

  const typeLabel = type === 'price' ? 'Base Price' 
    : type === 'coefficient' ? 'Coefficient' 
    : type === 'percent' ? 'Percent' 
    : 'Setting';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 mb-1">{config.category} · {typeLabel}</p>
              <h3 className="text-lg font-semibold text-neutral-900">{humanName}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors">
              <XIcon className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <span className="text-xs text-neutral-500">Current:</span>
            <span className="text-lg font-bold text-emerald-600">
              {formatConfigValue(config.value, type)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Display Name
              <span className="ml-1 text-xs font-normal text-neutral-400">(shown in calculator)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={humanName}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Value</label>
            <div className="flex items-center gap-2">
              {type === 'price' && <span className="text-lg text-neutral-400 font-medium">$</span>}
              {type === 'coefficient' && <span className="text-lg text-neutral-400 font-medium">×</span>}
              <input
                ref={inputRef}
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                step={type === 'coefficient' ? '0.01' : type === 'percent' ? '0.01' : '1'}
                className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono text-right transition-shadow"
              />
              {type === 'percent' && <span className="text-lg text-neutral-400 font-medium">%</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-xs text-neutral-400">⌘+Enter to save</span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSave(config.id, parseFloat(value), displayName.trim() || null)}
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Paired Edit Modal (base + secondary in one) ──────────────────────────────

function PairedEditModal({ pair, onSave, onClose, isSaving }) {
  const { base, secondary, secondaryType } = pair;
  const displayConfig = base || secondary;
  const humanName = getHumanName(displayConfig);
  
  const [displayName, setDisplayName] = useState(displayConfig.display_name || '');
  const [baseValue, setBaseValue] = useState(base?.value?.toString() || '');
  const [secondaryValue, setSecondaryValue] = useState(secondary?.value?.toString() || '');
  const baseInputRef = useRef(null);

  // For surcharge, show as percentage (multiply by 100 for display)
  const isSurcharge = secondaryType === 'surcharge';
  const secondaryDisplayValue = isSurcharge && secondary?.value < 1 
    ? (secondary.value * 100).toString() 
    : secondary?.value?.toString() || '';

  useEffect(() => {
    if (isSurcharge && secondary?.value < 1) {
      setSecondaryValue((secondary.value * 100).toString());
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => baseInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, baseValue, secondaryValue, displayName]);

  const handleSave = () => {
    // For surcharge, convert back from percentage to decimal
    const secondaryFinalValue = isSurcharge 
      ? parseFloat(secondaryValue) / 100 
      : parseFloat(secondaryValue);
    
    onSave({
      base: base ? { id: base.id, value: parseFloat(baseValue), display_name: displayName.trim() || null } : null,
      secondary: secondary ? { id: secondary.id, value: secondaryFinalValue } : null,
    });
  };

  const secondaryLabel = isSurcharge ? 'Surcharge' : 'Complexity Coefficient';
  const secondaryPrefix = isSurcharge ? '' : '×';
  const secondarySuffix = isSurcharge ? '%' : '';
  const secondaryCurrentDisplay = isSurcharge 
    ? `${(secondary?.value < 1 ? secondary.value * 100 : secondary?.value)}%`
    : `×${secondary?.value}`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 mb-1">{displayConfig.category}</p>
              <h3 className="text-lg font-semibold text-neutral-900">{humanName}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors">
              <XIcon className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Display Name
              <span className="ml-1 text-xs font-normal text-neutral-400">(shown in calculator)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={humanName}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
            />
          </div>

          {/* Base Price */}
          {base && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Base Price</label>
              <div className="flex items-center gap-2">
                <span className="text-lg text-neutral-400 font-medium">$</span>
                <input
                  ref={baseInputRef}
                  type="number"
                  value={baseValue}
                  onChange={(e) => setBaseValue(e.target.value)}
                  step="1"
                  className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono text-right transition-shadow"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">Current: {formatCurrency(base.value)}</p>
            </div>
          )}

          {/* Secondary (Complexity or Surcharge) */}
          {secondary && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">{secondaryLabel}</label>
              <div className="flex items-center gap-2">
                {secondaryPrefix && <span className="text-lg text-neutral-400 font-medium">{secondaryPrefix}</span>}
                <input
                  type="number"
                  value={secondaryValue}
                  onChange={(e) => setSecondaryValue(e.target.value)}
                  step={isSurcharge ? '0.1' : '0.1'}
                  className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono text-right transition-shadow"
                />
                {secondarySuffix && <span className="text-lg text-neutral-400 font-medium">{secondarySuffix}</span>}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Current: {secondaryCurrentDisplay}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-xs text-neutral-400">⌘+Enter to save</span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Paired Card (base price + secondary in one) ──────────────────────────────

function PairedCard({ pair, onEdit }) {
  const { base, secondary, secondaryType } = pair;
  const displayConfig = base || secondary;
  const humanName = getHumanName(displayConfig);
  
  const isSurcharge = secondaryType === 'surcharge';
  const secondaryLabel = isSurcharge ? 'Surcharge' : 'Complexity';
  const secondaryDisplay = isSurcharge 
    ? `${secondary?.value < 1 ? (secondary.value * 100) : secondary?.value}%`
    : `×${secondary?.value}`;

  return (
    <div 
      className="bg-white rounded-lg border border-neutral-200 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 p-4 cursor-pointer group"
      onClick={() => onEdit(pair)}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-neutral-900">{humanName}</p>
        <PencilIcon className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="space-y-1.5">
        {base && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Base Price</span>
            <span className="text-base font-semibold text-emerald-600 font-mono">
              {formatCurrency(base.value)}
            </span>
          </div>
        )}
        
        {secondary && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">{secondaryLabel}</span>
            <span className="text-base font-semibold text-emerald-600 font-mono">
              {secondaryDisplay}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Value Card (single setting) ──────────────────────────────────────────────

function ValueCard({ config, onEdit }) {
  const type = getConfigType(config.name);
  const humanName = getHumanName(config);

  return (
    <div
      className="group bg-white rounded-lg border border-neutral-200 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 cursor-pointer p-4"
      onClick={() => onEdit(config)}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-neutral-900">{humanName}</p>
        <PencilIcon className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-xl font-semibold text-emerald-600 font-mono">
        {formatConfigValue(config.value, type)}
      </div>
    </div>
  );
}

// ─── Settings Table (table view) ──────────────────────────────────────────────

function SettingsTable({ configs, isPairedCategory, onEdit, onEditPair }) {
  if (isPairedCategory) {
    const { pairs, standalone } = groupByItemId(configs);
    
    // Determine if we have surcharges or complexities
    const hasSurcharge = pairs.some(p => p.secondaryType === 'surcharge');
    const secondaryHeader = hasSurcharge ? 'Surcharge' : 'Complexity';
    
    return (
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Base Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {secondaryHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pairs.map((pair, idx) => {
              const displayConfig = pair.base || pair.secondary;
              const humanName = getHumanName(displayConfig);
              const isSurcharge = pair.secondaryType === 'surcharge';
              const secondaryDisplay = pair.secondary 
                ? (isSurcharge 
                    ? `${pair.secondary.value < 1 ? (pair.secondary.value * 100) : pair.secondary.value}%`
                    : `×${pair.secondary.value}`)
                : '—';
              
              return (
                <tr
                  key={pair.base?.id || pair.secondary?.id || idx}
                  onClick={() => onEditPair(pair)}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-900">{humanName}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-emerald-600 font-mono">
                      {pair.base ? formatCurrency(pair.base.value) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-emerald-600 font-mono">
                      {secondaryDisplay}
                    </span>
                  </td>
                </tr>
              );
            })}
            {standalone.map(config => {
              const type = getConfigType(config.name);
              const humanName = getHumanName(config);
              return (
                <tr
                  key={config.id}
                  onClick={() => onEdit(config)}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-900">{humanName}</span>
                  </td>
                  <td className="px-4 py-3 text-right" colSpan={2}>
                    <span className="font-semibold text-emerald-600 font-mono">
                      {formatConfigValue(config.value, type)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Non-paired categories: simple table
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {configs.map(config => {
            const type = getConfigType(config.name);
            const humanName = getHumanName(config);
            return (
              <tr
                key={config.id}
                onClick={() => onEdit(config)}
                className="hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900">{humanName}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-emerald-600 font-mono">
                    {formatConfigValue(config.value, type)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Minimum Order Section ────────────────────────────────────────────────────

function MinimumOrderSection({ configs, onSaveConfig }) {
  const enabledConfig = configs.find(c => c.name === 'min_order_enabled');
  const amountConfig = configs.find(c => c.name === 'min_order_amount');
  const messageConfig = configs.find(c => c.name === 'min_order_message');

  const [isEnabled, setIsEnabled] = useState(enabledConfig?.value === 1);
  const [amount, setAmount] = useState(amountConfig?.value?.toString() || '1000');
  const [message, setMessage] = useState(messageConfig?.description || '');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = () => { setIsEnabled(!isEnabled); setIsDirty(true); };
  const handleAmountChange = (e) => { setAmount(e.target.value); setIsDirty(true); };
  const handleMessageChange = (e) => { setMessage(e.target.value); setIsDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (enabledConfig) await onSaveConfig(enabledConfig.id, isEnabled ? 1 : 0, enabledConfig.description);
      if (amountConfig) await onSaveConfig(amountConfig.id, parseFloat(amount) || 0, amountConfig.description);
      if (messageConfig) await onSaveConfig(messageConfig.id, messageConfig.value, message.trim() || null);
      setIsDirty(false);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900">Minimum Order</h3>
          <p className="text-sm text-neutral-500">First order minimum amount</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {isEnabled ? 'Active' : 'Disabled'}
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Enable Minimum Order</p>
            <p className="text-xs text-neutral-500 mt-0.5">First order in every project must meet the minimum</p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className={`transition-all duration-200 ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <label className="block text-sm font-medium text-neutral-900 mb-2">Minimum Amount</label>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-lg font-medium">$</span>
            <input type="number" value={amount} onChange={handleAmountChange} min="0" step="100"
              className="w-44 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-right text-lg font-mono transition-shadow" />
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">Applies only to the first order (before any paid invoices)</p>
        </div>

        <div className={`transition-all duration-200 ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <label className="block text-sm font-medium text-neutral-900 mb-2">Client Message</label>
          <input type="text" value={message} onChange={handleMessageChange}
            placeholder="e.g. Minimum order amount is $1,000 for your first order"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow" />
        </div>

        {isDirty && (
          <div className="pt-3 border-t border-neutral-100">
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {isEnabled && (
          <div className="pt-3 border-t border-neutral-100">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Preview</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-amber-700">
                {message || `Min. $${parseInt(amount || 0).toLocaleString()} for first order`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PricingPage() {
  const { data: configs, isLoading } = usePriceConfigs();
  const updateConfig = useUpdatePriceConfig();

  const [editingConfig, setEditingConfig] = useState(null);
  const [editingPair, setEditingPair] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const detailRef = useRef(null);

  // Group configs by category with proper order
  const groupedConfigs = CATEGORY_ORDER.reduce((acc, category) => {
    const categoryConfigs = configs?.filter(c => c.category === category) || [];
    if (categoryConfigs.length > 0) {
      acc[category] = categoryConfigs;
    }
    return acc;
  }, {});

  configs?.forEach(config => {
    if (!groupedConfigs[config.category]) {
      groupedConfigs[config.category] = [config];
    }
  });

  // Filtered groups
  const filteredGroups = searchQuery
    ? Object.fromEntries(
        Object.entries(groupedConfigs).map(([cat, cfgs]) => [
          cat,
          cfgs.filter(c =>
            getDisplayName(c.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        ]).filter(([, cfgs]) => cfgs.length > 0)
      )
    : groupedConfigs;

  const filteredCategories = Object.keys(filteredGroups);

  // Auto-select first category
  useEffect(() => {
    if (filteredCategories.length > 0 && (!activeCategory || !filteredCategories.includes(activeCategory))) {
      setActiveCategory(filteredCategories[0]);
    }
  }, [filteredCategories, activeCategory]);

  const activeConfigs = filteredGroups[activeCategory] || [];
  const isMinOrder = activeCategory === 'Minimum Order';
  const isPairedCategory = PAIRED_CATEGORIES.includes(activeCategory);

  const handleEdit = (config) => setEditingConfig(config);
  const handleEditPair = (pair) => setEditingPair(pair);

  const handleSaveEdit = async (id, newValue, newDisplayName) => {
    const config = configs?.find(c => c.id === id);
    try {
      await updateConfig.mutateAsync({ id, value: newValue, display_name: newDisplayName });
      await logPriceChange({ 
        configId: id, 
        configName: config?.name, 
        oldValue: config?.value, 
        newValue, 
        oldDescription: config?.display_name, 
        newDescription: newDisplayName 
      });
      setEditingConfig(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleSavePair = async ({ base, secondary }) => {
    try {
      // Save base price if changed
      if (base) {
        const baseConfig = configs?.find(c => c.id === base.id);
        await updateConfig.mutateAsync({ id: base.id, value: base.value, display_name: base.display_name });
        await logPriceChange({ 
          configId: base.id, 
          configName: baseConfig?.name, 
          oldValue: baseConfig?.value, 
          newValue: base.value, 
          oldDescription: baseConfig?.display_name, 
          newDescription: base.display_name 
        });
      }
      // Save secondary (complexity/surcharge) if changed
      if (secondary) {
        const secondaryConfig = configs?.find(c => c.id === secondary.id);
        await updateConfig.mutateAsync({ id: secondary.id, value: secondary.value });
        await logPriceChange({ 
          configId: secondary.id, 
          configName: secondaryConfig?.name, 
          oldValue: secondaryConfig?.value, 
          newValue: secondary.value
        });
      }
      setEditingPair(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleSaveConfig = async (id, value, description) => {
    const config = configs?.find(c => c.id === id);
    await updateConfig.mutateAsync({ id, value, description });
    await logPriceChange({ configId: id, configName: config?.name, oldValue: config?.value, newValue: value, oldDescription: config?.description, newDescription: description });
  };

  // Stats
  const totalConfigs = configs?.length || 0;
  const priceCount = configs?.filter(c => getConfigType(c.name) === 'price').length || 0;
  const coeffCount = configs?.filter(c => getConfigType(c.name) === 'coefficient').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Calculator Settings</h1>
        <p className="text-neutral-500 mt-1">Manage prices, coefficients, and calculator configuration</p>
      </div>

      {/* Stats + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <span>{totalConfigs} settings</span>
          <span className="text-neutral-300">·</span>
          <span>{priceCount} prices</span>
          <span className="text-neutral-300">·</span>
          <span>{coeffCount} coefficients</span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Cards view"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-500" />
            <p className="text-sm text-neutral-500">Loading settings...</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-neutral-900 font-semibold text-lg">No price configurations found</p>
          <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
            {searchQuery ? 'Try a different search term' : 'Run the migration to populate calculator settings'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── Table View: All categories as sections ─── */
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const categoryConfigs = filteredGroups[category];
            const isPaired = PAIRED_CATEGORIES.includes(category);
            
            // Skip Minimum Order in table view (it has special UI)
            if (category === 'Minimum Order') {
              return (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">{category}</h2>
                  <MinimumOrderSection
                    configs={categoryConfigs}
                    onSaveConfig={handleSaveConfig}
                  />
                </div>
              );
            }
            
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">{category}</h2>
                <SettingsTable
                  configs={categoryConfigs}
                  isPairedCategory={isPaired}
                  onEdit={handleEdit}
                  onEditPair={handleEditPair}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Cards View: Sidebar + Detail panel ─── */
        <div className="flex gap-8 min-h-[600px]">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0 sticky top-6 self-start">
            <nav className="space-y-0.5">
              {filteredCategories.map((category) => {
                const isActive = category === activeCategory;
                const stats = getCategoryStats(filteredGroups[category]);
                
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <span className="text-sm truncate">{category}</span>
                    <span className={`text-xs tabular-nums ${isActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
                      {stats.total}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Detail panel */}
          <div ref={detailRef} className="flex-1 min-w-0">
            {isMinOrder ? (
              <MinimumOrderSection
                configs={activeConfigs}
                onSaveConfig={handleSaveConfig}
              />
            ) : activeConfigs.length > 0 ? (
              <div className="space-y-6">
                {/* Category header */}
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{activeCategory}</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {(() => {
                      const s = getCategoryStats(activeConfigs);
                      const parts = [];
                      if (s.prices) parts.push(`${s.prices} price${s.prices > 1 ? 's' : ''}`);
                      if (s.coeffs) parts.push(`${s.coeffs} coefficient${s.coeffs > 1 ? 's' : ''}`);
                      if (s.percents) parts.push(`${s.percents} percent${s.percents > 1 ? 's' : ''}`);
                      return parts.join(' · ') || `${s.total} settings`;
                    })()}
                  </p>
                </div>

                {/* Settings grid */}
                {isPairedCategory ? (
                  (() => {
                    const { pairs, standalone } = groupByItemId(activeConfigs);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {pairs.map((pair, idx) => (
                          <PairedCard key={pair.base?.id || pair.complexity?.id || idx} pair={pair} onEdit={handleEditPair} />
                        ))}
                        {standalone.map(config => (
                          <ValueCard key={config.id} config={config} onEdit={handleEdit} />
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {activeConfigs.map(config => (
                      <ValueCard key={config.id} config={config} onEdit={handleEdit} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-neutral-400">
                <p>Select a category from the sidebar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (single config) */}
      {editingConfig && (
        <EditModal
          config={editingConfig}
          onSave={handleSaveEdit}
          onClose={() => setEditingConfig(null)}
          isSaving={updateConfig.isPending}
        />
      )}

      {/* Paired Edit Modal (base + complexity) */}
      {editingPair && (
        <PairedEditModal
          pair={editingPair}
          onSave={handleSavePair}
          onClose={() => setEditingPair(null)}
          isSaving={updateConfig.isPending}
        />
      )}
    </div>
  );
}

export default PricingPage;
