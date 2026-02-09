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

export function TaskDetailModal({ isOpen, onClose, taskId, projectId, onOpenSpecification, onOpenOffer, highlightCommentId }) {
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
  const [deadlineEditing, setDeadlineEditing] = useState(false);
  const [deadlineType, setDeadlineType] = useState('date'); // 'date' | 'datetime' | 'range'
  
  const commentsTopRef = useRef(null);
  
  // Check if user can view user profiles (admin or AM)
  const canViewUsers = isAdmin || isAM;
  
  // Get the specification linked to this task (via source_specification_id)
  // Fall back to first non-draft specification for old tasks without the link
  const activeSpec = task?.source_specification_id 
    ? specifications?.find(s => s.id === task.source_specification_id)
    : (specifications?.find(s => s.status !== 'draft') || specifications?.[0]);
  
  // Get offer for the task's specification
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
      setDeadlineEditing(false);
    }
  }, [isOpen]);

  // Determine deadline type from task data
  useEffect(() => {
    if (task) {
      if (task.due_date_end) {
        setDeadlineType('range');
      } else if (task.due_time) {
        setDeadlineType('datetime');
      } else {
        setDeadlineType('date');
      }
    }
  }, [task]);

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

  // Format deadline for display
  const formatDeadline = () => {
    if (!task?.due_date) return null;
    
    const startDate = new Date(task.due_date);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    let result = startDate.toLocaleDateString('ru-RU', options);
    
    if (task.due_time) {
      result += ` в ${task.due_time.slice(0, 5)}`;
    }
    
    if (task.due_date_end) {
      const endDate = new Date(task.due_date_end);
      result += ` — ${endDate.toLocaleDateString('ru-RU', options)}`;
    }
    
    return result;
  };

  // Check if deadline is overdue
  const isOverdue = () => {
    if (!task?.due_date || task.status === 'done') return false;
    const deadline = task.due_date_end || task.due_date;
    return new Date(deadline) < new Date();
  };

  // Update deadline
  const handleDeadlineUpdate = (updates) => {
    updateTask({
      taskId: task.id,
      updates,
    });
    setDeadlineEditing(false);
  };

  // Clear deadline
  const handleClearDeadline = () => {
    updateTask({
      taskId: task.id,
      updates: {
        due_date: null,
        due_time: null,
        due_date_end: null,
      },
    });
    setDeadlineEditing(false);
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
                    {activeSpec.number || `Spec v${activeSpec.version_number}`}
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
                  {/* Title with checkbox - inline editable */}
                  <div className="flex items-start gap-3">
                    {/* Complete checkbox */}
                    <button
                      onClick={() => {
                        if (!isClient) {
                          const newStatus = task.status === 'done' ? 'todo' : 'done';
                          handleStatusChange(newStatus);
                        }
                      }}
                      disabled={isClient}
                      className={`shrink-0 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-neutral-300 hover:border-emerald-400'
                      } ${!isClient ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <svg 
                        className={`w-3.5 h-3.5 ${task.status === 'done' ? 'text-white' : 'text-neutral-300'}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    
                    <div className="flex-1 min-w-0">
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
                          className={`text-xl font-semibold rounded px-1 py-0.5 -mx-1 border border-transparent ${
                            task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900'
                          } ${!isClient ? 'hover:bg-neutral-100 cursor-text' : ''}`}
                        >
                          {task.title}
                        </h3>
                      )}
                    </div>
                  </div>

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

                {/* Deadline Section - Redesigned */}
                <div className="pt-4 border-t border-neutral-100">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${isOverdue() ? 'bg-red-100' : 'bg-emerald-50'}`}>
                      <svg className={`w-4 h-4 ${isOverdue() ? 'text-red-600' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">Дедлайн</span>
                  </div>

                  {deadlineEditing && !isClient ? (
                    <div className="space-y-4">
                      {/* Type selector with icons */}
                      <div className="flex gap-2">
                        {[
                          { id: 'date', label: 'Дата', icon: (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )},
                          { id: 'datetime', label: 'Дата и время', icon: (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )},
                          { id: 'range', label: 'Период', icon: (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          )},
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setDeadlineType(type.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
                              deadlineType === type.id
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            {type.icon}
                            {type.label}
                          </button>
                        ))}
                      </div>

                      {/* Quick actions */}
                      <div className="flex gap-2">
                        <span className="text-xs text-neutral-400 py-1">Быстрый выбор:</span>
                        {[
                          { label: 'Сегодня', days: 0 },
                          { label: 'Завтра', days: 1 },
                          { label: 'Через неделю', days: 7 },
                          { label: 'Через месяц', days: 30 },
                        ].map((quick) => {
                          const targetDate = new Date();
                          targetDate.setDate(targetDate.getDate() + quick.days);
                          const dateStr = targetDate.toISOString().split('T')[0];
                          return (
                            <button
                              key={quick.days}
                              onClick={() => handleDeadlineUpdate({ 
                                due_date: dateStr,
                                due_time: null,
                                due_date_end: null,
                              })}
                              className="px-2 py-1 text-xs text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              {quick.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Date inputs */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const updates = {
                            due_date: formData.get('due_date') || null,
                            due_time: deadlineType === 'datetime' ? formData.get('due_time') || null : null,
                            due_date_end: deadlineType === 'range' ? formData.get('due_date_end') || null : null,
                          };
                          handleDeadlineUpdate(updates);
                        }}
                        className="space-y-3"
                      >
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
                              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {deadlineType === 'range' ? 'Начало' : 'Дата'}
                            </label>
                            <input
                              type="date"
                              name="due_date"
                              defaultValue={task.due_date?.split('T')[0] || ''}
                              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                            />
                          </div>
                          
                          {deadlineType === 'datetime' && (
                            <div className="w-28">
                              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
                                <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Время
                              </label>
                              <input
                                type="time"
                                name="due_time"
                                defaultValue={task.due_time?.slice(0, 5) || ''}
                                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                              />
                            </div>
                          )}
                          
                          {deadlineType === 'range' && (
                            <div className="flex-1">
                              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
                                <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Окончание
                              </label>
                              <input
                                type="date"
                                name="due_date_end"
                                defaultValue={task.due_date_end?.split('T')[0] || ''}
                                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                              />
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm shadow-emerald-500/25 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Сохранить
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeadlineEditing(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            Отмена
                          </button>
                          {task.due_date && (
                            <button
                              type="button"
                              onClick={handleClearDeadline}
                              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Убрать
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      {task.due_date ? (
                        <button 
                          onClick={() => !isClient && setDeadlineEditing(true)}
                          disabled={isClient}
                          className={`group flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${
                            isOverdue() 
                              ? 'bg-red-50 border-red-200 hover:border-red-300' 
                              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300'
                          } ${!isClient ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          {/* Calendar icon with date */}
                          <div className={`shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                            isOverdue() ? 'bg-red-100' : 'bg-white shadow-sm'
                          }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${
                              isOverdue() ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {new Date(task.due_date).toLocaleDateString('ru-RU', { month: 'short' })}
                            </span>
                            <span className={`text-lg font-bold leading-none ${
                              isOverdue() ? 'text-red-700' : 'text-neutral-900'
                            }`}>
                              {new Date(task.due_date).getDate()}
                            </span>
                          </div>
                          
                          {/* Date info */}
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium ${isOverdue() ? 'text-red-700' : 'text-neutral-900'}`}>
                              {formatDeadline()}
                            </div>
                            <div className={`text-xs ${isOverdue() ? 'text-red-600' : 'text-neutral-500'}`}>
                              {isOverdue() ? (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  Просрочено
                                </span>
                              ) : (
                                (() => {
                                  const daysLeft = Math.ceil((new Date(task.due_date_end || task.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                                  if (daysLeft === 0) return 'Сегодня';
                                  if (daysLeft === 1) return 'Завтра';
                                  if (daysLeft < 7) return `Через ${daysLeft} дн.`;
                                  return `Через ${Math.ceil(daysLeft / 7)} нед.`;
                                })()
                              )}
                            </div>
                          </div>
                          
                          {/* Edit hint */}
                          {!isClient && (
                            <svg className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          )}
                        </button>
                      ) : (
                        !isClient && (
                          <button
                            onClick={() => setDeadlineEditing(true)}
                            className="group flex items-center gap-3 w-full p-3 rounded-xl border-2 border-dashed border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                          >
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                              <svg className="w-5 h-5 text-neutral-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-neutral-600 group-hover:text-emerald-700 transition-colors">
                                Добавить дедлайн
                              </div>
                              <div className="text-xs text-neutral-400">
                                Нажмите для установки срока
                              </div>
                            </div>
                          </button>
                        )
                      )}
                      {isClient && !task.due_date && (
                        <div className="flex items-center gap-2 text-sm text-neutral-400 italic py-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Дедлайн не установлен
                        </div>
                      )}
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
                  highlightCommentId={highlightCommentId}
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
