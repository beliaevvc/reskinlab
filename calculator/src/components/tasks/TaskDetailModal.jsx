import { useState, useEffect } from 'react';
import { useTask, useUpdateTask, useDeleteTask, useMarkCommentsAsRead, TASK_STATUSES } from '../../hooks/useTasks';
import { CommentThread } from '../comments';
import { TaskChecklist } from './TaskChecklist';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_ITEMS } from '../../data/categories';

export function TaskDetailModal({ isOpen, onClose, taskId, projectId }) {
  const { data: task, isLoading } = useTask(taskId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: markCommentsAsRead } = useMarkCommentsAsRead();
  const { isClient, isAdmin, isAM } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Mark comments as read when task is loaded
  useEffect(() => {
    if (isOpen && taskId && projectId && task) {
      markCommentsAsRead({ taskId, projectId });
    }
  }, [isOpen, taskId, projectId, task, markCommentsAsRead]);

  if (!isOpen) return null;

  const handleStartEdit = () => {
    setEditTitle(task?.title || '');
    setEditDescription(task?.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateTask(
      {
        taskId: task.id,
        updates: {
          title: editTitle,
          description: editDescription,
        },
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleStatusChange = (newStatus) => {
    updateTask({
      taskId: task.id,
      updates: {
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      },
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(
        { taskId: task.id, projectId },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : task ? (
            <div className="space-y-6">
              {/* Title & Description */}
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-medium"
                    placeholder="Task title"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isUpdating || !editTitle.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium disabled:opacity-50"
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-neutral-900">
                      {task.title}
                    </h3>
                    {!isClient && (
                      <button
                        onClick={handleStartEdit}
                        className="p-2 hover:bg-neutral-100 rounded transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-2 text-neutral-600 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                  
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-6 text-sm text-neutral-500">
                <span>Created {formatDate(task.created_at)}</span>
                {task.completed_at && (
                  <span className="text-emerald-600">
                    Completed {formatDate(task.completed_at)}
                  </span>
                )}
              </div>

              {/* Checklist - просмотр для всех, редактирование только для админа и AM */}
              <div className="border-t border-neutral-200 pt-6">
                <TaskChecklist taskId={task.id} canEdit={isAdmin || isAM} />
              </div>

              {/* Comments */}
              <div className="border-t border-neutral-200 pt-6">
                <h4 className="text-sm font-medium text-neutral-900 mb-4">
                  Comments
                </h4>
                <CommentThread entityType="task" entityId={task.id} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              Task not found
            </div>
          )}
        </div>

        {/* Footer */}
        {task && (
          <div className="px-6 py-4 border-t border-neutral-200 flex justify-between">
            {!isClient && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            )}
            {isClient && <div />}
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailModal;
