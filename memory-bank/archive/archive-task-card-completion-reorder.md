# TASK ARCHIVE: Task Card Completion & Reorder

## METADATA
- **Task ID:** task-card-completion-reorder
- **Date Started:** 4 Февраля 2026
- **Date Completed:** 4 Февраля 2026
- **Complexity Level:** Level 2 (Enhancement)
- **Status:** ARCHIVED ✅

---

## SUMMARY

Реализованы улучшения для карточек задач на Kanban доске:
- Галочка завершения задачи перед названием (для админа и AM)
- Перетаскивание задач внутри колонок для изменения порядка
- Автоскролл при перетаскивании к краям колонки
- Улучшение визуальной индикации при drag & drop

---

## REQUIREMENTS

### User Stories
1. Как админ/AM, я хочу быстро завершать задачи кликом по галочке
2. Как админ/AM, я хочу менять порядок задач внутри колонки drag & drop
3. Как админ/AM, я хочу видеть куда будет вставлена задача при перетаскивании
4. Как клиент, я хочу видеть статус завершения задачи (без возможности изменения)

### Acceptance Criteria
- [x] Галочка отображается перед названием задачи на доске и в модалке
- [x] Админ и AM могут кликать по галочке для toggle статуса
- [x] Клиент видит галочку, но не может кликать
- [x] Завершённые задачи визуально отличаются (серый фон, зачёркнутый текст)
- [x] Задачи можно перетаскивать внутри одной колонки
- [x] Зелёная полоска показывает позицию вставки
- [x] При перетаскивании к краю колонки происходит автоскролл
- [x] Обводка колонки при drag over не перекрывается скроллбаром

---

## IMPLEMENTATION

### Architecture Decisions

1. **Toggle логика:** done → todo, любой другой статус → done
2. **Order-based сортировка:** числовое поле `order` с шагом 1000
3. **Автоскролл:** requestAnimationFrame вместо setInterval
4. **Overlay обводка:** абсолютно позиционированный div с z-10

### Files Created

Нет новых файлов

### Files Modified

#### `calculator/src/components/tasks/TaskCard.jsx`
- Добавлены props: `canToggleComplete`, `onToggleComplete`
- Добавлена круглая галочка перед названием
- Галочка всегда видна (серая когда активна, белая на зелёном когда done)
- Стили для done: `bg-neutral-50`, `text-neutral-400 line-through`

#### `calculator/src/components/tasks/TaskDetailModal.jsx`
- Добавлена галочка перед названием в секции Title
- Toggle через существующий `handleStatusChange`

#### `calculator/src/components/tasks/KanbanBoard.jsx`
- Добавлен state `dropIndicator` для позиции вставки
- Добавлен `handleDragOverTask` для определения позиции
- Добавлен `useReorderTask` хук
- Автоскролл через requestAnimationFrame
- Overlay div для обводки колонки (`z-10`, `pointer-events-none`)
- Колонки с `max-h-[60vh]` и `overflow-y-auto`

#### `calculator/src/hooks/useTasks.js`
- Добавлен `useReorderTask()` — мутация для обновления status и order

#### `calculator/src/pages/projects/ProjectPage.jsx`
- Передача `canToggleComplete={effectiveIsStaff}` в KanbanBoard

### Code Highlights

**Галочка в TaskCard:**
```jsx
<button
  onClick={canToggleComplete ? handleToggleComplete : undefined}
  disabled={!canToggleComplete}
  className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
    isDone
      ? 'bg-emerald-500 border-emerald-500'
      : 'border-neutral-300 hover:border-emerald-400'
  } ${canToggleComplete ? 'cursor-pointer' : 'cursor-default'}`}
>
  <svg className={`w-2.5 h-2.5 ${isDone ? 'text-white' : 'text-neutral-300'}`} ...>
    <path d="M5 13l4 4L19 7" />
  </svg>
</button>
```

**Автоскролл:**
```jsx
useEffect(() => {
  const animate = () => {
    if (scrollContainerRef.current && scrollDirectionRef.current !== 0) {
      scrollContainerRef.current.scrollTop += scrollDirectionRef.current * SCROLL_SPEED;
    }
    scrollAnimationRef.current = requestAnimationFrame(animate);
  };
  scrollAnimationRef.current = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(scrollAnimationRef.current);
}, []);
```

**Overlay обводка:**
```jsx
{dragOverColumn === status.id && (
  <div className="absolute inset-0 border-2 border-emerald-500 rounded pointer-events-none z-10" />
)}
```

---

## TESTING

### Manual Testing
- [x] Галочка кликабельна для админа
- [x] Галочка кликабельна для AM
- [x] Галочка НЕ кликабельна для клиента
- [x] Статус сохраняется в БД при клике
- [x] Задача визуально меняется при завершении
- [x] Drag & drop между колонками работает
- [x] Drag & drop внутри колонки работает
- [x] Индикатор позиции отображается корректно
- [x] Автоскролл работает при перетаскивании к краю
- [x] Обводка колонки не перекрывается скроллбаром

---

## LESSONS LEARNED

### Technical Insights

1. **requestAnimationFrame для анимаций** — синхронизирован с refresh rate, не блокирует UI
2. **Overlay для визуальных эффектов** — не зависит от overflow и z-index содержимого
3. **Order с большим шагом** — 1000 позволяет много вставок без reindex

### Process Insights

1. **Итеративный подход** — несколько попыток для обводки (ring → shadow → border → overlay)
2. **Фидбек пользователя** — важен для UX деталей (размер галочки, скролл)

### What Could Be Improved

1. Оптимистичные обновления для мгновенного feedback
2. Анимация перемещения карточек
3. Batch reorder для множественного выбора

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-task-card-completion-reorder.md`
- **Related Task:** `memory-bank/archive/archive-kanban-drag-card-fix.md` (drag ghost fix)

---

## ARCHIVE DATE
4 Февраля 2026
