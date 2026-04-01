# Reflection: Kanban Enhancements — Expandable Checklist & Create Task Modal

## Date: 2026-02-11
## Complexity: Level 2

---

## Summary

Комплексное улучшение канбан-доски и модалки создания задачи:
1. **Раскрывающийся чек-лист в карточках** — без открытия модалки можно раскрыть и просмотреть/отметить пункты чек-листа прямо в TaskCard
2. **Кнопка "+" в каждой колонке** — быстрый доступ к созданию задачи с предустановленным статусом колонки
3. **Редизайн CreateTaskModal** — модалка создания задачи приведена к виду раскрытой карточки (TaskDetailModal): тот же header со статусом, чекбокс + заголовок, описание, секция дедлайна с быстрым выбором, секция чек-листа
4. **Чек-лист при создании** — возможность добавлять пункты чек-листа до создания задачи (локальный state → batch insert после создания)

---

## What Went Well

1. **Переиспользование паттернов** — Логика раскрытия чек-листа в TaskCard полностью скопирована из TaskListRow: `useTaskChecklist(isExpanded ? task.id : null)` для lazy-loading, тот же `useUpdateChecklistItem` для отметки пунктов. Единообразие поведения между Kanban и List view.

2. **Консистентность дизайна** — CreateTaskModal приведён к структуре TaskDetailModal: header с выпадающим статусом, чекбокс + title input, описание, deadline section с quick actions (Today, Tomorrow, In a week, In a month), checklist section. Пользователь сразу понимает интерфейс.

3. **Локальный чек-лист при создании** — Пункты хранятся в state до создания задачи, затем batch insert в `task_checklist_items` в onSuccess callback. Не требуется отдельный API или двухэтапный flow.

4. **Предустановка статуса** — `useCreateTask` принимает `status` parameter, order вычисляется относительно задач в той же колонке. onCreateTask callback передаёт `statusId` из колонки.

---

## Challenges

1. **onSuccess callback и newTask** — `createTask` mutation возвращает данные созданной задачи в onSuccess. Нужно было убедиться, что `newTask` содержит `id` для создания checklist items. React Query передаёт результат mutationFn в onSuccess — всё сработало корректно.

2. **Stage в CreateTaskModal** — Изначально в модалке был селектор Stage (этап проекта). При редизайне под TaskDetailModal stage убрали — в раскрытой карточке задачи stage не отображается в том же виде. Задачи привязаны к этапам через stage_id, но для быстрого создания из колонки это не критично (можно добавить позже при необходимости).

3. **Визуальное соответствие** — Пользователь уточнил: «как раскрытая карточка задачи» — имелось в виду TaskDetailModal, а не компактная TaskCard. Важно уточнять уровень детализации при «один в один».

---

## Lessons Learned

1. **Lazy-loading в карточках** — Даже в компактных карточках канбана можно раскрывать дополнительные данные (чеклист) без перехода в модалку. Паттерн `enabled: condition` в useQuery экономит запросы.

2. **Batch insert после создания** — При создании сущности с дочерними элементами (task + checklist items) локальный state + batch insert в onSuccess — простой и надёжный подход. Альтернатива (создать task, потом отдельные запросы на каждый item) даёт больше round-trips.

3. **Единообразие модалок** — Когда Create и Detail модалки выглядят одинаково, пользователь не переключает контекст. Снижает когнитивную нагрузку.

4. **canEdit prop** — Передача `canEditChecklist` из ProjectPage в KanbanBoard → TaskCard обеспечивает правильные права: staff может отмечать пункты в карточке, клиент — только просматривать.

---

## Technical Notes

- **useCreateTask** — Добавлен параметр `status` (default: 'backlog'). Order вычисляется через `eq('status', status)` в max-order запросе. Increment +1000 для gap-based ordering.
- **CreateTaskModal** — `initialStatus` prop, `useEffect` для синхронизации при открытии из разных колонок. Checklist items: `{ id: Date.now(), title }` для локального key, при insert передаётся только `{ task_id, title, completed, order }`.
- **KanbanBoard** — `onCreateTask(statusId)` — callback принимает status, не просто boolean. Кнопка "+" в header каждой колонки, только при `onCreateTask` (staff only).
- **MobileKanbanColumn** — Аналогично обновлён с `canEditChecklist` для TaskCard.

---

## Files

### Modified
- `calculator/src/components/tasks/TaskCard.jsx` — expandable checklist, useTaskChecklist, useUpdateChecklistItem, canEdit prop
- `calculator/src/components/tasks/KanbanBoard.jsx` — "+" button per column, canEditChecklist prop, onCreateTask(statusId)
- `calculator/src/components/tasks/CreateTaskModal.jsx` — полный редизайн под TaskDetailModal, checklist section, initialStatus
- `calculator/src/hooks/useTasks.js` — useCreateTask принимает status, order по колонке
- `calculator/src/pages/projects/ProjectPage.jsx` — createTaskInitialStatus state, canEditChecklist для KanbanBoard и MobileKanbanColumn

---

## Next Steps

- Потенциально: вернуть Stage selector в CreateTaskModal (если нужна привязка к этапу при создании)
- Потенциально: drag-and-drop для изменения порядка пунктов чек-листа в CreateTaskModal
- Потенциально: шаблоны чек-листа при создании (как в task_spec_item_templates)
