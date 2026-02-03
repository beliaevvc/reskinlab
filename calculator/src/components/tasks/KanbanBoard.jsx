import { useState } from 'react';
import { TASK_STATUSES, useUpdateTaskStatus } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';

export function KanbanBoard({ tasks, projectId, onTaskClick, onCreateTask, canDrag = true }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const { mutate: updateStatus } = useUpdateTaskStatus();

  // Group tasks by status
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.id] = tasks?.filter((t) => t.status === status.id) || [];
    return acc;
  }, {});

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Add drag image
    const ghost = e.target.cloneNode(true);
    ghost.style.opacity = '0.5';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(statusId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== newStatus) {
      updateStatus({
        taskId: draggedTask.id,
        status: newStatus,
        projectId,
      });
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getColumnColor = (statusId) => {
    switch (statusId) {
      case 'backlog':
        return 'border-t-slate-400';
      case 'todo':
        return 'border-t-neutral-500';
      case 'in_progress':
        return 'border-t-blue-500';
      case 'review':
        return 'border-t-amber-500';
      case 'done':
        return 'border-t-emerald-500';
      default:
        return 'border-t-neutral-400';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_STATUSES.map((status) => (
        <div
          key={status.id}
          className={`
            flex-shrink-0 w-72 bg-neutral-50 rounded border-t-4
            ${getColumnColor(status.id)}
            ${dragOverColumn === status.id ? 'ring-2 ring-emerald-500 ring-inset' : ''}
          `}
          onDragOver={(e) => handleDragOver(e, status.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status.id)}
        >
          {/* Column header */}
          <div className="p-3 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-neutral-900">
                {status.label}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-600">
                {tasksByStatus[status.id].length}
              </span>
            </div>
          </div>

          {/* Tasks */}
          <div className="p-2 space-y-2 min-h-[200px]">
            {tasksByStatus[status.id].map((task) => (
              <div
                key={task.id}
                draggable={canDrag}
                onDragStart={canDrag ? (e) => handleDragStart(e, task) : undefined}
                onDragEnd={canDrag ? handleDragEnd : undefined}
              >
                <TaskCard
                  task={task}
                  onClick={onTaskClick}
                  isDragging={canDrag && draggedTask?.id === task.id}
                />
              </div>
            ))}

            {/* Empty state */}
            {tasksByStatus[status.id].length === 0 && (
              <div className="text-center py-8 text-neutral-400 text-sm">
                No tasks
              </div>
            )}
          </div>

          {/* Add task button (for backlog column and if onCreateTask provided) */}
          {status.id === 'backlog' && onCreateTask && (
            <div className="p-2 border-t border-neutral-200">
              <button
                onClick={onCreateTask}
                className="w-full py-2 px-3 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
