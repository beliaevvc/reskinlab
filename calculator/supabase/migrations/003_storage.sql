-- ===========================================
-- RESKIN LAB PLATFORM - STORAGE BUCKETS
-- Version: 1.0
-- ===========================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('references', 'references', false, 52428800, NULL),
  ('deliverables', 'deliverables', false, 104857600, NULL),
  ('sources', 'sources', false, 524288000, NULL),
  ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('proofs', 'proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']);

-- ===========================================
-- AVATARS BUCKET (public)
-- ===========================================

-- Public read access for avatars
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "avatars_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ===========================================
-- REFERENCES BUCKET (client uploads)
-- ===========================================

-- Clients can upload references to their projects
CREATE POLICY "references_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'references' AND
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- Project participants can read references
CREATE POLICY "references_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'references' AND
  (
    -- Client owns project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    -- AM assigned to project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- ===========================================
-- DELIVERABLES BUCKET (studio uploads)
-- ===========================================

-- Staff can upload deliverables
CREATE POLICY "deliverables_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deliverables' AND
  (
    -- AM assigned to project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Project participants can read deliverables
CREATE POLICY "deliverables_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deliverables' AND
  (
    -- Client owns project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    -- AM assigned to project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- ===========================================
-- SOURCES BUCKET (source files)
-- ===========================================

-- Staff can upload sources
CREATE POLICY "sources_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sources' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Project participants can read sources
CREATE POLICY "sources_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sources' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      WHERE p.am_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- ===========================================
-- INVOICES BUCKET
-- ===========================================

-- Staff can upload invoice PDFs
CREATE POLICY "invoices_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('am', 'admin'))
);

-- Invoice owners can read
CREATE POLICY "invoices_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' AND
  (
    -- Client can read their invoices
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    -- Staff
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('am', 'admin'))
  )
);

-- ===========================================
-- PROOFS BUCKET (payment proofs)
-- ===========================================

-- Clients can upload payment proofs
CREATE POLICY "proofs_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proofs' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('am', 'admin'))
  )
);

-- Proof access
CREATE POLICY "proofs_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'proofs' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('am', 'admin'))
  )
);
