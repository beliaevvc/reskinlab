import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useTaskChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../../hooks/useTaskChecklist';

export function TaskChecklist({ taskId, canEdit = true }) {
  const { t } = useTranslation('tasks');
  const { data: items = [], isLoading } = useTaskChecklist(taskId);
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : -1;

    await createItem.mutateAsync({
      taskId,
      title: newItemTitle.trim(),
      order: maxOrder + 1,
    });

    setNewItemTitle('');
    setIsAdding(false);
  };

  const handleToggleComplete = async (item) => {
    await updateItem.mutateAsync({
      itemId: item.id,
      updates: {
        completed: !item.completed,
      },
    });
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm(t('checklist.deleteConfirm', { defaultValue: 'Delete this checklist item?' }))) {
      await deleteItem.mutateAsync({ itemId, taskId });
    }
  };

  const handleUpdateTitle = async (item, newTitle) => {
    if (newTitle.trim() && newTitle !== item.title) {
      await updateItem.mutateAsync({
        itemId: item.id,
        updates: {
          title: newTitle.trim(),
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-neutral-900">{t('checklist.title')}</h4>
          {totalCount > 0 && (
            <span className="text-xs text-neutral-500">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            + {t('checklist.addItem')}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Items list */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 group hover:bg-neutral-50 rounded-lg py-1.5 px-2 -mx-2 transition-colors"
          >
            {/* Custom circle checkbox */}
            <button
              onClick={() => canEdit && handleToggleComplete(item)}
              disabled={!canEdit}
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                item.completed 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-neutral-300 hover:border-emerald-400'
              } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              {item.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            
            {/* Title */}
            {canEdit ? (
              <input
                type="text"
                defaultValue={item.title}
                onBlur={(e) => handleUpdateTitle(item, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                className={`flex-1 text-sm bg-transparent border border-transparent focus:bg-neutral-50 focus:border-emerald-500 focus:outline-none rounded px-1 py-0.5 -ml-1 ${
                  item.completed ? 'line-through text-neutral-400' : 'text-neutral-700'
                }`}
              />
            ) : (
              <span className={`flex-1 text-sm ${
                item.completed ? 'line-through text-neutral-400' : 'text-neutral-700'
              }`}>
                {item.title}
              </span>
            )}
            
            {/* Delete button */}
            {canEdit && (
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-all"
                title={t('checklist.deleteItem', { defaultValue: 'Delete item' })}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Add new item */}
        {isAdding && (
          <div className="flex items-center gap-3 py-1.5 px-2 -mx-2">
            {/* Empty circle placeholder */}
            <div className="shrink-0 w-5 h-5 rounded-full border-2 border-dashed border-neutral-300" />
            
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewItemTitle('');
                }
              }}
              placeholder={t('checklist.itemPlaceholder')}
              autoFocus
              className="flex-1 text-sm border border-neutral-200 rounded px-2 py-1 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemTitle.trim() || createItem.isPending}
              className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createItem.isPending ? '...' : 'OK'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle('');
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

      {items.length === 0 && !isAdding && (
        <p className="text-sm text-neutral-400 text-center py-2">
          {t('checklist.empty', { defaultValue: 'Checklist is empty. Add first item.' })}
        </p>
      )}
    </div>
  );
}
