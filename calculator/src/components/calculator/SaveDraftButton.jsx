import { useState } from 'react';
import useCalculatorStore from '../../stores/calculatorStore';
import { CreateProjectModal } from '../projects';

export function SaveDraftButton({
  onSave,
  isSaving = false,
  disabled = false,
  belowMinimum = false,
  minimumAmount = 0,
  variant = 'primary', // 'primary' | 'secondary'
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProjectId, setProject, resetSpecification } = useCalculatorStore();

  const handleClick = () => {
    if (!currentProjectId) {
      // No project - show create modal
      setShowCreateModal(true);
    } else {
      // Has project - trigger save
      if (onSave) {
        onSave();
      }
    }
  };

  const handleProjectCreated = (project) => {
    setProject(project.id, project.name);
    resetSpecification();
    // Trigger save after project is created
    setTimeout(() => {
      if (onSave) {
        onSave();
      }
    }, 100);
  };

  const isPrimary = variant === 'primary';

  return (
    <>
      <div className="relative group">
        <button
          onClick={handleClick}
          disabled={disabled || isSaving}
          className={`
            flex items-center justify-center gap-2 px-4 py-2.5 rounded font-medium transition-colors
            ${
              isPrimary
                ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white'
                : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50'
            }
            disabled:cursor-not-allowed
          `}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Saving...</span>
            </>
          ) : currentProjectId ? (
            <>
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
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <span>Save Draft</span>
            </>
          ) : (
            <>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Project</span>
            </>
          )}
        </button>

        {/* Tooltip when blocked by minimum order */}
        {belowMinimum && !isSaving && (
          <div className="absolute right-0 top-full mt-2 w-56 px-3 py-2 bg-neutral-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
            Minimum order ${minimumAmount.toLocaleString()} for first order in project
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />
    </>
  );
}

export default SaveDraftButton;
