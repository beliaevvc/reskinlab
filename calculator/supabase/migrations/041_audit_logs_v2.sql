-- ===========================================
-- AUDIT LOGS V2 - Enhanced logging system
-- Version: 2.0
-- ===========================================

-- 1. Add new columns for IP and User-Agent tracking
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Add new indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON public.audit_logs(created_at DESC, action, entity_type);

-- 3. Drop existing audit_logs policies to replace them
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

-- 4. Immutable logs: prevent UPDATE and DELETE for all roles
CREATE POLICY "audit_logs_no_update" ON public.audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
  FOR DELETE USING (false);

-- 5. Read access: admin sees all, am/client see only their own logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid());

-- 6. Insert: all authenticated users can create logs
CREATE POLICY "audit_logs_insert_auth" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
