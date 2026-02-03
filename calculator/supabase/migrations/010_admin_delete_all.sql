-- ===========================================
-- COMPLETE DELETE POLICIES FOR ADMIN
-- ===========================================

-- Admin can delete projects
DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;
CREATE POLICY "projects_delete_admin"
ON public.projects FOR DELETE
USING (is_admin());

-- Admin can delete project_files
DROP POLICY IF EXISTS "project_files_delete_admin" ON public.project_files;
CREATE POLICY "project_files_delete_admin"
ON public.project_files FOR DELETE
USING (is_admin());

-- Admin can delete tasks
DROP POLICY IF EXISTS "tasks_delete_admin" ON public.tasks;
CREATE POLICY "tasks_delete_admin"
ON public.tasks FOR DELETE
USING (is_admin());

-- Admin can delete approvals
DROP POLICY IF EXISTS "approvals_delete_admin" ON public.approvals;
CREATE POLICY "approvals_delete_admin"
ON public.approvals FOR DELETE
USING (is_admin());

-- Admin can delete workflow_stages
DROP POLICY IF EXISTS "workflow_stages_delete_admin" ON public.workflow_stages;
CREATE POLICY "workflow_stages_delete_admin"
ON public.workflow_stages FOR DELETE
USING (is_admin());
