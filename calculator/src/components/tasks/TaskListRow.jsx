import { useState } from 'react';
import { formatDate } from '../../lib/utils';
import { useTaskChecklist, useUpdateChecklistItem } from '../../hooks/useTaskChecklist';

export function TaskListRow({ task, onClick, isDragging, canToggleComplete = false, onToggleComplete, canEdit = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';
  const hasPendingApproval = task.pending_approval || task.needs_approval;
  const hasChecklist = task.checklist_total > 0;

  // Lazy-load checklist items only when expanded
  const { data: checklistItems = [], isLoading: checklistLoading } = useTaskChecklist(isExpanded ? task.id : null);
  const updateChecklistItem = useUpdateChecklistItem();

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(task);
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleChecklistItemToggle = async (e, item) => {
    e.stopPropagation();
    await updateChecklistItem.mutateAsync({
      itemId: item.id,
      updates: { completed: !item.completed },
    });
  };

  // Assignee initials fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`
      border-b border-neutral-100 transition-all duration-150
      ${isDragging ? 'shadow-lg bg-white rounded-lg border border-emerald-300 scale-[1.01] opacity-90 z-10' : ''}
    `}>
      {/* Main row */}
      <div
        onClick={() => onClick?.(task)}
        className={`
          group flex items-center gap-3 px-3 py-2.5 cursor-pointer relative
          ${isDone ? 'opacity-50' : 'hover:bg-neutral-50'}
          ${hasPendingApproval ? 'bg-blue-50/30' : ''}
        `}
      >
        {/* Approval indicator */}
        {hasPendingApproval && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />
        )}

        {/* Checkbox */}
        <button
          onClick={canToggleComplete ? handleToggleComplete : undefined}
          disabled={!canToggleComplete}
          className={`shrink-0 w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
            isDone
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-neutral-300 group-hover:border-emerald-400'
          } ${canToggleComplete ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <svg
            className={`w-2.5 h-2.5 ${isDone ? 'text-white' : 'text-transparent'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* Title + checklist count */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-[13px] font-medium leading-snug truncate ${
            isDone ? 'text-neutral-400 line-through' : 'text-neutral-800'
          }`}>
            {task.title}
          </span>

          {/* Checklist count badge near title */}
          {hasChecklist && (
            <button
              onClick={handleExpandToggle}
              className={`
                shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors
                ${task.checklist_completed === task.checklist_total
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }
              `}
              title={isExpanded ? 'Скрыть чеклист' : 'Показать чеклист'}
            >
              {/* Chevron */}
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="tabular-nums">{task.checklist_completed}/{task.checklist_total}</span>
            </button>
          )}
        </div>

        {/* Badges row — right side */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Spec badge */}
          {task.source_specification && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {task.source_specification.number || `v${task.source_specification.version_number}`}
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span className={`
              inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
              ${isOverdue
                ? 'bg-red-50 text-red-600'
                : isDone
                  ? 'text-neutral-400'
                  : 'bg-neutral-50 text-neutral-500'
              }
            `}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(task.due_date)}
            </span>
          )}

          {/* Assignee avatar */}
          {task.assignee && (
            <div
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold overflow-hidden"
              title={task.assignee.full_name}
            >
              {task.assignee.avatar_url ? (
                <img
                  src={task.assignee.avatar_url}
                  alt={task.assignee.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200 text-neutral-600 flex items-center justify-center">
                  {getInitials(task.assignee.full_name)}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          {task.comments_count > 0 && (
            <div
              className={`flex items-center gap-0.5 text-[10px] shrink-0 ${
                task.unread_comments_count > 0
                  ? 'text-emerald-600 font-medium'
                  : 'text-neutral-400'
              }`}
              title={task.unread_comments_count > 0
                ? `${task.unread_comments_count} unread`
                : `${task.comments_count} comments`
              }
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{task.unread_comments_count > 0 ? task.unread_comments_count : task.comments_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded checklist */}
      {isExpanded && hasChecklist && (
        <div className="pl-10 pr-3 pb-2.5 bg-neutral-50/50">
          {checklistLoading ? (
            <div className="flex items-center gap-2 py-2 text-neutral-400 text-xs">
              <div className="animate-spin rounded-full h-3 w-3 border border-neutral-300 border-t-emerald-500" />
              Loading...
            </div>
          ) : (
            <div className="space-y-0.5">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-1 group/item"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Checklist item checkbox */}
                  <button
                    onClick={(e) => canEdit && handleChecklistItemToggle(e, item)}
                    disabled={!canEdit}
                    className={`shrink-0 w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-all ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-neutral-300 group-hover/item:border-emerald-400'
                    } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {item.completed && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-xs leading-snug ${
                    item.completed ? 'text-neutral-400 line-through' : 'text-neutral-600'
                  }`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskListRow;
