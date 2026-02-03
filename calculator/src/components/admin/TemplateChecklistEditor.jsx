import { useState, useEffect } from 'react';

export function TemplateChecklistEditor({ checklistItems = [], onChange }) {
  const [items, setItems] = useState(checklistItems || []);

  // Синхронизируем items при изменении checklistItems извне
  useEffect(() => {
    setItems(checklistItems || []);
  }, [checklistItems]);

  const handleAddItem = () => {
    const newItems = [...items, { title: '', order: items.length }];
    setItems(newItems);
    onChange(newItems);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'title') {
      newItems[index] = { ...newItems[index], title: value };
    } else if (field === 'order') {
      newItems[index] = { ...newItems[index], order: parseInt(value) || 0 };
    }
    setItems(newItems);
    onChange(newItems);
  };

  const handleDeleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    // Пересчитываем порядок
    newItems.forEach((item, i) => {
      item.order = i;
    });
    setItems(newItems);
    onChange(newItems);
  };

  const handleMoveItem = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Обновляем порядок
    newItems.forEach((item, i) => {
      item.order = i;
    });
    
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          Чеклист для задачи
        </label>
        <button
          type="button"
          onClick={handleAddItem}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          + Добавить пункт
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-2">
          Чеклист пуст. Добавьте первый пункт.
        </p>
      ) : (
        <div className="space-y-2 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-white rounded border border-neutral-200"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Переместить вверх"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Переместить вниз"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                placeholder="Название пункта чеклиста..."
                className="flex-1 text-sm border border-neutral-300 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleDeleteItem(index)}
                className="p-1 text-red-500 hover:text-red-700"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
