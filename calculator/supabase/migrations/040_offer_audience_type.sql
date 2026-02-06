-- ============================================
-- 040: Add audience_type to offer_templates
-- Allows templates to be scoped to all users or specific clients
-- ============================================

-- Add audience_type column: 'all' means available to everyone, 'specific' means only assigned clients
ALTER TABLE public.offer_templates
  ADD COLUMN IF NOT EXISTS audience_type TEXT NOT NULL DEFAULT 'all'
  CHECK (audience_type IN ('all', 'specific'));

-- Backfill: if a template has any client_offer_assignments, mark it as 'specific'
UPDATE public.offer_templates ot
SET audience_type = 'specific'
WHERE EXISTS (
  SELECT 1 FROM public.client_offer_assignments coa
  WHERE coa.template_id = ot.id
);
