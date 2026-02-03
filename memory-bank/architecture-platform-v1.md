# ReSkin Lab Platform — Архитектура v1.0

## Оглавление
1. [Обзор системы](#1-обзор-системы)
2. [Модель данных](#2-модель-данных)
3. [State Machines](#3-state-machines)
4. [Экраны и навигация](#4-экраны-и-навигация)
5. [RBAC и RLS](#5-rbac-и-rls)
6. [Юридические флоу](#6-юридические-флоу)
7. [Файловое хранилище](#7-файловое-хранилище)
8. [План реализации](#8-план-реализации)

---

## 1. Обзор системы

### 1.1. Канонический флоу

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT JOURNEY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [1] Calculator        [2] Specification      [3] Offer          [4] Invoice │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐       ┌──────────┐│
│  │  Select  │ ──────▶  │  Draft   │ ──────▶  │  Auto    │ ────▶ │ Milestone││
│  │  Items   │          │  Edit    │          │ Generate │       │  Payment ││
│  │  Style   │          │  Finalize│          │  Accept  │       │  USDT    ││
│  └──────────┘          └──────────┘          └──────────┘       └──────────┘│
│       │                      │                     │                  │      │
│       │                      │                     │                  │      │
│       │         ┌────────────┴─────────────────────┴──────────────────┘      │
│       │         │                                                            │
│       │         ▼                                                            │
│       │   [5] Project Workspace                                              │
│       │   ┌─────────────────────────────────────────────────────────────┐   │
│       │   │  Kanban  │  Tasks  │  Approvals  │  Materials  │  Delivery  │   │
│       │   └─────────────────────────────────────────────────────────────┘   │
│       │         │                                                            │
│       │         │  [Add-on Order]                                           │
│       │         └──────────────────────────▶ [2] New Specification          │
│       │                                                                      │
└───────┴─────────────────────────────────────────────────────────────────────┘
```

### 1.2. Технологический стек

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand / React Query |
| Backend | Supabase (Postgres + Auth + RLS + Storage + Edge Functions) |
| Payments | USDT (TRC20/ERC20) — manual confirmation |
| Hosting | Vercel (Frontend) + Supabase Cloud |

### 1.3. Роли

| Role | Описание | Доступ |
|------|----------|--------|
| **Client** | Заказчик | Свои проекты, калькулятор, approvals |
| **Account Manager (AM)** | Менеджер | Проекты своих клиентов, задачи, инвойсы |
| **Admin** | Суперпользователь | Всё + настройки, цены, промокоды |

---

## 2. Модель данных

### 2.1. ER-диаграмма (упрощённая)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │   clients   │       │   projects  │
│─────────────│       │─────────────│       │─────────────│
│ id (PK)     │──────▶│ id (PK)     │◀──────│ id (PK)     │
│ email       │       │ user_id(FK) │       │ client_id   │
│ role        │       │ company_name│       │ am_id       │
│ created_at  │       │ discount_%  │       │ status      │
└─────────────┘       │ is_active   │       │ created_at  │
                      └─────────────┘       └──────┬──────┘
                                                   │
                      ┌────────────────────────────┼────────────────────────────┐
                      │                            │                            │
                      ▼                            ▼                            ▼
               ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
               │specifications│             │   offers    │             │  invoices   │
               │─────────────│             │─────────────│             │─────────────│
               │ id (PK)     │────────────▶│ id (PK)     │             │ id (PK)     │
               │ project_id  │             │ spec_id(FK) │◀────────────│ offer_id    │
               │ version     │             │ number      │             │ milestone   │
               │ status      │             │ status      │             │ amount      │
               │ state_json  │             │ accepted_at │             │ status      │
               │ finalized_at│             │ legal_text  │             │ paid_at     │
               └─────────────┘             └─────────────┘             └─────────────┘
```

### 2.2. Таблицы

#### 2.2.1. `users` — Пользователи (расширение Supabase Auth)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'am', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.2. `clients` — Профили клиентов

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Company Info
  company_name TEXT,
  company_type TEXT CHECK (company_type IN ('individual', 'company')),
  tax_id TEXT,
  country TEXT,
  address TEXT,
  
  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  
  -- Business
  discount_percent DECIMAL(5,2) DEFAULT 0,
  promo_code_id UUID REFERENCES public.promo_codes(id),
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  profile_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.3. `projects` — Проекты

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  client_id UUID NOT NULL REFERENCES public.clients(id),
  am_id UUID REFERENCES public.profiles(id), -- Account Manager
  
  -- Info
  name TEXT NOT NULL,
  code TEXT UNIQUE, -- PROJECT-001
  description TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Черновик (до первой оплаты)
    'pending_payment', -- Ожидает оплаты
    'active',          -- В работе
    'on_hold',         -- Приостановлен (неоплата)
    'completed',       -- Завершён
    'cancelled'        -- Отменён
  )),
  
  -- Flags
  can_start_without_payment BOOLEAN DEFAULT false, -- Admin override
  
  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.4. `specifications` — Спецификации

```sql
CREATE TABLE public.specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  project_id UUID NOT NULL REFERENCES public.projects(id),
  parent_spec_id UUID REFERENCES public.specifications(id), -- Для дозаказов
  
  -- Versioning
  version TEXT NOT NULL, -- v1.0, v1.1, v2.0
  version_number INT NOT NULL DEFAULT 1,
  is_addon BOOLEAN DEFAULT false, -- Дозаказ?
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',     -- Редактируется
    'finalized'  -- Утверждена (read-only)
  )),
  
  -- Calculator State (ПОЛНЫЙ STATE)
  state_json JSONB NOT NULL, -- {globalStyle, usageRights, paymentModel, items, ...}
  
  -- Calculated Totals (денормализация для быстрого доступа)
  totals_json JSONB, -- {productionSum, grandTotal, lineItems, ...}
  
  -- Timestamps
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индекс для быстрого поиска последней версии
CREATE INDEX idx_specifications_project_version 
ON public.specifications(project_id, version_number DESC);
```

#### 2.2.5. `offers` — Оферты

```sql
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  specification_id UUID NOT NULL UNIQUE REFERENCES public.specifications(id),
  
  -- Identification
  number TEXT NOT NULL UNIQUE, -- OFF-2026-00001
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',   -- Ожидает акцепта
    'accepted',  -- Принята
    'expired',   -- Истекла
    'cancelled'  -- Отменена
  )),
  
  -- Legal Content (snapshot at generation time)
  legal_text TEXT NOT NULL, -- Юридический текст оферты
  terms_version TEXT, -- Версия условий
  
  -- Validity
  valid_until TIMESTAMPTZ, -- 30 days default
  
  -- Acceptance
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.6. `offer_acceptance_logs` — Логи акцепта (юридически значимые)

```sql
CREATE TABLE public.offer_acceptance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  offer_id UUID NOT NULL REFERENCES public.offers(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Action
  action TEXT NOT NULL CHECK (action IN ('viewed', 'accepted')),
  
  -- Technical Context
  ip_address INET,
  user_agent TEXT,
  
  -- Snapshot
  offer_snapshot JSONB, -- Полная копия оферты в момент акцепта
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.7. `invoices` — Инвойсы

```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  offer_id UUID NOT NULL REFERENCES public.offers(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  
  -- Identification
  number TEXT NOT NULL UNIQUE, -- INV-2026-00001
  
  -- Milestone
  milestone_id TEXT, -- briefing, moodboard, symbols, etc.
  milestone_name TEXT,
  milestone_order INT,
  
  -- Amount
  amount_usd DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  
  -- Payment Details
  wallet_address TEXT,
  network TEXT CHECK (network IN ('TRC20', 'ERC20')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',   -- Ожидает оплаты
    'paid',      -- Оплачен
    'overdue',   -- Просрочен
    'cancelled'  -- Отменён
  )),
  
  -- Dates
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id), -- AM who confirmed
  
  -- Payment Proof
  tx_hash TEXT, -- Transaction hash
  payment_proof_url TEXT, -- Screenshot/proof
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.8. `workflow_stages` — Этапы проекта

```sql
CREATE TABLE public.workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  project_id UUID NOT NULL REFERENCES public.projects(id),
  
  -- Stage Info
  stage_key TEXT NOT NULL, -- briefing, moodboard, symbols, ui, animation, revisions, delivery
  name TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Не начат
    'in_progress',  -- В работе
    'review',       -- На ревью у клиента
    'approved',     -- Утверждён
    'completed'     -- Завершён
  )),
  
  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(project_id, stage_key)
);
```

#### 2.2.9. `tasks` — Задачи (упрощённый Kanban)

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_id UUID REFERENCES public.workflow_stages(id),
  parent_task_id UUID REFERENCES public.tasks(id), -- Для subtasks
  
  -- Info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  assignee_id UUID REFERENCES public.profiles(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN (
    'todo',
    'in_progress',
    'review',
    'done'
  )),
  
  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Order
  "order" INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.10. `approvals` — Апрувы

```sql
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_id UUID REFERENCES public.workflow_stages(id),
  asset_id UUID REFERENCES public.assets(id), -- Если апрув конкретного ассета
  
  -- Type
  approval_type TEXT NOT NULL CHECK (approval_type IN ('asset', 'stage', 'final')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'needs_revision'
  )),
  
  -- Revision Tracking
  revision_round INT DEFAULT 1,
  max_free_rounds INT DEFAULT 2,
  
  -- Feedback
  client_comment TEXT,
  internal_notes TEXT,
  
  -- Who
  requested_by UUID REFERENCES public.profiles(id), -- AM
  responded_by UUID REFERENCES public.profiles(id), -- Client
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.11. `assets` — Материалы/Файлы

```sql
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_id UUID REFERENCES public.workflow_stages(id),
  task_id UUID REFERENCES public.tasks(id),
  
  -- File Info
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size BIGINT,
  mime_type TEXT,
  
  -- Type
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'reference',  -- Референс от клиента
    'deliverable', -- Готовый ассет от студии
    'source',     -- Исходник
    'proof'       -- Proof of payment и т.д.
  )),
  
  -- Versioning
  version INT DEFAULT 1,
  parent_asset_id UUID REFERENCES public.assets(id), -- Previous version
  
  -- Status
  is_final BOOLEAN DEFAULT false,
  
  -- Who
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.12. `comments` — Комментарии

```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic relation
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'approval', 'asset', 'project')),
  entity_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  
  -- Author
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Reply
  parent_comment_id UUID REFERENCES public.comments(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);
```

#### 2.2.13. `promo_codes` — Промокоды

```sql
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code TEXT NOT NULL UNIQUE,
  
  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  
  -- Limits
  max_uses INT,
  current_uses INT DEFAULT 0,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  -- Restrictions
  client_id UUID REFERENCES public.clients(id), -- Если привязан к клиенту
  min_order_amount DECIMAL(10,2),
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.14. `price_configs` — Конфигурация цен (Admin)

```sql
CREATE TABLE public.price_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  config_type TEXT NOT NULL, -- 'categories', 'styles', 'animations', 'usage_rights', 'payment_models'
  config_data JSONB NOT NULL,
  
  -- Versioning
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.15. `audit_logs` — Аудит-логи

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID REFERENCES public.profiles(id),
  user_role TEXT,
  
  -- What
  action TEXT NOT NULL, -- create, update, delete, accept, approve, pay, etc.
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Details
  old_data JSONB,
  new_data JSONB,
  metadata JSONB, -- IP, User-Agent, etc.
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
```

---

## 3. State Machines

### 3.1. Specification Lifecycle

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌─────────┐    ┌─────────┐    ┌────────────┐                 │
│  NEW    │───▶│  DRAFT  │───▶│ FINALIZED  │                 │
└─────────┘    └─────────┘    └────────────┘                 │
                    │              │                          │
                    │              │ [auto-generates Offer]   │
                    │              ▼                          │
                    │         ┌─────────┐                     │
                    │         │  OFFER  │                     │
                    │         └─────────┘                     │
                    │                                         │
                    │         [Add-on Order]                  │
                    └─────────────────────────────────────────┘
                              Creates new Specification
```

**Версионирование:**
- Основная: `v1.0`, `v2.0`, `v3.0` (major)
- Дозаказ: привязан к parent_spec, получает `v{parent}.{addon_number}`

### 3.2. Offer Lifecycle

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│ PENDING │───▶│ ACCEPTED │───▶│ INVOICES │
└─────────┘    └──────────┘    └──────────┘
     │
     │ [30 days]
     ▼
┌─────────┐
│ EXPIRED │
└─────────┘
```

### 3.3. Invoice Lifecycle

```
┌─────────┐    ┌──────┐    ┌───────────┐
│ PENDING │───▶│ PAID │───▶│ [Unlocks] │
└─────────┘    └──────┘    │  Project  │
     │                     │  or Stage │
     │ [past due_date]     └───────────┘
     ▼
┌─────────┐
│ OVERDUE │──▶ [Block project progress]
└─────────┘
```

### 3.4. Project Lifecycle

```
┌───────┐    ┌─────────────────┐    ┌────────┐    ┌───────────┐
│ DRAFT │───▶│ PENDING_PAYMENT │───▶│ ACTIVE │───▶│ COMPLETED │
└───────┘    └─────────────────┘    └────────┘    └───────────┘
                    │                    │
                    │                    │ [unpaid invoice]
                    │                    ▼
                    │               ┌─────────┐
                    │               │ ON_HOLD │
                    │               └─────────┘
                    │                    │
                    │                    │ [payment received]
                    │                    ▼
                    └───────────────▶ ACTIVE
```

### 3.5. Approval Lifecycle

```
┌─────────┐    ┌──────────┐
│ PENDING │───▶│ APPROVED │──▶ [Unlock next stage]
└─────────┘    └──────────┘
     │
     │ [Client rejects]
     ▼
┌──────────────────┐    ┌──────────┐    ┌─────────┐
│ NEEDS_REVISION   │───▶│ PENDING  │───▶│APPROVED │
│ (round 1,2)      │    │ (new ver)│    └─────────┘
└──────────────────┘    └──────────┘
     │
     │ [round > 2]
     ▼
┌────────────────────────┐
│ BLOCKED                │
│ "Purchase more rounds" │
└────────────────────────┘
```

---

## 4. Экраны и навигация

### 4.1. Client Portal

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT PORTAL                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /dashboard                 — Overview, active projects      │
│  │                                                          │
│  ├── /calculator            — Calculator (existing)          │
│  │   └── /calculator/draft/:id  — Saved draft               │
│  │                                                          │
│  ├── /projects              — Projects list                  │
│  │   └── /projects/:id      — Project workspace             │
│  │       ├── /overview      — Status, timeline              │
│  │       ├── /specification — Current spec (read-only)      │
│  │       ├── /invoices      — Invoices list                 │
│  │       ├── /tasks         — Kanban view                   │
│  │       ├── /approvals     — Pending approvals             │
│  │       ├── /materials     — Files & deliverables          │
│  │       └── /add-order     — Create add-on specification   │
│  │                                                          │
│  ├── /offers                — Offers list                    │
│  │   └── /offers/:id        — Offer details + accept        │
│  │                                                          │
│  ├── /invoices              — All invoices                   │
│  │   └── /invoices/:id      — Invoice details + pay         │
│  │                                                          │
│  └── /profile               — Profile settings               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2. Account Manager Panel

```
┌─────────────────────────────────────────────────────────────┐
│  AM PANEL                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /am/dashboard              — Overview, KPIs                 │
│  │                                                          │
│  ├── /am/clients            — Clients list                   │
│  │   └── /am/clients/:id    — Client details, CRM notes     │
│  │                                                          │
│  ├── /am/projects           — All my projects                │
│  │   └── /am/projects/:id   — Project management            │
│  │       ├── /tasks         — Task management               │
│  │       ├── /approvals     — Request approvals             │
│  │       ├── /materials     — Upload deliverables           │
│  │       └── /invoices      — Create/manage invoices        │
│  │                                                          │
│  ├── /am/invoices           — Invoices overview              │
│  │   └── Confirm payments                                   │
│  │                                                          │
│  └── /am/reports            — Reports (placeholder)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3. Admin Panel

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN PANEL                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /admin/dashboard           — System overview                │
│  │                                                          │
│  ├── /admin/users           — User management                │
│  │   └── Roles, activation                                  │
│  │                                                          │
│  ├── /admin/clients         — All clients                    │
│  │                                                          │
│  ├── /admin/projects        — All projects                   │
│  │   └── Override flags (start without payment)             │
│  │                                                          │
│  ├── /admin/pricing         — Price configuration            │
│  │   ├── Categories & items                                 │
│  │   ├── Styles & coefficients                              │
│  │   ├── Animations                                         │
│  │   └── Payment models                                     │
│  │                                                          │
│  ├── /admin/promo-codes     — Promo code management          │
│  │                                                          │
│  ├── /admin/offers          — Offer templates & legal text   │
│  │                                                          │
│  └── /admin/audit           — Audit logs                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. RBAC и RLS

### 5.1. Permission Matrix

| Resource | Client | AM | Admin |
|----------|--------|-----|-------|
| **Own Profile** | RW | RW | RW |
| **Own Client Record** | RW | R (assigned) | RW |
| **Projects (own)** | R | RW (assigned) | RW |
| **Projects (all)** | - | - | RW |
| **Specifications** | R (own) | RW (assigned) | RW |
| **Offers** | R+Accept (own) | R (assigned) | RW |
| **Invoices** | R+Pay (own) | RW (assigned) | RW |
| **Tasks** | R (own project) | RW (assigned) | RW |
| **Approvals** | RW (respond) | RW (create) | RW |
| **Assets** | R+Upload refs | RW | RW |
| **Comments** | RW (own) | RW | RW |
| **Promo Codes** | - | - | RW |
| **Price Config** | - | - | RW |
| **Audit Logs** | - | - | R |
| **User Management** | - | - | RW |

### 5.2. RLS Policies (ключевые)

```sql
-- Profiles: users see only themselves, admins see all
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Projects: clients see own, AM sees assigned, admin sees all
CREATE POLICY "Clients see own projects"
ON public.projects FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "AM sees assigned projects"
ON public.projects FOR SELECT
USING (am_id = auth.uid());

CREATE POLICY "Admin sees all projects"
ON public.projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 6. Юридические флоу

### 6.1. Offer Acceptance Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     OFFER ACCEPTANCE FLOW                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Client opens Offer page                                       │
│     └── Log: { action: 'viewed', ip, user_agent, timestamp }     │
│                                                                   │
│  2. Client reads full legal text                                  │
│     └── UI: scroll to bottom required before enabling button     │
│                                                                   │
│  3. Client checks "I agree to terms" checkbox                     │
│                                                                   │
│  4. Client clicks "Accept Offer"                                  │
│     └── Backend:                                                  │
│         a) Validate offer is still valid (not expired)           │
│         b) Create offer_acceptance_log with:                     │
│            - Full offer snapshot (JSON)                          │
│            - IP address                                          │
│            - User-Agent                                          │
│            - Timestamp                                           │
│         c) Update offer.status = 'accepted'                      │
│         d) Auto-generate first Invoice(s)                        │
│         e) Notify AM                                             │
│                                                                   │
│  5. Display success + redirect to invoice                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2. Specification Finalization Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   SPECIFICATION FINALIZATION                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Client reviews specification in draft state                   │
│                                                                   │
│  2. Client clicks "Finalize Specification"                        │
│     └── Confirmation modal: "This action cannot be undone"       │
│                                                                   │
│  3. Backend:                                                      │
│     a) Update status = 'finalized'                               │
│     b) Set finalized_at = now()                                  │
│     c) Create snapshot of current prices (in totals_json)        │
│     d) Generate Offer automatically                              │
│     e) Notify AM                                                 │
│     f) Audit log entry                                           │
│                                                                   │
│  4. Specification becomes read-only                               │
│                                                                   │
│  5. Redirect to Offer page                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3. Audit Log Entry Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_role": "client",
  "action": "accept_offer",
  "entity_type": "offer",
  "entity_id": "uuid",
  "old_data": {
    "status": "pending"
  },
  "new_data": {
    "status": "accepted",
    "accepted_at": "2026-02-01T12:00:00Z"
  },
  "metadata": {
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "source": "web"
  },
  "created_at": "2026-02-01T12:00:00Z"
}
```

---

## 7. Файловое хранилище

### 7.1. Рекомендация: Supabase Storage

**Почему Supabase Storage, а не S3:**
- Встроенная интеграция с RLS
- Единая авторизация (Supabase Auth)
- Проще настройка для MVP
- Достаточно для текущих объёмов

**Структура buckets:**

```
storage/
├── avatars/           — User avatars (public)
├── references/        — Client uploads (private, per project)
├── deliverables/      — Studio deliverables (private, per project)
├── sources/           — Source files (private, per project)
├── invoices/          — Invoice PDFs (private)
└── proofs/            — Payment proofs (private)
```

### 7.2. Storage Policies

```sql
-- References: clients can upload to their projects
CREATE POLICY "Clients upload references"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'references' AND
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM projects p
    JOIN clients c ON c.id = p.client_id
    WHERE c.user_id = auth.uid()
  )
);
```

---

## 8. План реализации

### Phase 1: Foundation (Week 1-2)

#### 1.1. Supabase Setup
- [ ] Create Supabase project
- [ ] Configure Auth (email/password)
- [ ] Create all tables (see 2.2)
- [ ] Setup RLS policies
- [ ] Configure Storage buckets

#### 1.2. Base Client App
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Auth flow (login, register, logout)
- [ ] Layout components (header, sidebar, navigation)
- [ ] Protected routes by role
- [ ] Basic profile page

### Phase 2: Calculator Integration (Week 2-3)

#### 2.1. Calculator Migration
- [ ] Copy existing calculator components
- [ ] Connect to Supabase for price configs
- [ ] Implement draft saving
- [ ] Add "Create Specification" flow

#### 2.2. Specifications
- [ ] Specification list view
- [ ] Specification detail view
- [ ] Finalization flow
- [ ] Version history view

### Phase 3: Offers & Invoices (Week 3-4)

#### 3.1. Offers
- [ ] Offer generation (from finalized spec)
- [ ] Offer view page
- [ ] Acceptance flow with legal logging
- [ ] PDF export

#### 3.2. Invoices
- [ ] Invoice generation (by milestones)
- [ ] Invoice view page
- [ ] Payment flow (wallet display)
- [ ] AM: payment confirmation

### Phase 4: Project Workspace (Week 4-5)

#### 4.1. Projects
- [ ] Project creation (auto after payment)
- [ ] Project overview page
- [ ] Timeline/stages view

#### 4.2. Tasks & Kanban
- [ ] Basic task CRUD
- [ ] Kanban board view
- [ ] Task details with comments

#### 4.3. Approvals
- [ ] Approval request (AM)
- [ ] Approval response (Client)
- [ ] Revision tracking
- [ ] Block after 2 rounds

### Phase 5: Materials & Delivery (Week 5-6)

#### 5.1. File Management
- [ ] File upload (references, deliverables)
- [ ] File browser by project
- [ ] Version tracking
- [ ] Preview for images

#### 5.2. Final Delivery
- [ ] Delivery checklist
- [ ] Final approval flow
- [ ] Project closure

### Phase 6: Admin Panel (Week 6-7)

#### 6.1. User Management
- [ ] User list, roles
- [ ] Client management
- [ ] AM assignment

#### 6.2. Settings
- [ ] Price configuration
- [ ] Promo codes
- [ ] Offer templates
- [ ] Audit logs viewer

### Phase 7: Polish & Launch (Week 7-8)

#### 7.1. UX
- [ ] Notifications system
- [ ] Email notifications
- [ ] Mobile responsiveness
- [ ] Error handling

#### 7.2. Security Review
- [ ] RLS audit
- [ ] Input validation
- [ ] Rate limiting

---

## Appendix A: Open Tasks (отдельные задачи)

### A.1. Legal Text Draft
**Priority:** High  
**Description:** Составить юридический текст оферты  
**Includes:**
- Общие условия
- Обязанности сторон
- Сроки
- Ответственность
- Интеллектуальная собственность
- Порядок разрешения споров

### A.2. AM CRM Module
**Priority:** Medium (after MVP)  
**Description:** CRM-функционал для Account Manager  
**Includes:**
- Заметки по клиенту
- История коммуникации
- Календарь/напоминания
- Пайплайн

---

## Appendix B: Technical Notes

### B.1. Number Generation

```typescript
// Offer number: OFF-YYYY-NNNNN
async function generateOfferNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await supabase
    .from('offers')
    .select('id', { count: 'exact' })
    .gte('created_at', `${year}-01-01`);
  
  const number = (count.count || 0) + 1;
  return `OFF-${year}-${number.toString().padStart(5, '0')}`;
}

// Invoice: INV-YYYY-NNNNN (same logic)
// Project: PRJ-YYYY-NNNNN (same logic)
```

### B.2. Specification Versioning

```typescript
// Major version: v1.0, v2.0 (new specifications)
// Add-on versioning: linked to parent, shows as "Add-on #1 to v1.0"

function generateSpecVersion(projectId: string, isAddon: boolean, parentVersion?: string): string {
  if (isAddon && parentVersion) {
    // Count add-ons for this parent
    const addonCount = await countAddons(projectId, parentVersion);
    return `${parentVersion}+${addonCount + 1}`; // v1.0+1, v1.0+2
  }
  
  // New major version
  const majorCount = await countMajorVersions(projectId);
  return `v${majorCount + 1}.0`;
}
```

---

**Document Version:** 1.0  
**Created:** 2026-02-01  
**Author:** Claude (Architect Mode)
