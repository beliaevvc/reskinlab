-- ===========================================
-- PROFILE EXTRA FIELDS: phone, telegram, bio
-- ===========================================

-- Add new fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS telegram TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update RLS: users can update their own profile (already exists via 002_rls_policies)
-- No additional policies needed — existing "Users can update own profile" covers new columns.
