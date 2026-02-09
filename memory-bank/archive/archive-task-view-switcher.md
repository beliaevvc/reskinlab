# TASK ARCHIVE: Task View Switcher — Kanban / List

## METADATA
- **Task ID:** task-view-switcher
- **Date:** 2026-02-09
- **Complexity:** Level 2
- **Status:** ARCHIVED

---

## SUMMARY

Добавлен переключатель вида задач в проекте (Kanban / List). Новый List view — компактные строки Linear-style с бейджами, сгруппированные по статусу в сворачиваемые секции с цветными заголовками. Полный drag-and-drop между секциями (native HTML5). Toggle иконки в тулбаре (grid/list), persist в localStorage, мобильная адаптация. Inline раскрытие чеклиста с lazy-loading пунктов.

---

## REQUIREMENTS

1. Переключатель видов Kanban / List в тулбаре проекта (иконки как в Notion)
2. List view с группировкой по статусу (5 секций: Backlog, To Do, In Progress, Review, Done)
3. Цветные сворачиваемые заголовки секций
4. Полный drag-and-drop между секциями и внутри (native HTML5)
5. Компактные строки задач (Linear-style) с бейджами: spec, due date, assignee, comments
6. Inline раскрытие чеклиста прямо в строке
7. Persist выбранного вида в localStorage
8. Мобильная адаптация с переключателем
9. Порядок задач как в канбане (order field)
10. Без фильтрации, без inline edit, без bulk actions в первой версии

---

## IMPLEMENTATION

### Архитектура компонентов

```
ProjectPage
├── Toolbar (view toggle: grid/list icons)
├── viewMode === 'kanban' → KanbanBoard (existing)
└── viewMode === 'list'  → TaskListView (NEW)
    └── TaskListSection (per status, collapsible)
        └── TaskListRow (compact row, expandable checklist)
```

### Файлы созданы

1. **`calculator/src/components/tasks/TaskListView.jsx`**
   - Основной компонент: группировка задач по TASK_STATUSES
   - Drag-and-drop между секциями (useReorderTask hook)
   - Auto-scroll при drag к краям контейнера
   - Persist свёрнутых секций в localStorage (`task-list-collapsed-sections`)

2. **`calculator/src/components/tasks/TaskListSection.jsx`**
   - Сворачиваемая секция с цветным заголовком
   - Dot + label + count + chevron
   - Drop zone с визуальной подсветкой по цвету статуса
   - Drop indicator (зелёная линия) между строками

3. **`calculator/src/components/tasks/TaskListRow.jsx`**
   - Компактная строка: checkbox + title + checklist count + badges
   - Бейджи справа: spec, due date, assignee avatar, comments
   - Inline раскрытие чеклиста (lazy-load через useTaskChecklist)
   - Toggle чеклист-пунктов для staff (useUpdateChecklistItem)
   - Адаптив: скрытие менее важных бейджей на мобильном

### Файлы модифицированы

4. **`calculator/src/pages/projects/ProjectPage.jsx`**
   - viewMode state с localStorage persist (`project-view-mode`)
   - Toggle иконки (grid/list) в тулбаре
   - Условный рендер: kanban → KanbanBoard, list → TaskListView
   - Mobile: при list-view скрываются column tabs
   - Проброс canEdit prop для inline checklist toggle

5. **`calculator/src/components/tasks/index.js`**
   - Добавлен экспорт TaskListView

### Паттерны

- **View toggle** — тот же паттерн что в ProjectsPage (localStorage + icon buttons)
- **Drag-and-drop** — переиспользован из KanbanBoard (native HTML5, useReorderTask, gap-based ordering)
- **Ghost element** — клон с фиксированными размерами, offset = позиция мыши относительно элемента
- **Lazy-loading** — useTaskChecklist(isExpanded ? task.id : null) — данные грузятся только при раскрытии
- **localStorage keys** — `project-view-mode`, `task-list-collapsed-sections`

---

## LESSONS LEARNED

1. **Бизнес-логика > наличие данных** — Не показывать в UI данные, если фича деактивирована (stage badge удалён, т.к. задачи не привязаны к этапам)
2. **Ghost positioning** — Использовать e.clientX - rect.left вместо rect.width/2 для правильного позиционирования ghost при drag
3. **Lazy-loading с conditional hook** — useQuery с enabled: !!condition — отличный паттерн для on-demand загрузки
4. **Переиспользование** — Drag-and-drop и view toggle полностью переиспользованы из существующего кода

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-task-view-switcher.md`
- **Related:** KanbanBoard drag-and-drop — `calculator/src/components/tasks/KanbanBoard.jsx`
- **Related:** ProjectsPage view toggle — `calculator/src/pages/projects/ProjectsPage.jsx`
- **Related:** Kanban drag fix — `memory-bank/reflection/reflection-kanban-drag-card-fix.md`
