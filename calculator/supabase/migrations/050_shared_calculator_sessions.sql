-- =============================================
-- 050: SHARED CALCULATOR SESSIONS — Public calculator sharing system
-- =============================================
-- Allows anonymous users to create calculator selections, generate
-- a shareable code/link, and later claim the selection into a registered account.
-- All access is via RPC functions (security definer) — no direct table access.
-- =============================================

-- Step 1: Create the table
CREATE TABLE public.shared_calculator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT UNIQUE NOT NULL,
  state_json JSONB NOT NULL,
  totals_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  ip_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookup by short_code
CREATE INDEX idx_shared_sessions_short_code ON public.shared_calculator_sessions(short_code);
-- Index for cleanup queries (expired + unclaimed)
CREATE INDEX idx_shared_sessions_expires ON public.shared_calculator_sessions(expires_at) WHERE claimed_by IS NULL;
-- Index for rate limiting queries (ip_hash + recent)
CREATE INDEX idx_shared_sessions_ip_rate ON public.shared_calculator_sessions(ip_hash, created_at) WHERE ip_hash IS NOT NULL;

-- Enable RLS but add NO policies — all access is through RPC functions only
ALTER TABLE public.shared_calculator_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper: Generate a unique short code (8 chars, A-Z + 2-9, no ambiguous chars)
-- Characters excluded: I, O, 0, 1 (too similar to each other)
-- =============================================
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.shared_calculator_sessions WHERE short_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;

-- =============================================
-- Helper: Generate specification number (SPEC-YYYY-NNNNN)
-- Same logic as client-side generateSpecNumber() in specUtils.js
-- =============================================
CREATE OR REPLACE FUNCTION generate_spec_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_str TEXT := EXTRACT(YEAR FROM now())::TEXT;
  prefix TEXT := 'SPEC-' || year_str || '-';
  last_number TEXT;
  next_num INT := 1;
BEGIN
  SELECT number INTO last_number
  FROM public.specifications
  WHERE number LIKE prefix || '%'
  ORDER BY number DESC
  LIMIT 1;

  IF last_number IS NOT NULL THEN
    next_num := split_part(last_number, '-', 3)::INT + 1;
  END IF;

  RETURN prefix || lpad(next_num::TEXT, 5, '0');
END;
$$;

-- =============================================
-- RPC 1: save_shared_session
-- Called by anonymous users to save their calculator state
-- Rate limited: max 10 sessions per hour per ip_hash
-- =============================================
CREATE OR REPLACE FUNCTION save_shared_session(
  p_state_json JSONB,
  p_totals_json JSONB DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_session_id UUID;
  v_rate_count INT;
BEGIN
  -- Rate limiting: max 10 sessions per hour from same IP hash
  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO v_rate_count
    FROM public.shared_calculator_sessions
    WHERE ip_hash = p_ip_hash
      AND created_at > now() - INTERVAL '1 hour';

    IF v_rate_count >= 10 THEN
      RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Validate input
  IF p_state_json IS NULL OR p_state_json = '{}'::jsonb THEN
    RAISE EXCEPTION 'state_json cannot be empty'
      USING ERRCODE = 'P0002';
  END IF;

  -- Generate unique short code
  v_code := generate_short_code();

  -- Insert session
  INSERT INTO public.shared_calculator_sessions (
    short_code, state_json, totals_json, ip_hash, metadata
  ) VALUES (
    v_code, p_state_json, p_totals_json, p_ip_hash, p_metadata
  )
  RETURNING id INTO v_session_id;

  -- Return the code and session ID
  RETURN jsonb_build_object(
    'short_code', v_code,
    'session_id', v_session_id,
    'expires_at', (now() + INTERVAL '30 days')::TEXT
  );
END;
$$;

-- =============================================
-- RPC 2: load_shared_session
-- Called by anyone (anon or authenticated) to load a shared session by code
-- Only returns non-expired, non-claimed sessions
-- =============================================
CREATE OR REPLACE FUNCTION load_shared_session(
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Normalize code to uppercase
  p_short_code := upper(trim(p_short_code));

  SELECT id, state_json, totals_json, created_at, expires_at, claimed_by
  INTO v_session
  FROM public.shared_calculator_sessions
  WHERE short_code = p_short_code;

  -- Not found
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Session not found'
      USING ERRCODE = 'P0003';
  END IF;

  -- Already claimed
  IF v_session.claimed_by IS NOT NULL THEN
    RAISE EXCEPTION 'This code has already been used'
      USING ERRCODE = 'P0004';
  END IF;

  -- Expired
  IF v_session.expires_at < now() THEN
    RAISE EXCEPTION 'This code has expired'
      USING ERRCODE = 'P0005';
  END IF;

  RETURN jsonb_build_object(
    'state_json', v_session.state_json,
    'totals_json', v_session.totals_json,
    'created_at', v_session.created_at::TEXT,
    'expires_at', v_session.expires_at::TEXT
  );
END;
$$;

-- =============================================
-- RPC 3: claim_shared_session
-- Called by authenticated users to claim a shared session into their account
-- Creates: client (if needed) -> project -> specification (draft)
-- Marks the session as claimed
-- =============================================
CREATE OR REPLACE FUNCTION claim_shared_session(
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_client_id UUID;
  v_session RECORD;
  v_project_id UUID;
  v_spec_id UUID;
  v_spec_number TEXT;
BEGIN
  -- Must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'P0006';
  END IF;

  -- Normalize code
  p_short_code := upper(trim(p_short_code));

  -- Find session (lock row for update to prevent race conditions)
  SELECT id, state_json, totals_json
  INTO v_session
  FROM public.shared_calculator_sessions
  WHERE short_code = p_short_code
    AND claimed_by IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Session not found, already claimed, or expired'
      USING ERRCODE = 'P0007';
  END IF;

  -- Get or create client
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE user_id = v_user_id;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (user_id)
    VALUES (v_user_id)
    RETURNING id INTO v_client_id;
  END IF;

  -- Create project
  INSERT INTO public.projects (client_id, name, description, status)
  VALUES (
    v_client_id,
    'Imported Project',
    'Auto-created from shared calculator selection',
    'draft'
  )
  RETURNING id INTO v_project_id;

  -- Generate spec number
  v_spec_number := generate_spec_number();

  -- Create specification draft
  INSERT INTO public.specifications (
    project_id, number, version, version_number, status, state_json, totals_json
  ) VALUES (
    v_project_id,
    v_spec_number,
    'v1.0',
    1,
    'draft',
    v_session.state_json,
    v_session.totals_json
  )
  RETURNING id INTO v_spec_id;

  -- Mark session as claimed
  UPDATE public.shared_calculator_sessions
  SET claimed_by = v_user_id,
      claimed_at = now()
  WHERE id = v_session.id;

  -- Return created entities
  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'specification_id', v_spec_id,
    'spec_number', v_spec_number
  );
END;
$$;

-- =============================================
-- GRANT permissions
-- =============================================

-- save_shared_session: accessible by anon (anonymous users can save)
GRANT EXECUTE ON FUNCTION save_shared_session(JSONB, JSONB, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION save_shared_session(JSONB, JSONB, TEXT, JSONB) TO authenticated;

-- load_shared_session: accessible by anon (anyone can load by code)
GRANT EXECUTE ON FUNCTION load_shared_session(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION load_shared_session(TEXT) TO authenticated;

-- claim_shared_session: only authenticated (requires auth.uid())
GRANT EXECUTE ON FUNCTION claim_shared_session(TEXT) TO authenticated;

-- Helper functions are internal, no direct grants needed
-- (they're called from within security definer functions)
