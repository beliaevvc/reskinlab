-- ===========================================
-- ADD last_login_at TO PROFILES
-- ===========================================

-- Add last_login_at column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at DESC);

-- Comment
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp of the last successful login';
