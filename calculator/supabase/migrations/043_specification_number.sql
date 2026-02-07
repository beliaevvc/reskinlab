-- Add number column to specifications (like offers/invoices)
-- Format: SPEC-YYYY-NNNNN

ALTER TABLE public.specifications
ADD COLUMN IF NOT EXISTS number TEXT UNIQUE;

-- Backfill existing specifications with generated numbers
-- Uses creation year + sequential number
DO $$
DECLARE
  rec RECORD;
  counter INT := 0;
  spec_year INT;
  spec_number TEXT;
BEGIN
  FOR rec IN 
    SELECT id, created_at 
    FROM public.specifications 
    WHERE number IS NULL 
    ORDER BY created_at ASC
  LOOP
    counter := counter + 1;
    spec_year := EXTRACT(YEAR FROM rec.created_at);
    spec_number := 'SPEC-' || spec_year || '-' || LPAD(counter::TEXT, 5, '0');
    
    UPDATE public.specifications 
    SET number = spec_number 
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Make number NOT NULL after backfill
ALTER TABLE public.specifications
ALTER COLUMN number SET NOT NULL;
