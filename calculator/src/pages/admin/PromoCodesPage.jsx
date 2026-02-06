import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePromoCodes, useCreatePromoCode, useUpdatePromoCode, useDeletePromoCode, useTogglePromoCode } from '../../hooks/usePromoCodes';
import { formatDate, formatCurrency } from '../../lib/utils';


/**
 * Delete confirmation modal
 */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, promoCode, isDeleting }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-md shadow-xl max-w-sm w-full p-6">
        {/* Icon */}
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Delete Promo Code?
          </h2>
          <p className="text-sm text-neutral-600">
            You are about to delete{' '}
            <span className="font-mono font-medium bg-neutral-100 px-1.5 py-0.5 rounded">{promoCode?.code}</span>.
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


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
    type: promoCode?.discount_type === 'percent' ? 'percentage' : (promoCode?.discount_type || 'percentage'),
    value: promoCode?.discount_value || '',
    minOrder: promoCode?.min_order_amount || '',
    maxUses: promoCode?.max_uses || '',
    expiresAt: promoCode?.valid_until ? promoCode.valid_until.split('T')[0] : '',
    isActive: promoCode?.is_active ?? true,
  });
  const [prefix, setPrefix] = useState('RESKIN');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: promoCode?.code || '',
        type: promoCode?.discount_type === 'percent' ? 'percentage' : (promoCode?.discount_type || 'percentage'),
        value: promoCode?.discount_value || '',
        minOrder: promoCode?.min_order_amount || '',
        maxUses: promoCode?.max_uses || '',
        expiresAt: promoCode?.valid_until ? promoCode.valid_until.split('T')[0] : '',
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

  const isEditing = !!promoCode;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-md shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isEditing ? 'bg-neutral-100' : 'bg-emerald-50'}`}>
              <svg className={`w-5 h-5 ${isEditing ? 'text-neutral-600' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" />
                )}
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {isEditing ? 'Edit Promo Code' : 'New Promo Code'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6">
          {/* Code Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Code <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="RESKIN-XXXXXXXX"
                  className="flex-1 px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase font-mono text-sm transition-colors"
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generate
                  </button>
                )}
              </div>
              {!isEditing && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Prefix:</span>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    className="w-20 px-2 py-1 text-xs border border-neutral-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none uppercase font-mono transition-colors"
                    placeholder="RESKIN"
                  />
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="border-t border-neutral-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-colors"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Value <span className="text-red-500">*</span>
                    <span className="text-neutral-400 font-normal ml-1">{formData.type === 'percentage' ? '%' : '$'}</span>
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder={formData.type === 'percentage' ? '10' : '100'}
                    min="0"
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Limits Section */}
            <div className="border-t border-neutral-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Min Order <span className="text-neutral-400 font-normal">($)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, minOrder: e.target.value }))}
                    placeholder="No minimum"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Expires At</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-colors"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className="flex items-center gap-3 text-left"
              >
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-emerald-500' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      formData.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </span>
                <span className="text-sm font-medium text-neutral-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 rounded border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.code || !formData.value}
              className="flex-1 px-4 py-2.5 rounded bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Code'
              )}
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
  const [deletingCode, setDeletingCode] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleDeleteConfirm = async () => {
    if (!deletingCode) return;
    try {
      await deleteCode.mutateAsync(deletingCode.id);
      setDeletingCode(null);
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

  const handleCopyCode = useCallback((e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code.code).then(() => {
      setCopiedId(code.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleRowClick = useCallback((code) => {
    setEditingCode(code);
    setShowModal(true);
  }, []);

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
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {promoCodes.map((code) => (
                  <tr
                    key={code.id}
                    onClick={() => handleRowClick(code)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, code)}
                        className="group relative font-mono text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-1 rounded transition-colors"
                        title="Click to copy"
                      >
                        {copiedId === code.id ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            {code.code}
                            <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-900">
                        {code.discount_type === 'percent' ? `${code.discount_value}%` : formatCurrency(code.discount_value)}
                      </span>
                      {code.min_order_amount && (
                        <span className="text-xs text-neutral-500 block">
                          Min: {formatCurrency(code.min_order_amount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600">
                        {code.current_uses || 0}
                        {code.max_uses && ` / ${code.max_uses}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">
                        {code.valid_until ? formatDate(code.valid_until) : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(code.id, code.is_active); }}
                        className="flex items-center gap-2 group"
                        title={code.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                            code.is_active ? 'bg-emerald-500' : 'bg-neutral-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                              code.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                            }`}
                          />
                        </span>
                        <span className={`text-xs font-medium ${code.is_active ? 'text-emerald-700' : 'text-neutral-400'}`}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingCode(code); }}
                        className="p-2 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Delete promo code"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <PromoCodeModal
        promoCode={editingCode}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCode(null); }}
        onSave={handleSave}
        isSaving={createCode.isPending || updateCode.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCode}
        onClose={() => setDeletingCode(null)}
        onConfirm={handleDeleteConfirm}
        promoCode={deletingCode}
        isDeleting={deleteCode.isPending}
      />
    </div>
  );
}

export default PromoCodesPage;
