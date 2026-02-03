# Tasks

## ⚠️ КРИТИЧЕСКИЙ ФИКС (4 Февраля 2026) — ARCHIVED ✅

**Auth Hanging Fix** — ARCHIVED ✅

### Summary
Исправлено зависание приложения при перезагрузке. Root cause: Supabase Auth event `SIGNED_IN` срабатывает до готовности токена.

### Archive Documents
- **Archive:** `memory-bank/archive/archive-auth-hanging-fix.md`
- **Reflection:** `memory-bank/reflection/reflection-auth-hanging-fix.md`
- **Pattern:** `memory-bank/systemPatterns.md`

---

## Current Task
**Fix Task Titles with ID-like Names** — IN PROGRESS 🔄

### Overview
Исправление проблемы, когда часть задач в проекте называются как ID (например, "ui_pack_d (x1)") вместо нормальных названий (например, "UI Pack (Detailed)").

### Problem
- Некоторые задачи имеют названия, совпадающие с `item_id` (например, "ui_pack_d", "pop_win_s")
- Это происходит, когда шаблоны в `task_spec_item_templates` были созданы с `task_title = item_id`
- Или когда существующие задачи были созданы до исправления шаблонов

### Solution
Создана миграция `027_fix_task_titles_in_templates.sql`, которая:
1. Обновляет все шаблоны в `task_spec_item_templates`, где `task_title = item_id`
2. Исправляет существующие задачи, где `title = spec_item_id`
3. Использует функцию `get_item_task_name()` для получения нормальных названий

### Status
- [x] Создана миграция для исправления шаблонов
- [x] Добавлено исправление существующих задач
- [ ] Миграция применена в базе данных
- [ ] Проверено, что все задачи имеют нормальные названия

### Implementation Details

#### Database Migration
- **File:** `calculator/supabase/migrations/027_fix_task_titles_in_templates.sql`
  - Обновляет шаблоны, где `task_title = item_id`
  - Обновляет существующие задачи, где `title = spec_item_id`
  - Использует функцию `get_item_task_name()` для получения нормальных названий

### Next Steps
- [ ] Применить миграцию в базе данных
- [ ] Проверить, что все задачи имеют нормальные названия
- [ ] Убедиться, что новые задачи создаются с правильными названиями

---

## Previous Task
**Project Stages Management & Offers Filtering** — ARCHIVED ✅

### Status
- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete

### Summary
Реализованы управление этапами проекта с каскадной логикой активации/деактивации и фильтрация офферов по клиентам для админов и AM.

### Archive Documents
- **Archive:** `memory-bank/archive/archive-project-stages-management-offers-filtering.md`
- **Reflection:** `memory-bank/reflection/reflection-project-stages-management-offers-filtering.md`

---

## Previous Task
**Task Spec Item Templates Management** — ARCHIVED ✅

### Status
- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete

### Summary
Реализована комплексная система управления шаблонами задач из спецификации калькулятора. Система позволяет админу настраивать названия, описания и чеклисты для автоматически создаваемых задач на основе пунктов спецификации. Дополнительно реализована автоматическая инициализация шаблонов для всех пунктов калькулятора и автоматическое создание шаблонов для новых пунктов при их первом использовании.

### Archive Documents
- **Archive:** `memory-bank/archive/archive-task-spec-item-templates-management.md`
- **Reflection:** `memory-bank/reflection/reflection-task-spec-item-templates-management.md`

---

## Current Task
**Admin Dashboard & Users Page Improvements** — COMPLETED ✅

### Overview
Исправление проблем с отображением финансовых данных и улучшение интерфейса управления пользователями:
- Исправление отображения оплаченных инвойсов в дашборде админа
- Исправление отображения выручки в разделе Users
- Улучшение UX таблицы Users (клики на колонки)
- Добавление отслеживания последнего входа пользователей
- Улучшение карточки пользователя (фиксированный размер, расширенная информация о проектах)

### Status
- [x] Исправлено использование неправильных полей БД (total_amount → amount_usd)
- [x] Исправлена фильтрация оплаченных инвойсов
- [x] Добавлен расчет выручки для пользователей
- [x] Улучшен интерфейс таблицы Users (клики на колонки)
- [x] Добавлено поле last_login_at в таблицу profiles
- [x] Добавлена логика обновления last_login_at при входе
- [x] Улучшена вкладка Projects в карточке пользователя
- [x] Установлен фиксированный размер карточки пользователя
- [x] Убрана избыточная кнопка Close
- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete

### Implementation Details

#### Database Migrations
- **File:** `calculator/supabase/migrations/026_add_last_login_at_to_profiles.sql`
  - Добавлено поле `last_login_at` в таблицу `profiles`
  - Создан индекс для быстрых запросов

#### Frontend Fixes
- **Hook:** `calculator/src/hooks/useDashboard.js`
  - Исправлено использование `amount_usd` вместо `total_amount`
  - Улучшена фильтрация оплаченных инвойсов
  - Исправлен расчет месячной выручки (используется paid_at вместо created_at)
- **Hook:** `calculator/src/hooks/useUsers.js`
  - Исправлено использование `amount_usd`
  - Добавлен расчет выручки для каждого пользователя
  - Улучшена загрузка данных проектов (отдельные запросы вместо вложенных)
  - Добавлена обработка ошибок
- **Hook:** `calculator/src/hooks/useClientActivity.js`
  - Исправлено использование `amount_usd`

#### UI Improvements
- **Component:** `calculator/src/components/admin/UsersTable.jsx`
  - Добавлены клики на колонки (имя/почта → Profile, Projects → Projects, Revenue → Finance, Role → смена роли)
  - Убрана колонка Actions и кнопки View/Edit Role
- **Component:** `calculator/src/components/admin/UserDetailModal.jsx`
  - Фиксированный размер карточки (900x700px на больших экранах)
  - Улучшена вкладка Projects (количество спецификаций, статистика инвойсов, прогресс workflow, текущая стадия)
  - Убрана кнопка Close внизу
  - Добавлен проп `initialTab` для открытия на нужной вкладке
- **Context:** `calculator/src/contexts/AuthContext.jsx`
  - Добавлена логика обновления `last_login_at` при входе и переключении аккаунтов
- **Utils:** `calculator/src/lib/utils.js`
  - Добавлена функция `formatDateTime` для отображения даты и времени

### Reflection Highlights
- **What Went Well**: Быстрое выявление проблемы, систематический подход к исправлениям, улучшение UX
- **Challenges**: Проблемы с вложенными запросами Supabase, синхронизация данных при переключении аккаунтов, обработка пустых данных
- **Lessons Learned**: Supabase вложенные запросы могут не работать как ожидается, нужно использовать parseFloat() для DECIMAL полей, важно проверять схему БД перед использованием полей
- **Next Steps**: Добавить валидацию данных, создать документацию полей БД, оптимизировать запросы

### Reflection Document
📄 `memory-bank/reflection/reflection-admin-dashboard-users-improvements.md`

### Archive Documents
- **Archive:** `memory-bank/archive/archive-admin-dashboard-users-improvements.md`
- **Reflection:** `memory-bank/reflection/reflection-admin-dashboard-users-improvements.md`

---

## Previous Task
**Task Spec Item Templates Management** — ARCHIVED ✅

### Overview
Управление шаблонами задач из спецификации в админке:
- Возможность редактирования названий задач для каждого пункта спецификации калькулятора
- Настройка шаблонов для задач с анимацией
- Отображение связи задачи с пунктом спецификации в UI

### Status
- [x] Создать таблицу шаблонов задач из спецификации (task_spec_item_templates)
- [x] Добавить поля spec_item_id и spec_anim_id в таблицу tasks
- [x] Обновить функцию создания задач для использования шаблонов и сохранения связи
- [x] Создать хук useTaskSpecItemTemplates для работы с шаблонами
- [x] Добавить UI в TaskAutoCreationSettingsPage для управления шаблонами
- [x] Показывать связь задачи с пунктом спецификации в TaskCard и TaskDetailModal
- [x] Убрать скролл из списка шаблонов задач из спецификации
- [x] Исправить доступ к чеклистам: просмотр для всех, редактирование только для админа и AM
- [x] Добавить возможность задавать чеклист для шаблонов автоматических задач в админке
- [x] Автоматически создавать чеклисты из шаблонов при создании задач
- [x] Автоматически создавать шаблоны для всех пунктов калькулятора при миграции
- [x] Автоматически создавать шаблоны для новых пунктов при первом использовании
- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete

### Implementation Details

#### Database Migrations
- **File:** `calculator/supabase/migrations/018_task_spec_item_templates.sql`
  - Создана таблица `task_spec_item_templates` для шаблонов задач из спецификации
  - Добавлены поля `spec_item_id` и `spec_anim_id` в таблицу `tasks`
  - Созданы дефолтные шаблоны для всех item_id из калькулятора
- **File:** `calculator/supabase/migrations/019_update_task_creation_with_spec_templates.sql`
  - Обновлена функция `auto_create_tasks_on_first_payment()` для использования шаблонов
  - Добавлено сохранение `spec_item_id` и `spec_anim_id` при создании задач
  - Поддержка шаблонов для задач с анимацией (с плейсхолдерами {item_name}, {anim_name})
- **File:** `calculator/supabase/migrations/020_update_checklist_policies_for_clients.sql`
  - Обновлены RLS политики для `task_checklist_items` - просмотр для всех, редактирование только для админа и AM
- **File:** `calculator/supabase/migrations/021_add_checklist_to_task_templates.sql`
  - Добавлено поле `checklist_items` (JSONB) в таблицы `task_auto_templates` и `task_spec_item_templates`
- **File:** `calculator/supabase/migrations/022_update_task_creation_with_checklists.sql`
  - Обновлена функция `auto_create_tasks_on_first_payment()` для автоматического создания чеклистов из шаблонов

#### Frontend Components
- **Hook:** `calculator/src/hooks/useTaskSpecItemTemplates.js` - CRUD операции с шаблонами
- **Page:** `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` - добавлена секция управления шаблонами задач из спецификации, убран скролл, добавлены редакторы чеклистов
- **Component:** `calculator/src/components/admin/TemplateChecklistEditor.jsx` - компонент для редактирования чеклистов в шаблонах задач
- **Component:** `calculator/src/components/tasks/TaskCard.jsx` - добавлены бейджи для связи с пунктом спецификации
- **Component:** `calculator/src/components/tasks/TaskDetailModal.jsx` - добавлена секция с информацией о связи со спецификацией
- **Component:** `calculator/src/components/tasks/TaskChecklist.jsx` - добавлен prop `canEdit` для контроля доступа к редактированию

#### Features
1. **Управление шаблонами задач из спецификации:**
   - Редактирование названия задачи для каждого item_id
   - Настройка описания задачи (с поддержкой {qty})
   - Настройка шаблонов для задач с анимацией (с поддержкой {item_name}, {anim_name})

2. **Отображение связи:**
   - В TaskCard показывается бейдж с названием пункта спецификации
   - В TaskCard показывается бейдж с типом анимации (если есть)
   - В TaskDetailModal показывается подробная информация о связи

3. **Чеклисты в шаблонах задач:**
   - Админ может задавать чеклист для каждого шаблона автоматических задач
   - Админ может задавать чеклист для каждого шаблона задач из спецификации
   - При создании задач из шаблонов автоматически создаются чеклисты
   - Чеклисты в задачах: просмотр доступен всем, редактирование только админу и AM

### Files Created/Modified

#### New Files
- `calculator/supabase/migrations/018_task_spec_item_templates.sql` - миграция БД (таблица шаблонов)
- `calculator/supabase/migrations/019_update_task_creation_with_spec_templates.sql` - миграция БД (обновление функции)
- `calculator/supabase/migrations/020_update_checklist_policies_for_clients.sql` - миграция БД (RLS политики для чеклистов)
- `calculator/supabase/migrations/021_add_checklist_to_task_templates.sql` - миграция БД (поле checklist_items в шаблонах)
- `calculator/supabase/migrations/022_update_task_creation_with_checklists.sql` - миграция БД (создание чеклистов из шаблонов)
- `calculator/src/hooks/useTaskSpecItemTemplates.js` - хук для работы с шаблонами
- `calculator/src/components/admin/TemplateChecklistEditor.jsx` - компонент для редактирования чеклистов в шаблонах

#### Modified Files
- `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` - добавлена секция управления шаблонами, убран скролл, добавлены редакторы чеклистов
- `calculator/src/components/tasks/TaskCard.jsx` - добавлены бейджи связи со спецификацией
- `calculator/src/components/tasks/TaskDetailModal.jsx` - добавлена информация о связи, чеклисты с контролем доступа (canEdit prop)
- `calculator/src/components/tasks/TaskChecklist.jsx` - добавлен prop canEdit для контроля доступа к редактированию

### Reflection Highlights
- **What Went Well**: Модульная архитектура миграций, автоматизация процессов, переиспользуемые компоненты, хорошая UX, гибкость системы
- **Challenges**: Синхронизация состояния при создании новых шаблонов, понимание требований пользователя, отображение всех пунктов из калькулятора
- **Lessons Learned**: Важность автоматической инициализации данных, управления состоянием для CRUD операций, уточнения требований, рефакторинга больших функций
- **Next Steps**: Применить миграции в production, добавить валидацию данных, рефакторинг больших функций, добавить тесты

### Reflection Document
📄 `memory-bank/reflection/reflection-task-spec-item-templates-management.md`

### Archive Documents
- **Archive:** `memory-bank/archive/archive-task-spec-item-templates-management.md`
- **Reflection:** `memory-bank/reflection/reflection-task-spec-item-templates-management.md`

---

## Previous Task
**Project Status Workflow** — COMPLETED ✅

### Overview
Обновление логики статусов проектов:
- При акцепте оффера проект переходит в статус `active`
- При подтверждении первой оплаты проект переходит в статус `in_production` (создаются задачи, активируется первый этап)
- Админ и AM могут завершить проект (статус `completed`)
- Админ и AM могут архивировать завершенные или отмененные проекты (статус `archived`)

### Status
- [x] Создать миграцию для обновления статусов проектов (добавить in_production и archived)
- [x] Создать триггер для обновления статуса проекта при акцепте оффера -> active
- [x] Обновить функцию auto_create_tasks_on_first_payment() для изменения статуса на in_production
- [x] Создать функции для завершения и архивирования проекта
- [x] Добавить UI кнопки завершения и архивирования в ProjectPage

### Implementation Details

#### Database Migration
- **File:** `calculator/supabase/migrations/016_project_status_workflow.sql`
  - Обновлен CHECK constraint для статусов проектов (добавлены `in_production` и `archived`)
  - Создана функция `update_project_status_on_offer_accepted()` для обновления статуса при акцепте оффера
  - Создан триггер `trigger_update_project_status_on_offer_accepted` на таблице `offers`
  - Обновлена функция `auto_create_tasks_on_first_payment()` для изменения статуса на `in_production`
  - Созданы функции `complete_project()` и `archive_project()` с проверкой прав доступа

#### Frontend Components
- **Hook:** `calculator/src/hooks/useProjects.js` - добавлены `useCompleteProject()` и `useArchiveProject()`
- **Component:** `calculator/src/components/project/ProjectHeader.jsx` - добавлены кнопки завершения и архивирования
- **Page:** `calculator/src/pages/projects/ProjectPage.jsx` - интегрированы обработчики завершения и архивирования

#### Features
1. **Автоматическое изменение статусов:**
   - При акцепте оффера: `draft`/`pending_payment` → `active`
   - При первой оплате: `active`/`pending_payment` → `in_production`

2. **Завершение проекта:**
   - Доступно админу и AM
   - Меняет статус на `completed`
   - Устанавливает `completed_at`
   - Доступно для проектов в статусах: `in_production`, `active`, `on_hold`

3. **Архивирование проекта:**
   - Доступно админу и AM
   - Меняет статус на `archived`
   - Доступно только для проектов в статусах: `completed`, `cancelled`

### Files Created/Modified

#### New Files
- `calculator/supabase/migrations/016_project_status_workflow.sql` - миграция БД (логика статусов)
- `calculator/supabase/migrations/017_update_existing_projects_status.sql` - миграция БД (обновление существующих проектов)

#### Modified Files
- `calculator/src/hooks/useProjects.js` - добавлены функции завершения и архивирования
- `calculator/src/components/project/ProjectHeader.jsx` - добавлены кнопки и статусы
- `calculator/src/pages/projects/ProjectPage.jsx` - интегрированы обработчики

### Migration Details

#### 017_update_existing_projects_status.sql
Обновляет статусы существующих проектов:
- Проекты с задачами и активированным этапом `briefing` → `in_production`
- Проекты с акцептированным оффером, но без задач → `active`

---

## Previous Task
**Auto Task Creation on First Payment** — IN PROGRESS 🔄

### Overview
Автоматическое создание задач в проекте при подтверждении первой оплаты:
- Задачи создаются из пунктов спецификации
- Анимации элементов разделяются на отдельные задачи (если включено в настройках)
- Дополнительные автоматические задачи создаются из шаблонов (например, брифинг)
- Админ может настраивать параметры автоматического создания задач
- Админ может управлять шаблонами дополнительных задач (добавление, изменение, удаление)

### Status
- [x] Создать таблицу настроек автоматических задач (task_auto_creation_settings)
- [x] Создать функцию/триггер для автоматического создания задач при подтверждении первой оплаты
- [x] Реализовать парсинг спецификации и создание задач из items (с разделением анимаций)
- [x] Создать таблицу шаблонов дополнительных задач (task_auto_templates)
- [x] Обновить функцию создания задач для использования шаблонов
- [x] Создать админ-панель для управления настройками автоматических задач
- [x] Добавить управление шаблонами дополнительных задач в админ-панели
- [x] Интегрировать логику создания задач в useConfirmPayment (через триггер)

### Implementation Details

#### Database Migrations
- **File:** `calculator/supabase/migrations/011_auto_task_creation.sql`
  - Создана таблица `task_auto_creation_settings` для хранения настроек
  - Создана функция `auto_create_tasks_on_first_payment()` для автоматического создания задач
  - Создан триггер `trigger_auto_create_tasks_on_first_payment` на таблице `invoices`
  - Добавлены вспомогательные функции `get_item_task_name()` и `get_animation_name()`
- **File:** `calculator/supabase/migrations/014_task_auto_templates.sql`
  - Создана таблица `task_auto_templates` для шаблонов дополнительных автоматических задач
  - Добавлен дефолтный шаблон для брифинга
- **File:** `calculator/supabase/migrations/015_update_auto_task_creation_with_templates.sql`
  - Обновлена функция `auto_create_tasks_on_first_payment()` для использования шаблонов
  - Удалена жестко закодированная логика брифинга

#### Frontend Components
- **Hook:** `calculator/src/hooks/useTaskAutoCreationSettings.js` - работа с настройками
- **Hook:** `calculator/src/hooks/useTaskAutoTemplates.js` - работа с шаблонами задач (CRUD)
- **Page:** `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` - админ-панель настроек
  - Управление шаблонами дополнительных задач (добавление, редактирование, удаление)
  - Настройка задач из спецификации
  - Общие настройки (исполнитель по умолчанию, дедлайн)
- **Route:** `/admin/task-settings` - добавлен в App.jsx
- **Sidebar:** Добавлена ссылка "Task Settings" в админ-меню

#### Features
1. **Автоматическое создание задач:**
   - При подтверждении первой оплаты (milestone_order = 1)
   - Защита от повторного создания (проверка существующих задач)
   - Создание задач из всех items спецификации с qty > 0

2. **Разделение анимаций:**
   - Если `animation_tasks_separate = true`, для каждого элемента с анимацией создается отдельная задача
   - Анимации: AN-L, AN-S, AN-F (none не создает отдельную задачу)

3. **Дополнительные автоматические задачи (шаблоны):**
   - Создаются из шаблонов в таблице `task_auto_templates`
   - Каждый шаблон имеет: название, описание, этап проекта, порядок создания, дедлайн, исполнителя
   - Можно включать/отключать отдельные шаблоны
   - Админ может добавлять, редактировать и удалять шаблоны через админ-панель
   - Дефолтный шаблон для брифинга создается автоматически при миграции

4. **Настройки админа:**
   - Управление шаблонами дополнительных задач (CRUD операции)
   - Включение/отключение создания задач из спецификации
   - Разделение анимаций на отдельные задачи
   - Назначение исполнителя по умолчанию (для задач из спецификации)
   - Дней до дедлайна по умолчанию (для задач из спецификации)

### Files Created/Modified

#### New Files
- `calculator/supabase/migrations/011_auto_task_creation.sql` - миграция БД (настройки и базовая функция)
- `calculator/supabase/migrations/014_task_auto_templates.sql` - миграция БД (таблица шаблонов)
- `calculator/supabase/migrations/015_update_auto_task_creation_with_templates.sql` - миграция БД (обновление функции)
- `calculator/src/hooks/useTaskAutoCreationSettings.js` - хук для работы с настройками
- `calculator/src/hooks/useTaskAutoTemplates.js` - хук для работы с шаблонами задач
- `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` - страница настроек (обновлена)

#### Modified Files
- `calculator/src/hooks/useInvoices.js` - добавлено обновление `confirmed_by` в `useConfirmPayment`
- `calculator/src/App.jsx` - добавлен роут `/admin/task-settings`
- `calculator/src/components/layout/AppSidebar.jsx` - добавлена ссылка "Task Settings" и иконка settings

### Next Steps
- [ ] Протестировать создание задач при подтверждении первой оплаты
- [ ] Проверить работу настроек админа
- [ ] Убедиться, что задачи не создаются повторно

---

## Previous Task
**Invoice Rejection Logic Improvement** — ARCHIVED ✅

### Status
- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete

### Summary
Изменена логика отклонения инвойсов: вместо тотального отклонения инвойсы возвращаются в `pending` с комментариями, видимыми клиенту и админу.

### Archive Documents
- **Archive:** `memory-bank/archive/archive-invoice-rejection-improvement.md`
- **Reflection:** `memory-bank/reflection/reflection-invoice-rejection-improvement.md`

---

## Previous Task
**Phase 7: Project Page Refactor** — PLANNING ✅

### Overview
Полный рефакторинг страницы проекта:
- Объединение 4 страниц в одну
- Канбан как основа интерфейса
- Левая сворачиваемая панель (specs/offers)
- Role Switcher для админа

### Plan Document
📄 `memory-bank/plans/project-page-refactor.md`

### Phases
- [x] **Phase 1:** Foundation — базовый лейаут ✅
- [x] **Phase 2:** Kanban 5 колонок + Stages ✅
- [x] **Phase 3:** Левая панель (Sidebar) ✅
- [x] **Phase 4:** Файлы и Approvals ✅
- [x] **Phase 5:** Role Switcher + Права ✅
- [ ] **Phase 6:** Cleanup и Polish (после тестирования)

### Phase 1 Results
**Created components:**
- `src/components/project/ProjectHeader.jsx` — шапка с инфо, статистикой, role switcher
- `src/components/project/ProjectSidebar.jsx` — сворачиваемая панель со спеками
- `src/components/project/ProjectStages.jsx` — progress bar стадий
- `src/pages/projects/ProjectPage.jsx` — новая единая страница

**Routes added (temporary /v2 for testing):**
- `/projects/:id/v2` → ProjectPage
- `/am/projects/:id/v2` → ProjectPage  
- `/admin/projects/:id/v2` → ProjectPage

---

## Previous Task
**Payment Confirmation Flow** — ARCHIVED ✅

### Status
- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete

### Archive
- **Date**: 2026-02-02
- **Archive Document**: `memory-bank/archive/archive-payment-confirmation-flow.md`
- **Reflection Document**: `memory-bank/reflection/reflection-payment-confirmation-flow.md`
- **Status**: COMPLETED ✅

---

## Previous Task
**Phase 6 Refinement** — COMPLETE ✅

---

## Phase 6 Refinement Summary

### Completed Items

#### Priority 1: Users Page Redesign ✅
- [x] Merged Users + Clients into single "Users" page
- [x] Added extended columns (projects count, revenue, last login)
- [x] Created UserDetailModal with 5 tabs (Profile, Company, Projects, Finance, Activity)
- [x] Added bulk actions (select all, change role)
- [x] Improved useUsers hook with stats aggregation

#### Priority 2: Audit Logging ✅
- [x] Created `lib/auditLog.js` utility with:
  - `logAuditEvent()` - generic event logging
  - `calculateDiff()` - before/after diff calculation
  - `logAuthEvent()` - login/logout events
  - `logPriceChange()` - pricing changes
  - `logProjectEvent()`, `logSpecificationEvent()`, `logOfferEvent()`, `logPaymentEvent()`

#### Priority 3: Calculator Pricing Migration ✅
- [x] Created migration SQL `005_price_configs_seed.sql` with all pricing data:
  - Symbols, Backgrounds, Pop-ups, UI Menus, Marketing
  - Styles, Animations coefficients
  - Usage Rights, Payment models
  - Revisions, Urgency, Volume discounts
  - Global settings
- [x] Redesigned PricingPage with collapsible categories
- [x] Added price change logging

#### Priority 4: Promo Code Auto-Generation ✅
- [x] Added `generatePromoCode()` function (RESKIN-XXXXXXXX format)
- [x] Added Generate button in PromoCodeModal
- [x] Customizable prefix support

#### Priority 5: Sidebar Update ✅
- [x] Removed "Clients" menu item
- [x] Added divider before settings section
- [x] Updated admin sidebar items (Dashboard, Users, Projects, Offers, Invoices | Calculator, Promo Codes, Audit Log)

#### Priority 6: Admin Dashboard ✅
- [x] Created useDashboard hooks (stats, activity, revenue/projects charts)
- [x] Implemented AdminDashboardPage with:
  - Main stats cards (Revenue, Projects, Users, Pending Approvals)
  - Secondary stats (This Month, Pending Revenue, Completed, Clients)
  - Revenue chart (6 months)
  - Projects chart (6 months)
  - Recent activity feed
  - Quick action links

---

## Files Created/Modified

### New Files
- `calculator/src/lib/auditLog.js`
- `calculator/src/hooks/useDashboard.js`
- `calculator/src/components/admin/UserDetailModal.jsx`
- `calculator/src/pages/admin/AdminDashboardPage.jsx`
- `calculator/supabase/migrations/005_price_configs_seed.sql`

### Modified Files
- `calculator/src/hooks/useUsers.js` - Extended with stats, bulk actions
- `calculator/src/components/admin/UsersTable.jsx` - Added columns, checkboxes
- `calculator/src/components/admin/index.js` - Added exports
- `calculator/src/pages/admin/UsersPage.jsx` - Full redesign
- `calculator/src/pages/admin/PricingPage.jsx` - Redesigned with categories
- `calculator/src/pages/admin/PromoCodesPage.jsx` - Added auto-generation
- `calculator/src/components/layout/AppSidebar.jsx` - Updated nav items
- `calculator/src/App.jsx` - Updated routes

---

## Action Required

**To populate calculator pricing in database:**
Run the following migration in Supabase SQL Editor:
```
calculator/supabase/migrations/005_price_configs_seed.sql
```

---

## Completed Phases

### Phase 6: Admin Panel (Refined) ✅
### Phase 5: Materials & Delivery ✅
### Phase 4: Project Workspace ✅
### Phase 3: Specifications & Offers ✅
### Phase 2: Calculator Integration ✅
### Phase 1: Foundation ✅
