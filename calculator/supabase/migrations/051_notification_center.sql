-- ===========================================
-- NOTIFICATION CENTER - Extended Triggers System
-- ===========================================
-- Migration 051: Comprehensive notification triggers for all roles (client, am, admin)
-- Extends the existing notification system from migrations 030/031
--
-- Notification types:
--   comment              (existing, from 031)
--   task_status_change   (new)
--   offer_created        (new)
--   offer_accepted       (new)
--   offer_cancelled      (new)
--   invoice_created      (new)
--   payment_received     (new)
--   payment_confirmed    (new)
--   project_created      (new)
--   project_status_change(new)
--   stage_change         (new)
--   spec_finalized       (new)
--   new_client           (new)
--   am_action            (new)
--   file_uploaded        (new)

-- ===========================================
-- 1. HELPER: Create notification safely
-- ===========================================
CREATE OR REPLACE FUNCTION create_notification_for_user(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, body, entity_type, entity_id, project_id, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id, p_project_id, p_metadata
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'create_notification_for_user failed for user %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification_for_user IS 'Safely inserts a notification row; swallows errors to never block the caller';

-- ===========================================
-- 2. HELPER: Get project stakeholders by role
-- ===========================================
-- Returns DISTINCT user UUIDs for a project filtered by role.
-- p_role: 'client' | 'am' | 'admin' | NULL (all)
-- p_exclude_user_id: optionally exclude a specific user (e.g. the actor)
CREATE OR REPLACE FUNCTION get_project_stakeholders(
  p_project_id UUID,
  p_role TEXT DEFAULT NULL,
  p_exclude_user_id UUID DEFAULT NULL
) RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT uid FROM (
      -- Client of the project
      SELECT c.user_id AS uid
      FROM public.clients c
      JOIN public.projects p ON p.client_id = c.id
      WHERE p.id = p_project_id
        AND (p_role IS NULL OR p_role = 'client')

      UNION

      -- Account manager of the project
      SELECT p.am_id AS uid
      FROM public.projects p
      WHERE p.id = p_project_id
        AND p.am_id IS NOT NULL
        AND (p_role IS NULL OR p_role = 'am')

      UNION

      -- All admins
      SELECT prof.id AS uid
      FROM public.profiles prof
      WHERE prof.role = 'admin'
        AND (p_role IS NULL OR p_role = 'admin')
    ) AS stakeholders
    WHERE uid IS NOT NULL
      AND (p_exclude_user_id IS NULL OR uid != p_exclude_user_id);

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_project_stakeholders IS 'Returns distinct user IDs for project stakeholders filtered by role';

-- ===========================================
-- 3. TRIGGER: Task status change → notify client
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_status_label TEXT;
  v_recipient UUID;
BEGIN
  -- Get project + client info
  SELECT p.id AS project_id, p.name AS project_name, c.user_id AS client_user_id
  INTO v_project
  FROM public.projects p
  JOIN public.clients c ON p.client_id = c.id
  WHERE p.id = NEW.project_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_status_label := CASE NEW.status
    WHEN 'backlog' THEN 'Backlog'
    WHEN 'todo' THEN 'To Do'
    WHEN 'in_progress' THEN 'In Progress'
    WHEN 'review' THEN 'Review'
    WHEN 'done' THEN 'Done'
    ELSE initcap(replace(NEW.status, '_', ' '))
  END;

  -- Notify client (skip if the client themselves changed the status)
  IF v_project.client_user_id IS NOT NULL
     AND v_project.client_user_id IS DISTINCT FROM auth.uid()
  THEN
    PERFORM create_notification_for_user(
      v_project.client_user_id,
      'task_status_change',
      'Task "' || LEFT(NEW.title, 60) || '" → ' || v_status_label,
      'In project ' || v_project.project_name,
      'task',
      NEW.id,
      NEW.project_id,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'project_name', v_project.project_name
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_task_status_change failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_task_status_change ON public.tasks;
CREATE TRIGGER trigger_notify_on_task_status_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_task_status_change();

-- ===========================================
-- 4. TRIGGER: Offer events → notify client / admin+AM
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_offer_event()
RETURNS TRIGGER AS $$
DECLARE
  v_spec RECORD;
  v_project RECORD;
  v_recipient UUID;
  v_actor_name TEXT;
BEGIN
  -- Get specification → project chain
  SELECT s.id AS spec_id, s.project_id,
         p.name AS project_name, p.client_id, p.am_id,
         c.user_id AS client_user_id
  INTO v_spec
  FROM public.specifications s
  JOIN public.projects p ON s.project_id = p.id
  JOIN public.clients c ON p.client_id = c.id
  WHERE s.id = NEW.specification_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- INSERT: new offer created → notify client
  IF TG_OP = 'INSERT' THEN
    IF v_spec.client_user_id IS NOT NULL THEN
      PERFORM create_notification_for_user(
        v_spec.client_user_id,
        'offer_created',
        'New offer for ' || v_spec.project_name,
        'Offer #' || NEW.number || ' is ready for your review',
        'offer',
        NEW.id,
        v_spec.project_id,
        jsonb_build_object(
          'offer_id', NEW.id,
          'offer_number', NEW.number,
          'project_name', v_spec.project_name
        )
      );
    END IF;
  END IF;

  -- UPDATE: status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Offer accepted → notify admin + AM
    IF NEW.status = 'accepted' THEN
      FOR v_recipient IN
        SELECT uid FROM (
          SELECT p.am_id AS uid FROM public.projects p WHERE p.id = v_spec.project_id AND p.am_id IS NOT NULL
          UNION
          SELECT prof.id AS uid FROM public.profiles prof WHERE prof.role = 'admin'
        ) AS staff
        WHERE uid IS NOT NULL AND uid IS DISTINCT FROM auth.uid()
      LOOP
        PERFORM create_notification_for_user(
          v_recipient,
          'offer_accepted',
          'Offer #' || NEW.number || ' accepted',
          'Client accepted the offer for ' || v_spec.project_name,
          'offer',
          NEW.id,
          v_spec.project_id,
          jsonb_build_object(
            'offer_id', NEW.id,
            'offer_number', NEW.number,
            'project_name', v_spec.project_name
          )
        );
      END LOOP;
    END IF;

    -- Offer cancelled → notify admin + AM
    IF NEW.status = 'cancelled' THEN
      FOR v_recipient IN
        SELECT uid FROM (
          SELECT p.am_id AS uid FROM public.projects p WHERE p.id = v_spec.project_id AND p.am_id IS NOT NULL
          UNION
          SELECT prof.id AS uid FROM public.profiles prof WHERE prof.role = 'admin'
        ) AS staff
        WHERE uid IS NOT NULL AND uid IS DISTINCT FROM auth.uid()
      LOOP
        PERFORM create_notification_for_user(
          v_recipient,
          'offer_cancelled',
          'Offer #' || NEW.number || ' cancelled',
          'Offer for ' || v_spec.project_name || ' was cancelled',
          'offer',
          NEW.id,
          v_spec.project_id,
          jsonb_build_object(
            'offer_id', NEW.id,
            'offer_number', NEW.number,
            'project_name', v_spec.project_name
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_offer_event failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_offer_event ON public.offers;
CREATE TRIGGER trigger_notify_on_offer_event
  AFTER INSERT OR UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_offer_event();

-- ===========================================
-- 5. TRIGGER: Invoice events → notify client / admin+AM
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_invoice_event()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_recipient UUID;
BEGIN
  -- Get project + client info
  SELECT p.id AS project_id, p.name AS project_name,
         p.client_id, p.am_id,
         c.user_id AS client_user_id
  INTO v_project
  FROM public.projects p
  JOIN public.clients c ON p.client_id = c.id
  WHERE p.id = NEW.project_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- INSERT: new invoice → notify client
  IF TG_OP = 'INSERT' THEN
    IF v_project.client_user_id IS NOT NULL THEN
      PERFORM create_notification_for_user(
        v_project.client_user_id,
        'invoice_created',
        'New invoice for ' || v_project.project_name,
        'Invoice #' || NEW.number || ' — $' || NEW.amount_usd::TEXT,
        'invoice',
        NEW.id,
        v_project.project_id,
        jsonb_build_object(
          'invoice_id', NEW.id,
          'invoice_number', NEW.number,
          'amount', NEW.amount_usd,
          'project_name', v_project.project_name
        )
      );
    END IF;
  END IF;

  -- UPDATE: status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- Client claims payment (awaiting_confirmation) → notify admin + AM
    IF NEW.status = 'awaiting_confirmation' THEN
      FOR v_recipient IN
        SELECT * FROM get_project_stakeholders(v_project.project_id, 'admin', auth.uid())
        UNION
        SELECT * FROM get_project_stakeholders(v_project.project_id, 'am', auth.uid())
      LOOP
        PERFORM create_notification_for_user(
          v_recipient,
          'payment_received',
          'Payment received for invoice #' || NEW.number,
          'Client submitted payment for ' || v_project.project_name || ' — $' || NEW.amount_usd::TEXT,
          'invoice',
          NEW.id,
          v_project.project_id,
          jsonb_build_object(
            'invoice_id', NEW.id,
            'invoice_number', NEW.number,
            'amount', NEW.amount_usd,
            'project_name', v_project.project_name
          )
        );
      END LOOP;
    END IF;

    -- Payment confirmed by admin → notify client + AM
    IF NEW.status = 'paid' THEN
      -- Notify client
      IF v_project.client_user_id IS NOT NULL
         AND v_project.client_user_id IS DISTINCT FROM auth.uid()
      THEN
        PERFORM create_notification_for_user(
          v_project.client_user_id,
          'payment_confirmed',
          'Payment confirmed for invoice #' || NEW.number,
          'Your payment of $' || NEW.amount_usd::TEXT || ' has been confirmed',
          'invoice',
          NEW.id,
          v_project.project_id,
          jsonb_build_object(
            'invoice_id', NEW.id,
            'invoice_number', NEW.number,
            'amount', NEW.amount_usd,
            'project_name', v_project.project_name
          )
        );
      END IF;

      -- Notify AM
      IF v_project.am_id IS NOT NULL
         AND v_project.am_id IS DISTINCT FROM auth.uid()
      THEN
        PERFORM create_notification_for_user(
          v_project.am_id,
          'payment_confirmed',
          'Payment confirmed — invoice #' || NEW.number,
          v_project.project_name || ' — $' || NEW.amount_usd::TEXT,
          'invoice',
          NEW.id,
          v_project.project_id,
          jsonb_build_object(
            'invoice_id', NEW.id,
            'invoice_number', NEW.number,
            'amount', NEW.amount_usd,
            'project_name', v_project.project_name
          )
        );
      END IF;

      -- Notify other admins (exclude the one who confirmed)
      FOR v_recipient IN
        SELECT * FROM get_project_stakeholders(v_project.project_id, 'admin', auth.uid())
      LOOP
        PERFORM create_notification_for_user(
          v_recipient,
          'payment_confirmed',
          'Payment confirmed — invoice #' || NEW.number,
          v_project.project_name || ' — $' || NEW.amount_usd::TEXT,
          'invoice',
          NEW.id,
          v_project.project_id,
          jsonb_build_object(
            'invoice_id', NEW.id,
            'invoice_number', NEW.number,
            'amount', NEW.amount_usd,
            'project_name', v_project.project_name
          )
        );
      END LOOP;
    END IF;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_invoice_event failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_invoice_event ON public.invoices;
CREATE TRIGGER trigger_notify_on_invoice_event
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_invoice_event();

-- ===========================================
-- 6. TRIGGER: Project events → notify admin+AM / client
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_project_event()
RETURNS TRIGGER AS $$
DECLARE
  v_client_user_id UUID;
  v_client_name TEXT;
  v_recipient UUID;
BEGIN
  -- Get client user_id
  SELECT c.user_id, COALESCE(prof.full_name, prof.email) AS client_name
  INTO v_client_user_id, v_client_name
  FROM public.clients c
  JOIN public.profiles prof ON c.user_id = prof.id
  WHERE c.id = NEW.client_id;

  -- INSERT: new project created → notify admins (and AM if assigned)
  IF TG_OP = 'INSERT' THEN
    FOR v_recipient IN
      SELECT DISTINCT uid FROM (
        SELECT prof.id AS uid
        FROM public.profiles prof
        WHERE prof.role = 'admin'
          AND prof.id IS DISTINCT FROM auth.uid()

        UNION

        SELECT NEW.am_id AS uid
        WHERE NEW.am_id IS NOT NULL
          AND NEW.am_id IS DISTINCT FROM auth.uid()
      ) AS staff
      WHERE uid IS NOT NULL
    LOOP
      PERFORM create_notification_for_user(
        v_recipient,
        'project_created',
        'New project: ' || NEW.name,
        'Created by ' || COALESCE(v_client_name, 'client'),
        'project',
        NEW.id,
        NEW.id,
        jsonb_build_object(
          'project_id', NEW.id,
          'project_name', NEW.name,
          'client_name', v_client_name
        )
      );
    END LOOP;
  END IF;

  -- UPDATE: status changed → notify client
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF v_client_user_id IS NOT NULL
       AND v_client_user_id IS DISTINCT FROM auth.uid()
    THEN
      PERFORM create_notification_for_user(
        v_client_user_id,
        'project_status_change',
        'Project "' || LEFT(NEW.name, 50) || '" status updated',
        'Status changed to ' || initcap(replace(NEW.status, '_', ' ')),
        'project',
        NEW.id,
        NEW.id,
        jsonb_build_object(
          'project_id', NEW.id,
          'project_name', NEW.name,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_project_event failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_project_event ON public.projects;
CREATE TRIGGER trigger_notify_on_project_event
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_project_event();

-- ===========================================
-- 7. TRIGGER: Workflow stage change → notify client
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_status_label TEXT;
BEGIN
  SELECT p.id AS project_id, p.name AS project_name, c.user_id AS client_user_id
  INTO v_project
  FROM public.projects p
  JOIN public.clients c ON p.client_id = c.id
  WHERE p.id = NEW.project_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_status_label := initcap(replace(NEW.status, '_', ' '));

  IF v_project.client_user_id IS NOT NULL
     AND v_project.client_user_id IS DISTINCT FROM auth.uid()
  THEN
    PERFORM create_notification_for_user(
      v_project.client_user_id,
      'stage_change',
      'Stage "' || NEW.name || '" → ' || v_status_label,
      'In project ' || v_project.project_name,
      'workflow_stage',
      NEW.id,
      NEW.project_id,
      jsonb_build_object(
        'stage_id', NEW.id,
        'stage_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'project_name', v_project.project_name
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_stage_change failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_stage_change ON public.workflow_stages;
CREATE TRIGGER trigger_notify_on_stage_change
  AFTER UPDATE ON public.workflow_stages
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_stage_change();

-- ===========================================
-- 8. TRIGGER: Specification finalized → notify admin + AM
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_spec_finalized()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_recipient UUID;
BEGIN
  IF NEW.status != 'finalized' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT p.id AS project_id, p.name AS project_name, p.am_id
  INTO v_project
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Notify admin + AM
  FOR v_recipient IN
    SELECT DISTINCT uid FROM (
      SELECT prof.id AS uid FROM public.profiles prof
      WHERE prof.role = 'admin'

      UNION

      SELECT v_project.am_id AS uid
      WHERE v_project.am_id IS NOT NULL
    ) AS staff
    WHERE uid IS NOT NULL AND uid IS DISTINCT FROM auth.uid()
  LOOP
    PERFORM create_notification_for_user(
      v_recipient,
      'spec_finalized',
      'Specification finalized — ' || v_project.project_name,
      'Version ' || NEW.version || ' (spec #' || COALESCE(NEW.number, '?') || ')',
      'specification',
      NEW.id,
      v_project.project_id,
      jsonb_build_object(
        'spec_id', NEW.id,
        'spec_number', NEW.number,
        'version', NEW.version,
        'project_name', v_project.project_name
      )
    );
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_spec_finalized failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_spec_finalized ON public.specifications;
CREATE TRIGGER trigger_notify_on_spec_finalized
  AFTER UPDATE ON public.specifications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_spec_finalized();

-- ===========================================
-- 9. TRIGGER: New client registered → notify admins
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_new_client()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient UUID;
BEGIN
  IF NEW.role != 'client' THEN
    RETURN NEW;
  END IF;

  FOR v_recipient IN
    SELECT id FROM public.profiles WHERE role = 'admin' AND id != NEW.id
  LOOP
    PERFORM create_notification_for_user(
      v_recipient,
      'new_client',
      'New client registered',
      COALESCE(NEW.full_name, NEW.email),
      'profile',
      NEW.id,
      NULL,
      jsonb_build_object(
        'client_profile_id', NEW.id,
        'client_name', COALESCE(NEW.full_name, NEW.email),
        'client_email', NEW.email
      )
    );
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_new_client failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_new_client ON public.profiles;
CREATE TRIGGER trigger_notify_on_new_client
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'client')
  EXECUTE FUNCTION notify_on_new_client();

-- ===========================================
-- 10. TRIGGER: AM actions → notify admins
-- ===========================================
-- Fires on audit_logs INSERT when an AM performs important actions.
-- Uses audit_logs as the source to catch all significant AM activity.
CREATE OR REPLACE FUNCTION notify_on_am_action()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_action_label TEXT;
  v_recipient UUID;
  v_project_id UUID;
BEGIN
  -- Get AM name
  SELECT COALESCE(full_name, email)
  INTO v_actor_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Human-readable action label
  v_action_label := CASE NEW.action
    WHEN 'create_offer' THEN 'created an offer'
    WHEN 'send_offer' THEN 'sent an offer'
    WHEN 'create_invoice' THEN 'created an invoice'
    WHEN 'confirm_payment' THEN 'confirmed a payment'
    WHEN 'update_project' THEN 'updated a project'
    WHEN 'complete_project' THEN 'completed a project'
    WHEN 'create_delivery' THEN 'created a delivery'
    WHEN 'update_task_status' THEN 'updated a task status'
    WHEN 'finalize_specification' THEN 'finalized a specification'
    WHEN 'upload_file' THEN 'uploaded a file'
    ELSE replace(NEW.action, '_', ' ')
  END;

  -- Try to extract project_id from metadata or new_data
  v_project_id := COALESCE(
    (NEW.metadata->>'project_id')::UUID,
    (NEW.new_data->>'project_id')::UUID,
    NEW.entity_id  -- fallback: entity_id might be project_id for project events
  );

  -- Notify all admins (not the actor)
  FOR v_recipient IN
    SELECT id FROM public.profiles
    WHERE role = 'admin' AND id IS DISTINCT FROM NEW.user_id
  LOOP
    PERFORM create_notification_for_user(
      v_recipient,
      'am_action',
      COALESCE(v_actor_name, 'Account Manager') || ' ' || v_action_label,
      initcap(replace(NEW.entity_type, '_', ' ')) || CASE
        WHEN NEW.entity_id IS NOT NULL THEN ''
        ELSE ''
      END,
      NEW.entity_type,
      NEW.entity_id,
      v_project_id,
      jsonb_build_object(
        'actor_id', NEW.user_id,
        'actor_name', v_actor_name,
        'action', NEW.action,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id
      )
    );
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_am_action failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_am_action ON public.audit_logs;
CREATE TRIGGER trigger_notify_on_am_action
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  WHEN (
    NEW.user_role = 'am'
    AND NEW.action IN (
      'create_offer', 'send_offer',
      'create_invoice', 'confirm_payment',
      'update_project', 'complete_project',
      'create_delivery',
      'update_task_status',
      'finalize_specification',
      'upload_file'
    )
  )
  EXECUTE FUNCTION notify_on_am_action();

-- ===========================================
-- 11. TRIGGER: File uploaded → notify client / admin+AM
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_file_uploaded()
RETURNS TRIGGER AS $$
DECLARE
  v_uploader RECORD;
  v_project RECORD;
  v_recipient UUID;
BEGIN
  -- Get uploader info
  SELECT id, role, COALESCE(full_name, email) AS name
  INTO v_uploader
  FROM public.profiles
  WHERE id = NEW.uploaded_by;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get project + client info
  SELECT p.id AS project_id, p.name AS project_name,
         p.am_id, c.user_id AS client_user_id
  INTO v_project
  FROM public.projects p
  JOIN public.clients c ON p.client_id = c.id
  WHERE p.id = NEW.project_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Admin/AM uploaded → notify client
  IF v_uploader.role IN ('admin', 'am') THEN
    IF v_project.client_user_id IS NOT NULL THEN
      PERFORM create_notification_for_user(
        v_project.client_user_id,
        'file_uploaded',
        v_uploader.name || ' uploaded a file',
        '"' || LEFT(NEW.name, 60) || '" in ' || v_project.project_name,
        'task',
        COALESCE(NEW.task_id, NEW.id),
        NEW.project_id,
        jsonb_build_object(
          'asset_id', NEW.id,
          'file_name', NEW.name,
          'uploader_name', v_uploader.name,
          'project_name', v_project.project_name,
          'task_id', NEW.task_id
        )
      );
    END IF;
  END IF;

  -- Client uploaded → notify admin + AM
  IF v_uploader.role = 'client' THEN
    FOR v_recipient IN
      SELECT DISTINCT uid FROM (
        SELECT prof.id AS uid FROM public.profiles prof WHERE prof.role = 'admin'
        UNION
        SELECT v_project.am_id AS uid WHERE v_project.am_id IS NOT NULL
      ) AS staff
      WHERE uid IS NOT NULL AND uid IS DISTINCT FROM NEW.uploaded_by
    LOOP
      PERFORM create_notification_for_user(
        v_recipient,
        'file_uploaded',
        v_uploader.name || ' uploaded a file',
        '"' || LEFT(NEW.name, 60) || '" in ' || v_project.project_name,
        'task',
        COALESCE(NEW.task_id, NEW.id),
        NEW.project_id,
        jsonb_build_object(
          'asset_id', NEW.id,
          'file_name', NEW.name,
          'uploader_name', v_uploader.name,
          'project_name', v_project.project_name,
          'task_id', NEW.task_id
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_file_uploaded failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_file_uploaded ON public.assets;
CREATE TRIGGER trigger_notify_on_file_uploaded
  AFTER INSERT ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_file_uploaded();

-- ===========================================
-- 12. INDEX for category filtering
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);

-- ===========================================
-- 13. CRON: Clean up old read notifications (90 days)
-- ===========================================
-- pg_cron must be enabled in Supabase Dashboard → Database → Extensions
-- If pg_cron is not available, this block is silently skipped.
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-old-read-notifications',
      '0 3 * * *',
      $cron$DELETE FROM public.notifications WHERE read_at IS NOT NULL AND read_at < now() - interval '90 days'$cron$
    );
    RAISE NOTICE 'Cron job cleanup-old-read-notifications scheduled';
  ELSE
    RAISE NOTICE 'pg_cron not available — skipping notification cleanup cron. Enable it in Supabase Dashboard -> Database -> Extensions.';
  END IF;
END $outer$;

-- ===========================================
-- COMMENTS
-- ===========================================
COMMENT ON FUNCTION notify_on_task_status_change IS 'Notifies project client when a task status changes';
COMMENT ON FUNCTION notify_on_offer_event IS 'Notifies client on new offer; admin+AM on acceptance/cancellation';
COMMENT ON FUNCTION notify_on_invoice_event IS 'Notifies client on new invoice; admin+AM on payment; all on confirmation';
COMMENT ON FUNCTION notify_on_project_event IS 'Notifies admins on new project; client on status change';
COMMENT ON FUNCTION notify_on_stage_change IS 'Notifies client when a workflow stage status changes';
COMMENT ON FUNCTION notify_on_spec_finalized IS 'Notifies admin+AM when a specification is finalized';
COMMENT ON FUNCTION notify_on_new_client IS 'Notifies all admins when a new client registers';
COMMENT ON FUNCTION notify_on_am_action IS 'Notifies admins about important AM actions via audit_logs';
COMMENT ON FUNCTION notify_on_file_uploaded IS 'Notifies client/team when files are uploaded';
