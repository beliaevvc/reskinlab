# Active Context

## Current Status
**Ready for Next Task** ✅

## Recently Archived Tasks

### Account Switcher Fix (4 Февраля 2026) — ARCHIVED ✅
Переключение аккаунтов не обновляло профиль пользователя. Добавлен явный вызов `fetchProfile()` в `signIn()`.
- **Archive:** `memory-bank/archive/archive-account-switcher-fix.md`
- **Pattern:** `memory-bank/systemPatterns.md` (раздел "Account Switcher и пропуск SIGNED_IN")

### Auth Hanging Fix (4 Февраля 2026) — ARCHIVED ✅
Критический баг с зависанием при перезагрузке страницы исправлен.
- **Archive:** `memory-bank/archive/archive-auth-hanging-fix.md`
- **Pattern:** `memory-bank/systemPatterns.md`

### Admin Dashboard & Users Page Improvements — ARCHIVED ✅
- **Archive:** `memory-bank/archive/archive-admin-dashboard-users-improvements.md`

### Task Spec Item Templates Management — ARCHIVED ✅
- **Archive:** `memory-bank/archive/archive-task-spec-item-templates-management.md`

---

## Pending Tasks

### Fix Task Titles with ID-like Names — IN PROGRESS 🔄
Некоторые задачи имеют названия, совпадающие с `item_id` вместо нормальных названий.

**Next Steps:**
- [ ] Применить миграцию `027_fix_task_titles_in_templates.sql` в базе данных
- [ ] Проверить, что все задачи имеют нормальные названия
- [ ] Убедиться, что новые задачи создаются с правильными названиями

### Production Migrations Pending
- [ ] Apply migrations 018-027 to production database
- [ ] Test task template creation with real projects
- [ ] Test checklist creation from templates
- [ ] Test access control for checklists with different user roles

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
- `memory-bank/archive/archive-account-switcher-fix.md` — Latest archived task
- `memory-bank/reflection/reflection-account-switcher-fix.md` — Latest reflection
