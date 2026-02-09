import { TaskListRow } from './TaskListRow';

const SECTION_DOT_COLORS = {
  backlog: 'bg-slate-400',
  todo: 'bg-neutral-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  done: 'bg-emerald-500',
};

const SECTION_BG_COLORS = {
  backlog: 'bg-slate-50/60',
  todo: 'bg-neutral-50/60',
  in_progress: 'bg-blue-50/60',
  review: 'bg-amber-50/60',
  done: 'bg-emerald-50/60',
};

const SECTION_DROP_COLORS = {
  backlog: 'ring-1 ring-slate-300 bg-slate-50/80',
  todo: 'ring-1 ring-neutral-300 bg-neutral-50/80',
  in_progress: 'ring-1 ring-blue-300 bg-blue-50/40',
  review: 'ring-1 ring-amber-300 bg-amber-50/40',
  done: 'ring-1 ring-emerald-300 bg-emerald-50/40',
};

export function TaskListSection({
  statusId,
  label,
  tasks,
  isCollapsed,
  onToggleCollapse,
  onTaskClick,
  canDrag,
  canToggleComplete,
  canEdit,
  onToggleComplete,
  // Drag-and-drop
  draggedTask,
  dropIndicator,
  onDragStart,
  onDragOver,
  onDragOverTask,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragOver,
}) {
  const taskCount = tasks.length;

  return (
    <div className="mb-1">
      {/* Section header */}
      <button
        onClick={onToggleCollapse}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none
          ${SECTION_BG_COLORS[statusId] || 'bg-neutral-50/60'}
          hover:brightness-95
        `}
      >
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>

        {/* Dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${SECTION_DOT_COLORS[statusId] || 'bg-neutral-400'}`} />

        {/* Label */}
        <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
          {label}
        </span>

        {/* Count */}
        <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
          {taskCount}
        </span>
      </button>

      {/* Tasks list */}
      {!isCollapsed && (
        <div
          className={`
            mt-0.5 rounded-lg overflow-hidden transition-all duration-200
            ${isDragOver ? SECTION_DROP_COLORS[statusId] : ''}
          `}
          onDragOver={(e) => onDragOver?.(e, statusId)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop?.(e, statusId)}
        >
          {tasks.length > 0 ? (
            <div className="min-h-[20px]">
              {tasks.map((task, index) => (
                <div key={task.id}>
                  {/* Drop indicator before task */}
                  {dropIndicator?.statusId === statusId && dropIndicator?.index === index && (
                    <div className="h-0.5 bg-emerald-500 rounded-full mx-3 my-0.5" />
                  )}
                  <div
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => onDragStart?.(e, task) : undefined}
                    onDragOver={canDrag ? (e) => onDragOverTask?.(e, statusId, index, task) : undefined}
                    onDragEnd={canDrag ? onDragEnd : undefined}
                  >
                    <TaskListRow
                      task={task}
                      onClick={onTaskClick}
                      isDragging={canDrag && draggedTask?.id === task.id}
                      canToggleComplete={canToggleComplete}
                      canEdit={canEdit}
                      onToggleComplete={onToggleComplete}
                    />
                  </div>
                </div>
              ))}
              {/* Drop indicator at the end */}
              {dropIndicator?.statusId === statusId && dropIndicator?.index === tasks.length && (
                <div className="h-0.5 bg-emerald-500 rounded-full mx-3 my-0.5" />
              )}
            </div>
          ) : (
            /* Empty state / drop zone */
            isDragOver ? (
              <div className="flex items-center justify-center py-6 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-400 text-xs mx-1 my-1">
                Drop here
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 text-neutral-300 text-xs">
                No tasks
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default TaskListSection;
