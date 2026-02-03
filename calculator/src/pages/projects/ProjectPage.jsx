import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViewAsRole } from '../../contexts/ViewAsRoleContext';
import { useProject, useUpdateProject, useCompleteProject, useArchiveProject } from '../../hooks/useProjects';
import { useStages, useCreateStages } from '../../hooks/useStages';
import { useTasks } from '../../hooks/useTasks';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useProjectFiles } from '../../hooks/useFiles';
import { ProjectHeader, ProjectSidebar, ProjectStages, SpecificationModal, OfferModal, InvoiceModal, FilesGalleryModal, CalculatorModal } from '../../components/project';
import { StageChangeModal } from '../../components/project/StageChangeModal';
import { KanbanBoard, TaskDetailModal, CreateTaskModal } from '../../components/tasks';

// Local storage key for sidebar state
const SIDEBAR_COLLAPSED_KEY = 'project-sidebar-collapsed';

export function ProjectPage() {
  const { id: projectId } = useParams();
  const { isStaff: realIsStaff, isAdmin: realIsAdmin } = useAuth();
  const { effectiveIsStaff, effectiveIsAdmin } = useViewAsRole();
  
  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showFilesGallery, setShowFilesGallery] = useState(false);
  const [selectedSpecId, setSelectedSpecId] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedStageForChange, setSelectedStageForChange] = useState(null);

  // Data fetching
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: stages, isLoading: stagesLoading } = useStages(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: pendingApprovals } = usePendingApprovals(projectId);
  const { data: projectFiles } = useProjectFiles(projectId);
  const { mutate: createStages, isPending: isCreatingStages } = useCreateStages();
  const { mutate: completeProject, isPending: isCompleting } = useCompleteProject();
  const { mutate: archiveProject, isPending: isArchiving } = useArchiveProject();

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Calculate stats
  const taskStats = {
    total: tasks?.length || 0,
    done: tasks?.filter(t => t.status === 'done').length || 0,
  };

  // Handlers
  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNewSpecification = () => {
    setEditingSpecId(null);
    setShowCalculator(true);
  };

  const handleEditSpecification = (specId) => {
    setEditingSpecId(specId);
    setShowCalculator(true);
  };

  const handleSpecClick = (spec) => {
    // Open specification in modal
    setSelectedSpecId(spec.id);
  };

  const handleOfferClick = (offer) => {
    setSelectedOfferId(offer.id);
  };

  const handleInvoiceClick = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
  };

  const handleInitializeStages = () => {
    createStages(projectId);
  };

  const handleStageClick = (stage) => {
    // Открываем модальное окно подтверждения смены этапа
    setSelectedStageForChange(stage);
  };

  const handleCompleteProject = () => {
    if (confirm('Вы уверены, что хотите завершить этот проект? Проект будет помечен как завершенный.')) {
      completeProject(projectId);
    }
  };

  const handleArchiveProject = () => {
    if (confirm('Вы уверены, что хотите архивировать этот проект? Проект будет перемещен в архив.')) {
      archiveProject(projectId);
    }
  };

  // Loading state
  if (projectLoading || stagesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (projectError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <p className="text-red-800">Failed to load project: {projectError.message}</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="p-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
          <p className="text-neutral-600">Project not found</p>
        </div>
      </div>
    );
  }

  const hasStages = stages && stages.length > 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-neutral-100">
      {/* Header */}
      <ProjectHeader
        project={project}
        taskStats={taskStats}
        pendingApprovals={pendingApprovals?.length || 0}
        onOpenFilesGallery={() => setShowFilesGallery(true)}
        onCompleteProject={handleCompleteProject}
        onArchiveProject={handleArchiveProject}
        canCompleteOrArchive={effectiveIsStaff}
        isCompleting={isCompleting}
        isArchiving={isArchiving}
      />

      {/* Stages Progress Bar */}
      {hasStages && (
        <ProjectStages
          stages={stages}
          onStageClick={handleStageClick}
          canChangeStage={effectiveIsStaff}
        />
      )}

      {/* Initialize stages prompt */}
      {!hasStages && effectiveIsStaff && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            No stages defined. Initialize default project stages to track progress.
          </span>
          <button
            onClick={handleInitializeStages}
            disabled={isCreatingStages}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded font-medium disabled:opacity-50"
          >
            {isCreatingStages ? 'Creating...' : 'Initialize Stages'}
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
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

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Kanban header */}
          <div className="px-6 py-3 bg-white border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Task Board</h2>
            {effectiveIsStaff && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>

          {/* Kanban board */}
          <div className="flex-1 overflow-auto p-6">
            <KanbanBoard
              tasks={tasks || []}
              projectId={projectId}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
              onCreateTask={effectiveIsStaff ? () => setShowCreateTask(true) : undefined}
              canDrag={effectiveIsStaff}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskDetailModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        projectId={projectId}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
      />

      {/* Specification Modal */}
      <SpecificationModal
        isOpen={!!selectedSpecId}
        onClose={() => setSelectedSpecId(null)}
        specificationId={selectedSpecId}
        onEdit={handleEditSpecification}
        onViewOffer={(offer) => setSelectedOfferId(offer.id)}
      />

      {/* Files Gallery Modal */}
      <FilesGalleryModal
        isOpen={showFilesGallery}
        onClose={() => setShowFilesGallery(false)}
        files={projectFiles || []}
        projectName={project?.name}
      />

      {/* Calculator Modal */}
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

      {/* Offer Modal */}
      <OfferModal
        isOpen={!!selectedOfferId}
        onClose={() => setSelectedOfferId(null)}
        offerId={selectedOfferId}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />

      {/* Stage Change Confirmation Modal */}
      <StageChangeModal
        isOpen={!!selectedStageForChange}
        onClose={() => setSelectedStageForChange(null)}
        stage={selectedStageForChange}
        projectId={projectId}
        allStages={stages || []}
      />
    </div>
  );
}

export default ProjectPage;
