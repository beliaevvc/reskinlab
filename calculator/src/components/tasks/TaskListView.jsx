import { useState, useRef, useCallback, useEffect } from 'react';
import { TASK_STATUSES, useUpdateTaskStatus, useReorderTask } from '../../hooks/useTasks';
import { TaskListSection } from './TaskListSection';

const SCROLL_THRESHOLD = 80;
const SCROLL_SPEED = 10;
const COLLAPSED_SECTIONS_KEY = 'task-list-collapsed-sections';

export function TaskListView({ tasks, projectId, onTaskClick, canDrag = true, canToggleComplete = false, canEdit = false }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dropIndicator, setDropIndicator] = useState({ statusId: null, index: null });
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { mutate: updateStatus } = useUpdateTaskStatus();
  const { mutate: reorderTask } = useReorderTask();
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const scrollDirectionRef = useRef(0);

  // Persist collapsed sections
  useEffect(() => {
    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(collapsedSections));
  }, [collapsedSections]);

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

  const checkAutoScroll = useCallback((e) => {
    const container = scrollContainerRef.current;
    if (!container) {
      scrollDirectionRef.current = 0;
      return;
    }
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY;
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
  }, []);

  // Group tasks by status
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.id] = (tasks?.filter((t) => t.status === status.id) || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  const handleToggleCollapse = (statusId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [statusId]: !prev[statusId],
    }));
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateStatus({ taskId: task.id, status: newStatus, projectId });
  };

  // --- Drag-and-drop handlers ---

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Create ghost element with fixed dimensions and proper styling
    const ghost = e.target.cloneNode(true);
    const rect = e.target.getBoundingClientRect();
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.position = 'fixed';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.opacity = '0.85';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.background = '#fff';
    ghost.style.borderRadius = '8px';
    ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    ghost.style.overflow = 'hidden';
    document.body.appendChild(ghost);
    // Use mouse position relative to the element so it doesn't jump
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(statusId);
    checkAutoScroll(e);
  };

  const handleDragOverTask = (e, statusId, taskIndex, task) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTask || draggedTask.id === task.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midY ? taskIndex : taskIndex + 1;
    setDropIndicator({ statusId, index: insertIndex });
    setDragOverSection(statusId);
    checkAutoScroll(e);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSection(null);
      setDropIndicator({ statusId: null, index: null });
      stopAutoScroll();
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverSection(null);
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
    setDragOverSection(null);
    setDropIndicator({ statusId: null, index: null });
    stopAutoScroll();
  };

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto px-2 py-2 space-y-1">
      {TASK_STATUSES.map((status) => (
        <TaskListSection
          key={status.id}
          statusId={status.id}
          label={status.label}
          tasks={tasksByStatus[status.id]}
          isCollapsed={!!collapsedSections[status.id]}
          onToggleCollapse={() => handleToggleCollapse(status.id)}
          onTaskClick={onTaskClick}
          canDrag={canDrag}
          canToggleComplete={canToggleComplete}
          canEdit={canEdit}
          onToggleComplete={handleToggleComplete}
          // Drag-and-drop
          draggedTask={draggedTask}
          dropIndicator={dropIndicator}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragOverTask={handleDragOverTask}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragOver={dragOverSection === status.id}
        />
      ))}
    </div>
  );
}

export default TaskListView;
