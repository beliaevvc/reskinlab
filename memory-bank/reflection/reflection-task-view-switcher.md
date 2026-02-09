# Reflection: Task View Switcher — Kanban / List

## Date: 2026-02-09
## Complexity: Level 2

---

## Summary

Добавлен переключатель вида задач в проекте (Kanban / List). Новый List view — компактные строки Linear-style с бейджами, сгруппированные по статусу в сворачиваемые секции с цветными заголовками. Полный drag-and-drop между секциями (native HTML5). Toggle иконки в тулбаре (grid/list), persist в localStorage, мобильная адаптация. Дополнительно: inline раскрытие чеклиста с lazy-loading пунктов.

---

## What Went Well

1. **Переиспользование паттернов** — View toggle скопирован с ProjectsPage (тот же паттерн localStorage + icon buttons). Drag-and-drop полностью переиспользован из KanbanBoard (те же хуки `useReorderTask`, тот же алгоритм порядка с gap-based ordering). Это обеспечило консистентность поведения.

2. **Компонентная декомпозиция** — Три новых компонента (TaskListView → TaskListSection → TaskListRow) с чётким разделением ответственности: View управляет drag-and-drop и группировкой, Section — collapse и drop zone, Row — отображение данных и inline checklist.

3. **Lazy-loading чеклиста** — Чеклист-пункты загружаются только при раскрытии строки через `useTaskChecklist(isExpanded ? task.id : null)`. Это не создаёт лишних запросов для свёрнутых задач.

4. **Мобильная адаптация** — Адаптивное скрытие бейджей (spec, checklist скрыты на sm), переключатель доступен и на мобильном, при list-view скрываются column tabs.

---

## Challenges

1. **Stage badge — ненужная фича** — Изначально добавил stage badge в TaskListRow, основываясь на доступных данных (`task.stage`). Пользователь указал, что задачи НЕ привязаны к этапам (это было решено ранее). Урок: проверять бизнес-логику, а не просто наличие данных.

2. **Ghost element при drag-and-drop** — Ghost смещался влево при перетаскивании. Причина: offset был привязан к центру элемента (`rect.width / 2`), а не к позиции клика мыши. Исправлено на `e.clientX - rect.left`. Также добавлены стили ghost (белый фон, тень, скругление).

3. **Checklist count в правых бейджах** — Изначально checklist progress bar был в правых бейджах (как в TaskCard). Пользователь запросил: счётчик рядом с названием + возможность раскрыть. Пришлось переделать — убрать progress bar из бейджей и добавить интерактивный счётчик с chevron рядом с title.

---

## Lessons Learned

1. **Бизнес-логика > данные** — Не показывать в UI всё, что есть в данных. Если фича была деактивирована (привязка задач к этапам), не отображать её даже если поле заполнено.

2. **Ghost positioning** — При drag-and-drop всегда использовать позицию мыши относительно элемента (`e.clientX - rect.left`) вместо центра. Это предотвращает визуальный прыжок.

3. **Inline expansion в списке** — List view даёт возможность показывать дополнительную информацию при раскрытии строки (чеклист). Это преимущество перед канбаном, где пространство ограничено шириной колонки.

4. **Паттерн lazy-loading с conditional hook** — `useQuery(key, fn, { enabled: !!condition })` — отличный паттерн для lazy-loading данных при раскрытии секций. Данные кешируются React Query после первой загрузки.

---

## Technical Notes

- **Drag-and-drop** — Тот же native HTML5 API и `useReorderTask` hook что в канбане. Auto-scroll при перетаскивании к краям scroll-контейнера.
- **localStorage keys** — `project-view-mode` (kanban/list), `task-list-collapsed-sections` (JSON объект свёрнутых секций).
- **Миграции** — Не потребовались, работаем с существующими данными.

---

## Files

### Created
- `calculator/src/components/tasks/TaskListView.jsx`
- `calculator/src/components/tasks/TaskListSection.jsx`
- `calculator/src/components/tasks/TaskListRow.jsx`

### Modified
- `calculator/src/pages/projects/ProjectPage.jsx`
- `calculator/src/components/tasks/index.js`

---

## Next Steps

- Потенциально: добавить фильтрацию/поиск задач (оба вида)
- Потенциально: bulk actions (массовый выбор + смена статуса)
- Потенциально: inline editing статуса через dropdown в list view
