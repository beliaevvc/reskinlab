# TASK ARCHIVE: Board Tabs Management

## METADATA
- **Task ID:** `board-tabs-management`
- **Date Started:** 2026-02-16
- **Date Completed:** 2026-02-16
- **Complexity Level:** 2
- **Status:** ARCHIVED ✅

---

## SUMMARY

Реализовано полноценное управление вкладками досок в ReTracker:
- Удаление доски с модальным подтверждением
- Drag-and-drop перетаскивание вкладок для изменения порядка
- Inline переименование досок по двойному клику
- Визуальная индикация позиции вставки (зелёная полоса)
- Optimistic updates для мгновенного отклика UI

---

## REQUIREMENTS

### Функциональные требования
1. Возможность удалять доски с подтверждением (предупреждение о потере данных)
2. Drag-and-drop перетаскивание вкладок для изменения порядка
3. Переименование досок по двойному клику
4. Сохранение порядка досок в БД

### UX требования
1. Зелёная полоса индикации drop position (как в колонках Kanban)
2. Кнопка удаления появляется при hover
3. Auto-width input для переименования
4. Автоматический переход на другую доску после удаления текущей

---

## IMPLEMENTATION

### Database Migration

**File:** `retracker/supabase/migrations/021_board_sort_order.sql`

```sql
-- Add sort_order column
ALTER TABLE public.boards 
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on created_at order
WITH ordered_boards AS (
  SELECT id, workspace_id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at) - 1 as new_order
  FROM public.boards
)
UPDATE public.boards b
SET sort_order = ob.new_order
FROM ordered_boards ob
WHERE b.id = ob.id;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_boards_sort_order ON public.boards(workspace_id, sort_order);
```

### Hooks

**File:** `retracker/src/hooks/useBoards.js`

Изменения:
- `useBoards()` — сортировка по `sort_order` вместо `created_at`
- `useDeleteBoard()` — добавлен optimistic update
- `useReorderBoards()` — новый хук для batch update порядка
- `useUpdateBoard()` — переиспользован для переименования

```javascript
// useReorderBoards — ключевая логика
export function useReorderBoards() {
  return useMutation({
    mutationFn: async ({ workspaceId, boardIds }) => {
      const updates = boardIds.map((id, index) => ({
        id,
        sort_order: index,
      }))
      for (const update of updates) {
        await supabase.from('boards').update({ sort_order: update.sort_order }).eq('id', update.id)
      }
    },
    onMutate: async ({ workspaceId, boardIds }) => {
      // Optimistic reorder
      const boardMap = new Map(previousBoards.map(b => [b.id, b]))
      const reorderedBoards = boardIds.map(id => boardMap.get(id)).filter(Boolean)
      queryClient.setQueryData(['boards', workspaceId], reorderedBoards)
    },
    // ... rollback on error
  })
}
```

### UI Components

**File:** `retracker/src/pages/BoardPage.jsx`

Добавлено:
1. **State для управления:**
   - `deletingBoardId` — ID доски для удаления
   - `draggingBoardId` — ID перетаскиваемой вкладки
   - `dropTargetBoardId` / `dropPosition` — визуальная индикация drop
   - `editingBoardId` / `editingBoardName` — inline редактирование

2. **Drag-and-drop handlers:**
   - `handleBoardDragStart` — начало перетаскивания
   - `handleBoardDragOver` — расчёт позиции (left/right от midpoint)
   - `handleBoardDrop` — применение нового порядка
   - `handleBoardDragLeave` / `handleBoardDragEnd` — очистка состояния

3. **Delete handlers:**
   - `handleDeleteBoardClick` — открытие модалки
   - `handleDeleteBoardConfirm` — удаление с переходом на другую доску
   - `handleDeleteBoardCancel` — закрытие модалки

4. **Rename handlers:**
   - `handleBoardDoubleClick` — вход в режим редактирования
   - `handleBoardRenameSave` — сохранение (Enter / blur)
   - `handleBoardRenameKeyDown` — обработка Escape

5. **UI элементы:**
   - Зелёная полоса индикации (`w-0.5 bg-emerald-500`)
   - Кнопка удаления (×) с opacity transition
   - Модальное окно подтверждения удаления
   - Auto-width input (`width: ${length}ch`)

---

## TESTING

### Тестовые сценарии

| Сценарий | Статус |
|----------|--------|
| Перетаскивание вкладки влево | ✅ |
| Перетаскивание вкладки вправо | ✅ |
| Визуальная индикация drop position | ✅ |
| Удаление доски с подтверждением | ✅ |
| Удаление текущей доски → переход на другую | ✅ |
| Переименование по двойному клику | ✅ |
| Сохранение по Enter | ✅ |
| Отмена по Escape | ✅ |
| Auto-width input | ✅ |

---

## LESSONS LEARNED

### Технические
1. **Reuse existing hooks** — `useUpdateBoard` уже существовал, не нужно было создавать новый
2. **Midpoint calculation** — простой способ определить left/right position: `e.clientX < midpoint`
3. **Auto-width через `ch`** — `width: ${text.length}ch` даёт аккуратный UX

### Процессные
1. **Visual feedback критичен** — пользователь сразу запросил зелёную полосу
2. **Паттерны переиспользуются** — drag-and-drop колонок легко адаптировался под вкладки

### Архитектурные
1. **Optimistic updates везде** — все мутации должны иметь оптимистичные обновления
2. **Batch updates можно оптимизировать** — текущая реализация делает N запросов, можно заменить на RPC

---

## FILES

### Created
- `retracker/supabase/migrations/021_board_sort_order.sql`
- `memory-bank/reflection/reflection-board-tabs-management.md`

### Modified
- `retracker/src/hooks/useBoards.js`
- `retracker/src/pages/BoardPage.jsx`

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-board-tabs-management.md`
- **Related:** Dynamic Statuses (`019_workspace_statuses.sql`, `020_dynamic_statuses.sql`)
- **Commit:** `feat: board tabs management - delete, reorder, rename`

---

## METRICS

| Metric | Value |
|--------|-------|
| Time | ~20 min |
| Files Changed | 3 |
| Lines Added | ~180 |
| User Iterations | 4 |
| Commits | 1 |
