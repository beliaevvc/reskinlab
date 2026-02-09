import { useTranslation } from 'react-i18next';
import { formatDate } from '../../lib/utils';

export function TaskCard({ task, onClick, isDragging, canToggleComplete = false, onToggleComplete }) {
  const { t, i18n } = useTranslation('tasks');
  const currentLang = i18n.language;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';
  
  const hasPendingApproval = task.pending_approval || task.needs_approval;

  // Get localized title
  const getLocalizedTitle = () => {
    if (currentLang === 'ru') {
      return task.title_ru || task.title || '';
    }
    return task.title_en || task.title || '';
  };

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(task);
    }
  };

  const checklistProgress = task.checklist_total > 0
    ? Math.round((task.checklist_completed / task.checklist_total) * 100)
    : 0;

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`
        group rounded-lg border p-3 cursor-pointer transition-all duration-200 relative
        ${isDone 
          ? 'bg-white/60 border-neutral-150 opacity-60' 
          : 'bg-white border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300'
        }
        ${isDragging
          ? 'shadow-xl border-emerald-300 rotate-1 scale-[1.02] opacity-90'
          : ''
        }
        ${hasPendingApproval ? 'ring-1 ring-blue-200' : ''}
      `}
    >
      {/* Approval indicator */}
      {hasPendingApproval && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}

      {/* Title row: checkbox + title + due date */}
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={canToggleComplete ? handleToggleComplete : undefined}
          disabled={!canToggleComplete}
          className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
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
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-[13px] leading-snug line-clamp-2 ${
            isDone ? 'text-neutral-400 line-through' : 'text-neutral-800'
          }`}>
            {getLocalizedTitle()}
          </h4>
        </div>
      </div>

      {/* Spec badge + Due date */}
      {(task.source_specification || task.due_date) && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {/* Spec badge */}
          {task.source_specification && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600">
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
        </div>
      )}

      {/* Bottom row: checklist + comments */}
      {(task.checklist_total > 0 || task.comments_count > 0) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {/* Checklist progress */}
          {task.checklist_total > 0 ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    checklistProgress === 100 ? 'bg-emerald-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400 tabular-nums flex-shrink-0">
                {task.checklist_completed}/{task.checklist_total}
              </span>
            </div>
          ) : <div />}

          {/* Comments */}
          {task.comments_count > 0 && (
            <div 
              className={`flex items-center gap-0.5 text-[10px] flex-shrink-0 ${
                task.unread_comments_count > 0 
                  ? 'text-emerald-600 font-medium' 
                  : 'text-neutral-400'
              }`}
              title={task.unread_comments_count > 0 
                ? t('card.commentsCount', { count: task.unread_comments_count })
                : t('card.commentsCount', { count: task.comments_count })
              }
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {task.unread_comments_count > 0 ? (
                <span>{task.unread_comments_count}</span>
              ) : (
                <span>{task.comments_count}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
