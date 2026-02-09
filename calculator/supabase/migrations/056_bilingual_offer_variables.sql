-- ===========================================
-- BILINGUAL OFFER VARIABLES LABELS
-- ===========================================
-- Adds English labels for offer variables

-- 1. Add label_en column
ALTER TABLE public.offer_variables 
  ADD COLUMN IF NOT EXISTS label_en VARCHAR(100);

-- 2. Update existing variables with English labels
UPDATE public.offer_variables SET label_en = 'Client Name' WHERE key = 'client_name';
UPDATE public.offer_variables SET label_en = 'Contact Person' WHERE key = 'client_contact';
UPDATE public.offer_variables SET label_en = 'Project Name' WHERE key = 'project_name';
UPDATE public.offer_variables SET label_en = 'Total Cost' WHERE key = 'grand_total';
UPDATE public.offer_variables SET label_en = 'Currency' WHERE key = 'currency';
UPDATE public.offer_variables SET label_en = 'Valid Until' WHERE key = 'valid_until';
UPDATE public.offer_variables SET label_en = 'Specification Items' WHERE key = 'spec_items';
UPDATE public.offer_variables SET label_en = 'Payment Schedule' WHERE key = 'payment_schedule';
UPDATE public.offer_variables SET label_en = 'Terms Version' WHERE key = 'terms_version';
UPDATE public.offer_variables SET label_en = 'Publication Date' WHERE key = 'publish_date';
UPDATE public.offer_variables SET label_en = 'Prepayment Amount' WHERE key = 'prepayment_amount';
UPDATE public.offer_variables SET label_en = 'Production Payment' WHERE key = 'production_payment';
UPDATE public.offer_variables SET label_en = 'Final Payment' WHERE key = 'final_payment';

-- 3. Comment
COMMENT ON COLUMN public.offer_variables.label_en IS 
  'English label for the variable (displayed in EN interface)';
