-- ============================================
-- 044: Project Links (Resources)
-- Adds external resource links to projects (Figma, GitHub, Dropbox, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  type TEXT NOT NULL CHECK (type IN ('figma', 'github', 'gitlab', 'dropbox', 'google_drive', 'notion', 'miro', 'custom')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by project + ordering
CREATE INDEX IF NOT EXISTS idx_project_links_project
  ON public.project_links(project_id, sort_order);

-- Enable RLS
ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

-- SELECT: clients see links for their own projects, staff sees all
CREATE POLICY "project_links_select_client"
  ON public.project_links FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE client_id = get_my_client_id()
    )
  );

CREATE POLICY "project_links_select_staff"
  ON public.project_links FOR SELECT
  USING (is_staff());

-- INSERT/UPDATE/DELETE: staff only
CREATE POLICY "project_links_insert_staff"
  ON public.project_links FOR INSERT
  WITH CHECK (is_staff());

CREATE POLICY "project_links_update_staff"
  ON public.project_links FOR UPDATE
  USING (is_staff());

CREATE POLICY "project_links_delete_staff"
  ON public.project_links FOR DELETE
  USING (is_staff());
