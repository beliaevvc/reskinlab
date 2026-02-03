import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useProjects, useAllProjects, useDeleteProject } from '../../hooks/useProjects';
import { useAuth } from '../../contexts/AuthContext';
import { CreateProjectModal, ProjectCard } from '../../components/projects';
import { formatDate } from '../../lib/utils';

// Get base path for projects based on current location
function useProjectBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin/projects';
  if (location.pathname.startsWith('/am')) return '/am/projects';
  return '/projects';
}

export function ProjectsPage() {
  const { isAdmin, isAM } = useAuth();
  const isStaff = isAdmin || isAM;
  const basePath = useProjectBasePath();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState({ client: '', status: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

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
            {isStaff ? 'All Projects' : 'My Projects'}
          </h1>
          <p className="text-neutral-500 mt-1">
            {isStaff
              ? 'Manage all client projects and specifications'
              : 'Manage your game art projects and specifications'}
          </p>
        </div>
        {!isStaff && (
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
            New Project
          </button>
        )}
      </div>

      {/* Admin Filters & View Toggle */}
      {isStaff && (
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-48">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Client</label>
                <select
                  value={filter.client}
                  onChange={(e) => setFilter(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Clients</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="in_production">In Production</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {(filter.client || filter.status) && (
                <button
                  onClick={() => setFilter({ client: '', status: '' })}
                  className="text-sm text-neutral-500 hover:text-neutral-700 mt-5"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 rounded p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white shadow-sm text-emerald-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="Card view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-emerald-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="Table view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-neutral-500">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            {(filter.client || filter.status) && ` (filtered from ${projects?.length || 0})`}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            <p className="text-sm text-neutral-500">Loading projects...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <p className="text-red-800">
            Failed to load projects: {error.message}
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
            {isStaff ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
            {isStaff
              ? 'No projects match the current filters.'
              : 'Create your first project to start building game art specifications.'}
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
              Create First Project
            </button>
          )}
        </div>
      )}

      {/* Staff view: Table */}
      {isStaff && viewMode === 'table' && !isLoading && !error && filteredProjects?.length > 0 && (
        <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide">Project</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wide">Specs</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <Link to={`${basePath}/${project.id}`} className="font-medium text-neutral-900 hover:text-emerald-600 transition-colors">
                      {project.name}
                    </Link>
                    {project.description && (
                      <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-xs">{project.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                        {(project.client?.company_name || project.client?.profile?.full_name || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {project.client?.company_name || project.client?.profile?.full_name || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                      {project.specifications?.[0]?.count || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-neutral-500">
                    {formatDate(project.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        to={`${basePath}/${project.id}`} 
                        className="p-2 rounded hover:bg-emerald-100 text-neutral-400 hover:text-emerald-600 transition-colors"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button 
                        onClick={() => setDeleteConfirm(project)} 
                        className="p-2 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Client view: Grid */}
      {!isStaff && !isLoading && !error && filteredProjects?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(project) => {
          console.log('Project created:', project);
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
                <h3 className="text-lg font-semibold text-neutral-900">Delete Project</h3>
              </div>
              <p className="text-neutral-600 mb-2">
                Are you sure you want to delete <strong className="text-neutral-900">{deleteConfirm.name}</strong>?
              </p>
              <p className="text-sm text-neutral-500">
                This will permanently remove all specifications, offers, invoices, and files.
              </p>
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleteProject.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Admin Project Card — matching client style
function AdminProjectCard({ project, basePath, onDelete }) {
  const clientName = project.client?.company_name || project.client?.profile?.full_name || '—';
  const specsCount = project.specifications?.[0]?.count || 0;

  return (
    <div className="group bg-white rounded-md border border-neutral-200 p-5 hover:shadow-md hover:border-emerald-200 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link
            to={`${basePath}/${project.id}`}
            className="text-lg font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors truncate block"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Client badge */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-50 rounded">
        <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-semibold">
          {clientName[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium text-emerald-800 truncate">{clientName}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-neutral-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{specsCount} spec{specsCount !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400 ml-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(project.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
        <Link
          to={`${basePath}/${project.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View Project →
        </Link>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="text-sm text-neutral-400 hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Status badge
function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-neutral-100 text-neutral-700',
    active: 'bg-emerald-100 text-emerald-800',
    in_production: 'bg-purple-100 text-purple-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-neutral-100 text-neutral-500',
  };

  const labels = {
    draft: 'Draft',
    active: 'Active',
    in_production: 'In Progress',
    completed: 'Completed',
    archived: 'Archived',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}

export default ProjectsPage;
