# Phase 4: Project Workspace — Детальный план

## Обзор Phase 4

**Цель:** Реализовать рабочее пространство проекта с этапами, Kanban-доской задач и системой апрувов.

**Результат:** После принятия оферты и оплаты клиент видит проект с этапами, задачами и может апрувить работу.

---

## Структура Phase 4

```
Phase 4: Project Workspace
├── 4.1 Project Overview (Enhanced)
│   ├── 4.1.1 Project status flow
│   ├── 4.1.2 Timeline/stages view
│   └── 4.1.3 Project stats
│
├── 4.2 Workflow Stages
│   ├── 4.2.1 Stage hooks & API
│   ├── 4.2.2 Stage timeline component
│   ├── 4.2.3 Stage detail view
│   └── 4.2.4 Auto-create stages on project start
│
├── 4.3 Tasks & Kanban
│   ├── 4.3.1 Task hooks & API
│   ├── 4.3.2 Kanban board component
│   ├── 4.3.3 Task card component
│   ├── 4.3.4 Task detail modal
│   ├── 4.3.5 Drag-and-drop (status change)
│   └── 4.3.6 Comments on tasks
│
├── 4.4 Approvals
│   ├── 4.4.1 Approval hooks & API
│   ├── 4.4.2 Approval request component
│   ├── 4.4.3 Approval response modal
│   ├── 4.4.4 Revision tracking
│   └── 4.4.5 Pending approvals badge
│
└── 4.5 Integration
    ├── 4.5.1 Update ProjectDetailPage
    ├── 4.5.2 Add routes
    └── 4.5.3 Dashboard widgets
```

---

## 4.1 Project Overview (Enhanced)

### Project Status Flow

```
draft → offer_pending → pending_payment → in_progress → completed
                                              ↓
                                          on_hold
```

### Enhanced ProjectDetailPage

**Sections:**
- Header (name, status, dates)
- Progress bar (stages completion %)
- Stage timeline (horizontal)
- Active tasks summary
- Pending approvals alert
- Recent activity

---

## 4.2 Workflow Stages

### Default Stages (auto-created)

```javascript
const DEFAULT_STAGES = [
  { key: 'briefing', name: 'Briefing', order: 1 },
  { key: 'moodboard', name: 'Moodboard', order: 2 },
  { key: 'symbols', name: 'Symbols Design', order: 3 },
  { key: 'ui', name: 'UI Elements', order: 4 },
  { key: 'animation', name: 'Animation', order: 5 },
  { key: 'revisions', name: 'Revisions', order: 6 },
  { key: 'delivery', name: 'Final Delivery', order: 7 },
];
```

### Stage Hooks

**Файл:** `src/hooks/useStages.js`

```javascript
// Hooks:
- useStages(projectId) - list stages for project
- useStage(stageId) - single stage with tasks
- useCreateStages() - create default stages
- useUpdateStageStatus() - change stage status
```

### Stage Timeline Component

**Файл:** `src/components/stages/StageTimeline.jsx`

Horizontal timeline showing:
- Stage name
- Status indicator (pending/in_progress/review/completed)
- Click to expand/navigate

---

## 4.3 Tasks & Kanban

### Task Hooks

**Файл:** `src/hooks/useTasks.js`

```javascript
// Hooks:
- useTasks(projectId) - all tasks for project
- useTasksByStage(stageId) - tasks in stage
- useTask(taskId) - single task with comments
- useCreateTask() - create new task
- useUpdateTask() - update task
- useUpdateTaskStatus() - change status (for drag-drop)
- useDeleteTask() - delete task
```

### Kanban Board

**Файл:** `src/components/tasks/KanbanBoard.jsx`

**Columns:**
- To Do
- In Progress
- Review
- Done

**Features:**
- Drag and drop between columns
- Filter by stage
- Quick add task
- Click to open detail

### Task Card

**Файл:** `src/components/tasks/TaskCard.jsx`

**Shows:**
- Title
- Stage badge
- Assignee avatar
- Due date
- Comments count

### Task Detail Modal

**Файл:** `src/components/tasks/TaskDetailModal.jsx`

**Sections:**
- Title & description
- Status selector
- Stage selector
- Due date picker
- Comments thread
- Activity log

---

## 4.4 Approvals

### Approval Flow

```
AM requests approval → Client sees pending → Client responds
                                                    ↓
                              ┌─────────────────────┼─────────────────────┐
                              ↓                     ↓                     ↓
                          Approved            Needs Revision         Rejected
                              ↓                     ↓
                        Stage complete      Revision round++
                                                    ↓
                                            If round > max_free
                                                    ↓
                                            Block / Extra charge
```

### Approval Hooks

**Файл:** `src/hooks/useApprovals.js`

```javascript
// Hooks:
- useApprovals(projectId) - all approvals for project
- usePendingApprovals(projectId) - pending only
- useApproval(approvalId) - single approval
- useRespondToApproval() - client response (approve/reject/revision)
```

### Approval Request Card

**Файл:** `src/components/approvals/ApprovalCard.jsx`

**Shows:**
- Type (stage/asset/final)
- Stage name
- Revision round (1/2, 2/2)
- Status badge
- Respond button

### Approval Response Modal

**Файл:** `src/components/approvals/ApprovalResponseModal.jsx`

**Options:**
- Approve (with optional comment)
- Request Revision (comment required)
- Reject (comment required)

**Warning if revision_round >= max_free_rounds:**
"This is your last free revision round. Additional revisions will be charged."

---

## 4.5 Comments System

### Comment Hooks

**Файл:** `src/hooks/useComments.js`

```javascript
// Hooks:
- useComments(entityType, entityId) - comments for entity
- useAddComment() - add new comment
- useDeleteComment() - delete own comment
```

### Comment Thread

**Файл:** `src/components/comments/CommentThread.jsx`

**Features:**
- Avatar + author name
- Timestamp
- Content
- Reply (nested)
- Delete own

---

## Файловая структура Phase 4

```
src/
├── hooks/
│   ├── useStages.js            ← NEW
│   ├── useTasks.js             ← NEW
│   ├── useApprovals.js         ← NEW
│   └── useComments.js          ← NEW
│
├── components/
│   ├── stages/
│   │   ├── StageTimeline.jsx   ← NEW
│   │   ├── StageCard.jsx       ← NEW
│   │   └── index.js
│   │
│   ├── tasks/
│   │   ├── KanbanBoard.jsx     ← NEW
│   │   ├── TaskCard.jsx        ← NEW
│   │   ├── TaskDetailModal.jsx ← NEW
│   │   ├── CreateTaskModal.jsx ← NEW
│   │   └── index.js
│   │
│   ├── approvals/
│   │   ├── ApprovalCard.jsx    ← NEW
│   │   ├── ApprovalResponseModal.jsx ← NEW
│   │   ├── PendingApprovalsBadge.jsx ← NEW
│   │   └── index.js
│   │
│   └── comments/
│       ├── CommentThread.jsx   ← NEW
│       ├── CommentItem.jsx     ← NEW
│       └── index.js
│
├── pages/
│   └── projects/
│       ├── ProjectDetailPage.jsx ← UPDATE (enhanced)
│       └── ProjectWorkspacePage.jsx ← NEW (tabs: Overview, Tasks, Approvals)
│
└── App.jsx                     (update routes)
```

---

## Implementation Order

### Step 1: Hooks
1. `hooks/useStages.js`
2. `hooks/useTasks.js`
3. `hooks/useApprovals.js`
4. `hooks/useComments.js`

### Step 2: Stage Components
1. `StageTimeline.jsx`
2. `StageCard.jsx`

### Step 3: Task Components
1. `TaskCard.jsx`
2. `KanbanBoard.jsx`
3. `TaskDetailModal.jsx`
4. `CreateTaskModal.jsx`

### Step 4: Approval Components
1. `ApprovalCard.jsx`
2. `ApprovalResponseModal.jsx`
3. `PendingApprovalsBadge.jsx`

### Step 5: Comments
1. `CommentItem.jsx`
2. `CommentThread.jsx`

### Step 6: Pages & Integration
1. Update `ProjectDetailPage.jsx`
2. Create `ProjectWorkspacePage.jsx`
3. Update routes
4. Dashboard widgets

---

## RLS Policies (уже есть, проверить)

- `stages_select_client` ✓
- `stages_staff` ✓
- `tasks_select_client` — нужно добавить
- `tasks_insert_client` — нужно добавить
- `approvals_select_client` ✓
- `approvals_update_client` — нужно добавить
- `comments_*` — нужно добавить

---

## Acceptance Criteria

### Stages
- [ ] Этапы отображаются на timeline
- [ ] Клиент видит статус каждого этапа
- [ ] Этапы создаются автоматически при старте проекта

### Tasks
- [ ] Kanban-доска с 4 колонками
- [ ] Drag-and-drop меняет статус
- [ ] Можно фильтровать по этапу
- [ ] Детали задачи в модалке

### Approvals
- [ ] Клиент видит pending approvals
- [ ] Может ответить: approve/revision/reject
- [ ] Показывается номер раунда ревизий
- [ ] Предупреждение при превышении бесплатных раундов

### Comments
- [ ] Можно комментировать задачи
- [ ] Можно комментировать апрувы
- [ ] Nested replies

---

## Notes

### Оставляем на Phase 5:
- File uploads (assets)
- AM: создание задач
- AM: запрос апрува
- Final delivery flow

### Drag-and-drop:
- Используем `@dnd-kit/core` или `react-beautiful-dnd`
- Можно начать без DnD, добавить позже

---

**Document Version:** 1.0  
**Created:** 2026-02-01
