import { useState } from 'react';
import {
  useTaskChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../../hooks/useTaskChecklist';

export function TaskChecklist({ taskId, canEdit = true }) {
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
    if (window.confirm('Удалить этот пункт из чеклиста?')) {
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
          <h4 className="text-sm font-medium text-neutral-900">Чеклист</h4>
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
            + Добавить пункт
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
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 group hover:bg-neutral-50 rounded p-2 -mx-2 transition-colors"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => canEdit && handleToggleComplete(item)}
              disabled={!canEdit}
              className={`mt-0.5 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 ${
                canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            />
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
                className={`flex-1 text-sm border-none bg-transparent focus:bg-white focus:border focus:border-emerald-300 focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 ${
                  item.completed ? 'line-through text-neutral-400' : 'text-neutral-700'
                }`}
              />
            ) : (
              <span className={`flex-1 text-sm px-2 py-1 ${
                item.completed ? 'line-through text-neutral-400' : 'text-neutral-700'
              }`}>
                {item.title}
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                title="Удалить пункт"
              >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              </button>
            )}
          </div>
        ))}

        {/* Add new item */}
        {isAdding && (
          <div className="flex items-center gap-2 p-2 -mx-2">
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
              placeholder="Введите название пункта..."
              autoFocus
              className="flex-1 text-sm border border-neutral-300 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemTitle.trim() || createItem.isPending}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Добавить
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle('');
              }}
              className="px-3 py-1 text-neutral-600 hover:bg-neutral-100 text-sm rounded"
            >
              Отмена
            </button>
          </div>
        )}
      </div>

      {items.length === 0 && !isAdding && (
        <p className="text-sm text-neutral-400 text-center py-2">
          Чеклист пуст. Добавьте первый пункт.
        </p>
      )}
    </div>
  );
}
