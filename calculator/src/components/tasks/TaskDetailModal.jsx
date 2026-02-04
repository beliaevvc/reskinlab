import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTask, useUpdateTask, useDeleteTask, useMarkCommentsAsRead, TASK_STATUSES } from '../../hooks/useTasks';
import { useSpecifications } from '../../hooks/useSpecifications';
import { supabase } from '../../lib/supabase';
import { CommentThread, CommentInput } from '../comments';
import { TaskChecklist } from './TaskChecklist';
import { UserDetailModal } from '../admin/UserDetailModal';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

// Hook to get offers for project specifications
function useProjectOffers(projectId, specificationId) {
  return useQuery({
    queryKey: ['project-offers', projectId, specificationId],
    queryFn: async () => {
      if (!specificationId) return null;
      
      const { data, error } = await supabase
        .from('offers')
        .select('id, number, status')
        .eq('specification_id', specificationId)
        .limit(1);
      
      if (error) {
        console.error('Error fetching offer:', error);
        return null;
      }
      return data?.[0] || null;
    },
    enabled: !!projectId && !!specificationId,
  });
}

const STATUS_COLORS = {
  backlog: { bg: '#f1f5f9', text: '#475569', dot: '#64748b' },
  todo: { bg: '#f5f5f5', text: '#525252', dot: '#737373' },
  in_progress: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  review: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  done: { bg: '#d1fae5', text: '#047857', dot: '#10b981' },
};

const getStatusColor = (statusId) => STATUS_COLORS[statusId] || STATUS_COLORS.todo;

// Parse text and convert URLs to clickable links
const parseTextWithLinks = (text) => {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export function TaskDetailModal({ isOpen, onClose, taskId, projectId, onOpenSpecification, onOpenOffer }) {
  const { data: task, isLoading } = useTask(taskId);
  const { data: specifications } = useSpecifications(projectId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: markCommentsAsRead } = useMarkCommentsAsRead();
  const { isClient, isAdmin, isAM } = useAuth();

  const [editingField, setEditingField] = useState(null); // 'title' | 'description' | null
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const commentsTopRef = useRef(null);
  
  // Check if user can view user profiles (admin or AM)
  const canViewUsers = isAdmin || isAM;
  
  // Get the active specification (first non-draft or latest)
  const activeSpec = specifications?.find(s => s.status !== 'draft') || specifications?.[0];
  
  // Get offer for the active specification
  const { data: activeOffer } = useProjectOffers(projectId, activeSpec?.id);

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
      setEditingField(null);
      setStatusMenuOpen(false);
      setSelectedUserId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateField = (field, value) => {
    const trimmedValue = value.trim();
    // Don't save empty title
    if (field === 'title' && !trimmedValue) return;
    // Only update if value changed
    if (task[field] === trimmedValue) return;
    
    updateTask({
      taskId: task.id,
      updates: { [field]: trimmedValue || null },
    });
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
        <div className="px-6 py-3 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div>
            {task && (
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span>{formatDate(task.created_at)}</span>
                {/* Link to specification */}
                {activeSpec && onOpenSpecification && (
                  <button
                    onClick={() => onOpenSpecification(activeSpec.id)}
                    className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Spec v{activeSpec.version_number}
                  </button>
                )}
                {/* Link to offer */}
                {activeOffer && onOpenOffer && (
                  <button
                    onClick={() => onOpenOffer(activeOffer.id)}
                    className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Offer
                  </button>
                )}
                {/* Status - last */}
                <div className="relative inline-flex">
                  <button
                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                    className="inline-flex items-center gap-1.5 hover:text-neutral-600 transition-colors"
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(task.status).dot }}
                    />
                    <span style={{ color: getStatusColor(task.status).text }}>
                      {TASK_STATUSES.find(s => s.id === task.status)?.label || task.status}
                    </span>
                    <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {statusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[140px]">
                        {TASK_STATUSES.map((status) => (
                          <button
                            key={status.id}
                            onClick={() => {
                              handleStatusChange(status.id);
                              setStatusMenuOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-neutral-50 ${
                              task.status === status.id ? 'bg-neutral-50' : ''
                            }`}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: getStatusColor(status.id).dot }}
                            />
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
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
              <div className="p-6 space-y-4 border-b border-neutral-100">
                {/* Title & Description */}
                <div className="space-y-1">
                  {/* Title - inline editable */}
                  {editingField === 'title' && !isClient ? (
                    <input
                      type="text"
                      defaultValue={task.title}
                      autoFocus
                      onBlur={(e) => {
                        handleUpdateField('title', e.target.value);
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        } else if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      className="w-full text-xl font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:outline-none rounded px-1 py-0.5 -mx-1"
                      placeholder="Название задачи"
                    />
                  ) : (
                    <h3 
                      onClick={() => !isClient && setEditingField('title')}
                      className={`text-xl font-semibold text-neutral-900 rounded px-1 py-0.5 -mx-1 border border-transparent ${
                        !isClient ? 'hover:bg-neutral-100 cursor-text' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                  )}

                  {/* Description - inline editable */}
                  {editingField === 'description' && !isClient ? (
                    <textarea
                      defaultValue={task.description || ''}
                      autoFocus
                      rows={4}
                      onBlur={(e) => {
                        handleUpdateField('description', e.target.value);
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      className="w-full text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:outline-none rounded px-2 py-1.5 -mx-1 resize-none min-h-[80px]"
                      placeholder="Добавить описание..."
                    />
                  ) : (
                    <div 
                      onClick={() => !isClient && setEditingField('description')}
                      className={`text-sm text-neutral-600 whitespace-pre-wrap break-words rounded px-1 py-0.5 -mx-1 border border-transparent ${
                        !isClient ? 'hover:bg-neutral-100 cursor-text' : ''
                      } ${!task.description ? 'text-neutral-400 italic' : ''}`}
                    >
                      {task.description 
                        ? parseTextWithLinks(task.description) 
                        : (!isClient ? 'Добавить описание...' : '')
                      }
                    </div>
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
                  onUserClick={canViewUsers ? setSelectedUserId : undefined}
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

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

export default TaskDetailModal;
