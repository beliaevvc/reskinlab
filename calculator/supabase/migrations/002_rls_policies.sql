-- ===========================================
-- RESKIN LAB PLATFORM - RLS POLICIES
-- Version: 1.0
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

-- Check if user is AM or Admin
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('am', 'admin')
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

-- Staff can view all profiles
CREATE POLICY "profiles_select_staff"
ON public.profiles FOR SELECT
USING (is_staff());

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

-- Staff can view all clients
CREATE POLICY "clients_select_staff"
ON public.clients FOR SELECT
USING (is_staff());

-- Users can update own client record
CREATE POLICY "clients_update_own"
ON public.clients FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

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

-- Clients can create own projects
CREATE POLICY "projects_insert_client"
ON public.projects FOR INSERT
WITH CHECK (client_id = get_my_client_id());

-- Staff can create projects
CREATE POLICY "projects_insert_staff"
ON public.projects FOR INSERT
WITH CHECK (is_staff());

-- Staff can update assigned/all projects
CREATE POLICY "projects_update_am"
ON public.projects FOR UPDATE
USING (am_id = auth.uid());

CREATE POLICY "projects_update_admin"
ON public.projects FOR UPDATE
USING (is_admin());

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

-- Staff sees assigned/all specs
CREATE POLICY "specifications_select_staff"
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
  -- Can update if: owns the project AND spec is draft
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
  AND status = 'draft'
)
WITH CHECK (
  -- After update: just check ownership (allow status change to finalized)
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Staff can manage specs
CREATE POLICY "specifications_staff"
ON public.specifications FOR ALL
USING (is_staff());

-- ===========================================
-- OFFERS POLICIES
-- ===========================================

-- Client sees own offers
CREATE POLICY "offers_select_client"
ON public.offers FOR SELECT
USING (
  specification_id IN (
    SELECT s.id FROM specifications s
    JOIN projects p ON s.project_id = p.id
    WHERE p.client_id = get_my_client_id()
  )
);

-- Staff sees all offers
CREATE POLICY "offers_select_staff"
ON public.offers FOR SELECT
USING (is_staff());

-- Client can INSERT offers for their finalized specs
CREATE POLICY "offers_insert_client"
ON public.offers FOR INSERT
WITH CHECK (
  specification_id IN (
    SELECT s.id FROM specifications s
    JOIN projects p ON s.project_id = p.id
    WHERE p.client_id = get_my_client_id()
    AND s.status = 'finalized'
  )
);

-- Client can UPDATE offers (for acceptance)
CREATE POLICY "offers_update_client"
ON public.offers FOR UPDATE
USING (
  specification_id IN (
    SELECT s.id FROM specifications s
    JOIN projects p ON s.project_id = p.id
    WHERE p.client_id = get_my_client_id()
  )
  AND status = 'pending'
)
WITH CHECK (
  specification_id IN (
    SELECT s.id FROM specifications s
    JOIN projects p ON s.project_id = p.id
    WHERE p.client_id = get_my_client_id()
  )
);

-- Staff can manage offers
CREATE POLICY "offers_staff"
ON public.offers FOR ALL
USING (is_staff());

-- ===========================================
-- OFFER ACCEPTANCE LOGS
-- ===========================================

-- Users can create logs for their offers
CREATE POLICY "offer_logs_insert"
ON public.offer_acceptance_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can view their own logs
CREATE POLICY "offer_logs_select_own"
ON public.offer_acceptance_logs FOR SELECT
USING (user_id = auth.uid());

-- Admin can view all
CREATE POLICY "offer_logs_select_admin"
ON public.offer_acceptance_logs FOR SELECT
USING (is_admin());

-- ===========================================
-- INVOICES POLICIES
-- ===========================================

-- Client sees own invoices
CREATE POLICY "invoices_select_client"
ON public.invoices FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can INSERT invoices (through offer creation)
CREATE POLICY "invoices_insert_client"
ON public.invoices FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Staff sees all invoices
CREATE POLICY "invoices_select_staff"
ON public.invoices FOR SELECT
USING (is_staff());

-- Staff can manage invoices
CREATE POLICY "invoices_staff"
ON public.invoices FOR ALL
USING (is_staff());

-- ===========================================
-- WORKFLOW STAGES POLICIES
-- ===========================================

-- Client sees own project stages
CREATE POLICY "stages_select_client"
ON public.workflow_stages FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can create stages in own projects
CREATE POLICY "stages_insert_client"
ON public.workflow_stages FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Staff can manage stages
CREATE POLICY "stages_staff"
ON public.workflow_stages FOR ALL
USING (is_staff());

-- ===========================================
-- TASKS POLICIES
-- ===========================================

-- Client sees own project tasks
CREATE POLICY "tasks_select_client"
ON public.tasks FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can create tasks in own projects
CREATE POLICY "tasks_insert_client"
ON public.tasks FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can update tasks in own projects
CREATE POLICY "tasks_update_client"
ON public.tasks FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can delete tasks in own projects
CREATE POLICY "tasks_delete_client"
ON public.tasks FOR DELETE
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Staff can manage tasks
CREATE POLICY "tasks_staff"
ON public.tasks FOR ALL
USING (is_staff());

-- ===========================================
-- ASSETS POLICIES
-- ===========================================

-- Client sees own project assets
CREATE POLICY "assets_select_client"
ON public.assets FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can upload references
CREATE POLICY "assets_insert_client"
ON public.assets FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
  AND asset_type = 'reference'
  AND uploaded_by = auth.uid()
);

-- Staff can manage assets
CREATE POLICY "assets_staff"
ON public.assets FOR ALL
USING (is_staff());

-- ===========================================
-- APPROVALS POLICIES
-- ===========================================

-- Client sees own approvals
CREATE POLICY "approvals_select_client"
ON public.approvals FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Client can respond to approvals
CREATE POLICY "approvals_update_client"
ON public.approvals FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
  AND status = 'pending'
)
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE client_id = get_my_client_id()
  )
);

-- Staff can manage approvals
CREATE POLICY "approvals_staff"
ON public.approvals FOR ALL
USING (is_staff());

-- ===========================================
-- COMMENTS POLICIES
-- ===========================================

-- Users can create their own comments
CREATE POLICY "comments_insert"
ON public.comments FOR INSERT
WITH CHECK (author_id = auth.uid());

-- Users can view comments on their entities
CREATE POLICY "comments_select"
ON public.comments FOR SELECT
USING (
  -- Check based on entity type
  CASE entity_type
    WHEN 'project' THEN
      entity_id IN (
        SELECT id FROM projects 
        WHERE client_id = get_my_client_id() 
        OR am_id = auth.uid()
      )
    WHEN 'task' THEN
      entity_id IN (
        SELECT t.id FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.client_id = get_my_client_id() 
        OR p.am_id = auth.uid()
      )
    ELSE true
  END
  OR is_admin()
);

-- Users can update own comments
CREATE POLICY "comments_update_own"
ON public.comments FOR UPDATE
USING (author_id = auth.uid());

-- Users can delete own comments
CREATE POLICY "comments_delete_own"
ON public.comments FOR DELETE
USING (author_id = auth.uid());

-- ===========================================
-- PROMO CODES POLICIES
-- ===========================================

-- Admin can manage
CREATE POLICY "promo_codes_admin"
ON public.promo_codes FOR ALL
USING (is_admin());

-- All authenticated can read active promo codes
CREATE POLICY "promo_codes_select"
ON public.promo_codes FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- ===========================================
-- PRICE CONFIGS POLICIES
-- ===========================================

-- Admin can manage
CREATE POLICY "price_configs_admin"
ON public.price_configs FOR ALL
USING (is_admin());

-- All can read active configs
CREATE POLICY "price_configs_select"
ON public.price_configs FOR SELECT
USING (is_active = true);

-- ===========================================
-- AUDIT LOGS POLICIES
-- ===========================================

-- Admin can view all logs
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT
USING (is_admin());

-- Any authenticated user can create logs
CREATE POLICY "audit_logs_insert"
ON public.audit_logs FOR INSERT
WITH CHECK (true);
