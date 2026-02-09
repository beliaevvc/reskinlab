import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useCreateProject } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import { Select } from '../Select';

export function CreateProjectModal({ isOpen, onClose, onSuccess, isStaff = false }) {
  const { t } = useTranslation('projects');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const createProject = useCreateProject();
  const { data: clients, isLoading: clientsLoading } = useClients();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (isStaff && !selectedClientId) return;

    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        clientId: isStaff ? selectedClientId : undefined,
      });

      // Reset form
      setName('');
      setDescription('');
      setSelectedClientId('');

      // Callback with created project
      if (onSuccess) {
        onSuccess(project);
      }

      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-md shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t('create.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {createProject.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                {createProject.error.message || t('create.failed', { defaultValue: 'Failed to create project' })}
              </p>
            </div>
          )}

          {/* Client selector (staff only) */}
          {isStaff && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('create.client')} <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedClientId}
                onChange={setSelectedClientId}
                disabled={clientsLoading}
                options={[
                  { value: '', label: clientsLoading ? t('create.loadingClients') : t('create.selectClient') },
                  ...(clients || []).map((c) => ({
                    value: c.id,
                    label: c.user?.full_name || c.user?.email || c.company_name || c.id,
                  })),
                ]}
              />
            </div>
          )}

          {/* Project Name */}
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-neutral-700 mb-1.5"
            >
              {t('create.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('create.namePlaceholder')}
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="projectDescription"
              className="block text-sm font-medium text-neutral-700 mb-1.5"
            >
              {t('create.description')} <span className="text-neutral-400">({t('create.optional')})</span>
            </label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('create.descriptionPlaceholder')}
              rows={3}
              className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createProject.isPending || (isStaff && !selectedClientId)}
              className="flex-1 px-4 py-2.5 rounded bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {createProject.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t('create.creating')}
                </>
              ) : (
                t('create.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default CreateProjectModal;
