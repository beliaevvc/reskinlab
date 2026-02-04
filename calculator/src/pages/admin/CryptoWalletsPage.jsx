import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useCryptoWallets,
  useCreateWallet,
  useUpdateWallet,
  useDeleteWallet,
  useToggleWallet,
  SUPPORTED_CURRENCIES,
  SUPPORTED_NETWORKS,
  NETWORK_INFO,
} from '../../hooks/useCryptoWallets';

function WalletModal({ wallet, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    currency: wallet?.currency || 'USDT',
    network: wallet?.network || 'TRC20',
    address: wallet?.address || '',
    label: wallet?.label || '',
    isActive: wallet?.is_active ?? true,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        currency: wallet?.currency || 'USDT',
        network: wallet?.network || 'TRC20',
        address: wallet?.address || '',
        label: wallet?.label || '',
        isActive: wallet?.is_active ?? true,
      });
    }
  }, [isOpen, wallet]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.address.trim()) {
      alert('Wallet address is required');
      return;
    }
    onSave(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {wallet ? 'Edit Wallet' : 'Add Wallet'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Currency *</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {SUPPORTED_CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Network *</label>
              <select
                value={formData.network}
                onChange={(e) => setFormData(prev => ({ ...prev, network: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {SUPPORTED_NETWORKS.map(network => (
                  <option key={network} value={network}>
                    {network} ({NETWORK_INFO[network]?.blockchain})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Wallet Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter wallet address"
              className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Label (optional)</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Main USDT wallet"
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
            <span className="text-sm text-neutral-700">Active (show to clients in invoices)</span>
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

export function CryptoWalletsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  const { data: wallets, isLoading } = useCryptoWallets();
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const deleteWallet = useDeleteWallet();
  const toggleWallet = useToggleWallet();

  const handleSave = async (data) => {
    try {
      if (editingWallet) {
        await updateWallet.mutateAsync({ id: editingWallet.id, updates: data });
      } else {
        await createWallet.mutateAsync(data);
      }
      setShowModal(false);
      setEditingWallet(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return;
    try {
      await deleteWallet.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await toggleWallet.mutateAsync({ id, isActive: !currentStatus });
    } catch (err) {
      alert('Failed to toggle: ' + err.message);
    }
  };

  const activeCount = wallets?.filter(w => w.is_active).length || 0;

  // Group wallets by currency for display
  const walletsByCurrency = wallets?.reduce((acc, wallet) => {
    if (!acc[wallet.currency]) acc[wallet.currency] = [];
    acc[wallet.currency].push(wallet);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payment Wallets</h1>
          <p className="text-neutral-500 mt-1">Manage crypto wallets for invoice payments</p>
        </div>
        <button
          onClick={() => { setEditingWallet(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Wallet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Total Wallets</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{wallets?.length || 0}</p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Active Wallets</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : wallets?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-neutral-500 mb-4">No wallets configured yet</p>
            <button
              onClick={() => { setEditingWallet(null); setShowModal(true); }}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Add your first wallet
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Currency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Network</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Active</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {wallets.map((wallet) => (
                  <tr 
                    key={wallet.id} 
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => { setEditingWallet(wallet); setShowModal(true); }}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        wallet.currency === 'USDT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {wallet.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-neutral-900">{wallet.network}</span>
                        <span className="text-xs text-neutral-500 block">
                          {NETWORK_INFO[wallet.network]?.blockchain}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono text-neutral-700 break-all max-w-xs block">
                        {wallet.address.length > 20
                          ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-10)}`
                          : wallet.address}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600">
                        {wallet.label || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggle(wallet.id, wallet.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          wallet.is_active ? 'bg-emerald-500' : 'bg-neutral-300'
                        }`}
                        title={wallet.is_active ? 'Active' : 'Inactive'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            wallet.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(wallet.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete wallet"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Info card */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-medium">How it works</p>
            <ul className="mt-1 space-y-1 text-amber-700">
              <li>• Active wallets are shown to clients when they view invoice payment details</li>
              <li>• Clients can choose from available networks based on active wallets</li>
              <li>• Inactive wallets are hidden from clients but remain in the system</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      <WalletModal
        wallet={editingWallet}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingWallet(null); }}
        onSave={handleSave}
        isSaving={createWallet.isPending || updateWallet.isPending}
      />
    </div>
  );
}

export default CryptoWalletsPage;
