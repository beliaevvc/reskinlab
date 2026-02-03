import { useState, useEffect, useRef } from 'react';
import { useTask, useUpdateTask, useDeleteTask, useMarkCommentsAsRead, TASK_STATUSES } from '../../hooks/useTasks';
import { CommentThread, CommentInput } from '../comments';
import { TaskChecklist } from './TaskChecklist';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export function TaskDetailModal({ isOpen, onClose, taskId, projectId }) {
  const { data: task, isLoading } = useTask(taskId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: markCommentsAsRead } = useMarkCommentsAsRead();
  const { isClient, isAdmin, isAM } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  const commentsTopRef = useRef(null);

  // Mark comments as read when task is loaded
  useEffect(() => {
    if (isOpen && taskId && projectId && task) {
      markCommentsAsRead({ taskId, projectId });
    }
  }, [isOpen, taskId, projectId, task, markCommentsAsRead]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReplyingTo(null);
      setIsEditing(false);
    }
  }, [isOpen]);

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

  const handleReply = (comment) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToTop = () => {
    setTimeout(() => {
      commentsTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900">
            Task Details
          </h2>
          <div className="flex items-center gap-1">
            {/* Delete button for staff */}
            {!isClient && task && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Task"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : task ? (
            <div className="flex flex-col">
              {/* Task Info Section */}
              <div className="p-6 space-y-6 border-b border-neutral-100">
                {/* Title & Description */}
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-medium"
                      placeholder="Task title"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      placeholder="Description (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isUpdating || !editTitle.trim()}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg"
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
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
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
                    className="w-full max-w-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

                {/* Checklist */}
                <div className="pt-4 border-t border-neutral-100">
                  <TaskChecklist taskId={task.id} canEdit={isAdmin || isAM} />
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-6 bg-neutral-50/50">
                <h4 className="text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </h4>
                <div ref={commentsTopRef} />
                <CommentThread 
                  entityType="task" 
                  entityId={task.id} 
                  onReply={handleReply}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              Task not found
            </div>
          )}
        </div>

        {/* Sticky Input Footer */}
        {task && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-white shrink-0">
            <CommentInput
              entityType="task"
              entityId={task.id}
              projectId={projectId}
              taskId={task.id}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onCommentAdded={scrollToTop}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailModal;
