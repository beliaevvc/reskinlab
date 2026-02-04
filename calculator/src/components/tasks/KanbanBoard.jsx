import { useState, useRef, useCallback, useEffect } from 'react';
import { TASK_STATUSES, useUpdateTaskStatus, useReorderTask } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';

const SCROLL_THRESHOLD = 80; // px from edge to start scrolling
const SCROLL_SPEED = 10; // px per frame

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
      // Near top - scroll up
      scrollDirectionRef.current = -1;
    } else if (mouseY > rect.bottom - SCROLL_THRESHOLD && 
               container.scrollTop < container.scrollHeight - container.clientHeight) {
      // Near bottom - scroll down
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
    updateStatus({
      taskId: task.id,
      status: newStatus,
      projectId,
    });
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
    
    // Create ghost with fixed dimensions from original element
    const ghost = e.target.cloneNode(true);
    const rect = e.target.getBoundingClientRect();
    
    // Fix ghost dimensions and position off-screen
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
    // Only clear if leaving the column entirely
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
      // Calculate new order based on drop position
      const insertIndex = dropIndicator.index;
      
      // Filter out the dragged task to get accurate positions
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
      
      reorderTask({
        taskId: draggedTask.id,
        status: newStatus,
        newOrder,
        projectId,
      });
    } else if (draggedTask.status !== newStatus) {
      // Moving to a different column without specific position
      const maxOrder = columnTasks.length > 0 
        ? Math.max(...columnTasks.map(t => t.order || 0)) 
        : 0;
      
      reorderTask({
        taskId: draggedTask.id,
        status: newStatus,
        newOrder: maxOrder + 1000,
        projectId,
      });
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
            flex-shrink-0 w-72 bg-neutral-50 rounded border-t-4 relative
            ${getColumnColor(status.id)}
          `}
          onDragOver={(e) => handleDragOver(e, status.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status.id)}
        >
          {/* Drag overlay border */}
          {dragOverColumn === status.id && (
            <div className="absolute inset-0 border-2 border-emerald-500 rounded pointer-events-none z-10" />
          )}
          
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
          <div 
            ref={(el) => columnRefs.current[status.id] = el}
            className="p-2 min-h-[200px] max-h-[60vh] overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              checkAutoScroll(e, status.id);
            }}
          >
            {tasksByStatus[status.id].map((task, index) => (
              <div key={task.id}>
                {/* Drop indicator before task */}
                {dropIndicator.statusId === status.id && dropIndicator.index === index && (
                  <div className="h-1 bg-emerald-500 rounded-full mx-1 mb-2" />
                )}
                <div
                  className="mb-2"
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
              <div className="h-1 bg-emerald-500 rounded-full mx-1 mb-2" />
            )}

            {/* Empty state */}
            {tasksByStatus[status.id].length === 0 && !dragOverColumn && (
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
