import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePromoCodes, useCreatePromoCode, useUpdatePromoCode, useDeletePromoCode, useTogglePromoCode } from '../../hooks/usePromoCodes';
import { formatDate, formatCurrency } from '../../lib/utils';


/**
 * Generate a random promo code
 * Format: PREFIX-XXXXXXXX (8 chars after prefix)
 * Characters: A-Z, 2-9 (excluding confusing chars like O/0, I/1)
 */
function generatePromoCode(prefix = 'RESKIN') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

function PromoCodeModal({ promoCode, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    code: promoCode?.code || '',
    type: promoCode?.type || 'percentage',
    value: promoCode?.value || '',
    minOrder: promoCode?.min_order || '',
    maxUses: promoCode?.max_uses || '',
    expiresAt: promoCode?.expires_at ? promoCode.expires_at.split('T')[0] : '',
    isActive: promoCode?.is_active ?? true,
  });
  const [prefix, setPrefix] = useState('RESKIN');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: promoCode?.code || '',
        type: promoCode?.type || 'percentage',
        value: promoCode?.value || '',
        minOrder: promoCode?.min_order || '',
        maxUses: promoCode?.max_uses || '',
        expiresAt: promoCode?.expires_at ? promoCode.expires_at.split('T')[0] : '',
        isActive: promoCode?.is_active ?? true,
      });
    }
  }, [isOpen, promoCode]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setFormData(prev => ({ ...prev, code: generatePromoCode(prefix) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value) {
      alert('Code and value are required');
      return;
    }
    onSave({
      ...formData,
      value: parseFloat(formData.value),
      minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiresAt: formData.expiresAt || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {promoCode ? 'Edit Promo Code' : 'Create Promo Code'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Code *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="RESKIN-XXXXXXXX"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase font-mono"
              />
              {!promoCode && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate
                </button>
              )}
            </div>
            {!promoCode && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-neutral-500">Prefix:</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  className="w-24 px-2 py-1 text-xs border border-neutral-200 rounded focus:ring-1 focus:ring-emerald-500 uppercase"
                  placeholder="RESKIN"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Value * {formData.type === 'percentage' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={formData.type === 'percentage' ? '10' : '100'}
                min="0"
                step={formData.type === 'percentage' ? '1' : '0.01'}
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Min Order ($)</label>
              <input
                type="number"
                value={formData.minOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrder: e.target.value }))}
                placeholder="Optional"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Max Uses</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                placeholder="Unlimited"
                min="1"
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Expires At</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
            />
            <span className="text-sm text-neutral-700">Active</span>
          </label>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function PromoCodesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  const { data: promoCodes, isLoading } = usePromoCodes();
  const createCode = useCreatePromoCode();
  const updateCode = useUpdatePromoCode();
  const deleteCode = useDeletePromoCode();
  const toggleCode = useTogglePromoCode();

  const handleSave = async (data) => {
    try {
      if (editingCode) {
        await updateCode.mutateAsync({ id: editingCode.id, updates: data });
      } else {
        await createCode.mutateAsync(data);
      }
      setShowModal(false);
      setEditingCode(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deleteCode.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await toggleCode.mutateAsync({ id, isActive: !currentStatus });
    } catch (err) {
      alert('Failed to toggle: ' + err.message);
    }
  };

  const activeCount = promoCodes?.filter(p => p.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Promo Codes</h1>
          <p className="text-neutral-500 mt-1">Manage discount codes for the calculator</p>
        </div>
        <button
          onClick={() => { setEditingCode(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Total Codes</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{promoCodes?.length || 0}</p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Active Codes</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : promoCodes?.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No promo codes yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {promoCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-900">
                        {code.type === 'percentage' ? `${code.value}%` : formatCurrency(code.value)}
                      </span>
                      {code.min_order && (
                        <span className="text-xs text-neutral-500 block">
                          Min: {formatCurrency(code.min_order)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600">
                        {code.times_used || 0}
                        {code.max_uses && ` / ${code.max_uses}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">
                        {code.expires_at ? formatDate(code.expires_at) : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(code.id, code.is_active)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          code.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {code.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditingCode(code); setShowModal(true); }}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <PromoCodeModal
        promoCode={editingCode}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCode(null); }}
        onSave={handleSave}
        isSaving={createCode.isPending || updateCode.isPending}
      />
    </div>
  );
}

export default PromoCodesPage;
