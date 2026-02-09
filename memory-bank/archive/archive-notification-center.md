# TASK ARCHIVE: Notification Center

## METADATA
- **Task ID:** notification-center
- **Date Started:** 2026-02-09
- **Date Completed:** 2026-02-09
- **Complexity:** Level 3 — Intermediate
- **Status:** ARCHIVED ✅

---

## SUMMARY

Реализована полная in-app система уведомлений для ReSkin Lab. Включает:
- **Backend:** 14 PostgreSQL триггеров для автоматической генерации уведомлений, 2 хелпер-функции, RLS-политики, батчевая RPC для стадий, pg_cron для автоочистки (90 дней)
- **Frontend:** Колокольчик с badge (exact count), dropdown с фильтрами (All/Unread + Categories), карточные уведомления с rich content
- **Deep-linking:** Все типы уведомлений ведут к конкретной сущности через query params → модалки в ProjectPage
- **3 роли:** client, AM, admin — каждая получает релевантные уведомления
- **Polling:** 15-секундный интервал с немедленным refetch при открытии dropdown

Сопутствующие фиксы: активация/деактивация стадий с плейсхолдерами, z-index header'а, позиция иконки комментариев в TaskListRow.

---

## REQUIREMENTS

### Core
1. Bell icon в хедере с exact count непрочитанных уведомлений
2. Dropdown панель с фильтрами: All/Unread + категории (Comments, Tasks, Payments, Projects)
3. Клик по уведомлению → навигация к сущности + mark as read
4. Polling каждые 15 секунд (Supabase Realtime отключён)
5. Unread — хранятся бессрочно; read — 90 дней → cleanup cron

### Notification Types (14 триггеров)
| Trigger | Event | Recipients |
|---------|-------|------------|
| `notify_on_comment` | New comment on task | Task stakeholders (excl. author) |
| `notify_on_task_status_change` | Task status changed | Project stakeholders |
| `notify_on_task_assigned` | Task assigned to user | Assignee |
| `notify_on_offer_created` | New offer created | Client |
| `notify_on_offer_accepted` | Offer accepted by client | AM + admins |
| `notify_on_invoice_status_change` | Invoice status changed | Relevant stakeholders |
| `notify_on_file_uploaded` | File uploaded to task | Project stakeholders |
| `notify_on_project_created` | New project created | AM + admins |
| `notify_on_project_status_change` | Project status changed | Project stakeholders |
| `notify_on_specification_finalized` | Spec finalized | AM + admins |
| `notify_on_role_changed` | User role changed | Affected user |
| `notify_on_stage_change` | Stage activated/deactivated | Project stakeholders (replaced by RPC) |
| `notify_on_task_deadline` | Task deadline approaching | Assignee + project stakeholders |
| `notify_on_am_action` | AM audit log action | Client |

### UI/UX
- Emerald цветовая палитра (не blue)
- Card-style уведомления (не flat rows)
- Visual separator между фильтрами
- Highlight при deep-link переходе (2s fade)
- No sound notifications

---

## IMPLEMENTATION

### Database Layer

#### Migration 051: `051_notification_center.sql` (923 lines)
- **Table:** `notifications` (id, user_id, type, title, body, entity_type, entity_id, metadata, read_at, created_at)
- **Indexes:** user_id + read_at (for unread count), user_id + created_at (for listing), created_at (for cleanup)
- **RLS:** SELECT → `user_id = auth.uid()`, INSERT → `WITH CHECK (true)` (system), UPDATE → own records only
- **Helper functions:**
  - `create_notification_for_user(p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id, p_metadata)` — SECURITY DEFINER, EXCEPTION WHEN OTHERS → silent fail
  - `get_project_stakeholders(p_project_id, p_exclude_user_id)` — returns client_id + am_id + admin IDs
- **14 trigger functions** — каждый с `EXCEPTION WHEN OTHERS THEN RAISE WARNING`
- **pg_cron:** Weekly cleanup read notifications older than 90 days

#### Migration 052: `052_fix_stage_notifications.sql` (95 lines)
- **DROP** old per-row trigger `trigger_notify_on_stage_change`
- **New RPC:** `notify_stages_changed(p_project_id, p_target_stage_name, p_action, p_stage_names)` — batch notification for stage activation/deactivation, notifies ALL stakeholders except actor

### Frontend Layer

#### Hook: `useNotifications.js`
- `useNotifications()` — fetch with polling (15s), filter by read/category
- `useUnreadCount()` — separate count query (15s polling)
- `useMarkAsRead()` — mutation, optimistic update
- `useMarkAllAsRead()` — batch mark all
- `useNotificationNavigation()` — `getEntityUrl()` → deep-link URL builder
- **Constants:** `NOTIFICATION_CATEGORIES` mapping types → categories, `CATEGORY_LABELS`

#### Components

**NotificationBell.jsx:**
- Badge с exact count (9+)
- Click toggle dropdown
- Immediate `queryClient.invalidateQueries(['notifications'])` on open
- Click-outside close via `useRef` + `mousedown` listener

**NotificationDropdown.jsx:**
- Fixed 400px width, max 500px height
- Header: title + "Mark all read" button
- Read filter tabs: All / Unread (emerald active)
- Category chips: All, Comments, Tasks, Payments, Projects (dark active)
- Separator `border-t` between filters
- Scrollable list with `p-3` + `space-y-2`
- Loading spinner + empty state

**NotificationItem.jsx:**
- Card-style: `rounded-lg`, `border`, `shadow-sm` on hover
- Unread: `border-emerald-200 bg-emerald-50/40`
- Read: `border-neutral-100 bg-white`
- Top row: icon (colored bg) + relative time + unread dot
- `RichContent` sub-component — per-type JSX rendering:
  - `comment` → author + task title + comment preview
  - `task_status_change` → task title + status badge
  - `task_assigned` → task title
  - `offer_created/accepted` → offer info
  - `invoice_status_change` → invoice amount + status
  - `stage_change` → batch format (target + arrow chain) or legacy format
  - `file_uploaded` → filename
  - `project_*` → project name
  - `am_action` → action description
- `StatusBadge` — colored pill for statuses
- `formatDistanceToNow` — relative time

### Deep-linking

**Pattern:** URL query params → `useEffect` in `ProjectPage` → set state → open modal → clear params

| Entity | URL Pattern | Modal |
|--------|------------|-------|
| Task + Comment | `?task=uuid&comment=uuid` | TaskDetailModal → CommentThread scroll |
| Offer | `?offer=uuid` | OfferModal |
| Invoice | `?invoice=uuid` | InvoiceModal |
| Specification | `?spec=uuid` | SpecModal |
| Stage | (navigate to project) | — |

**Comment highlight:** `CommentItem` detects `highlightCommentId` prop → `scrollIntoView({ block: 'center' })` → `bg-emerald-50/60` → 2s delay → 700ms fade transition

### Stage Fixes

**Placeholder handling in `useStages.js`:**
- `useActivateStageWithPrevious`: Split `stagesToActivate` into `placeholderStages` (INSERT) and `realStages` (UPDATE)
- `useDeactivateStageWithPrevious`: Skip placeholders (already pending), filter to `!_isPlaceholder` only
- Both call `supabase.rpc('notify_stages_changed', {...})` wrapped in `try/catch`
- `ProjectPage.jsx`: Pass `mergedStages` (not raw `stages`) to `StageChangeModal`

### Z-index Fix
- `AppHeader.jsx`: `z-30` → `z-40` (creates higher stacking context for dropdown children)
- `NotificationBell.jsx`: Removed explicit `z-[60]` (unnecessary, inherits from header)

### TaskListRow Comment Icon
- Moved from right-aligned "Badges row" to title row, immediately after checklist badge

---

## TESTING

Тестирование проводилось вручную через UI:
1. Активация/деактивация стадий (одиночные + каскадные) — OK
2. Отображение batch-уведомлений по стадиям — OK (consolidated message)
3. Deep-link переход из уведомления к комментарию — OK (scroll + highlight)
4. Deep-link переход к offer/invoice/spec — OK (modal opens)
5. Фильтры All/Unread + Categories — OK
6. Mark as read (single + all) — OK
7. Z-index: dropdown over sidebar arrow — OK (after header z-40)
8. Polling sync: badge updates → open dropdown → immediate list update — OK

---

## LESSONS LEARNED

### Технические
1. **Supabase RPC returns PostgrestBuilder, not Promise** — `.catch()` doesn't exist, always use `try/catch` or destructure `{ error }`
2. **Per-row triggers unsuitable for batch operations** — Use RPC called from frontend for consolidated notifications
3. **Z-index inherits stacking context** — Child z-50 inside parent z-30 won't beat sibling z-30. Fix: raise parent z-index
4. **Dollar-quoting conflicts** — Use named tags (`$outer$`, `$cron$`) for nested SQL blocks
5. **Placeholder objects need end-to-end handling** — `_isPlaceholder` marker + conditional INSERT/UPDATE logic

### Процессные
1. **Test after every RPC change** — `.catch()` bug was invisible until runtime
2. **Visual bugs need DOM inspection** — Z-index problems require understanding stacking context chain
3. **Consolidated notifications > per-event spam** — Users prefer one meaningful message over multiple atomic ones

---

## FILES

### Created (7 files)
| File | Purpose |
|------|---------|
| `calculator/supabase/migrations/051_notification_center.sql` | Core schema: table, 14 triggers, helpers, cron |
| `calculator/supabase/migrations/052_fix_stage_notifications.sql` | Batch RPC for stage notifications |
| `calculator/src/hooks/useNotifications.js` | All notification hooks |
| `calculator/src/components/notifications/NotificationBell.jsx` | Bell icon + dropdown toggle |
| `calculator/src/components/notifications/NotificationDropdown.jsx` | Dropdown panel with filters |
| `calculator/src/components/notifications/NotificationItem.jsx` | Card-style notification entry |
| `calculator/src/components/notifications/index.js` | Barrel exports |

### Modified (8 files)
| File | Changes |
|------|---------|
| `calculator/src/components/layout/AppHeader.jsx` | z-30→z-40, added NotificationBell |
| `calculator/src/hooks/useStages.js` | Placeholder INSERT, batch RPC, try/catch |
| `calculator/src/pages/projects/ProjectPage.jsx` | Deep-link params, mergedStages to modal |
| `calculator/src/components/comments/CommentThread.jsx` | highlightCommentId + scrollIntoView |
| `calculator/src/components/comments/CommentItem.jsx` | Highlight effect (2s fade) |
| `calculator/src/components/tasks/TaskDetailModal.jsx` | Pass highlightCommentId |
| `calculator/src/components/tasks/TaskListRow.jsx` | Comment icon moved left (after checklist) |
| `calculator/src/components/notifications/NotificationBell.jsx` | Removed z-[60] |

---

## REFERENCES
- **Reflection:** `memory-bank/reflection/reflection-notification-center.md`
- **Related:** `memory-bank/archive/archive-project-stages-management-offers-filtering.md` (original stage cascade logic)
- **Related:** `memory-bank/archive/archive-task-card-comments-improvements.md` (comment tracking system)
- **System Patterns:** `memory-bank/systemPatterns.md` (Supabase auth patterns, stacking context)
