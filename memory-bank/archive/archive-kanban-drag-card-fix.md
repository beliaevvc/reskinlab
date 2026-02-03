# TASK ARCHIVE: Kanban Drag Card Fix

## METADATA
- **Task ID:** kanban-drag-card-fix
- **Date Completed:** 2026-02-04
- **Complexity Level:** 1 (Bug Fix)
- **Status:** ARCHIVED ✅

---

## SUMMARY

Исправлен визуальный баг в админке: при перетаскивании карточки задачи в Kanban Board она растягивалась на всю ширину экрана. Причина — ghost-элемент создавался без фиксированных размеров и терял CSS-контекст родительской колонки при добавлении в body.

---

## PROBLEM

При drag-and-drop карточки задачи в Task Board:
- Карточка становилась слишком длинной
- Визуально ломался drag preview
- Проблема воспроизводилась при любом перетаскивании

---

## ROOT CAUSE

Ghost-элемент в `handleDragStart()`:
1. Создавался через `e.target.cloneNode(true)` без inline размеров
2. Добавлялся в `document.body` 
3. Терял контекст ширины от родительской колонки (272px)
4. Растягивался без ограничений

**Подтверждено логами:**
- `targetWidth: 272, targetHeight: 107` — оригинальные размеры
- Ghost получал эти размеры только от CSS родителя, который терялся

---

## SOLUTION

**File:** `calculator/src/components/tasks/KanbanBoard.jsx`

```javascript
const handleDragStart = (e, task) => {
  setDraggedTask(task);
  e.dataTransfer.effectAllowed = 'move';
  
  // Create ghost with fixed dimensions from original element
  const ghost = e.target.cloneNode(true);
  const rect = e.target.getBoundingClientRect();
  
  // Fix ghost dimensions and position off-screen
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.position = 'fixed';
  ghost.style.top = '-1000px';
  ghost.style.left = '-1000px';
  ghost.style.opacity = '0.8';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '9999';
  
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
  
  setTimeout(() => document.body.removeChild(ghost), 0);
};
```

---

## KEY CHANGES

| Aspect | Before | After |
|--------|--------|-------|
| Ghost размеры | Наследуются (теряются) | Фиксированные inline |
| Позиционирование | Статическое | `position: fixed; top: -1000px` |
| Drag cursor | Угол (0, 0) | Центр карточки |
| Opacity | 0.5 | 0.8 |

---

## FILES MODIFIED

- `calculator/src/components/tasks/KanbanBoard.jsx` — функция `handleDragStart()`

---

## TESTING

- Debug instrumentation для сбора runtime данных
- Визуальная проверка drag-and-drop
- Подтверждение пользователем

---

## LESSONS LEARNED

1. **Browser drag-and-drop:** Ghost-элементы в body требуют явных inline размеров
2. **getBoundingClientRect():** Надёжный способ получить computed размеры
3. **Off-screen positioning:** Предотвращает визуальное мерцание ghost'а

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-kanban-drag-card-fix.md`
