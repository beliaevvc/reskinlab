# Active Context

## Current Status
**Нет активной задачи** — Готов к следующей задаче.

## Recently Completed Tasks

### Calculator Settings Redesign (9 Февраля 2026) — COMPLETED ✅
Редизайн PricingPage: sidebar + карточки, объединение base+complexity, сдержанный дизайн (emerald, без эмоджи).
- **Reflection:** `memory-bank/reflection/reflection-pricing-page-redesign.md`

---

### User Card Redesign & Inline Editing (9 Февраля 2026) — ARCHIVED ✅
Редизайн Profile/Company табов. Инлайн-редактирование (Full Name, Phone, Role, Company Name, Country, Address). Мутации + кэш-инвалидация.
- **Archive:** `memory-bank/archive/archive-user-card-inline-editing.md`
- **Reflection:** `memory-bank/reflection/reflection-user-card-inline-editing.md`

---

### Notification Center (9 Февраля 2026) — ARCHIVED ✅
Полная система in-app уведомлений: 14 DB-триггеров, батч-RPC для стадий, поллинг 15с, deep-linking (offer/invoice/spec/task/comment → модалки), карточный UI, фильтры. Фикс стадий (плейсхолдеры + RPC). Z-index fix. 3 роли.
- **Archive:** `memory-bank/archive/archive-notification-center.md`
- **Reflection:** `memory-bank/reflection/reflection-notification-center.md`

---

### Task View Switcher — Kanban / List (9 Февраля 2026) — ARCHIVED ✅
Переключатель вида задач в проекте: Kanban доска и List (список). Список — компактные строки Linear-style с бейджами, сгруппированные по статусу (5 секций), сворачиваемые цветные заголовки, полный drag-and-drop между секциями. Toggle иконки в тулбаре. localStorage persist. Мобильная адаптация.
- **Archive:** `memory-bank/archive/archive-task-view-switcher.md`
- **Reflection:** `memory-bank/reflection/reflection-task-view-switcher.md`

---

### Public Calculator + Dynamic Pricing (8 Февраля 2026) — ARCHIVED ✅
Динамические цены из Supabase (price_configs → useDynamicPricing). Публичный калькулятор /shared/calculator. Система кодов. Авто-claim. Импорт для зарегистрированных. Rate limiting. pg_cron cleanup.
- **Archive:** `memory-bank/archive/archive-public-calculator-dynamic-pricing.md`
- **Reflection:** `memory-bank/reflection/reflection-public-calculator-dynamic-pricing.md`

---

### Concept Document — автозадача + сортировка по весам (8 Февраля 2026) — ARCHIVED ✅
Автозадача для concept_doc. Система sort_order для spec item templates. Дефолтные веса. UI в админке.
- **Archive:** `memory-bank/archive/archive-concept-doc-task-and-sort-order.md`
- **Reflection:** `memory-bank/reflection/reflection-concept-doc-task-and-sort-order.md`

---

### Concept Document в калькуляторе (8 Февраля 2026) — ARCHIVED ✅
Новая категория "Concept Document" с уникальной моделью ценообразования ($1000 + 1% от spec). Флаговая архитектура. Двухпроходный расчёт.
- **Archive:** `memory-bank/archive/archive-concept-document.md`
- **Reflection:** `memory-bank/reflection/reflection-concept-document.md`

---

### Per-item Order Type (7 Февраля 2026) — ARCHIVED ✅
Переключатель типа заказа per-item: Art Only / Anim Only / Art+Anim. Глобальный дефолт. Фильтрация None.
- **Archive:** `memory-bank/archive/archive-per-item-order-type.md`
- **Reflection:** `memory-bank/reflection/reflection-per-item-order-type.md`

---

### Specification Settings Inheritance (7 Февраля 2026) — ARCHIVED ✅
Наследование Visual Style, Usage Rights, Payment Model из первой оплаченной спецификации. Locked UI.
- **Archive:** `memory-bank/archive/archive-specification-inheritance.md`

---

### Minimum Order Amount (7 Февраля 2026) — ARCHIVED ✅
Минимальная сумма заказа ($1000) для первого заказа в проекте. Промо capping. Настройка в админке. Предупреждения в UI.
- **Archive:** `memory-bank/archive/archive-minimum-order-amount.md`
- **Reflection:** `memory-bank/reflection/reflection-minimum-order-amount.md`

---

### Project Resources Tab & UI Consistency (7 Февраля 2026) — ARCHIVED ✅
Новая вкладка "Resources" в правой панели проекта для внешних ссылок. UI consistency fixes.
- **Archive:** `memory-bank/archive/archive-project-resources-tab.md`
- **Reflection:** `memory-bank/reflection/reflection-project-resources-tab.md`

---

### Client Dashboard Activity — Audit Logs Integration (7 Февраля 2026) — ARCHIVED ✅
Блок "Recent Activity" переведён на audit_logs. UI в стиле админки. Сворачиваемый блок.
- **Archive:** `memory-bank/archive/archive-client-dashboard-activity.md`
- **Reflection:** `memory-bank/reflection/reflection-client-dashboard-activity.md`

---

### Profile Improvements & Avatar System (7 Февраля 2026) — ARCHIVED ✅
Полный редизайн профиля для всех ролей: аватар, sticky save, select, смена пароля, danger zone.
- **Archive:** `memory-bank/archive/archive-profile-improvements.md`
- **Reflection:** `memory-bank/reflection/reflection-profile-improvements.md`

---

### Promo Codes — Full Fix & Redesign (7 Февраля 2026) — ARCHIVED ✅
Комплексное исправление системы промокодов: CRUD (5 полей), калькулятор (hardcoded → Supabase), редизайн UI.
- **Archive:** `memory-bank/archive/archive-promo-codes-fix-and-redesign.md`
- **Reflection:** `memory-bank/reflection/reflection-promo-codes-fix-and-ui.md`

---

## Pending Tasks

### Production Migrations Pending
- [ ] Apply migrations 018-045 to production database
- [ ] Test task creation with real projects
- [ ] Verify task names match calculator

---

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Supabase (Auth, DB, Storage, RLS)
- React Query for data fetching
- Zustand for calculator state
- TipTap (ProseMirror) for rich text editing

## Important Files
- `memory-bank/systemPatterns.md` - **КРИТИЧЕСКИ ВАЖНО** — паттерны и фиксы проблем
- `calculator/src/contexts/AuthContext.jsx` - Auth context с фиксом SIGNED_IN
- `calculator/src/lib/supabase.js` - Supabase client с отключенным Realtime

## Archive Documents
- `memory-bank/archive/archive-minimum-order-amount.md` — Latest archived task
- `memory-bank/reflection/reflection-minimum-order-amount.md` — Latest reflection
