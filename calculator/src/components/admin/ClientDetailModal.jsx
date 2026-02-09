import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClientDetails } from '../../hooks/useClients';
import { formatDate, formatCurrency } from '../../lib/utils';

const STATUS_STYLES = {
  draft: 'bg-neutral-100 text-neutral-700',
  active: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function ClientDetailModal({ clientId, isOpen, onClose }) {
  const { t } = useTranslation('admin');
  const { data: client, isLoading } = useClientDetails(clientId);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900">Client Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : client ? (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-emerald-700">
                    {client.company_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-neutral-900">
                    {client.company_name || t('clientDetail.noCompanyName')}
                  </h3>
                  <p className="text-neutral-500 mt-1">{client.contact_email || client.user?.email || '—'}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-neutral-500">{t('clientDetail.contact')} </span>
                      <span className="text-neutral-900">{client.contact_person || '—'}</span>
                    </div>
                    {client.phone && (
                      <div>
                        <span className="text-neutral-500">{t('clientDetail.phone')} </span>
                        <span className="text-neutral-900">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-50 rounded-md p-4">
                  <p className="text-sm text-neutral-500">{t('clientDetail.totalProjects')}</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {client.projectCount}
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-md p-4">
                  <p className="text-sm text-neutral-500">{t('clientDetail.totalRevenue')}</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(client.totalRevenue)}
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-md p-4">
                  <p className="text-sm text-neutral-500">{t('clientDetail.memberSince')}</p>
                  <p className="text-lg font-bold text-neutral-900 mt-1">
                    {formatDate(client.created_at)}
                  </p>
                </div>
              </div>

              {/* Linked User */}
              {client.user && (
                <div className="bg-blue-50 rounded-md p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Linked Account</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {client.user.full_name?.[0] || client.user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {client.user.full_name || 'No name'}
                      </p>
                      <p className="text-xs text-neutral-500">{client.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-3">{t('clientDetail.projects')}</h4>
                {client.projects?.length > 0 ? (
                  <div className="space-y-2">
                    {client.projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {project.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {formatDate(project.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            STATUS_STYLES[project.status] || STATUS_STYLES.draft
                          }`}>
                            {project.status?.replace('_', ' ')}
                          </span>
                          <Link
                            to={`/admin/projects/${project.id}`}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            onClick={onClose}
                          >
                            {t('clientDetail.view')}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    {t('clientDetail.noProjects')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              {t('clientDetail.clientNotFound')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-neutral-700 hover:bg-neutral-100 font-medium rounded transition-colors"
          >
            {t('clientDetail.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ClientDetailModal;
