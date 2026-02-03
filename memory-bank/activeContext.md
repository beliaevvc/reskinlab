# Active Context

## Current Status
**Ready for Next Task** ✅

## ⚠️ КРИТИЧЕСКИЙ ФИКС (3 Февраля 2026)

**Проблема:** Приложение зависало при перезагрузке — бесконечный Loading.

**Причина:** Supabase Realtime WebSocket блокировал HTTP запросы.

**Решение:** В `calculator/src/lib/supabase.js` добавлен `supabase.realtime.disconnect()`.

**Подробности:** `memory-bank/systemPatterns.md`

---

## Last Session Summary
Completed Admin Dashboard & Users Page Improvements:

### Key Deliverables

1. **Admin Dashboard & Users Page Improvements** ✅ ARCHIVED
   - Fixed critical issues with financial data display in admin dashboard
   - Fixed revenue display in Users page
   - Improved Users table UX with intuitive column clicks
   - Added last_login_at tracking for users
   - Improved UserDetailModal with fixed size and expanded Projects tab information
   - Archive: `memory-bank/archive/archive-admin-dashboard-users-improvements.md`

2. **Previous Tasks**
   - Task Spec Item Templates Management ✅ ARCHIVED
   - Project Stages Management & Offers Filtering ✅ ARCHIVED
   - Invoice Rejection Logic Improvement ✅ ARCHIVED
   - Payment Confirmation System ✅ ARCHIVED

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Supabase (Auth, DB, Storage, RLS)
- React Query for data fetching
- Zustand for calculator state

## Next Steps
- Apply migrations 018-025 to production database
- Test task template creation with real projects
- Test checklist creation from templates
- Test access control for checklists with different user roles
- Consider adding validation for template fields
- Consider refactoring large `auto_create_tasks_on_first_payment()` function

## Important Files
- `memory-bank/archive/archive-admin-dashboard-users-improvements.md` - Latest completed task archive
- `memory-bank/reflection/reflection-admin-dashboard-users-improvements.md` - Latest task reflection
- `calculator/supabase/migrations/026_add_last_login_at_to_profiles.sql` - Database migration for last_login_at
- `calculator/src/hooks/useDashboard.js` - Dashboard statistics hooks
- `calculator/src/hooks/useUsers.js` - Users management hooks
- `calculator/src/components/admin/UserDetailModal.jsx` - User detail modal component
