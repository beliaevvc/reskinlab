# TASK ARCHIVE: Kanban Enhancements — Expandable Checklist & Create Task Modal

## METADATA
- **Task ID:** kanban-enhancements
- **Date:** 2026-02-11
- **Complexity:** Level 2
- **Status:** ARCHIVED

---

## SUMMARY

Комплексное улучшение канбан-доски и модалки создания задачи:
1. Раскрывающийся чек-лист в TaskCard (kanban) — просмотр и отметка пунктов без открытия модалки
2. Кнопка "+" в каждой колонке — создание задачи с предустановленным статусом
3. Редизайн CreateTaskModal под TaskDetailModal — единый вид раскрытой карточки
4. Чек-лист при создании задачи — локальный state → batch insert после создания

---

## REQUIREMENTS

1. Раскрытие чек-листа прямо в карточке канбана (без открытия TaskDetailModal)
2. Lazy-loading пунктов чек-листа при раскрытии
3. Возможность отмечать пункты в карточке (для staff)
4. Кнопка "+" в заголовке каждой колонки для staff
5. При клике на "+" — открытие CreateTaskModal с предустановленным статусом колонки
6. CreateTaskModal должна выглядеть как TaskDetailModal (раскрытая карточка)
7. Возможность добавлять пункты чек-листа при создании задачи

---

## IMPLEMENTATION

### TaskCard — Expandable Checklist

- **State:** `isChecklistExpanded` (useState)
- **Lazy-load:** `useTaskChecklist(isChecklistExpanded ? task.id : null)`
- **Toggle:** Клик на прогресс-бар (chevron + bar + N/M) раскрывает/сворачивает
- **Items:** Рендер пунктов с чекбоксами, `useUpdateChecklistItem` для отметки
- **Prop:** `canEdit` — staff может отмечать, клиент только просматривает

### KanbanBoard — Add Task Button

- **Prop:** `onCreateTask(statusId)` — callback с ID статуса колонки
- **UI:** Кнопка "+" в header каждой колонки (только при `onCreateTask`)
- **Prop:** `canEditChecklist` — передаётся в TaskCard

### CreateTaskModal — Full Redesign

- **Layout:** max-w-2xl, rounded-xl — как TaskDetailModal
- **Header:** Заголовок + выпадающий статус (цветные точки)
- **Content:** Чекбокс + title input, textarea description, deadline section, checklist section
- **Deadline:** Quick actions (Today, Tomorrow, In a week, In a month), date picker, карточка с датой
- **Checklist:** Локальный state `checklistItems`, add/edit/remove до создания
- **onSuccess:** Batch insert в `task_checklist_items` после создания задачи

### useCreateTask — Status Parameter

- **Parameter:** `status` (default: 'backlog')
- **Order:** max-order запрос с `eq('status', status)`, increment +1000

### ProjectPage

- **State:** `createTaskInitialStatus` — хранит статус при открытии из колонки
- **Handler:** `onCreateTask={(statusId) => { setCreateTaskInitialStatus(statusId); setShowCreateTask(true); }}`
- **Props:** `canEditChecklist={effectiveIsStaff}` для KanbanBoard и MobileKanbanColumn

---

## FILES MODIFIED

| File | Changes |
|------|---------|
| `calculator/src/components/tasks/TaskCard.jsx` | Expandable checklist, useTaskChecklist, useUpdateChecklistItem, canEdit prop |
| `calculator/src/components/tasks/KanbanBoard.jsx` | "+" button per column, canEditChecklist, onCreateTask(statusId) |
| `calculator/src/components/tasks/CreateTaskModal.jsx` | Full redesign, checklist section, initialStatus, deadline section |
| `calculator/src/hooks/useTasks.js` | useCreateTask accepts status, order per column |
| `calculator/src/pages/projects/ProjectPage.jsx` | createTaskInitialStatus, canEditChecklist for KanbanBoard, MobileKanbanColumn |

---

## LESSONS LEARNED

1. **Lazy-loading в карточках** — Паттерн `enabled: condition` в useQuery экономит запросы при раскрытии
2. **Batch insert после создания** — Локальный state + batch insert в onSuccess — простой подход для task + checklist items
3. **Единообразие модалок** — Create и Detail в одном стиле снижают когнитивную нагрузку
4. **canEdit prop** — Передача прав через props обеспечивает корректное поведение для staff vs client

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-kanban-enhancements.md`
- **Related:** TaskListRow — тот же паттерн expandable checklist
- **Related:** TaskDetailModal — образец дизайна для CreateTaskModal
