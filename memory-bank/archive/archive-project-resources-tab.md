# TASK ARCHIVE: Project Resources Tab & UI Consistency

## METADATA
- **Task ID:** project-resources-tab
- **Date:** 2026-02-07
- **Complexity:** Level 2
- **Status:** ARCHIVED ✅

---

## SUMMARY

Реализована новая вкладка "Resources" в правой панели проекта (ProjectSidebar) для хранения внешних ссылок на инструменты проекта (Figma, GitHub, Dropbox и др.). Полный цикл: миграция БД → React Query хуки → UI компоненты → интеграция. Параллельно исправлены проблемы консистентности UI: замена нативных `<select>` на кастомный `<Select>`, добавление компактного варианта `size="sm"`, удаление дублирующего действия из dropdown.

---

## REQUIREMENTS

### Основная фича: Resources Tab
1. Новая вкладка "Resources" в ProjectSidebar
2. Admin + AM могут добавлять/редактировать/удалять ссылки
3. Все роли могут видеть ссылки
4. Предопределённые типы: Figma, GitHub, GitLab, Dropbox, Google Drive, Notion, Miro + custom
5. Автодетекция типа сервиса по URL
6. Карточки с бренд-иконками (стиль InvoiceRow)
7. Опциональное описание
8. Редактирование через модалку
9. Клик открывает URL в новой вкладке
10. Drag-and-drop сортировка
11. Favicon для custom-ссылок
12. Empty state при отсутствии ссылок
13. Подтверждение удаления через модалку

### UI Consistency Fixes
1. Role Switcher: нативный `<select>` → кастомный `<Select>` с `size="sm"`
2. FilesGalleryModal: 2 нативных `<select>` → кастомные `<Select>`
3. Удалён "Complete project" из ActionsMenu dropdown (есть отдельная кнопка)

---

## IMPLEMENTATION

### Database Layer
**Файл:** `calculator/supabase/migrations/044_project_links.sql`
- Таблица `project_links`: id, project_id, type (enum check), title, url, description, sort_order, created_by, created_at, updated_at
- Индекс: `idx_project_links_project` на (project_id, sort_order)
- RLS: clients видят ссылки своих проектов, staff — все; INSERT/UPDATE/DELETE — только staff

### Hooks Layer
**Файл:** `calculator/src/hooks/useProjectLinks.js`
- `useProjectLinks(projectId)` — fetch all links ordered by sort_order
- `useCreateProjectLink()` — insert с auto-increment sort_order (gap 1000)
- `useUpdateProjectLink()` — update с auto-updated_at
- `useDeleteProjectLink()` — delete по id
- `useReorderProjectLinks()` — batch update sort_order по массиву ID
- `detectServiceType(url)` — автодетекция типа по домену (DOMAIN_MAP)
- `SERVICE_CONFIG` — label + brand color для каждого типа

### UI Components (внутри ProjectSidebar.jsx)
- **ResourceCard** — карточка ссылки с ServiceIcon, title, description, url, actions (edit/delete) для staff, drag handle
- **ResourceModal** — модалка добавления/редактирования через createPortal. URL auto-detection, Select для типа
- **DeleteConfirmModal** — подтверждение удаления (danger стиль)
- **ResourcesEmptyState** — empty state при отсутствии ссылок
- **ServiceIcon** — 7 бренд-иконок + favicon для custom через Google S2 API

### Select Component Enhancement
**Файл:** `calculator/src/components/Select.jsx`
- Новый проп `size`: `'default'` (px-3 py-2.5 text-sm) | `'sm'` (px-2 py-1 text-xs)

### ProjectHeader Cleanup
**Файл:** `calculator/src/components/project/ProjectHeader.jsx`
- Удалены props `showComplete`, `onCompleteProject`, `isCompleting` из ActionsMenu
- Role Switcher: нативный select → `<Select size="sm">`

### FilesGalleryModal Fix
**Файл:** `calculator/src/components/project/FilesGalleryModal.jsx`
- 2 нативных `<select>` (filter + sort) → `<Select>` с options/onChange

### Cascade Delete
**Файл:** `calculator/src/hooks/useProjects.js`
- Добавлен `safeDelete('project_links', 'project_id', projectId)` в useDeleteProject

---

## TESTING

- Визуальная проверка карточек ресурсов, иконок, модалок
- Проверка горизонтального скролла табов в 280px сайдбаре
- Проверка замены нативных select на кастомные
- Удаление дублирующего действия из dropdown

---

## LESSONS LEARNED

1. **Ограниченное пространство → скроллируемость**: При добавлении элементов в фиксированный контейнер сразу закладывать горизонтальный скролл, а не уменьшать существующий контент
2. **Бренд-иконки**: Всегда использовать официальные многоцветные SVG, не одноцветные аппроксимации
3. **Нативные элементы**: Повторяющийся паттерн — нативные `<select>` проскальзывают в новые компоненты. Нужен системный аудит
4. **Дублирование действий**: При добавлении нового UI-элемента для действия — сразу удалять старый дубликат

---

## FILES

### Created
| File | Description |
|------|-------------|
| `calculator/supabase/migrations/044_project_links.sql` | Таблица + RLS |
| `calculator/src/hooks/useProjectLinks.js` | CRUD хуки + автодетекция + конфиг |

### Modified
| File | Description |
|------|-------------|
| `calculator/src/components/project/ProjectSidebar.jsx` | Resources таб + 4 компонента + DnD + MobilePanel |
| `calculator/src/components/project/ProjectHeader.jsx` | Cleanup dropdown + Select role switcher |
| `calculator/src/components/project/FilesGalleryModal.jsx` | Нативные select → Select |
| `calculator/src/components/Select.jsx` | Добавлен size="sm" |
| `calculator/src/hooks/useProjects.js` | project_links в useDeleteProject |

---

## REFERENCES
- **Reflection:** `memory-bank/reflection/reflection-project-resources-tab.md`
- **Style Guide:** `memory-bank/style-guide.md` — правило про кастомный Select
