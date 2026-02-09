import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const ROLE_KEYS = [
  { value: 'client', labelKey: 'roleModal.roles.client', descKey: 'roleModal.roles.clientDesc' },
  { value: 'am', labelKey: 'roleModal.roles.am', descKey: 'roleModal.roles.amDesc' },
  { value: 'admin', labelKey: 'roleModal.roles.admin', descKey: 'roleModal.roles.adminDesc' },
];

export function UserRoleModal({ user, isOpen, onClose, onSave, isSaving }) {
  const { t } = useTranslation('admin');
  const [selectedRole, setSelectedRole] = useState(user?.role || 'client');

  if (!isOpen || !user) return null;

  const handleSave = () => {
    if (selectedRole !== user.role) {
      onSave(selectedRole);
    } else {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{t('roleModal.title')}</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {user.full_name || user.email}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {ROLE_KEYS.map((role) => (
              <label
                key={role.value}
                className={`flex items-start gap-3 p-4 rounded-md border-2 cursor-pointer transition-colors ${
                  selectedRole === role.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300"
                />
                <div>
                  <p className="font-medium text-neutral-900">{role.label}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">{role.description}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedRole !== user.role && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> {t('roleModal.note')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium disabled:opacity-50"
          >
            {t('roleModal.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedRole === user.role}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-300 text-white font-medium rounded transition-colors"
          >
            {isSaving ? t('roleModal.saving') : t('roleModal.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default UserRoleModal;
