-- ===========================================
-- FIX: Stage change notifications — batch instead of per-row
-- ===========================================
-- Problem: The per-row trigger notify_on_stage_change fires for EACH stage
--   in a batch activation (e.g. activating "UI Elements" also activates
--   Moodboard + Symbols Design), producing multiple confusing notifications.
--
-- Solution:
--   1. Drop the per-row trigger
--   2. Create an RPC function that sends ONE notification per batch operation
--   3. Notify ALL stakeholders (client, AM, admins), not just client
--   4. Called from the frontend after successful batch update

-- 1. Drop the old per-row trigger
DROP TRIGGER IF EXISTS trigger_notify_on_stage_change ON public.workflow_stages;

-- 2. Create batch notification function
CREATE OR REPLACE FUNCTION notify_stages_changed(
  p_project_id UUID,
  p_target_stage_name TEXT,
  p_action TEXT,              -- 'activated' | 'deactivated'
  p_stage_names TEXT[]        -- names of ALL stages affected
) RETURNS void AS $$
DECLARE
  v_project RECORD;
  v_recipient UUID;
  v_title TEXT;
  v_body TEXT;
  v_stages_count INT;
  v_metadata JSONB;
BEGIN
  -- Get project info
  SELECT p.id, p.name AS project_name, p.am_id, c.user_id AS client_user_id
  INTO v_project
  FROM public.projects p
  JOIN public.clients c ON p.client_id = c.id
  WHERE p.id = p_project_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_stages_count := COALESCE(array_length(p_stage_names, 1), 0);

  -- Build notification title and body
  IF p_action = 'activated' THEN
    IF v_stages_count > 1 THEN
      v_title := 'Stages activated up to "' || p_target_stage_name || '"';
      v_body := array_to_string(p_stage_names, ', ');
    ELSE
      v_title := 'Stage "' || p_target_stage_name || '" activated';
      v_body := v_project.project_name;
    END IF;
  ELSE
    IF v_stages_count > 1 THEN
      v_title := 'Stages deactivated from "' || p_target_stage_name || '"';
      v_body := array_to_string(p_stage_names, ', ');
    ELSE
      v_title := 'Stage "' || p_target_stage_name || '" deactivated';
      v_body := v_project.project_name;
    END IF;
  END IF;

  v_metadata := jsonb_build_object(
    'target_stage_name', p_target_stage_name,
    'action', p_action,
    'stage_names', to_jsonb(p_stage_names),
    'stages_count', v_stages_count,
    'project_name', v_project.project_name
  );

  -- Notify ALL project stakeholders except the actor (auth.uid())
  FOR v_recipient IN
    SELECT * FROM get_project_stakeholders(p_project_id, NULL, auth.uid())
  LOOP
    PERFORM create_notification_for_user(
      v_recipient,
      'stage_change',
      v_title,
      v_body,
      'project',
      p_project_id,
      p_project_id,
      v_metadata
    );
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_stages_changed failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_stages_changed IS 'Creates a single batch notification when stages are activated/deactivated. Called from frontend after batch update.';
