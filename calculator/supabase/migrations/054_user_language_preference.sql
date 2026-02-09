-- ===========================================
-- USER LANGUAGE PREFERENCE & BILINGUAL OFFERS
-- ===========================================

-- Add language preference to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'auto';

-- Add comment
COMMENT ON COLUMN public.profiles.preferred_language IS 
  'User language preference: en, ru, or auto (browser detection)';

-- Add bilingual support to offer_templates
ALTER TABLE public.offer_templates 
  ADD COLUMN IF NOT EXISTS legal_text_ru TEXT,
  ADD COLUMN IF NOT EXISTS legal_text_en TEXT;

-- Comments for offer_templates columns
COMMENT ON COLUMN public.offer_templates.legal_text_ru IS 
  'Russian version of legal text for offers';
COMMENT ON COLUMN public.offer_templates.legal_text_en IS 
  'English version of legal text for offers';

-- Update handle_new_user function to include default language
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    'auto'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
