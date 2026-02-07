import { useState, useRef, useCallback, useEffect } from 'react';
import { TASK_STATUSES, useUpdateTaskStatus, useReorderTask } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';

const SCROLL_THRESHOLD = 80;
const SCROLL_SPEED = 10;

const COLUMN_DOT_COLORS = {
  backlog: 'bg-slate-400',
  todo: 'bg-neutral-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  done: 'bg-emerald-500',
};

const COLUMN_DROP_COLORS = {
  backlog: 'border-slate-300 bg-slate-50/50',
  todo: 'border-neutral-300 bg-neutral-50/50',
  in_progress: 'border-blue-300 bg-blue-50/30',
  review: 'border-amber-300 bg-amber-50/30',
  done: 'border-emerald-300 bg-emerald-50/30',
};

export function KanbanBoard({ tasks, projectId, onTaskClick, onCreateTask, canDrag = true, canToggleComplete = false }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dropIndicator, setDropIndicator] = useState({ statusId: null, index: null });
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const { mutate: reorderTask } = useReorderTask();
  const columnRefs = useRef({});
  const scrollAnimationRef = useRef(null);
  const scrollDirectionRef = useRef(0);
  const scrollContainerRef = useRef(null);

  // Auto-scroll animation loop
  useEffect(() => {
    const animate = () => {
      if (scrollContainerRef.current && scrollDirectionRef.current !== 0) {
        scrollContainerRef.current.scrollTop += scrollDirectionRef.current * SCROLL_SPEED;
      }
      scrollAnimationRef.current = requestAnimationFrame(animate);
    };
    scrollAnimationRef.current = requestAnimationFrame(animate);
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  const checkAutoScroll = useCallback((e, statusId) => {
    const container = columnRefs.current[statusId];
    if (!container) {
      scrollDirectionRef.current = 0;
      scrollContainerRef.current = null;
      return;
    }
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY;
    scrollContainerRef.current = container;
    if (mouseY < rect.top + SCROLL_THRESHOLD && container.scrollTop > 0) {
      scrollDirectionRef.current = -1;
    } else if (mouseY > rect.bottom - SCROLL_THRESHOLD && 
               container.scrollTop < container.scrollHeight - container.clientHeight) {
      scrollDirectionRef.current = 1;
    } else {
      scrollDirectionRef.current = 0;
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    scrollDirectionRef.current = 0;
    scrollContainerRef.current = null;
  }, []);

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateStatus({ taskId: task.id, status: newStatus, projectId });
  };

  // Group tasks by status and sort by order
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.id] = (tasks?.filter((t) => t.status === status.id) || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = e.target.cloneNode(true);
    const rect = e.target.getBoundingClientRect();
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.position = 'fixed';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.opacity = '0.8';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(statusId);
    checkAutoScroll(e, statusId);
  };

  const handleDragOverTask = (e, statusId, taskIndex, task) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTask || draggedTask.id === task.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midY ? taskIndex : taskIndex + 1;
    setDropIndicator({ statusId, index: insertIndex });
    setDragOverColumn(statusId);
    checkAutoScroll(e, statusId);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
      setDropIndicator({ statusId: null, index: null });
      stopAutoScroll();
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask) {
      setDropIndicator({ statusId: null, index: null });
      return;
    }
    const columnTasks = tasksByStatus[newStatus];
    let newOrder;
    if (dropIndicator.statusId === newStatus && dropIndicator.index !== null) {
      const insertIndex = dropIndicator.index;
      const otherTasks = columnTasks.filter(t => t.id !== draggedTask.id);
      if (otherTasks.length === 0) {
        newOrder = 1000;
      } else if (insertIndex === 0) {
        newOrder = (otherTasks[0]?.order || 1000) - 1000;
      } else if (insertIndex >= otherTasks.length) {
        newOrder = (otherTasks[otherTasks.length - 1]?.order || 0) + 1000;
      } else {
        const prevOrder = otherTasks[insertIndex - 1]?.order || 0;
        const nextOrder = otherTasks[insertIndex]?.order || prevOrder + 2000;
        newOrder = Math.floor((prevOrder + nextOrder) / 2);
      }
      reorderTask({ taskId: draggedTask.id, status: newStatus, newOrder, projectId });
    } else if (draggedTask.status !== newStatus) {
      const maxOrder = columnTasks.length > 0 
        ? Math.max(...columnTasks.map(t => t.order || 0)) : 0;
      reorderTask({ taskId: draggedTask.id, status: newStatus, newOrder: maxOrder + 1000, projectId });
    }
    setDraggedTask(null);
    setDropIndicator({ statusId: null, index: null });
    stopAutoScroll();
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
    setDropIndicator({ statusId: null, index: null });
    stopAutoScroll();
  };

  return (
    <div className="flex h-full overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {TASK_STATUSES.map((status, colIndex) => {
        const isDragOver = dragOverColumn === status.id;
        const taskCount = tasksByStatus[status.id].length;

        return (
          <div
            key={status.id}
            className={`
              flex-shrink-0 w-64 lg:w-72 flex flex-col relative
              ${colIndex < TASK_STATUSES.length - 1 ? 'border-r border-neutral-100' : ''}
            `}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${COLUMN_DOT_COLORS[status.id] || 'bg-neutral-400'}`} />
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {status.label}
                </h3>
              </div>
              <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                {taskCount}
              </span>
            </div>

            {/* Tasks area */}
            <div 
              ref={(el) => columnRefs.current[status.id] = el}
              className={`
                flex-1 px-2 pb-3 overflow-y-auto transition-colors duration-200
                ${isDragOver ? COLUMN_DROP_COLORS[status.id] : ''}
              `}
              onDragOver={(e) => {
                e.preventDefault();
                checkAutoScroll(e, status.id);
              }}
            >
              <div className="space-y-2 min-h-[120px]">
                {tasksByStatus[status.id].map((task, index) => (
                  <div key={task.id}>
                    {/* Drop indicator before task */}
                    {dropIndicator.statusId === status.id && dropIndicator.index === index && (
                      <div className="h-0.5 bg-emerald-500 rounded-full mx-1 mb-2" />
                    )}
                    <div
                      draggable={canDrag}
                      onDragStart={canDrag ? (e) => handleDragStart(e, task) : undefined}
                      onDragOver={canDrag ? (e) => handleDragOverTask(e, status.id, index, task) : undefined}
                      onDragEnd={canDrag ? handleDragEnd : undefined}
                    >
                      <TaskCard
                        task={task}
                        onClick={onTaskClick}
                        isDragging={canDrag && draggedTask?.id === task.id}
                        canToggleComplete={canToggleComplete}
                        onToggleComplete={handleToggleComplete}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Drop indicator at the end */}
                {dropIndicator.statusId === status.id && dropIndicator.index === tasksByStatus[status.id].length && (
                  <div className="h-0.5 bg-emerald-500 rounded-full mx-1" />
                )}

                {/* Empty state */}
                {taskCount === 0 && !isDragOver && (
                  <div className="flex flex-col items-center justify-center py-10 text-neutral-300">
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-xs">No tasks</span>
                  </div>
                )}

                {/* Drop zone for empty column during drag */}
                {taskCount === 0 && isDragOver && (
                  <div className="flex items-center justify-center py-10 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-400 text-xs">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
