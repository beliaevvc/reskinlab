# Active Context

## Current Status
**Ready for Next Task** ✅

## Recently Completed Tasks

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
- `memory-bank/archive/archive-account-switcher-fix.md` — Latest archived task
- `memory-bank/reflection/reflection-account-switcher-fix.md` — Latest reflection
