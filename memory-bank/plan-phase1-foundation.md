# Phase 1: Foundation — Детальный план

## Обзор Phase 1

**Цель:** Создать фундамент платформы — Supabase backend + базовое React приложение с авторизацией и роутингом.

**Длительность:** 1-2 недели  
**Результат:** Работающее приложение с логином, регистрацией, защищёнными роутами и базовым профилем.

---

## Структура Phase 1

```
Phase 1: Foundation
├── 1.1 Supabase Setup
│   ├── 1.1.1 Create project
│   ├── 1.1.2 Database schema (tables)
│   ├── 1.1.3 RLS policies
│   ├── 1.1.4 Storage buckets
│   └── 1.1.5 Seed data (admin user)
│
└── 1.2 Base App
    ├── 1.2.1 Project restructure
    ├── 1.2.2 Supabase client setup
    ├── 1.2.3 Auth context & hooks
    ├── 1.2.4 Router setup
    ├── 1.2.5 Layout components
    ├── 1.2.6 Auth pages (login, register)
    ├── 1.2.7 Protected routes
    └── 1.2.8 Profile page
```

---

## 1.1 Supabase Setup

### 1.1.1 Create Supabase Project

**Действия:**
1. Создать проект на [supabase.com](https://supabase.com)
2. Записать credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Настроить Auth:
   - Включить Email provider
   - Отключить email confirmation (для MVP)
   - Настроить redirect URLs

**Файл для credentials:** `.env.local` (добавить в .gitignore)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

### 1.1.2 Database Schema

**Порядок создания таблиц (с учётом FK):**

```
1. profiles (depends on auth.users)
2. promo_codes (no deps)
3. price_configs (no deps)
4. clients (depends on profiles, promo_codes)
5. projects (depends on clients, profiles)
6. specifications (depends on projects, profiles)
7. offers (depends on specifications, profiles)
8. offer_acceptance_logs (depends on offers, profiles)
9. invoices (depends on offers, projects, profiles)
10. workflow_stages (depends on projects)
11. tasks (depends on projects, workflow_stages, profiles)
12. assets (depends on projects, workflow_stages, tasks, profiles)
13. approvals (depends on projects, workflow_stages, assets, profiles)
14. comments (depends on profiles)
15. audit_logs (depends on profiles)
```

**SQL Script:** `supabase/migrations/001_initial_schema.sql`

```sql
-- ===========================================
-- PHASE 1: CORE TABLES
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (extends Supabase Auth)
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

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Promo Codes
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  min_order_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Price Configs
CREATE TABLE public.price_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL,
  config_data JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  company_type TEXT CHECK (company_type IN ('individual', 'company')),
  tax_id TEXT,
  country TEXT,
  address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  promo_code_id UUID REFERENCES public.promo_codes(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to create client record for client role users
CREATE OR REPLACE FUNCTION public.handle_new_client()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'client' THEN
    INSERT INTO public.clients (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_client();

-- 5. Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  am_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_payment', 'active', 'on_hold', 'completed', 'cancelled'
  )),
  can_start_without_payment BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Specifications
CREATE TABLE public.specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  parent_spec_id UUID REFERENCES public.specifications(id),
  version TEXT NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  is_addon BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  state_json JSONB NOT NULL,
  totals_json JSONB,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_specifications_project_version 
ON public.specifications(project_id, version_number DESC);

-- 7. Offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specification_id UUID NOT NULL UNIQUE REFERENCES public.specifications(id),
  number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'expired', 'cancelled'
  )),
  legal_text TEXT NOT NULL,
  terms_version TEXT,
  valid_until TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Offer Acceptance Logs
CREATE TABLE public.offer_acceptance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('viewed', 'accepted')),
  ip_address INET,
  user_agent TEXT,
  offer_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  number TEXT NOT NULL UNIQUE,
  milestone_id TEXT,
  milestone_name TEXT,
  milestone_order INT,
  amount_usd DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  wallet_address TEXT,
  network TEXT CHECK (network IN ('TRC20', 'ERC20')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'overdue', 'cancelled'
  )),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id),
  tx_hash TEXT,
  payment_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Workflow Stages
CREATE TABLE public.workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'review', 'approved', 'completed'
  )),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, stage_key)
);

-- 11. Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_id UUID REFERENCES public.workflow_stages(id),
  parent_task_id UUID REFERENCES public.tasks(id),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN (
    'todo', 'in_progress', 'review', 'done'
  )),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Assets
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_id UUID REFERENCES public.workflow_stages(id),
  task_id UUID REFERENCES public.tasks(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'reference', 'deliverable', 'source', 'proof'
  )),
  version INT DEFAULT 1,
  parent_asset_id UUID REFERENCES public.assets(id),
  is_final BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Approvals
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  stage_id UUID REFERENCES public.workflow_stages(id),
  asset_id UUID REFERENCES public.assets(id),
  approval_type TEXT NOT NULL CHECK (approval_type IN ('asset', 'stage', 'final')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'needs_revision'
  )),
  revision_round INT DEFAULT 1,
  max_free_rounds INT DEFAULT 2,
  client_comment TEXT,
  internal_notes TEXT,
  requested_by UUID REFERENCES public.profiles(id),
  responded_by UUID REFERENCES public.profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'approval', 'asset', 'project')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  parent_comment_id UUID REFERENCES public.comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);

-- 15. Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ===========================================
-- UPDATED_AT TRIGGERS
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specifications_updated_at BEFORE UPDATE ON specifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_stages_updated_at BEFORE UPDATE ON workflow_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 1.1.3 RLS Policies

**SQL Script:** `supabase/migrations/002_rls_policies.sql`

```sql
-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_acceptance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is AM
CREATE OR REPLACE FUNCTION is_am()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'am'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get client_id for current user
CREATE OR REPLACE FUNCTION get_my_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.clients
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PROFILES POLICIES
-- ===========================================

-- Users can view own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- AM can view client profiles
CREATE POLICY "profiles_select_am"
ON public.profiles FOR SELECT
USING (is_am() OR is_admin());

-- Users can update own profile (except role)
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "profiles_update_admin"
ON public.profiles FOR UPDATE
USING (is_admin());

-- ===========================================
-- CLIENTS POLICIES
-- ===========================================

-- Users can view own client record
CREATE POLICY "clients_select_own"
ON public.clients FOR SELECT
USING (user_id = auth.uid());

-- AM/Admin can view all clients
CREATE POLICY "clients_select_staff"
ON public.clients FOR SELECT
USING (is_am() OR is_admin());

-- Users can update own client record
CREATE POLICY "clients_update_own"
ON public.clients FOR UPDATE
USING (user_id = auth.uid());

-- Admin can update any client
CREATE POLICY "clients_update_admin"
ON public.clients FOR UPDATE
USING (is_admin());

-- ===========================================
-- PROJECTS POLICIES
-- ===========================================

-- Clients see own projects
CREATE POLICY "projects_select_client"
ON public.projects FOR SELECT
USING (client_id = get_my_client_id());

-- AM sees assigned projects
CREATE POLICY "projects_select_am"
ON public.projects FOR SELECT
USING (am_id = auth.uid());

-- Admin sees all
CREATE POLICY "projects_select_admin"
ON public.projects FOR SELECT
USING (is_admin());

-- AM can create projects for clients
CREATE POLICY "projects_insert_staff"
ON public.projects FOR INSERT
WITH CHECK (is_am() OR is_admin());

-- Clients can create own projects (for calculator flow)
CREATE POLICY "projects_insert_client"
ON public.projects FOR INSERT
WITH CHECK (client_id = get_my_client_id());

-- AM/Admin can update assigned projects
CREATE POLICY "projects_update_staff"
ON public.projects FOR UPDATE
USING (am_id = auth.uid() OR is_admin());

-- ===========================================
-- SPECIFICATIONS POLICIES
-- ===========================================

-- Client sees own specs
CREATE POLICY "specifications_select_client"
ON public.specifications FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- AM sees assigned project specs
CREATE POLICY "specifications_select_am"
ON public.specifications FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE am_id = auth.uid()
  )
  OR is_admin()
);

-- Client can create/update draft specs
CREATE POLICY "specifications_insert_client"
ON public.specifications FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

CREATE POLICY "specifications_update_client"
ON public.specifications FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
  AND status = 'draft'
);

-- ===========================================
-- PRICE CONFIGS (Admin only read for clients)
-- ===========================================

-- Everyone can read active price configs
CREATE POLICY "price_configs_select_all"
ON public.price_configs FOR SELECT
USING (is_active = true);

-- Admin can manage
CREATE POLICY "price_configs_admin"
ON public.price_configs FOR ALL
USING (is_admin());

-- ===========================================
-- PROMO CODES
-- ===========================================

-- Admin can manage
CREATE POLICY "promo_codes_admin"
ON public.promo_codes FOR ALL
USING (is_admin());

-- Clients can read active promo codes (for validation)
CREATE POLICY "promo_codes_select_client"
ON public.promo_codes FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- ===========================================
-- AUDIT LOGS (Admin only)
-- ===========================================

CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT
USING (is_admin());

CREATE POLICY "audit_logs_insert_all"
ON public.audit_logs FOR INSERT
WITH CHECK (true); -- Any authenticated user can create audit logs
```

---

### 1.1.4 Storage Buckets

**SQL Script:** `supabase/migrations/003_storage.sql`

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('references', 'references', false),
  ('deliverables', 'deliverables', false),
  ('sources', 'sources', false),
  ('invoices', 'invoices', false),
  ('proofs', 'proofs', false);

-- Avatars: public read, authenticated upload own
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- References: clients upload to own projects
CREATE POLICY "references_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'references' AND
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM projects p
    JOIN clients c ON c.id = p.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "references_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'references' AND
  (
    -- Client owns project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    -- AM assigned to project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Deliverables: AM/Admin upload, client reads
CREATE POLICY "deliverables_upload_staff"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deliverables' AND
  (
    -- AM assigned to project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "deliverables_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deliverables' AND
  (
    -- Client owns project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    -- AM assigned to project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
```

---

### 1.1.5 Seed Data

**SQL Script:** `supabase/seed.sql`

```sql
-- Note: Admin user must be created via Supabase Auth first,
-- then we update the role

-- After creating admin user via dashboard or API:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@reskinlab.com';

-- Seed price configs from existing calculator data
-- (This will be done programmatically in Phase 2)
```

---

## 1.2 Base App Setup

### 1.2.1 Project Restructure

**Решение:** Расширяем существующий калькулятор в полноценную платформу.

**Новая структура проекта:**

```
calculator/  →  platform/  (rename)
├── public/
├── src/
│   ├── components/
│   │   ├── calculator/        ← Существующие компоненты калькулятора
│   │   │   ├── CategorySection.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── ItemRow.jsx
│   │   │   └── ... (все текущие)
│   │   │
│   │   ├── layout/            ← NEW: Общие layout компоненты
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── MobileNav.jsx
│   │   │
│   │   ├── auth/              ← NEW: Auth компоненты
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   └── ui/                ← NEW: Переиспользуемые UI компоненты
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Card.jsx
│   │       └── ...
│   │
│   ├── pages/                 ← NEW: Страницы
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── calculator/
│   │   │   └── CalculatorPage.jsx  ← Обёртка над существующим
│   │   └── profile/
│   │       └── ProfilePage.jsx
│   │
│   ├── lib/                   ← NEW: Библиотеки и утилиты
│   │   ├── supabase.js
│   │   └── utils.js
│   │
│   ├── hooks/                 ← Расширяем
│   │   ├── useCalculator.js   ← Существующий
│   │   ├── useAuth.js         ← NEW
│   │   └── useProfile.js      ← NEW
│   │
│   ├── contexts/              ← NEW: React контексты
│   │   └── AuthContext.jsx
│   │
│   ├── data/                  ← Существующие данные калькулятора
│   │
│   ├── App.jsx                ← Рефакторинг в Router
│   ├── main.jsx
│   └── index.css
│
├── supabase/                  ← NEW: Supabase migrations
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_storage.sql
│   └── seed.sql
│
├── .env.local                 ← NEW: Environment variables
├── .env.example               ← NEW: Template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

### 1.2.2 Dependencies

**Добавить в package.json:**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-router-dom": "^6.21.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0"
  }
}
```

**Команда:**
```bash
npm install @supabase/supabase-js react-router-dom zustand @tanstack/react-query
```

---

### 1.2.3 Supabase Client

**Файл:** `src/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

---

### 1.2.4 Auth Context

**Файл:** `src/contexts/AuthContext.jsx`

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'client',
        },
      },
    });
    return { data, error };
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isClient: profile?.role === 'client',
    isAM: profile?.role === 'am',
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### 1.2.5 Router Setup

**Файл:** `src/App.jsx` (рефакторинг)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CalculatorPage from './pages/calculator/CalculatorPage';
import ProfilePage from './pages/profile/ProfilePage';

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

### 1.2.6 Protected Route Component

**Файл:** `src/components/auth/ProtectedRoute.jsx`

```javascript
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

---

### 1.2.7 Layout Components

**Файл:** `src/components/layout/AppLayout.jsx`

```javascript
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Файл:** `src/components/layout/AppSidebar.jsx`

```javascript
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const clientNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/calculator', label: 'Calculator', icon: 'calculator' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/invoices', label: 'Invoices', icon: 'receipt' },
];

const amNavItems = [
  { to: '/am/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/am/clients', label: 'Clients', icon: 'users' },
  { to: '/am/projects', label: 'Projects', icon: 'folder' },
];

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/pricing', label: 'Pricing', icon: 'tag' },
  { to: '/admin/audit', label: 'Audit Log', icon: 'shield' },
];

export function AppSidebar({ open, onClose }) {
  const { profile, signOut } = useAuth();

  const navItems = profile?.role === 'admin' 
    ? adminNavItems 
    : profile?.role === 'am' 
      ? amNavItems 
      : clientNavItems;

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-200">
        <span className="text-xl font-bold text-neutral-900">
          ReSkin Lab<span className="text-emerald-500">.</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
        <NavLink
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Profile
        </NavLink>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
```

---

## Чеклист Phase 1

### 1.1 Supabase Setup
- [ ] Создать Supabase проект
- [ ] Добавить credentials в `.env.local`
- [ ] Выполнить `001_initial_schema.sql`
- [ ] Выполнить `002_rls_policies.sql`
- [ ] Выполнить `003_storage.sql`
- [ ] Создать admin пользователя
- [ ] Протестировать RLS в Supabase Dashboard

### 1.2 Base App
- [ ] Установить зависимости (`npm install ...`)
- [ ] Создать структуру папок
- [ ] Настроить `src/lib/supabase.js`
- [ ] Создать `AuthContext.jsx`
- [ ] Создать `ProtectedRoute.jsx`
- [ ] Создать Layout компоненты
- [ ] Рефакторинг `App.jsx` с роутингом
- [ ] Создать `LoginPage.jsx`
- [ ] Создать `RegisterPage.jsx`
- [ ] Создать `DashboardPage.jsx` (заглушка)
- [ ] Создать `ProfilePage.jsx`
- [ ] Обернуть калькулятор в `CalculatorPage.jsx`
- [ ] Протестировать полный auth flow

### Acceptance Criteria
- [ ] Пользователь может зарегистрироваться
- [ ] Пользователь может войти
- [ ] Пользователь может выйти
- [ ] Защищённые роуты редиректят на логин
- [ ] Профиль отображает данные из Supabase
- [ ] Калькулятор работает как раньше
- [ ] Мобильная навигация работает

---

**Готов к /build?**
