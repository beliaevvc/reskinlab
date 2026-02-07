import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useViewAsRole } from '../../contexts/ViewAsRoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateProject } from '../../hooks/useProjects';
import { Select } from '../Select';
import { InlineEdit } from '../InlineEdit';

const STATUS_STYLES = {
  draft: 'bg-neutral-100 text-neutral-600',
  pending_payment: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  in_production: 'bg-purple-50 text-purple-700',
  on_hold: 'bg-orange-50 text-orange-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
  archived: 'bg-neutral-100 text-neutral-500',
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

// Compact stages stepper -- thin row under the header, no pill backgrounds
function StagesStepper({ stages = [], onStageClick, canChangeStage = false }) {
  const { isAdmin, isAM } = useAuth();

  if (!stages.length) return null;

  const isClickable = canChangeStage && (isAdmin || isAM);

  return (
    <div className="px-4 lg:px-6 py-1.5 border-t border-neutral-100 flex items-center overflow-x-auto">
      {stages.map((stage, index) => {
        const isCompleted = stage.status === 'completed' || stage.status === 'approved';
        const isCurrent = stage.status === 'in_progress' || stage.status === 'review';

        return (
          <div key={stage.id} className="flex items-center" style={index < stages.length - 1 ? { flex: '1 1 0%' } : undefined}>
            {/* Stage indicator + name */}
            <button
              onClick={() => isClickable && onStageClick?.(stage)}
              disabled={!isClickable}
              className={`
                flex items-center gap-1.5 transition-colors text-[11px] whitespace-nowrap flex-shrink-0
                ${isCurrent 
                  ? 'text-emerald-700 font-semibold' 
                  : isCompleted 
                    ? 'text-emerald-600' 
                    : 'text-neutral-400'
                }
                ${isClickable ? 'cursor-pointer hover:text-emerald-600' : 'cursor-default'}
              `}
            >
              {/* Dot / checkmark */}
              <span className={`
                flex items-center justify-center flex-shrink-0 rounded-full
                ${isCurrent 
                  ? 'w-5 h-5 bg-emerald-500 text-white' 
                  : isCompleted 
                    ? 'w-4 h-4 bg-emerald-500 text-white'
                    : 'w-4 h-4 bg-neutral-200 text-neutral-400'
                }
              `}>
                {isCompleted ? (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`font-bold ${isCurrent ? 'text-[9px]' : 'text-[8px]'}`}>{index + 1}</span>
                )}
              </span>

              {/* Name -- always visible */}
              {stage.name}
            </button>

            {/* Connector line -- fills remaining space */}
            {index < stages.length - 1 && (
              <div className={`
                flex-1 h-px mx-2 min-w-[12px]
                ${isCompleted || isCurrent ? 'bg-emerald-300' : 'bg-neutral-200'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Actions dropdown menu
function ActionsMenu({ 
  project, 
  onOpenFilesGallery, 
  onArchiveProject, 
  canCompleteOrArchive,
  isArchiving,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const showArchive = canCompleteOrArchive && 
    (project.status === 'completed' || project.status === 'cancelled') && 
    project.status !== 'archived';

  const hasMenuItems = showArchive;

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Files gallery button */}
        {onOpenFilesGallery && (
          <button
            onClick={onOpenFilesGallery}
            className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Files"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* More actions */}
        {hasMenuItems && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-400 hover:text-neutral-600 transition-colors"
            title="More actions"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && hasMenuItems && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
            {showArchive && (
              <button
                onClick={() => { onArchiveProject(); setIsOpen(false); }}
                disabled={isArchiving}
                className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {isArchiving ? 'Archiving...' : 'Archive project'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ProjectHeader({ 
  project, 
  taskStats = { total: 0, done: 0 },
  pendingApprovals = 0,
  stages = [],
  onStageClick,
  canChangeStage = false,
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
    <div className="bg-white border-b border-neutral-200 flex-shrink-0">
      {/* View As Banner */}
      {isViewingAs && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between">
          <span className="text-xs text-amber-800">
            <strong>Preview:</strong> Viewing as {viewAsRole === 'client' ? 'Client' : 'AM'}
          </span>
          <button
            onClick={() => setViewAs(null)}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium"
          >
            Exit
          </button>
        </div>
      )}

      {/* Main compact header */}
      <div className="px-4 lg:px-6 h-12 flex items-center gap-3">
        {/* Left: Breadcrumb + Name + Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Breadcrumb */}
          <Link 
            to={basePath} 
            className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </Link>

          <span className="hidden sm:block text-neutral-300 text-xs">/</span>

          {/* Project name */}
          <h1 className="text-sm font-semibold text-neutral-900 truncate">
            <InlineEdit
              value={project.name}
              onSave={(value) => handleSave('name', value)}
              placeholder="Project name"
              inputClassName="text-sm font-semibold"
            />
          </h1>

          {/* Status badge */}
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
            STATUS_STYLES[project.status] || STATUS_STYLES.draft
          }`}>
            {STATUS_LABELS[project.status] || project.status}
          </span>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Stats pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-50 text-[11px] text-neutral-600" title="Tasks completed">
              <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">{taskStats.done}</span>
              <span className="text-neutral-400">/ {taskStats.total}</span>
            </span>

            {progress > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-50 text-[11px] text-neutral-600" title="Progress">
                <div className="w-8 h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className="font-medium">{progress}%</span>
              </span>
            )}

            {pendingApprovals > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[11px] text-blue-600 font-medium" title="Pending approvals">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pendingApprovals}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-neutral-200" />

          {/* Complete Project button (visible for staff when applicable) */}
          {canCompleteOrArchive && project.status !== 'completed' && project.status !== 'archived' && project.status !== 'cancelled' && (
            <button
              onClick={onCompleteProject}
              disabled={isCompleting}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isCompleting ? 'Completing...' : 'Complete'}
            </button>
          )}

          {/* Actions */}
          <ActionsMenu
            project={project}
            onOpenFilesGallery={onOpenFilesGallery}
            onArchiveProject={onArchiveProject}
            canCompleteOrArchive={canCompleteOrArchive}
            isArchiving={isArchiving}
          />

          {/* Role Switcher */}
          {canUseViewAs && (
            <Select
              value={effectiveRole || 'admin'}
              onChange={(val) => setViewAs(val)}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'am', label: 'AM' },
                { value: 'client', label: 'Client' },
              ]}
              size="sm"
              className="min-w-[80px]"
            />
          )}
        </div>
      </div>

      {/* Stages bar - separate row under header */}
      {stages.length > 0 && (
        <StagesStepper
          stages={stages}
          onStageClick={onStageClick}
          canChangeStage={canChangeStage}
        />
      )}
    </div>
  );
}

export default ProjectHeader;
