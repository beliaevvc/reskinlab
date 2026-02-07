import { useState, useRef, useEffect } from 'react';
import { useProjectsForSelector } from '../../hooks/useProjects';
import { useAuth } from '../../contexts/AuthContext';
import useCalculatorStore from '../../stores/calculatorStore';
import { CreateProjectModal } from '../projects';

export function ProjectSelector({ onProjectChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);
  const { isAdmin, isAM } = useAuth();
  const isStaff = isAdmin || isAM;

  const { data: projects, isLoading } = useProjectsForSelector();
  const {
    currentProjectId,
    currentProjectName,
    setProject,
    resetSpecification,
  } = useCalculatorStore();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProject = (project) => {
    setProject(project.id, project.name);
    resetSpecification();
    setIsOpen(false);
    if (onProjectChange) {
      onProjectChange(project);
    }
  };

  const handleCreateSuccess = (project) => {
    setProject(project.id, project.name);
    resetSpecification();
    if (onProjectChange) {
      onProjectChange(project);
    }
  };

  const handleClearProject = (e) => {
    e.stopPropagation();
    setProject(null, null);
    resetSpecification();
    setIsOpen(false);
    if (onProjectChange) {
      onProjectChange(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded border border-neutral-200 hover:border-neutral-300 bg-white transition-colors text-sm"
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
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className={currentProjectId ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
          {currentProjectName || 'Select Project'}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded shadow-lg border border-neutral-200 py-1 z-50">
          {/* New Project Option */}
          <button
            onClick={() => {
              setIsOpen(false);
              setShowCreateModal(true);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
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
            New Project
          </button>

          <div className="border-t border-neutral-100 my-1" />

          {/* Clear selection */}
          {currentProjectId && (
            <>
              <button
                onClick={handleClearProject}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50 transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Selection
              </button>
              <div className="border-t border-neutral-100 my-1" />
            </>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-neutral-500">
              Loading projects...
            </div>
          )}

          {/* Projects List */}
          {!isLoading && projects?.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">
              No projects yet
            </div>
          )}

          {!isLoading && projects?.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                    project.id === currentProjectId
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate flex-1">{project.name}</span>
                  {project.id === currentProjectId && (
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        isStaff={isStaff}
      />
    </div>
  );
}

export default ProjectSelector;
