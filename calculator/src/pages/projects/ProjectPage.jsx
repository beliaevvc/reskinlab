import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useViewAsRole } from '../../contexts/ViewAsRoleContext';
import { useProject, useCompleteProject, useArchiveProject } from '../../hooks/useProjects';
import { useStages, useCreateStages, DEFAULT_STAGES } from '../../hooks/useStages';
import { useTasks, TASK_STATUSES, useUpdateTaskStatus } from '../../hooks/useTasks';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useProjectFiles } from '../../hooks/useFiles';
import { ProjectHeader, ProjectSidebar, SpecificationModal, OfferModal, InvoiceModal, FilesGalleryModal, CalculatorModal } from '../../components/project';
import { StageChangeModal } from '../../components/project/StageChangeModal';
import { KanbanBoard, TaskDetailModal, CreateTaskModal } from '../../components/tasks';
import { TaskCard } from '../../components/tasks/TaskCard';

const SIDEBAR_COLLAPSED_KEY = 'project-sidebar-collapsed';

export function ProjectPage() {
  const { id: projectId } = useParams();
  const { effectiveIsStaff } = useViewAsRole();
  
  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showFilesGallery, setShowFilesGallery] = useState(false);
  const [selectedSpecId, setSelectedSpecId] = useState(null);
  const [returnToTaskId, setReturnToTaskId] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedStageForChange, setSelectedStageForChange] = useState(null);
  // Mobile kanban column tabs
  const [mobileColumn, setMobileColumn] = useState('todo');
  // Confirm modal
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'complete' | 'archive', title, message }

  // Data fetching
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: stages, isLoading: stagesLoading } = useStages(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: pendingApprovals } = usePendingApprovals(projectId);
  const { data: projectFiles } = useProjectFiles(projectId);
  const { mutate: completeProject, isPending: isCompleting } = useCompleteProject();
  const { mutate: archiveProject, isPending: isArchiving } = useArchiveProject();

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Stats
  const taskStats = {
    total: tasks?.length || 0,
    done: tasks?.filter(t => t.status === 'done').length || 0,
  };

  // Handlers
  const handleToggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleNewSpecification = () => { setEditingSpecId(null); setShowCalculator(true); };
  const handleEditSpecification = (specId) => { setEditingSpecId(specId); setShowCalculator(true); };
  const handleSpecClick = (spec) => setSelectedSpecId(spec.id);
  const handleOfferClick = (offer) => setSelectedOfferId(offer.id);
  const handleInvoiceClick = (invoiceId) => setSelectedInvoiceId(invoiceId);
  const handleStageClick = (stage) => setSelectedStageForChange(stage);

  const handleCompleteProject = () => {
    setConfirmAction({
      type: 'complete',
      title: 'Complete Project',
      message: `Are you sure you want to mark "${project?.name}" as completed?`,
    });
  };

  const handleArchiveProject = () => {
    setConfirmAction({
      type: 'archive',
      title: 'Archive Project',
      message: `Are you sure you want to archive "${project?.name}"? This action cannot be easily undone.`,
    });
  };

  const handleConfirmAction = () => {
    if (confirmAction?.type === 'complete') {
      completeProject(projectId);
    } else if (confirmAction?.type === 'archive') {
      archiveProject(projectId);
    }
    setConfirmAction(null);
  };

  // Loading state
  if (projectLoading || stagesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-emerald-500" />
          <p className="text-xs text-neutral-400">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (projectError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700">Failed to load project: {projectError.message}</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!project) {
    return (
      <div className="p-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-sm text-neutral-500">Project not found</p>
        </div>
      </div>
    );
  }

  // Merge DB stages with defaults so all 7 are always visible
  const mergedStages = DEFAULT_STAGES.map((def) => {
    const dbStage = stages?.find((s) => s.stage_key === def.key);
    if (dbStage) return dbStage;
    // Placeholder for stages not yet in DB
    return {
      id: `default-${def.key}`,
      stage_key: def.key,
      name: def.name,
      order: def.order,
      status: 'pending',
      _isPlaceholder: true,
    };
  });

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100vh-4rem)] flex flex-col bg-neutral-50">
      {/* Compact Header with inline stages */}
      <ProjectHeader
        project={project}
        taskStats={taskStats}
        pendingApprovals={pendingApprovals?.length || 0}
        stages={mergedStages}
        onStageClick={handleStageClick}
        canChangeStage={effectiveIsStaff}
        onOpenFilesGallery={() => setShowFilesGallery(true)}
        onCompleteProject={handleCompleteProject}
        onArchiveProject={handleArchiveProject}
        canCompleteOrArchive={effectiveIsStaff}
        isCompleting={isCompleting}
        isArchiving={isArchiving}
      />

      {/* Main content: Kanban (fills space) + Sidebar (right) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Kanban area */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          {/* Compact kanban toolbar */}
          <div className="px-4 lg:px-5 py-2 flex items-center justify-between flex-shrink-0 border-b border-neutral-100 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Board</h2>
              <span className="text-[10px] text-neutral-400 tabular-nums">
                {taskStats.total} tasks
              </span>
            </div>
            {effectiveIsStaff && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Task</span>
              </button>
            )}
          </div>

          {/* Mobile column tabs */}
          <div className="md:hidden flex border-b border-neutral-100 bg-white overflow-x-auto flex-shrink-0">
            {TASK_STATUSES.map((status) => {
              const count = tasks?.filter(t => t.status === status.id).length || 0;
              return (
                <button
                  key={status.id}
                  onClick={() => setMobileColumn(status.id)}
                  className={`
                    flex items-center gap-1 px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0
                    ${mobileColumn === status.id
                      ? 'text-neutral-900 border-b-2 border-emerald-500'
                      : 'text-neutral-400'
                    }
                  `}
                >
                  {status.label}
                  {count > 0 && (
                    <span className={`px-1 rounded text-[9px] tabular-nums ${
                      mobileColumn === status.id ? 'bg-neutral-200 text-neutral-600' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop: Full kanban board */}
          <div className="hidden md:flex flex-1 overflow-auto p-3 lg:p-4">
            <KanbanBoard
              tasks={tasks || []}
              projectId={projectId}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
              onCreateTask={effectiveIsStaff ? () => setShowCreateTask(true) : undefined}
              canDrag={effectiveIsStaff}
              canToggleComplete={effectiveIsStaff}
            />
          </div>

          {/* Mobile: Single column view */}
          <div className="md:hidden flex-1 overflow-auto p-3">
            <MobileKanbanColumn
              tasks={tasks || []}
              statusId={mobileColumn}
              projectId={projectId}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
              canToggleComplete={effectiveIsStaff}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <ProjectSidebar
          project={project}
          specifications={project.specifications || []}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onSpecClick={handleSpecClick}
          onOfferClick={handleOfferClick}
          onInvoiceClick={handleInvoiceClick}
          onNewSpecification={handleNewSpecification}
        />
      </div>

      {/* Modals (unchanged) */}
      <TaskDetailModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        projectId={projectId}
        onOpenSpecification={(specId) => {
          setReturnToTaskId(selectedTaskId);
          setSelectedTaskId(null);
          setSelectedSpecId(specId);
        }}
        onOpenOffer={(offerId) => {
          setReturnToTaskId(selectedTaskId);
          setSelectedTaskId(null);
          setSelectedOfferId(offerId);
        }}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
      />

      <SpecificationModal
        isOpen={!!selectedSpecId}
        onClose={() => {
          setSelectedSpecId(null);
          if (returnToTaskId) {
            setSelectedTaskId(returnToTaskId);
            setReturnToTaskId(null);
          }
        }}
        specificationId={selectedSpecId}
        onEdit={handleEditSpecification}
        onViewOffer={(offer) => setSelectedOfferId(offer.id)}
      />

      <FilesGalleryModal
        isOpen={showFilesGallery}
        onClose={() => setShowFilesGallery(false)}
        files={projectFiles || []}
        projectName={project?.name}
        onTaskClick={(taskId) => {
          setShowFilesGallery(false);
          setSelectedTaskId(taskId);
        }}
      />

      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => {
          setShowCalculator(false);
          setEditingSpecId(null);
        }}
        projectId={projectId}
        projectName={project?.name}
        specificationId={editingSpecId}
      />

      <OfferModal
        isOpen={!!selectedOfferId}
        onClose={() => {
          setSelectedOfferId(null);
          if (returnToTaskId) {
            setSelectedTaskId(returnToTaskId);
            setReturnToTaskId(null);
          }
        }}
        offerId={selectedOfferId}
      />

      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />

      <StageChangeModal
        isOpen={!!selectedStageForChange}
        onClose={() => setSelectedStageForChange(null)}
        stage={selectedStageForChange}
        projectId={projectId}
        allStages={stages || []}
      />

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmAction.type === 'archive' ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                {confirmAction.type === 'archive' ? (
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">{confirmAction.title}</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 rounded-md border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2.5 rounded-md text-white font-medium transition-colors text-sm ${
                  confirmAction.type === 'archive'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {confirmAction.type === 'archive' ? 'Archive' : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile single-column kanban view
function MobileKanbanColumn({ tasks, statusId, projectId, onTaskClick, canToggleComplete }) {
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const columnTasks = tasks
    .filter(t => t.status === statusId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateStatus({ taskId: task.id, status: newStatus, projectId });
  };

  if (columnTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-300">
        <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-xs">No tasks in this column</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {columnTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={onTaskClick}
          isDragging={false}
          canToggleComplete={canToggleComplete}
          onToggleComplete={handleToggleComplete}
        />
      ))}
    </div>
  );
}

export default ProjectPage;
