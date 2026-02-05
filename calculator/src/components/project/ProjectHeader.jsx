import { Link, useLocation } from 'react-router-dom';
import { useViewAsRole } from '../../contexts/ViewAsRoleContext';
import { useUpdateProject } from '../../hooks/useProjects';
import { InlineEdit } from '../InlineEdit';
import { formatDate } from '../../lib/utils';

const STATUS_STYLES = {
  draft: 'bg-neutral-100 text-neutral-700',
  pending_payment: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-purple-100 text-purple-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  archived: 'bg-neutral-200 text-neutral-600',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  active: 'Active',
  in_production: 'In Production',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
};

function useProjectBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin/projects';
  if (location.pathname.startsWith('/am')) return '/am/projects';
  return '/projects';
}

export function ProjectHeader({ 
  project, 
  taskStats = { total: 0, done: 0 },
  pendingApprovals = 0,
  onOpenFilesGallery,
  onCompleteProject,
  onArchiveProject,
  canCompleteOrArchive = false,
  isCompleting = false,
  isArchiving = false,
}) {
  const basePath = useProjectBasePath();
  const updateProject = useUpdateProject();
  const { 
    viewAsRole, 
    setViewAs, 
    canUseViewAs, 
    isViewingAs,
    effectiveRole 
  } = useViewAsRole();

  if (!project) return null;

  const handleSave = (field, value) => {
    updateProject.mutate({
      projectId: project.id,
      updates: { [field]: value },
    });
  };

  const progress = taskStats.total > 0 
    ? Math.round((taskStats.done / taskStats.total) * 100) 
    : 0;

  return (
    <div className="bg-white border-b border-neutral-200">
      {/* View As Banner */}
      {isViewingAs && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            <strong>Preview mode:</strong> Viewing as {viewAsRole === 'client' ? 'Client' : 'Account Manager'}
          </span>
          <button
            onClick={() => setViewAs(null)}
            className="text-sm text-amber-700 hover:text-amber-900 font-medium"
          >
            Exit preview
          </button>
        </div>
      )}

      <div className="px-6 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-4">
          <Link to={basePath} className="text-neutral-500 hover:text-neutral-700 transition-colors">
            Projects
          </Link>
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-neutral-900 font-medium">{project.name}</span>
        </nav>

        {/* Main header row */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: Project info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900">
                <InlineEdit
                  value={project.name}
                  onSave={(value) => handleSave('name', value)}
                  placeholder="Project name"
                  inputClassName="text-xl font-bold"
                />
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                STATUS_STYLES[project.status] || STATUS_STYLES.draft
              }`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
            </div>

            {/* Client & dates */}
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
              {project.client?.company_name && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {project.client.company_name}
                </span>
              )}
              <span>Created {formatDate(project.created_at)}</span>
            </div>
          </div>

          {/* Right: Stats & Actions */}
          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="text-center px-3 py-1 bg-neutral-50 rounded">
                <div className="font-semibold text-neutral-900">{taskStats.done}/{taskStats.total}</div>
                <div className="text-xs text-neutral-500">Tasks</div>
              </div>
              <div className="text-center px-3 py-1 bg-neutral-50 rounded">
                <div className="font-semibold text-neutral-900">{progress}%</div>
                <div className="text-xs text-neutral-500">Progress</div>
              </div>
              {pendingApprovals > 0 && (
                <div className="text-center px-3 py-1 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-700">{pendingApprovals}</div>
                  <div className="text-xs text-blue-600">Approvals</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onOpenFilesGallery && (
                <button
                  onClick={onOpenFilesGallery}
                  className="p-2 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700"
                  title="View all files"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              )}

              {/* Complete/Archive buttons - Admin and AM only */}
              {canCompleteOrArchive && (
                <>
                  {project.status !== 'completed' && project.status !== 'archived' && project.status !== 'cancelled' && (
                    <button
                      onClick={onCompleteProject}
                      disabled={isCompleting || isArchiving}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Завершить проект"
                    >
                      {isCompleting ? 'Завершение...' : 'Завершить проект'}
                    </button>
                  )}
                  {(project.status === 'completed' || project.status === 'cancelled') && project.status !== 'archived' && (
                    <button
                      onClick={onArchiveProject}
                      disabled={isCompleting || isArchiving}
                      className="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Архивировать проект"
                    >
                      {isArchiving ? 'Архивирование...' : 'Архивировать'}
                    </button>
                  )}
                </>
              )}

              {/* Role Switcher - Admin only */}
              {canUseViewAs && (
                <div className="relative">
                  <select
                    value={effectiveRole || 'admin'}
                    onChange={(e) => setViewAs(e.target.value)}
                    className={`appearance-none border rounded px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isViewingAs 
                        ? 'bg-amber-100 border-amber-300 text-amber-800' 
                        : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <option value="admin">Admin</option>
                    <option value="am">View as AM</option>
                    <option value="client">View as Client</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectHeader;
