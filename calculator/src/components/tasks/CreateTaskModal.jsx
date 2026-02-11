import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateTask, TASK_STATUSES } from '../../hooks/useTasks';
import { supabase } from '../../lib/supabase';

const STATUS_COLORS = {
  backlog: { bg: '#f1f5f9', text: '#475569', dot: '#64748b' },
  todo: { bg: '#f5f5f5', text: '#525252', dot: '#737373' },
  in_progress: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  review: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  done: { bg: '#d1fae5', text: '#047857', dot: '#10b981' },
};

const getStatusColor = (statusId) => STATUS_COLORS[statusId] || STATUS_COLORS.todo;

export function CreateTaskModal({ isOpen, onClose, projectId, initialStatus = 'backlog' }) {
  const { t, i18n } = useTranslation('tasks');
  const currentLang = i18n.language?.substring(0, 2) || 'en';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [deadlineEditing, setDeadlineEditing] = useState(false);
  const titleRef = useRef(null);
  
  // Checklist state
  const [checklistItems, setChecklistItems] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);

  // Update status when initialStatus changes
  useEffect(() => {
    if (isOpen) {
      setStatus(initialStatus);
      setTitle('');
      setDescription('');
      setDueDate('');
      setDeadlineEditing(false);
      setChecklistItems([]);
      setNewChecklistItem('');
      setIsAddingChecklistItem(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, initialStatus]);

  const { mutate: createTask, isPending } = useCreateTask();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!title.trim()) return;

    const trimmedDesc = description.trim() || null;
    
    createTask(
      {
        projectId,
        stageId: null,
        title: title.trim(),
        title_ru: currentLang === 'ru' ? title.trim() : null,
        title_en: currentLang === 'en' ? title.trim() : null,
        description: trimmedDesc,
        description_ru: currentLang === 'ru' ? trimmedDesc : null,
        description_en: currentLang === 'en' ? trimmedDesc : null,
        dueDate: dueDate || null,
        status,
      },
      {
        onSuccess: async (newTask) => {
          // Create checklist items if any
          if (checklistItems.length > 0 && newTask?.id) {
            const itemsToInsert = checklistItems.map((item, index) => ({
              task_id: newTask.id,
              title: item.title,
              completed: false,
              order: index,
            }));
            
            await supabase.from('task_checklist_items').insert(itemsToInsert);
          }
          onClose();
        },
      }
    );
  };

  // Checklist handlers
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    setChecklistItems([
      ...checklistItems,
      { id: Date.now(), title: newChecklistItem.trim() }
    ]);
    setNewChecklistItem('');
    setIsAddingChecklistItem(false);
  };

  const handleRemoveChecklistItem = (itemId) => {
    setChecklistItems(checklistItems.filter(item => item.id !== itemId));
  };

  const handleUpdateChecklistItem = (itemId, newTitle) => {
    setChecklistItems(checklistItems.map(item => 
      item.id === itemId ? { ...item, title: newTitle } : item
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal - Same style as TaskDetailModal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span>{t('create.title')}</span>
            
            {/* Status selector */}
            <div className="relative inline-flex">
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="inline-flex items-center gap-1.5 hover:text-neutral-600 transition-colors"
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(status).dot }}
                />
                <span style={{ color: getStatusColor(status).text }}>
                  {t(`status.${status}`)}
                </span>
                <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {statusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[140px]">
                    {TASK_STATUSES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStatus(s.id);
                          setStatusMenuOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-neutral-50 ${
                          status === s.id ? 'bg-neutral-50' : ''
                        }`}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getStatusColor(s.id).dot }}
                        />
                        {t(`status.${s.id}`)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Title & Description */}
            <div className="space-y-1">
              {/* Title with checkbox */}
              <div className="flex items-start gap-3">
                {/* Checkbox (visual placeholder) */}
                <div className="shrink-0 mt-1 w-6 h-6 rounded-full border-2 border-neutral-300 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('create.titlePlaceholder')}
                    className="w-full text-xl font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:outline-none rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('detail.addDescription', { defaultValue: 'Add description...' })}
                rows={3}
                className="w-full text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:outline-none rounded px-2 py-1.5 resize-none ml-9"
                style={{ width: 'calc(100% - 36px)' }}
              />
            </div>

            {/* Deadline Section */}
            <div className="pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-50">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-900">{t('detail.deadline', { defaultValue: 'Deadline' })}</span>
              </div>

              {deadlineEditing ? (
                <div className="space-y-3">
                  {/* Quick actions */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-neutral-400 py-1">{t('deadline.quickSelect', { defaultValue: 'Quick:' })}</span>
                    {[
                      { label: t('deadline.today', { defaultValue: 'Today' }), days: 0 },
                      { label: t('deadline.tomorrow', { defaultValue: 'Tomorrow' }), days: 1 },
                      { label: t('deadline.nextWeek', { defaultValue: 'In a week' }), days: 7 },
                      { label: t('deadline.nextMonth', { defaultValue: 'In a month' }), days: 30 },
                    ].map((quick) => {
                      const targetDate = new Date();
                      targetDate.setDate(targetDate.getDate() + quick.days);
                      const dateStr = targetDate.toISOString().split('T')[0];
                      return (
                        <button
                          key={quick.days}
                          type="button"
                          onClick={() => {
                            setDueDate(dateStr);
                            setDeadlineEditing(false);
                          }}
                          className="px-2 py-1 text-xs text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          {quick.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Date input */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                        {t('deadline.date', { defaultValue: 'Date' })}
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeadlineEditing(false)}
                      className="px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
                    >
                      {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate('');
                          setDeadlineEditing(false);
                        }}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        {t('detail.clearDeadline', { defaultValue: 'Clear' })}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {dueDate ? (
                    <button 
                      type="button"
                      onClick={() => setDeadlineEditing(true)}
                      className="group flex items-center gap-3 w-full p-3 rounded-xl border-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300 transition-all cursor-pointer"
                    >
                      {/* Calendar icon with date */}
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-white shadow-sm flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          {new Date(dueDate).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none text-neutral-900">
                          {new Date(dueDate).getDate()}
                        </span>
                      </div>
                      
                      {/* Date info */}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-neutral-900">
                          {new Date(dueDate).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {(() => {
                            const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                            if (daysLeft < 0) return t('detail.overdue', { defaultValue: 'Overdue' });
                            if (daysLeft === 0) return t('deadline.today', { defaultValue: 'Today' });
                            if (daysLeft === 1) return t('deadline.tomorrow', { defaultValue: 'Tomorrow' });
                            return t('deadline.inDays', { count: daysLeft, defaultValue: `In ${daysLeft} days` });
                          })()}
                        </div>
                      </div>
                      
                      {/* Edit hint */}
                      <svg className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
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
                          {t('detail.setDeadline', { defaultValue: 'Set deadline' })}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {t('deadline.clickToSet', { defaultValue: 'Click to set deadline' })}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Checklist Section */}
            <div className="pt-4 border-t border-neutral-100">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-neutral-900">{t('checklist.title', { defaultValue: 'Checklist' })}</h4>
                    {checklistItems.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        {checklistItems.length} {t('checklist.items', { defaultValue: 'items' })}
                      </span>
                    )}
                  </div>
                  {!isAddingChecklistItem && (
                    <button
                      type="button"
                      onClick={() => setIsAddingChecklistItem(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + {t('checklist.addItem', { defaultValue: 'Add item' })}
                    </button>
                  )}
                </div>

                {/* Items list */}
                <div className="space-y-1">
                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 group hover:bg-neutral-50 rounded-lg py-1.5 px-2 -mx-2 transition-colors"
                    >
                      {/* Circle checkbox (unchecked) */}
                      <div className="shrink-0 w-5 h-5 rounded-full border-2 border-neutral-300" />
                      
                      {/* Title - editable */}
                      <input
                        type="text"
                        defaultValue={item.title}
                        onBlur={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                        className="flex-1 text-sm bg-transparent border border-transparent focus:bg-neutral-50 focus:border-emerald-500 focus:outline-none rounded px-1 py-0.5 -ml-1 text-neutral-700"
                      />
                      
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-all"
                        title={t('checklist.deleteItem', { defaultValue: 'Delete item' })}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add new item */}
                  {isAddingChecklistItem && (
                    <div className="flex items-center gap-3 py-1.5 px-2 -mx-2">
                      {/* Empty circle placeholder */}
                      <div className="shrink-0 w-5 h-5 rounded-full border-2 border-dashed border-neutral-300" />
                      
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddChecklistItem();
                          } else if (e.key === 'Escape') {
                            setIsAddingChecklistItem(false);
                            setNewChecklistItem('');
                          }
                        }}
                        placeholder={t('checklist.itemPlaceholder', { defaultValue: 'Checklist item...' })}
                        autoFocus
                        className="flex-1 text-sm border border-neutral-200 rounded px-2 py-1 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklistItem}
                        disabled={!newChecklistItem.trim()}
                        className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingChecklistItem(false);
                          setNewChecklistItem('');
                        }}
                        className="shrink-0 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {checklistItems.length === 0 && !isAddingChecklistItem && (
                  <button
                    type="button"
                    onClick={() => setIsAddingChecklistItem(true)}
                    className="group flex items-center gap-3 w-full p-3 rounded-xl border-2 border-dashed border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-neutral-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-neutral-600 group-hover:text-blue-700 transition-colors">
                        {t('checklist.addChecklist', { defaultValue: 'Add checklist' })}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {t('checklist.clickToAdd', { defaultValue: 'Click to add checklist items' })}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Create button */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-white shrink-0 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {t('create.hint', { defaultValue: 'Fill in the details and click Create' })}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg font-medium transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !title.trim()}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('create.creating', { defaultValue: 'Creating...' })}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('create.submit', { defaultValue: 'Create task' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTaskModal;
