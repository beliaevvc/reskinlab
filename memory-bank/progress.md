# Progress Log

## Kanban Drag Card Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Исправлен визуальный баг: при перетаскивании карточки задачи в Task Board она растягивалась на всю ширину. Ghost-элемент терял CSS-контекст родительской колонки.

### Solution
- Ghost получает фиксированные размеры через `getBoundingClientRect()`
- Off-screen позиционирование (`position: fixed; top: -1000px`)
- Центрирование drag image относительно курсора

### Files Modified
- `calculator/src/components/tasks/KanbanBoard.jsx` — функция `handleDragStart()`

### Archive Reference
📄 `memory-bank/archive/archive-kanban-drag-card-fix.md`
📄 `memory-bank/reflection/reflection-kanban-drag-card-fix.md`

---

## Auto Task Names Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Комплексное исправление системы автоматического создания задач при первой оплате проекта:
- Названия задач не соответствовали калькулятору (сырые item_id)
- Триггер не обрабатывал проекты в статусе 'draft'
- UI не обновлялся после подтверждения платежа
- Лишние UI элементы (Initialize Stages, связь со спецификацией)

### Solution
- Обновлена функция `get_item_task_name()` с правильными названиями из `categories.js`
- Обновлён триггер `auto_create_tasks_on_first_payment()` (добавлен 'draft', создание стадий)
- Добавлена инвалидация кэша `['tasks']` и `['stages']` в `useConfirmPayment`
- Удалены лишние UI элементы

### Files Modified
- `calculator/src/hooks/useInvoices.js` — инвалидация кэша tasks/stages
- `calculator/src/hooks/useProjects.js` — инвалидация при удалении
- `calculator/src/pages/projects/ProjectPage.jsx` — удалена плашка Initialize Stages
- `calculator/src/components/tasks/TaskDetailModal.jsx` — удалена секция связи
- `calculator/src/components/tasks/TaskCard.jsx` — удалены бейджи spec_item
- `calculator/supabase/migrations/028_fix_item_names_from_calculator.sql` — миграция

### Archive Reference
📄 `memory-bank/archive/archive-auto-task-names-fix.md`
📄 `memory-bank/reflection/reflection-auto-task-names-fix.md`

---

## Account Switcher Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
При переключении аккаунтов через AccountSwitcher профиль не обновлялся. Root cause — пропуск `SIGNED_IN` event препятствовал вызову `fetchProfile()` для нового пользователя.

### Solution
- Явный вызов `setUser()` и `fetchProfile()` в функции `signIn()` после успешной авторизации
- `force=true` для обхода кеша localStorage

### Files Modified
- `calculator/src/contexts/AuthContext.jsx` — добавлен явный вызов fetchProfile в signIn
- `calculator/src/components/admin/AccountSwitcher.jsx` — исправлен warning про вложенные кнопки
- `memory-bank/systemPatterns.md` — добавлена документация паттерна

### Archive Reference
📄 `memory-bank/archive/archive-account-switcher-fix.md`

---

## Auth Hanging Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Критический баг: приложение зависало при перезагрузке страницы. Root cause — Supabase Auth event `SIGNED_IN` срабатывает до готовности токена, запросы к базе зависали.

### Solution
- Пропуск `SIGNED_IN` event, обработка только `INITIAL_SESSION`
- Таймаут 3 секунды на запрос профиля
- Кэширование профиля в localStorage

### Files Modified
- `calculator/src/contexts/AuthContext.jsx` — основной фикс

### Archive Reference
📄 `memory-bank/archive/archive-auth-hanging-fix.md`

---

## Admin Dashboard & Users Page Improvements — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Dashboard & Users Fixes
| Item | Status | Notes |
|------|--------|-------|
| Fix invoice revenue display in dashboard | ✅ | Исправлено использование amount_usd вместо total_amount |
| Fix revenue display in Users page | ✅ | Добавлен расчет выручки для каждого пользователя |
| Improve Users table UX | ✅ | Добавлены клики на колонки для открытия разных вкладок |
| Add last_login_at tracking | ✅ | Добавлено поле и логика обновления при входе |
| Improve UserDetailModal Projects tab | ✅ | Добавлена информация о спецификациях, инвойсах, workflow |
| Fix UserDetailModal size | ✅ | Установлен фиксированный размер карточки |

### Files Created
- `calculator/supabase/migrations/026_add_last_login_at_to_profiles.sql` - Добавлено поле last_login_at

### Files Modified
- `calculator/src/hooks/useDashboard.js` - Исправлено использование amount_usd
- `calculator/src/hooks/useUsers.js` - Исправлено использование amount_usd, добавлен расчет выручки
- `calculator/src/hooks/useClientActivity.js` - Исправлено использование amount_usd
- `calculator/src/components/admin/UsersTable.jsx` - Добавлены клики на колонки
- `calculator/src/components/admin/UserDetailModal.jsx` - Фиксированный размер, улучшена вкладка Projects
- `calculator/src/pages/admin/UsersPage.jsx` - Обновлена логика открытия модальных окон
- `calculator/src/contexts/AuthContext.jsx` - Добавлена логика обновления last_login_at
- `calculator/src/lib/utils.js` - Добавлена функция formatDateTime

### Archive Reference
📄 `memory-bank/archive/archive-admin-dashboard-users-improvements.md`

---

## Task Spec Item Templates Management — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Task Templates Management System
| Item | Status | Notes |
|------|--------|-------|
| Task spec item templates table | ✅ | Таблица для управления шаблонами задач из спецификации |
| Template editing UI | ✅ | UI для редактирования всех шаблонов в админке |
| Checklist support in templates | ✅ | Возможность задавать чеклисты для шаблонов |
| Auto-create templates for all items | ✅ | Автоматическое создание шаблонов для всех пунктов калькулятора |
| Auto-create templates for new items | ✅ | Автоматическое создание шаблонов для новых пунктов при использовании |
| Task-spec connection display | ✅ | Отображение связи задач с пунктами спецификации в UI |
| Checklist access control | ✅ | Просмотр для всех, редактирование только для админа и AM |

### Files Created
- `calculator/supabase/migrations/018_task_spec_item_templates.sql` - Таблица шаблонов
- `calculator/supabase/migrations/019_update_task_creation_with_spec_templates.sql` - Обновление функции создания задач
- `calculator/supabase/migrations/020_update_checklist_policies_for_clients.sql` - RLS политики для чеклистов
- `calculator/supabase/migrations/021_add_checklist_to_task_templates.sql` - Поле checklist_items
- `calculator/supabase/migrations/022_update_task_creation_with_checklists.sql` - Создание чеклистов из шаблонов
- `calculator/supabase/migrations/023_create_all_spec_item_templates.sql` - Автоматическое создание шаблонов для всех пунктов
- `calculator/supabase/migrations/024_auto_create_template_for_new_items.sql` - Автоматическое создание для новых пунктов
- `calculator/supabase/migrations/025_update_get_item_task_name.sql` - Обновление функции get_item_task_name
- `calculator/src/hooks/useTaskSpecItemTemplates.js` - Хук для работы с шаблонами
- `calculator/src/components/admin/TemplateChecklistEditor.jsx` - Компонент для редактирования чеклистов

### Files Modified
- `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` - Добавлена секция управления шаблонами
- `calculator/src/components/tasks/TaskCard.jsx` - Добавлены бейджи связи со спецификацией
- `calculator/src/components/tasks/TaskDetailModal.jsx` - Добавлена информация о связи, контроль доступа к чеклистам
- `calculator/src/components/tasks/TaskChecklist.jsx` - Добавлен prop canEdit для контроля доступа

### Archive Reference
📄 `memory-bank/archive/archive-task-spec-item-templates-management.md`

---

## Project Stages Management & Offers Filtering — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Stage Management System
| Item | Status | Notes |
|------|--------|-------|
| Stage activation with cascade | ✅ | Активация всех предыдущих pending этапов |
| Stage deactivation with cascade | ✅ | Деактивация всех последующих активных этапов |
| Confirmation modal | ✅ | Модальное окно с отображением затронутых этапов |
| Role-based access | ✅ | Только админы и AM могут управлять этапами |
| Visual feedback | ✅ | Зеленый для активации, красный для деактивации |

#### Offers Filtering System
| Item | Status | Notes |
|------|--------|-------|
| Client filter component | ✅ | Компонент с поиском в реальном времени |
| Admin/AM offers view | ✅ | Отображение всех офферов для админов/AM |
| Client offers view | ✅ | Клиенты видят только свои офферы |
| AM route | ✅ | Добавлен маршрут `/am/offers` для AM |
| Search functionality | ✅ | Поиск клиентов по имени |

### Files Created
- `calculator/src/components/project/StageChangeModal.jsx` - Модальное окно подтверждения смены этапа
- `calculator/src/components/offers/ClientFilter.jsx` - Компонент фильтра клиентов с поиском

### Files Modified
- `calculator/src/hooks/useStages.js` - Добавлены функции каскадной активации/деактивации
- `calculator/src/hooks/useOffers.js` - Добавлена функция `useAllOffers()` для админов/AM
- `calculator/src/components/project/ProjectStages.jsx` - Добавлена логика клика для админов/AM
- `calculator/src/pages/projects/ProjectPage.jsx` - Интеграция модального окна
- `calculator/src/pages/offers/OffersPage.jsx` - Добавлена фильтрация по клиентам
- `calculator/src/App.jsx` - Добавлен маршрут `/am/offers`
- `calculator/src/components/layout/AppSidebar.jsx` - Добавлена ссылка "Offers" для AM
- `calculator/src/components/offers/index.js` - Добавлены экспорты новых компонентов

### Archive Reference
📄 `memory-bank/archive/archive-project-stages-management-offers-filtering.md`

---

## Invoice Rejection Logic Improvement — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Invoice Rejection Logic Update
| Item | Status | Notes |
|------|--------|-------|
| Simplified rejection flow | ✅ | Always return to pending with comment |
| Removed "Reject Permanently" option | ✅ | Single "Return to Pending" option |
| Client comment display | ✅ | Yellow warning block in InvoiceModal |
| Admin comment display | ✅ | Neutral info block in InvoiceModal |
| Visual indicator in InvoiceCard | ✅ | "Needs correction" badge |
| Removed "Rejected" section | ✅ | Status no longer used |

### Files Modified
- `calculator/src/hooks/useInvoices.js` - Simplified `useRejectPayment` hook
- `calculator/src/components/project/InvoiceModal.jsx` - Updated rejection form and comment display
- `calculator/src/pages/invoices/InvoicesPage.jsx` - Removed "Rejected" section
- `calculator/src/components/invoices/InvoiceCard.jsx` - Added visual indicator

### Archive Reference
📄 `memory-bank/archive/archive-invoice-rejection-improvement.md`

---

## Payment Confirmation Flow — ARCHIVED ✅

### Date: 2026-02-02

### Completed Items

#### Payment Confirmation System
| Item | Status | Notes |
|------|--------|-------|
| Database Migration (rejected status) | ✅ | `009_invoice_rejection.sql` |
| RLS Policies for staff | ✅ | Staff can update invoice status |
| usePendingConfirmationsCount hook | ✅ | Badge count for admin/AM |
| useConfirmPayment hook | ✅ | Confirm payment flow |
| useRejectPayment hook | ✅ | Reject payment with reason |
| InvoiceModal admin UI | ✅ | Confirm/Reject buttons |
| AppSidebar badge | ✅ | Pending confirmations indicator |
| InvoicesPage status grouping | ✅ | Awaiting/Rejected sections |

#### Bug Fixes
| Item | Status | Notes |
|------|--------|-------|
| Client display in admin invoices | ✅ | Nested selects for client data |
| Invoice status categorization | ✅ | Fixed awaiting_confirmation grouping |
| Modal overlay (React Portals) | ✅ | Fixed "line of light" issue |
| Project deletion cascade | ✅ | Safe deletion helpers |
| Admin offer acceptance | ✅ | Disabled for admin role |

### Files Created
- `calculator/supabase/migrations/009_invoice_rejection.sql`
- `calculator/supabase/migrations/010_admin_delete_all.sql`

### Files Modified
- `calculator/src/hooks/useInvoices.js` - Payment confirmation hooks
- `calculator/src/components/project/InvoiceModal.jsx` - Admin confirmation UI
- `calculator/src/components/layout/AppSidebar.jsx` - Badge indicator
- `calculator/src/pages/invoices/InvoicesPage.jsx` - Status grouping
- `calculator/src/components/invoices/InvoiceCard.jsx` - Client display
- `calculator/src/components/project/OfferModal.jsx` - Admin restriction
- `calculator/src/lib/invoiceUtils.js` - Rejected status support
- `calculator/src/hooks/useProjects.js` - Safe project deletion
- Multiple modal components - React Portals fix

### Archive Reference
📄 `memory-bank/archive/archive-payment-confirmation-flow.md`

---

## Phase 2: Calculator Integration — COMPLETE

### Date: 2026-02-01

### Completed Items

#### 2.1 State Management
| Item | Status | Notes |
|------|--------|-------|
| calculatorStore.js | ✅ | Zustand with persistence |
| useProjects.js | ✅ | CRUD hooks with React Query |
| useSpecifications.js | ✅ | CRUD + finalize + version |
| useAutoSave.js | ✅ | Debounced auto-save |

#### 2.2 Projects Flow
| Item | Status | Notes |
|------|--------|-------|
| CreateProjectModal | ✅ | Modal for new project |
| ProjectCard | ✅ | Card component |
| ProjectsPage | ✅ | List with empty state |
| ProjectDetailPage | ✅ | Detail + specs list |

#### 2.3 Specifications Flow
| Item | Status | Notes |
|------|--------|-------|
| SpecificationCard | ✅ | Version, status, actions |
| FinalizeConfirmModal | ✅ | Confirmation with warning |
| SpecificationDetailPage | ✅ | Full detail view + finalize |

#### 2.4 Calculator Enhancement
| Item | Status | Notes |
|------|--------|-------|
| ProjectSelector | ✅ | Dropdown with create |
| SaveDraftButton | ✅ | Save or create project |
| DraftStatusBadge | ✅ | Status indicator |
| CalculatorPage | ✅ | Integration complete |
| Router | ✅ | New routes added |

### Build Status
```
✓ npm run build — SUCCESS
✓ 181 modules transformed
✓ 575KB bundle (gzip: 157KB)
```

### Files Created

```
src/
├── stores/
│   └── calculatorStore.js          ← Zustand store
│
├── hooks/
│   ├── useProjects.js              ← Projects CRUD
│   ├── useSpecifications.js        ← Specifications CRUD
│   └── useAutoSave.js              ← Auto-save hook
│
├── components/
│   ├── projects/
│   │   ├── CreateProjectModal.jsx
│   │   ├── ProjectCard.jsx
│   │   └── index.js
│   │
│   ├── specifications/
│   │   ├── SpecificationCard.jsx
│   │   ├── FinalizeConfirmModal.jsx
│   │   └── index.js
│   │
│   └── calculator/
│       ├── ProjectSelector.jsx
│       ├── DraftStatusBadge.jsx
│       ├── SaveDraftButton.jsx
│       └── index.js
│
├── pages/
│   ├── projects/
│   │   ├── ProjectsPage.jsx
│   │   └── ProjectDetailPage.jsx
│   │
│   └── specifications/
│       └── SpecificationDetailPage.jsx
│
└── App.jsx (updated routes)
```

### User Flow (Phase 2)

```
Dashboard → Projects (list)
                ↓
         New Project (modal)
                ↓
Calculator → Select Project → Save Draft
                ↓
         Specification saved
                ↓
Project Detail → Specifications list
                ↓
         Specification Detail
                ↓
         Finalize (modal) → Locked
```

---

## Phase 1: Foundation — COMPLETE

(см. предыдущий progress log)

---

### Next Phase

**Phase 3: Offers & Invoices**
- Offer generation from finalized specification
- Legal acceptance flow
- Invoice generation
- Payment tracking
