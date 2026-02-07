# Active Context

## Current Status
**Ready for Next Task** ✅

## Recently Completed Tasks

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
Дополнительные поля admin/AM (phone, telegram, bio). Аватары во всех компонентах: AccountSwitcher, комментарии, логи, дашборд. Фикс роутинга профиля.
- **Archive:** `memory-bank/archive/archive-profile-improvements.md`
- **Reflection:** `memory-bank/reflection/reflection-profile-improvements.md`

---

### Promo Codes — Full Fix & Redesign (7 Февраля 2026) — ARCHIVED ✅
Комплексное исправление системы промокодов: CRUD (5 полей), калькулятор (hardcoded → Supabase), редизайн UI.
- **Archive:** `memory-bank/archive/archive-promo-codes-fix-and-redesign.md`
- **Reflection:** `memory-bank/reflection/reflection-promo-codes-fix-and-ui.md`

---

### Sidebar Badge Color Fix (7 Февраля 2026) — ARCHIVED ✅
Цвет бейджа инвойсов в сайдбаре: синий → зелёный (emerald) для единообразия дизайн-системы.

---

### Audit Logs — Entity Names & Parent Context (6 Февраля 2026) — ARCHIVED ✅
Расширение аудит-логов: названия сущностей во всех CRUD-операциях + родительский контекст (project_name, client_name) + обогащение старых записей через batch-fetch.
- **Archive:** `memory-bank/archive/archive-audit-logs-entity-names.md`
- **Reflection:** `memory-bank/reflection/reflection-audit-logs-entity-names.md`

---

### Offer Templates Admin Panel (6 Февраля 2026) — ARCHIVED ✅
Комплексная доработка раздела управления шаблонами оферт в админ-панели.
- Модалка настроек, удаление validity_days, inline user picker, grid top bar
- Preview с LegalDocument и подсветкой переменных зелёным
- Bold/Italic через всю цепочку, подсказки по форматированию, автоверсионирование
- **Archive:** `memory-bank/archive/archive-offer-templates-admin.md`
- **Reflection:** `memory-bank/reflection/reflection-offer-templates-admin.md`

---

### Terms & Conditions Modal Redesign (6 Февраля 2026) — ARCHIVED ✅
Полный редизайн отображения Terms & Conditions в офертах.
- **Archive:** `memory-bank/archive/archive-terms-conditions-modal.md`
- **Reflection:** `memory-bank/reflection/reflection-terms-conditions-modal.md`

---

### Admin Sidebar Sections (5 Февраля 2026) — ARCHIVED ✅
Улучшение структуры левого меню админки:
- Добавлен заголовок "Settings" перед блоком настроек
- Audit Log отделён линией как отдельный раздел
- **Archive:** `memory-bank/archive/archive-admin-sidebar-sections.md`
- **Reflection:** `memory-bank/reflection/reflection-admin-sidebar-sections.md`

---

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

## Pending Tasks

### Production Migrations Pending
- [ ] Apply migrations 018-040 to production database
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
- `memory-bank/archive/archive-promo-codes-fix-and-redesign.md` — Latest archived task
- `memory-bank/reflection/reflection-promo-codes-fix-and-ui.md` — Latest reflection
