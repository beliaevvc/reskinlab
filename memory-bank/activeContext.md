# Active Context

## Current Status
**Ready for Next Task** ✅

## Recently Completed Tasks

### Admin Dashboard & Specifications Page (5 Февраля 2026) — ARCHIVED ✅
Исправление багов в дашборде и создание страницы спецификаций:
- Фикс "Active Projects", разделение "Pending Approvals"
- Страницы `/admin/specifications` и `/am/specifications`
- **Archive:** `memory-bank/archive/archive-admin-specifications-page.md`
- **Reflection:** `memory-bank/reflection/reflection-admin-specifications-page.md`

**Примечание:** AM роль требует отдельного аудита — много функционала отсутствует или устарело.

---

### Projects & Invoices UI Improvements (5 Февраля 2026) — ARCHIVED ✅
Комплексное улучшение UI/UX страницы проектов и инвойсов:
- Фильтрация инвойсов по клиенту, проекту и спецификации
- Редизайн карточек и таблиц проектов (переключатель вида, статистика)
- Inline редактирование названия и описания проекта
- Создание переиспользуемого компонента InlineEdit
- **Archive:** `memory-bank/archive/archive-projects-ui-improvements.md`
- **Reflection:** `memory-bank/reflection/reflection-projects-ui-improvements.md`

---

### Crypto Wallets Admin (4 Февраля 2026) — COMPLETED ✅
Добавлена страница управления криптокошельками в админке для оплаты инвойсов.
- Поддержка USDT/USDC
- Сети: TRC20, ERC20, BSC, Polygon, Arbitrum, Base, Optimism
- Флаг активности для показа клиентам
- Динамическая загрузка кошельков в PaymentInfo

**Files Created:**
- `calculator/supabase/migrations/037_crypto_wallets.sql`
- `calculator/src/hooks/useCryptoWallets.js`
- `calculator/src/pages/admin/CryptoWalletsPage.jsx`

**Files Modified:**
- `calculator/src/App.jsx` — добавлен роут
- `calculator/src/components/layout/AppSidebar.jsx` — добавлен пункт меню
- `calculator/src/components/invoices/PaymentInfo.jsx` — загрузка из БД
- `calculator/src/lib/invoiceUtils.js` — удалены хардкоженные адреса

### Task Card Deadline UI Redesign (4 Февраля 2026) — ARCHIVED ✅
Редизайн секции настройки дедлайна в карточке задачи.
- **Archive:** `memory-bank/archive/archive-task-deadline-ui-redesign.md`
- **Reflection:** `memory-bank/reflection/reflection-task-deadline-ui-redesign.md`

### Multiple Specifications Fix (4 Февраля 2026) — ARCHIVED ✅
Исправлен баг: при дозаказе работ в проекте задачи не создавались для новых спецификаций.
- **Archive:** `memory-bank/archive/archive-multiple-specifications-fix.md`
- **Reflection:** `memory-bank/reflection/reflection-multiple-specifications-fix.md`

### Task Card Completion & Reorder (4 Февраля 2026) — ARCHIVED ✅
Улучшения карточек задач на Kanban доске:
- Галочка завершения задачи (для админа и AM)
- Перетаскивание задач внутри колонок для изменения порядка
- Автоскролл при перетаскивании к краям колонки
- **Archive:** `memory-bank/archive/archive-task-card-completion-reorder.md`
- **Reflection:** `memory-bank/reflection/reflection-task-card-completion-reorder.md`

### Kanban Drag Card Fix (4 Февраля 2026) — ARCHIVED ✅
Исправлен баг растягивания карточки при перетаскивании в Task Board.
- **Archive:** `memory-bank/archive/archive-kanban-drag-card-fix.md`
- **Reflection:** `memory-bank/reflection/reflection-kanban-drag-card-fix.md`

### Auto Task Names Fix (4 Февраля 2026) — ARCHIVED ✅
Комплексное исправление автоматического создания задач при первой оплате.
- **Archive:** `memory-bank/archive/archive-auto-task-names-fix.md`
- **Reflection:** `memory-bank/reflection/reflection-auto-task-names-fix.md`

### Account Switcher Fix (4 Февраля 2026) — ARCHIVED ✅
- **Archive:** `memory-bank/archive/archive-account-switcher-fix.md`

### Auth Hanging Fix (4 Февраля 2026) — ARCHIVED ✅
- **Archive:** `memory-bank/archive/archive-auth-hanging-fix.md`

### Admin Dashboard & Users Page Improvements — ARCHIVED ✅
- **Archive:** `memory-bank/archive/archive-admin-dashboard-users-improvements.md`

### Task Spec Item Templates Management — ARCHIVED ✅
- **Archive:** `memory-bank/archive/archive-task-spec-item-templates-management.md`

---

## Pending Tasks

### Production Migrations Pending
- [ ] Apply migrations 018-028 to production database
- [ ] Test task creation with real projects
- [ ] Verify task names match calculator

---

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Supabase (Auth, DB, Storage, RLS)
- React Query for data fetching
- Zustand for calculator state

## Important Files
- `memory-bank/systemPatterns.md` - **КРИТИЧЕСКИ ВАЖНО** — паттерны и фиксы проблем
- `calculator/src/contexts/AuthContext.jsx` - Auth context с фиксом SIGNED_IN
- `calculator/src/lib/supabase.js` - Supabase client с отключенным Realtime

## Archive Documents
- `memory-bank/archive/archive-multiple-specifications-fix.md` — Latest archived task
- `memory-bank/reflection/reflection-multiple-specifications-fix.md` — Latest reflection
