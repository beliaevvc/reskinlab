import { formatDate } from '../../lib/utils';
import { getTaskStatusInfo } from '../../hooks/useTasks';
import { ALL_ITEMS } from '../../data/categories';

export function TaskCard({ task, onClick, isDragging }) {
  const statusInfo = getTaskStatusInfo(task.status);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  
  // Check for pending approval
  const hasPendingApproval = task.pending_approval || task.needs_approval;
  // Count attachments
  const attachmentsCount = task.assets_count || task.attachments?.length || 0;

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`
        bg-white rounded border p-3 cursor-pointer transition-all relative
        ${isDragging
          ? 'shadow-lg border-emerald-300 rotate-2'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'}
        ${hasPendingApproval ? 'ring-2 ring-blue-200' : ''}
      `}
    >
      {/* Approval badge */}
      {hasPendingApproval && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}

      {/* Title */}
      <h4 className="font-medium text-neutral-900 text-sm line-clamp-2">
        {task.title}
      </h4>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        
        {/* Stage badge */}
        {task.stage && (
          <span className="px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600">
            {task.stage.name}
          </span>
        )}

        {/* Due date */}
        {task.due_date && (
          <span
            className={`text-xs ${
              isOverdue ? 'text-red-600 font-medium' : 'text-neutral-500'
            }`}
          >
            {isOverdue && '⚠ '}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Checklist progress */}
      {task.checklist_total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>{task.checklist_completed}/{task.checklist_total}</span>
            </div>
            {task.checklist_completed === task.checklist_total && (
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all bg-emerald-500"
              style={{ width: `${(task.checklist_completed / task.checklist_total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer - показываем только если есть контент */}
      {(task.assignee || attachmentsCount > 0 || task.comments_count > 0) && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-700">
                {task.assignee.full_name?.charAt(0) || '?'}
              </div>
              <span className="text-xs text-neutral-500 truncate max-w-[80px]">
                {task.assignee.full_name}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Indicators */}
          <div className="flex items-center gap-2">
            {/* Attachments indicator */}
            {attachmentsCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-neutral-400" title={`${attachmentsCount} file(s)`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {attachmentsCount}
              </div>
            )}

            {/* Comments indicator */}
            {task.comments_count > 0 && (
              <div 
                className={`flex items-center gap-1 text-xs ${
                  task.unread_comments_count > 0 
                    ? 'text-emerald-600 font-medium' 
                    : 'text-neutral-400'
                }`}
                title={task.unread_comments_count > 0 
                  ? `${task.unread_comments_count} unread of ${task.comments_count} comments`
                  : `${task.comments_count} comments`
                }
              >
                <svg 
                  className={`w-3.5 h-3.5 ${task.unread_comments_count > 0 ? 'fill-emerald-100' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {task.unread_comments_count > 0 ? (
                  <span>{task.unread_comments_count}/{task.comments_count}</span>
                ) : (
                  <span>{task.comments_count}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskCard;
