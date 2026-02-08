import { useState } from 'react';
import { usePriceConfigs, useUpdatePriceConfig, useCreatePriceConfig, useDeletePriceConfig } from '../../hooks/usePricing';
import { formatCurrency } from '../../lib/utils';
import { logPriceChange } from '../../lib/auditLog';

// Category icons
const CATEGORY_ICONS = {
  'Minimum Order': '🛡️',
  'Concept Document': '📋',
  'Symbols': '🎰',
  'Backgrounds': '🖼️',
  'Pop-ups': '💥',
  'UI Menus': '📱',
  'Marketing': '📣',
  'Styles': '🎨',
  'Animations': '🎬',
  'Usage Rights': '📜',
  'Payment': '💳',
  'Revisions': '🔄',
  'Urgency': '⚡',
  'Volume Discounts': '💰',
  'Global': '⚙️',
};

// Category order
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

function PriceConfigItem({ config, onEdit, onDelete, isEditing, editValue, setEditValue, editDescription, setEditDescription, onSave, onCancel, isSaving }) {
  const isCoefficient = config.name.includes('coeff') || config.name.includes('complexity');
  const isPercent = config.name.includes('percent') || config.name.includes('rate');
  const isPrice = config.name.includes('base') || config.name.includes('price') || config.name.includes('amount');

  const formatValue = (value) => {
    if (isPrice) return formatCurrency(value);
    if (isPercent) return `${value}%`;
    if (isCoefficient) return `×${value}`;
    return value;
  };

  const displayName = config.name
    .replace(/_/g, ' ')
    .replace(/coeff$/i, '')
    .replace(/base$/i, '')
    .trim();

  if (isEditing) {
    return (
      <div className="px-6 py-4 bg-emerald-50/50 border-l-4 border-emerald-500">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900 mb-3">{displayName}</p>
            
            {/* Value input */}
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-neutral-500 w-16">Value:</label>
              {isCoefficient && <span className="text-neutral-400">×</span>}
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                step={isCoefficient ? '0.01' : isPercent ? '1' : '1'}
                className="w-32 px-3 py-1.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-right"
                autoFocus
              />
              {isPercent && <span className="text-neutral-400">%</span>}
            </div>

            {/* Description input */}
            <div className="flex items-start gap-2">
              <label className="text-xs text-neutral-500 w-16 pt-2">Description:</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description..."
                className="flex-1 px-3 py-1.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <button
              onClick={() => onSave(config.id)}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{displayName}</p>
            {config.description && (
              <p className="text-xs text-neutral-500 mt-0.5">{config.description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-4">
        <span className={`text-lg font-semibold min-w-[100px] text-right ${
          isPrice ? 'text-emerald-600' : isCoefficient ? 'text-blue-600' : 'text-neutral-900'
        }`}>
          {formatValue(config.value)}
        </span>
        <button
          onClick={() => onEdit(config)}
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function CategorySection({ category, configs, expandedCategories, toggleCategory, onEdit, editingId, editValue, setEditValue, editDescription, setEditDescription, onSave, onCancel, isSaving }) {
  const isExpanded = expandedCategories.includes(category);
  const icon = CATEGORY_ICONS[category] || '📦';
  
  const priceCount = configs.filter(c => 
    c.name.includes('base') || c.name.includes('price') || c.name.includes('amount')
  ).length;
  const coeffCount = configs.filter(c => 
    c.name.includes('coeff') || c.name.includes('complexity')
  ).length;

  return (
    <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
      <button
        onClick={() => toggleCategory(category)}
        className="w-full px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-neutral-900">{category}</h3>
            <p className="text-sm text-neutral-500">
              {priceCount > 0 && `${priceCount} prices`}
              {priceCount > 0 && coeffCount > 0 && ' · '}
              {coeffCount > 0 && `${coeffCount} coefficients`}
            </p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="divide-y divide-neutral-100">
          {configs.map((config) => (
            <PriceConfigItem
              key={config.id}
              config={config}
              onEdit={onEdit}
              isEditing={editingId === config.id}
              editValue={editValue}
              setEditValue={setEditValue}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              onSave={onSave}
              onCancel={onCancel}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Custom section for Minimum Order settings
 * Shows: toggle (on/off), amount ($), and client-facing message
 */
function MinimumOrderSection({ configs, onSaveConfig, isSaving }) {
  const enabledConfig = configs.find(c => c.name === 'min_order_enabled');
  const amountConfig = configs.find(c => c.name === 'min_order_amount');
  const messageConfig = configs.find(c => c.name === 'min_order_message');

  const [isEnabled, setIsEnabled] = useState(enabledConfig?.value === 1);
  const [amount, setAmount] = useState(amountConfig?.value?.toString() || '1000');
  const [message, setMessage] = useState(messageConfig?.description || '');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    setIsDirty(true);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    setIsDirty(true);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save enabled toggle
      if (enabledConfig) {
        await onSaveConfig(enabledConfig.id, isEnabled ? 1 : 0, enabledConfig.description);
      }
      // Save amount
      if (amountConfig) {
        await onSaveConfig(amountConfig.id, parseFloat(amount) || 0, amountConfig.description);
      }
      // Save message (stored in description of min_order_message)
      if (messageConfig) {
        await onSaveConfig(messageConfig.id, messageConfig.value, message.trim() || null);
      }
      setIsDirty(false);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center gap-3">
        <span className="text-xl">🛡️</span>
        <div>
          <h3 className="font-semibold text-neutral-900">Minimum Order</h3>
          <p className="text-sm text-neutral-500">
            Minimum amount required for the first order in a project
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Enable Minimum Order</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              When enabled, the first order in every project must meet the minimum amount
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-emerald-500' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Amount */}
        <div className={`transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            Minimum Amount ($)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 text-lg">$</span>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              min="0"
              step="100"
              className="w-40 px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-right text-lg font-mono"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Applies only to the first order (before any paid invoices in the project)
          </p>
        </div>

        {/* Message */}
        <div className={`transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            Client Message
          </label>
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="e.g. Minimum order amount is $1,000 for your first order"
            className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Shown to clients in the calculator when their order is below the minimum
          </p>
        </div>

        {/* Save button */}
        {isDirty && (
          <div className="pt-2 border-t border-neutral-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Preview */}
        {isEnabled && (
          <div className="pt-3 border-t border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Preview</p>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
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

export function PricingPage() {
  const { data: configs, isLoading } = usePriceConfigs();
  const updateConfig = useUpdatePriceConfig();

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['Symbols', 'Styles']);

  // Group configs by category with proper order
  const groupedConfigs = CATEGORY_ORDER.reduce((acc, category) => {
    const categoryConfigs = configs?.filter(c => c.category === category) || [];
    if (categoryConfigs.length > 0) {
      acc[category] = categoryConfigs;
    }
    return acc;
  }, {});

  // Add any categories not in the predefined order
  configs?.forEach(config => {
    if (!groupedConfigs[config.category]) {
      groupedConfigs[config.category] = [config];
    }
  });

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setEditValue(config.value.toString());
    setEditDescription(config.description || '');
  };

  const handleSave = async (id) => {
    const config = configs?.find(c => c.id === id);
    const oldValue = config?.value;
    const oldDescription = config?.description;
    const newValue = parseFloat(editValue);
    const newDescription = editDescription.trim();

    try {
      await updateConfig.mutateAsync({ 
        id, 
        value: newValue,
        description: newDescription || null
      });
      
      // Log price change
      await logPriceChange({
        configId: id,
        configName: config?.name,
        oldValue,
        newValue,
        oldDescription,
        newDescription
      });
      
      setEditingId(null);
      setEditValue('');
      setEditDescription('');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setEditDescription('');
  };

  // Direct save handler for MinimumOrderSection (saves individual config by id)
  const handleSaveConfig = async (id, value, description) => {
    const config = configs?.find(c => c.id === id);
    const oldValue = config?.value;
    const oldDescription = config?.description;

    await updateConfig.mutateAsync({ id, value, description });

    await logPriceChange({
      configId: id,
      configName: config?.name,
      oldValue,
      newValue: value,
      oldDescription,
      newDescription: description,
    });
  };

  const expandAll = () => setExpandedCategories(Object.keys(groupedConfigs));
  const collapseAll = () => setExpandedCategories([]);

  // Stats
  const totalConfigs = configs?.length || 0;
  const categories = Object.keys(groupedConfigs).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Calculator Settings</h1>
          <p className="text-neutral-500 mt-1">Manage prices, coefficients, and calculator configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Total Settings</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{totalConfigs}</p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Categories</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{categories}</p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Base Prices</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {configs?.filter(c => c.name.includes('base') || c.name.includes('price')).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Coefficients</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {configs?.filter(c => c.name.includes('coeff') || c.name.includes('complexity')).length || 0}
          </p>
        </div>
      </div>

      {/* Config Groups */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : Object.keys(groupedConfigs).length === 0 ? (
        <div className="bg-white rounded-md border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-neutral-900 font-medium">No price configurations found</p>
          <p className="text-sm text-neutral-500 mt-1">
            Run the migration to populate calculator settings
          </p>
          <div className="mt-4 p-4 bg-neutral-50 rounded text-left">
            <p className="text-sm font-medium text-neutral-700 mb-2">To populate settings, run:</p>
            <code className="text-xs text-neutral-600 block bg-neutral-100 p-2 rounded">
              supabase/migrations/005_price_configs_seed.sql
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
            category === 'Minimum Order' ? (
              <MinimumOrderSection
                key={category}
                configs={categoryConfigs}
                onSaveConfig={handleSaveConfig}
                isSaving={updateConfig.isPending}
              />
            ) : (
              <CategorySection
                key={category}
                category={category}
                configs={categoryConfigs}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                onEdit={handleEdit}
                editingId={editingId}
                editValue={editValue}
                setEditValue={setEditValue}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={updateConfig.isPending}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default PricingPage;
