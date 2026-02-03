import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useUpdateProject } from '../../hooks/useProjects';

const STATUS_STYLES = {
  draft: 'bg-neutral-100 text-neutral-700',
  pending_payment: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Get base path for projects based on current location
function useProjectBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin/projects';
  if (location.pathname.startsWith('/am')) return '/am/projects';
  return '/projects';
}

export function ProjectCard({ project, showClient = false }) {
  const basePath = useProjectBasePath();
  const specCount = project.specifications?.[0]?.count || 0;
  const latestTotal = project.specifications?.[0]?.totals_json?.grandTotal;
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const updateProject = useUpdateProject();
  
  // Get client name for admin view
  const clientName = showClient && project.client 
    ? (project.client.company_name || project.client.profile?.full_name || 'Unknown')
    : null;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(project.name);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (editedName.trim() && editedName !== project.name) {
      try {
        await updateProject.mutateAsync({
          projectId: project.id,
          updates: { name: editedName.trim() },
        });
      } catch (err) {
        console.error('Failed to update project:', err);
        alert('Failed to update project name');
      }
    }
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false);
    setEditedName(project.name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  return (
    <Link
      to={isEditing ? '#' : `${basePath}/${project.id}`}
      onClick={(e) => {
        if (isEditing) {
          e.preventDefault();
        }
      }}
      className="block bg-white rounded-md border border-neutral-200 p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 text-lg font-semibold text-neutral-900 border border-emerald-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <h3 className="flex-1 text-lg font-semibold text-neutral-900 truncate group-hover:text-emerald-700 transition-colors">
                  {project.name}
                </h3>
                <button
                  onClick={handleEdit}
                  className="p-1 hover:bg-neutral-100 rounded z-10"
                  title="Rename project"
                >
                  <svg
                    className="w-4 h-4 text-neutral-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <span
          className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium ${
            STATUS_STYLES[project.status] || STATUS_STYLES.draft
          }`}
        >
          {STATUS_LABELS[project.status] || project.status}
        </span>
      </div>

      {/* Client Info (Admin view) - минималистично */}
      {showClient && clientName && (
        <div className="flex items-center gap-2 mb-3 text-sm text-neutral-600">
          <svg
            className="w-4 h-4 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="truncate">{clientName}</span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        {/* Specifications count */}
        <div className="flex items-center gap-1.5 text-neutral-600">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>
            {specCount} spec{specCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Latest total if available */}
        {latestTotal > 0 && (
          <div className="flex items-center gap-1.5 text-neutral-600">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatCurrency(latestTotal)}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-neutral-400 ml-auto">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(project.updated_at || project.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
