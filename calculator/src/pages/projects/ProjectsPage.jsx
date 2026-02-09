import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjects, useAllProjects, useDeleteProject, useUpdateProject } from '../../hooks/useProjects';
import { useAuth } from '../../contexts/AuthContext';
import { CreateProjectModal } from '../../components/projects';
import { InlineEdit } from '../../components/InlineEdit';
import { Select } from '../../components/Select';
import { formatDate } from '../../lib/utils';
// Get base path for projects based on current location
function useProjectBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin/projects';
  if (location.pathname.startsWith('/am')) return '/am/projects';
  return '/projects';
}

export function ProjectsPage() {
  const { t } = useTranslation('projects');
  const { isAdmin, isAM } = useAuth();
  const isStaff = isAdmin || isAM;
  const basePath = useProjectBasePath();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState({ client: '', status: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('projects-view') || 'cards';
  });

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('projects-view', mode);
  };

  // Use different hooks for staff vs client
  const { data: clientProjects, isLoading: clientLoading, error: clientError } = useProjects();
  const { data: allProjects, isLoading: allLoading, error: allError } = useAllProjects();

  const deleteProject = useDeleteProject();

  // Select appropriate data based on role
  const projects = isStaff ? allProjects : clientProjects;
  const isLoading = isStaff ? allLoading : clientLoading;
  const error = isStaff ? allError : clientError;

  // Get unique clients for filter
  const clients = useMemo(() => {
    if (!isStaff || !allProjects) return [];
    const uniqueClients = new Map();
    allProjects.forEach(p => {
      if (p.client?.id && !uniqueClients.has(p.client.id)) {
        uniqueClients.set(p.client.id, {
          id: p.client.id,
          name: p.client.company_name || p.client.profile?.full_name || 'Unknown',
        });
      }
    });
    return Array.from(uniqueClients.values());
  }, [isStaff, allProjects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      if (filter.client && p.client?.id !== filter.client) return false;
      if (filter.status && p.status !== filter.status) return false;
      return true;
    });
  }, [projects, filter]);

  // Handle delete
  const handleDelete = async (projectId) => {
    try {
      await deleteProject.mutateAsync(projectId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isStaff ? t('titleAll') : t('titleMy')}
          </h1>
          <p className="text-neutral-500 mt-1">
            {isStaff ? t('subtitleAll') : t('subtitleMy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle for clients */}
          {!isStaff && filteredProjects?.length > 0 && (
            <div className="flex items-center bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title={t('filters.cardView')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewChange('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title={t('filters.listView')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('actions.newProject')}
          </button>
        </div>
      </div>

      {/* Admin Filters & View Toggle */}
      {isStaff && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-52">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">{t('filters.client')}</label>
              <Select
                value={filter.client}
                onChange={(value) => setFilter(prev => ({ ...prev, client: value }))}
                options={[
                  { value: '', label: t('filters.allClients') },
                  ...clients.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">{t('filters.status')}</label>
              <Select
                value={filter.status}
                onChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
                options={[
                  { value: '', label: t('filters.allStatuses') },
                  { value: 'draft', label: t('status.draft') },
                  { value: 'active', label: t('status.active') },
                  { value: 'in_production', label: t('status.in_production') },
                  { value: 'completed', label: t('status.completed') },
                  { value: 'archived', label: t('status.archived') },
                ]}
              />
            </div>
            
            {/* Clear & Count */}
            {(filter.client || filter.status) && (
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-neutral-400">
                  {t('filters.ofCount', { filtered: filteredProjects.length, total: projects?.length || 0 })}
                </span>
                <button
                  onClick={() => setFilter({ client: '', status: '' })}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {t('filters.clear')}
                </button>
              </div>
            )}
            
            {/* View Toggle */}
            <div className={`flex items-center gap-1 bg-neutral-100 rounded-lg p-1 ${(filter.client || filter.status) ? '' : 'ml-auto'}`}>
              <button
                onClick={() => handleViewChange('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title={t('filters.cardView')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewChange('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title={t('filters.tableView')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            <p className="text-sm text-neutral-500">{t('detail.loading')}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <p className="text-red-800">
            {t('detail.loadError')}: {error.message}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredProjects?.length === 0 && (
        <div className="bg-white rounded-md border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {isStaff ? t('empty.titleStaff') : t('empty.title')}
          </h3>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
            {isStaff ? t('empty.subtitleStaff') : t('empty.clientSubtitle')}
          </p>
          {!isStaff && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('empty.createFirst')}
            </button>
          )}
        </div>
      )}

      {/* Staff view: Table */}
      {isStaff && viewMode === 'table' && !isLoading && !error && filteredProjects?.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.project')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.client')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.status')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.specs')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.offers')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.invoices')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.tasks')}</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProjects.map((project) => {
                const clientName = project.client?.company_name || project.client?.profile?.full_name || '—';
                const specsCount = project.specifications?.[0]?.count || 0;
                const offersCount = project.offersCount || 0;
                const invoicesCount = project.invoices?.[0]?.count || 0;
                const tasksCount = project.tasks?.[0]?.count || 0;
                return (
                  <tr 
                    key={project.id} 
                    onClick={() => navigate(`${basePath}/${project.id}`)}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{project.name}</div>
                      {project.description && (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[180px]">{project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-emerald-700">{clientName[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-neutral-700 truncate max-w-[100px]">{clientName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{specsCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{offersCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{invoicesCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{tasksCount}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project); }} 
                        className="p-1.5 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors"
                        title={t('actions.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff view: Cards */}
      {isStaff && viewMode === 'cards' && !isLoading && !error && filteredProjects?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <AdminProjectCard 
              key={project.id} 
              project={project} 
              basePath={basePath}
              onDelete={() => setDeleteConfirm(project)}
            />
          ))}
        </div>
      )}

      {/* Client view: Cards */}
      {!isStaff && viewMode === 'cards' && !isLoading && !error && filteredProjects?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ClientProjectCard key={project.id} project={project} basePath={basePath} />
          ))}
        </div>
      )}

      {/* Client view: Table */}
      {!isStaff && viewMode === 'table' && !isLoading && !error && filteredProjects?.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.project')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.status')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.specs')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.offers')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.invoices')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('table.tasks')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProjects.map((project) => {
                const specsCount = project.specifications?.[0]?.count || 0;
                const offersCount = project.offersCount || 0;
                const invoicesCount = project.invoices?.[0]?.count || 0;
                const tasksCount = project.tasks?.[0]?.count || 0;
                return (
                  <tr 
                    key={project.id} 
                    onClick={() => navigate(`${basePath}/${project.id}`)}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{project.name}</div>
                      {project.description && (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[180px]">{project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{specsCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{offersCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{invoicesCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-600">{tasksCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        isStaff={isStaff}
        onSuccess={(project) => {
          navigate(`${basePath}/${project.id}`);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-md max-w-md w-full shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{t('delete.title')}</h3>
              </div>
              <p className="text-neutral-600 mb-2">
                {t('delete.confirm')} <strong className="text-neutral-900">{deleteConfirm.name}</strong>?
              </p>
              <p className="text-sm text-neutral-500">
                {t('delete.warning')}
              </p>
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleteProject.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {deleteProject.isPending ? t('actions.deleting') : t('actions.deleteProject')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

// Admin Project Card — vertical card style with inline editing
function AdminProjectCard({ project, basePath, onDelete }) {
  const { t } = useTranslation('projects');
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const clientName = project.client?.company_name || project.client?.profile?.full_name || '—';
  const specsCount = project.specifications?.[0]?.count || 0;
  const offersCount = project.offersCount || 0;
  const invoicesCount = project.invoices?.[0]?.count || 0;
  const tasksCount = project.tasks?.[0]?.count || 0;

  const handleSave = (field, value) => {
    updateProject.mutate({
      projectId: project.id,
      updates: { [field]: value },
    });
  };

  return (
    <div
      onClick={() => navigate(`${basePath}/${project.id}`)}
      className="group block bg-white rounded-lg border border-neutral-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1 flex-1">
          <InlineEdit
            value={project.name}
            onSave={(value) => handleSave('name', value)}
            placeholder={t('create.namePlaceholder')}
            inputClassName="text-base font-semibold"
          />
        </h3>
        <StatusBadge status={project.status} />
      </div>

      {/* Description */}
      <div className="text-sm text-neutral-500 mb-4 min-h-[40px]">
        <InlineEdit
          value={project.description}
          onSave={(value) => handleSave('description', value)}
          placeholder={t('create.descriptionPlaceholder')}
          multiline
          inputClassName="text-sm"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{specsCount}</div>
          <div className="text-xs text-neutral-500">{t('card.specs')}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{offersCount}</div>
          <div className="text-xs text-neutral-500">{t('card.offers')}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{invoicesCount}</div>
          <div className="text-xs text-neutral-500">{t('card.invoices')}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{tasksCount}</div>
          <div className="text-xs text-neutral-500">{t('tasks.title')}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <span className="text-xs text-neutral-400">{formatDate(project.created_at)}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate max-w-[100px]">{clientName}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
            title={t('actions.delete')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Client Project Card — same as AdminProjectCard but without client info
function ClientProjectCard({ project, basePath }) {
  const { t } = useTranslation('projects');
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const specsCount = project.specifications?.[0]?.count || 0;
  const offersCount = project.offersCount || 0;
  const invoicesCount = project.invoices?.[0]?.count || 0;
  const tasksCount = project.tasks?.[0]?.count || 0;

  const handleSave = (field, value) => {
    updateProject.mutate({
      projectId: project.id,
      updates: { [field]: value },
    });
  };

  return (
    <div
      onClick={() => navigate(`${basePath}/${project.id}`)}
      className="group block bg-white rounded-lg border border-neutral-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1 flex-1">
          <InlineEdit
            value={project.name}
            onSave={(value) => handleSave('name', value)}
            placeholder={t('create.namePlaceholder')}
            inputClassName="text-base font-semibold"
          />
        </h3>
        <StatusBadge status={project.status} />
      </div>

      {/* Description */}
      <div className="text-sm text-neutral-500 mb-4 min-h-[40px]">
        <InlineEdit
          value={project.description}
          onSave={(value) => handleSave('description', value)}
          placeholder={t('create.descriptionPlaceholder')}
          multiline
          inputClassName="text-sm"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{specsCount}</div>
          <div className="text-xs text-neutral-500">{t('card.specs')}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{offersCount}</div>
          <div className="text-xs text-neutral-500">{t('card.offers')}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{invoicesCount}</div>
          <div className="text-xs text-neutral-500">{t('card.invoices')}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded">
          <div className="text-lg font-semibold text-neutral-900">{tasksCount}</div>
          <div className="text-xs text-neutral-500">{t('tasks.title')}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <span className="text-xs text-neutral-400">{formatDate(project.created_at)}</span>
        <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
          {t('card.open')} →
        </span>
      </div>
    </div>
  );
}

// Status badge
function StatusBadge({ status }) {
  const { t } = useTranslation('projects');
  const styles = {
    draft: 'bg-neutral-100 text-neutral-700',
    active: 'bg-emerald-100 text-emerald-800',
    in_production: 'bg-purple-100 text-purple-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-neutral-100 text-neutral-500',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}

export default ProjectsPage;
