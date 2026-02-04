-- Migration: Add deadline fields to tasks
-- Supports: date only, date + time, date range (for manual editing)
-- Auto-created tasks use simple day offset from settings

-- ===========================================
-- TASKS TABLE - deadline fields for manual editing
-- ===========================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS due_time TIME,
ADD COLUMN IF NOT EXISTS due_date_end DATE;

COMMENT ON COLUMN public.tasks.due_date IS 'Deadline date (start date if range)';
COMMENT ON COLUMN public.tasks.due_time IS 'Optional deadline time';
COMMENT ON COLUMN public.tasks.due_date_end IS 'End date for deadline range (optional)';

-- ===========================================
-- UPDATE TASK CREATION FUNCTION
-- ===========================================
-- Update the function to use new deadline fields from templates

CREATE OR REPLACE FUNCTION public.handle_first_payment_with_tasks()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id UUID;
  v_spec_id UUID;
  v_spec_state JSONB;
  v_settings RECORD;
  v_item JSONB;
  v_item_id TEXT;
  v_item_name TEXT;
  v_item_qty INT;
  v_stage_id UUID;
  v_task_order INT := 0;
  v_template RECORD;
  v_template_assignee_id UUID;
  v_template_due_days INT;
  v_spec_template RECORD;
  v_animation JSONB;
  v_anim_name TEXT;
  v_task_title TEXT;
  v_task_description TEXT;
  v_created_task_id UUID;
  v_checklist_item JSONB;
  v_checklist_item_title TEXT;
  v_checklist_item_order INT;
BEGIN
  -- Проверяем, что это подтверждение оплаты (новый статус = confirmed)
  IF NEW.status != 'confirmed' OR OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Проверяем, есть ли уже confirmed платежи в этом инвойсе (это не первый подтвержденный платеж)
  -- Исключаем текущую запись, чтобы не учитывать саму себя
  IF EXISTS (
    SELECT 1 FROM public.payments 
    WHERE invoice_id = NEW.invoice_id 
      AND status = 'confirmed' 
      AND id != NEW.id
  ) THEN
    RAISE NOTICE 'Skipping: not the first confirmed payment for this invoice';
    RETURN NEW;
  END IF;
  
  -- Получаем project_id из инвойса
  SELECT project_id INTO v_project_id
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  IF v_project_id IS NULL THEN
    RAISE NOTICE 'Skipping: no project_id found for invoice %', NEW.invoice_id;
    RETURN NEW;
  END IF;
  
  -- Проверяем, есть ли уже задачи в проекте
  IF EXISTS (SELECT 1 FROM public.tasks WHERE project_id = v_project_id LIMIT 1) THEN
    RAISE NOTICE 'Skipping: tasks already exist for project %', v_project_id;
    RETURN NEW;
  END IF;
  
  -- Получаем настройки автосоздания
  SELECT * INTO v_settings
  FROM public.task_auto_creation_settings
  LIMIT 1;
  
  -- Если настроек нет, создаем дефолтные
  IF NOT FOUND THEN
    INSERT INTO public.task_auto_creation_settings DEFAULT VALUES
    RETURNING * INTO v_settings;
  END IF;
  
  -- Получаем спецификацию проекта
  SELECT id, state_json INTO v_spec_id, v_spec_state
  FROM public.specifications
  WHERE project_id = v_project_id
    AND status != 'draft'
  ORDER BY version_number DESC
  LIMIT 1;
  
  IF NOT FOUND OR v_spec_state IS NULL THEN
    RAISE NOTICE 'Skipping: specification not found or state_json is null (spec_id: %)', v_spec_id;
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Specification found, creating tasks...';
  
  -- ===========================================
  -- СОЗДАНИЕ ЗАДАЧ ИЗ ШАБЛОНОВ (task_auto_templates)
  -- ===========================================
  FOR v_template IN 
    SELECT * FROM public.task_auto_templates
    WHERE is_enabled = true
    ORDER BY "order" ASC
  LOOP
    v_template_assignee_id := COALESCE(v_template.assignee_id, v_settings.default_assignee_id);
    v_template_due_days := COALESCE(v_template.due_days_offset, v_settings.default_due_days, 7);
    
    SELECT id INTO v_stage_id
    FROM public.workflow_stages
    WHERE project_id = v_project_id AND stage_key = v_template.stage_key;
    
    IF NOT FOUND THEN
      INSERT INTO public.workflow_stages (
        project_id, stage_key, name, description, "order", status, started_at
      ) VALUES (
        v_project_id,
        v_template.stage_key,
        CASE v_template.stage_key
          WHEN 'briefing' THEN 'Briefing'
          WHEN 'moodboard' THEN 'Moodboard & Concept'
          WHEN 'symbols' THEN 'Symbol Design'
          WHEN 'ui' THEN 'UI & Layout'
          WHEN 'animation' THEN 'Animation Production'
          WHEN 'revisions' THEN 'Revisions'
          WHEN 'delivery' THEN 'Final Delivery'
          ELSE INITCAP(v_template.stage_key)
        END,
        CASE v_template.stage_key
          WHEN 'briefing' THEN 'Requirements gathering, references, source game analysis'
          WHEN 'moodboard' THEN 'Visual direction, color palette, overall concept'
          WHEN 'symbols' THEN 'Game symbols production (low, high, special)'
          WHEN 'ui' THEN 'Interface elements, buttons, panels, backgrounds'
          WHEN 'animation' THEN 'Symbol and UI animation'
          WHEN 'revisions' THEN 'Feedback implementation and adjustments'
          WHEN 'delivery' THEN 'Source files and final assets handover'
          ELSE NULL
        END,
        CASE v_template.stage_key
          WHEN 'briefing' THEN 1 WHEN 'moodboard' THEN 2 WHEN 'symbols' THEN 3
          WHEN 'ui' THEN 4 WHEN 'animation' THEN 5 WHEN 'revisions' THEN 6
          WHEN 'delivery' THEN 7 ELSE 99
        END,
        'in_progress',
        NOW()
      ) RETURNING id INTO v_stage_id;
    ELSE
      UPDATE public.workflow_stages
      SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
      WHERE id = v_stage_id AND status = 'pending';
    END IF;
    
    -- Создаем задачу из шаблона (дедлайн = текущая дата + offset дней)
    INSERT INTO public.tasks (
      project_id, stage_id, title, description, status, "order",
      due_date, assignee_id
    ) VALUES (
      v_project_id,
      v_stage_id,
      v_template.title,
      v_template.description,
      'backlog',
      v_task_order,
      CURRENT_DATE + (v_template_due_days || ' days')::INTERVAL,
      v_template_assignee_id
    ) RETURNING id INTO v_created_task_id;
    
    -- Создаем чеклист из шаблона
    IF v_template.checklist_items IS NOT NULL AND jsonb_array_length(v_template.checklist_items) > 0 THEN
      v_checklist_item_order := 0;
      FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_template.checklist_items) LOOP
        v_checklist_item_title := v_checklist_item->>'title';
        IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
          INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
          VALUES (v_created_task_id, v_checklist_item_title, false, v_checklist_item_order);
          v_checklist_item_order := v_checklist_item_order + 1;
        END IF;
      END LOOP;
    END IF;
    
    v_task_order := v_task_order + 1;
    RAISE NOTICE 'Created task from template: % (task_id: %)', v_template.title, v_created_task_id;
  END LOOP;
  
  -- ===========================================
  -- СОЗДАНИЕ ЗАДАЧ ИЗ СПЕЦИФИКАЦИИ
  -- ===========================================
  IF v_settings.spec_tasks_enabled THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_spec_state->'items') LOOP
      v_item_id := v_item->>'id';
      v_item_name := v_item->>'name';
      v_item_qty := COALESCE((v_item->>'qty')::INT, 1);
      
      IF v_item_id IS NULL OR v_item_name IS NULL THEN
        CONTINUE;
      END IF;
      
      SELECT * INTO v_spec_template
      FROM public.task_spec_item_templates
      WHERE item_id = v_item_id;
      
      IF FOUND AND v_spec_template.task_title IS NOT NULL THEN
        v_task_title := v_spec_template.task_title;
        v_task_description := REPLACE(
          COALESCE(v_spec_template.task_description, ''),
          '{qty}',
          v_item_qty::TEXT
        );
      ELSE
        v_task_title := v_item_name || ' (x' || v_item_qty || ')';
        v_task_description := NULL;
      END IF;
      
      INSERT INTO public.tasks (
        project_id, title, description, status, "order",
        due_date, assignee_id
      ) VALUES (
        v_project_id,
        v_task_title,
        v_task_description,
        'backlog',
        v_task_order,
        CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
        v_settings.default_assignee_id
      ) RETURNING id INTO v_created_task_id;
      
      -- Создаем чеклист из шаблона спецификации
      IF v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
        v_checklist_item_order := 0;
        FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
          v_checklist_item_title := v_checklist_item->>'title';
          IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
            INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
            VALUES (v_created_task_id, v_checklist_item_title, false, v_checklist_item_order);
            v_checklist_item_order := v_checklist_item_order + 1;
          END IF;
        END LOOP;
      END IF;
      
      v_task_order := v_task_order + 1;
      RAISE NOTICE 'Created spec task: % (task_id: %)', v_task_title, v_created_task_id;
      
      -- Создаем отдельные задачи на анимацию
      IF v_settings.animation_tasks_separate AND v_item->'animations' IS NOT NULL THEN
        FOR v_animation IN SELECT * FROM jsonb_array_elements(v_item->'animations') LOOP
          v_anim_name := v_animation->>'name';
          IF v_anim_name IS NOT NULL THEN
            IF FOUND AND v_spec_template.animation_task_title_template IS NOT NULL THEN
              v_task_title := REPLACE(
                REPLACE(v_spec_template.animation_task_title_template, '{item_name}', v_item_name),
                '{anim_name}', v_anim_name
              );
              v_task_description := REPLACE(
                REPLACE(COALESCE(v_spec_template.animation_task_description_template, ''), '{item_name}', v_item_name),
                '{anim_name}', v_anim_name
              );
            ELSE
              v_task_title := 'Анимация: ' || v_item_name || ' (' || v_anim_name || ')';
              v_task_description := NULL;
            END IF;
            
            INSERT INTO public.tasks (
              project_id, title, description, status, "order",
              due_date, assignee_id
            ) VALUES (
              v_project_id,
              v_task_title,
              v_task_description,
              'backlog',
              v_task_order,
              CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
              v_settings.default_assignee_id
            );
            
            v_task_order := v_task_order + 1;
            RAISE NOTICE 'Created animation task: %', v_task_title;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Task creation completed for project %', v_project_id;
  
  RETURN NEW;
END;
$$;

-- Триггер уже существует на таблице payments (создан в предыдущих миграциях)
-- Функция обновится автоматически благодаря CREATE OR REPLACE
