-- ===========================================
-- FIX: ALLOW MULTIPLE SPECIFICATIONS IN ONE PROJECT
-- ===========================================
-- Problem: Tasks are not created for new specifications when project already has tasks
-- Solution: Track source_specification_id and check per-specification, not per-project

-- ===========================================
-- 1. ADD source_specification_id TO TASKS TABLE
-- ===========================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS source_specification_id UUID REFERENCES public.specifications(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tasks_source_specification_id 
ON public.tasks(source_specification_id);

COMMENT ON COLUMN public.tasks.source_specification_id IS 'ID спецификации, из которой была создана эта задача (для отслеживания дозаказов)';

-- ===========================================
-- 2. BACKFILL EXISTING TASKS
-- ===========================================
-- Пытаемся связать существующие задачи со спецификациями через цепочку:
-- task.project_id → invoices → offer → specification

-- Для задач из первой оплаченной спецификации
WITH first_paid_specs AS (
  SELECT DISTINCT ON (i.project_id) 
    i.project_id,
    o.specification_id
  FROM public.invoices i
  JOIN public.offers o ON o.id = i.offer_id
  WHERE i.status = 'paid'
    AND i.milestone_order = 1
  ORDER BY i.project_id, i.paid_at ASC NULLS LAST, i.created_at ASC
)
UPDATE public.tasks t
SET source_specification_id = fps.specification_id
FROM first_paid_specs fps
WHERE t.project_id = fps.project_id
  AND t.source_specification_id IS NULL;

-- ===========================================
-- 3. UPDATE FUNCTION TO ALLOW MULTIPLE SPECIFICATIONS
-- ===========================================

CREATE OR REPLACE FUNCTION auto_create_tasks_on_first_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_offer_id UUID;
  v_spec_id UUID;
  v_spec_state JSONB;
  v_settings RECORD;
  v_template RECORD;
  v_stage_id UUID;
  v_item_id TEXT;
  v_item_data JSONB;
  v_item_qty INT;
  v_item_anim TEXT;
  v_task_title TEXT;
  v_task_description TEXT;
  v_task_order INT := 0;
  v_template_assignee_id UUID;
  v_template_due_days INT;
  v_spec_template RECORD;
  v_anim_name TEXT;
  v_final_title TEXT;
  v_final_description TEXT;
  v_created_task_id UUID;
  v_checklist_item JSONB;
  v_checklist_item_title TEXT;
  v_checklist_item_order INT;
  v_tasks_exist_for_spec BOOLEAN;
BEGIN
  -- Проверяем, что статус изменился на 'paid' (из любого другого статуса)
  RAISE NOTICE 'Trigger fired: OLD.status = %, NEW.status = %, milestone_order = %', OLD.status, NEW.status, NEW.milestone_order;
  
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    RAISE NOTICE 'Status changed to paid, checking conditions...';
    
    v_project_id := NEW.project_id;
    v_offer_id := NEW.offer_id;
    
    -- Проверяем, что это первая оплата (milestone_order = 1)
    IF NEW.milestone_order IS NULL OR NEW.milestone_order != 1 THEN
      RAISE NOTICE 'Skipping: milestone_order is not 1 (value: %)', NEW.milestone_order;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'First payment confirmed, proceeding with task creation...';
    
    -- Получаем specification_id из offer
    SELECT specification_id INTO v_spec_id
    FROM public.offers
    WHERE id = v_offer_id;
    
    IF NOT FOUND OR v_spec_id IS NULL THEN
      RAISE NOTICE 'Skipping: no specification found for offer %', v_offer_id;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Specification ID: %', v_spec_id;
    
    -- ===========================================
    -- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Проверяем задачи для ЭТОЙ КОНКРЕТНОЙ СПЕЦИФИКАЦИИ
    -- ===========================================
    SELECT EXISTS(
      SELECT 1 FROM public.tasks 
      WHERE source_specification_id = v_spec_id
    ) INTO v_tasks_exist_for_spec;
    
    IF v_tasks_exist_for_spec THEN
      -- Задачи уже созданы для этой спецификации
      RAISE NOTICE 'Skipping: tasks already exist for specification %', v_spec_id;
      RETURN NEW;
    END IF;
    
    -- Дополнительная защита от дубликатов в рамках одной транзакции (10 минут)
    IF EXISTS(
      SELECT 1 FROM public.tasks 
      WHERE project_id = v_project_id 
        AND source_specification_id IS NULL
        AND status = 'backlog'
        AND created_at >= NOW() - INTERVAL '10 minutes'
    ) THEN
      RAISE NOTICE 'Skipping: recent backlog tasks without specification found (possible duplicate)';
      RETURN NEW;
    END IF;
    
    -- Получаем настройки
    SELECT * INTO v_settings 
    FROM public.task_auto_creation_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
      -- Если настроек нет, используем дефолтные
      v_settings.spec_tasks_enabled := true;
      v_settings.animation_tasks_separate := true;
      v_settings.default_due_days := 7;
      v_settings.default_assignee_id := NULL;
    END IF;
    
    -- Получаем state_json из спецификации
    SELECT state_json INTO v_spec_state
    FROM public.specifications
    WHERE id = v_spec_id;
    
    IF NOT FOUND OR v_spec_state IS NULL THEN
      RAISE NOTICE 'Skipping: specification not found or state_json is null (spec_id: %)', v_spec_id;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Specification found, creating tasks for spec %...', v_spec_id;
    
    -- Получаем максимальный order для существующих задач в проекте
    SELECT COALESCE(MAX("order"), -1) + 1 INTO v_task_order
    FROM public.tasks
    WHERE project_id = v_project_id;
    
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
      
      -- Получаем или создаем stage для этого шаблона
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
      
      -- Создаем задачу из шаблона С УКАЗАНИЕМ source_specification_id
      INSERT INTO public.tasks (
        project_id, stage_id, title, description, status, "order",
        due_date, assignee_id, source_specification_id
      ) VALUES (
        v_project_id,
        v_stage_id,
        v_template.title,
        v_template.description,
        'backlog',
        v_task_order,
        CURRENT_DATE + (v_template_due_days || ' days')::INTERVAL,
        v_template_assignee_id,
        v_spec_id  -- ДОБАВЛЕНО: привязка к спецификации
      ) RETURNING id INTO v_created_task_id;
      
      -- Создаем чеклист из шаблона
      IF v_template.checklist_items IS NOT NULL AND jsonb_array_length(v_template.checklist_items) > 0 THEN
        v_checklist_item_order := 0;
        FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_template.checklist_items) LOOP
          v_checklist_item_title := v_checklist_item->>'title';
          IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
            INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
            VALUES (v_created_task_id, v_checklist_item_title, false, 
                    COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order));
            v_checklist_item_order := v_checklist_item_order + 1;
          END IF;
        END LOOP;
      END IF;
      
      v_task_order := v_task_order + 1;
      RAISE NOTICE 'Created task from template: % (stage: %, spec: %)', v_template.title, v_template.stage_key, v_spec_id;
    END LOOP;
    
    -- ===========================================
    -- СОЗДАНИЕ ЗАДАЧ ИЗ СПЕЦИФИКАЦИИ
    -- ===========================================
    IF v_settings.spec_tasks_enabled AND v_spec_state->'items' IS NOT NULL THEN
      
      FOR v_item_id, v_item_data IN SELECT * FROM jsonb_each(v_spec_state->'items') LOOP
        
        v_item_qty := (v_item_data->>'qty')::INT;
        v_item_anim := COALESCE(v_item_data->>'anim', 'none');
        
        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
          CONTINUE;
        END IF;
        
        PERFORM ensure_spec_item_template_exists(v_item_id);
        
        SELECT * INTO v_spec_template
        FROM public.task_spec_item_templates
        WHERE item_id = v_item_id;
        
        v_task_title := v_spec_template.task_title;
        v_task_description := COALESCE(
          REPLACE(v_spec_template.task_description, '{qty}', v_item_qty::TEXT),
          'Задача по созданию ' || LOWER(v_task_title) || ' в количестве ' || v_item_qty || ' шт.'
        );
        
        -- Создаем задачу С УКАЗАНИЕМ source_specification_id
        INSERT INTO public.tasks (
          project_id, title, description, status, "order",
          due_date, assignee_id, spec_item_id, source_specification_id
        ) VALUES (
          v_project_id,
          v_task_title || ' (x' || v_item_qty || ')',
          v_task_description,
          'backlog',
          v_task_order,
          CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
          v_settings.default_assignee_id,
          v_item_id,
          v_spec_id  -- ДОБАВЛЕНО: привязка к спецификации
        ) RETURNING id INTO v_created_task_id;
        
        -- Создаем чеклист
        IF v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
          v_checklist_item_order := 0;
          FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
            v_checklist_item_title := v_checklist_item->>'title';
            IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
              INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
              VALUES (v_created_task_id, v_checklist_item_title, false,
                      COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order));
              v_checklist_item_order := v_checklist_item_order + 1;
            END IF;
          END LOOP;
        END IF;
        
        v_task_order := v_task_order + 1;
        
        -- Анимации
        IF v_settings.animation_tasks_separate AND v_item_anim != 'none' THEN
          v_anim_name := get_animation_name(v_item_anim);
          
          IF v_spec_template.animation_task_title_template IS NOT NULL THEN
            v_final_title := REPLACE(
              REPLACE(v_spec_template.animation_task_title_template, '{item_name}', v_task_title),
              '{anim_name}', v_anim_name
            );
          ELSE
            v_final_title := 'Анимация: ' || v_task_title || ' (' || v_anim_name || ')';
          END IF;
          
          IF v_spec_template.animation_task_description_template IS NOT NULL THEN
            v_final_description := REPLACE(
              REPLACE(v_spec_template.animation_task_description_template, '{item_name}', LOWER(v_task_title)),
              '{anim_name}', v_anim_name
            );
          ELSE
            v_final_description := 'Задача по созданию анимации для ' || LOWER(v_task_title) || ': ' || v_anim_name;
          END IF;
          
          INSERT INTO public.tasks (
            project_id, title, description, status, "order",
            due_date, assignee_id, spec_item_id, spec_anim_id, source_specification_id
          ) VALUES (
            v_project_id,
            v_final_title,
            v_final_description,
            'backlog',
            v_task_order,
            CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
            v_settings.default_assignee_id,
            v_item_id,
            v_item_anim,
            v_spec_id  -- ДОБАВЛЕНО: привязка к спецификации
          ) RETURNING id INTO v_created_task_id;
          
          -- Чеклист для анимации
          IF v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
            v_checklist_item_order := 0;
            FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
              v_checklist_item_title := v_checklist_item->>'title';
              IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
                INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
                VALUES (v_created_task_id, v_checklist_item_title, false,
                        COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order));
                v_checklist_item_order := v_checklist_item_order + 1;
              END IF;
            END LOOP;
          END IF;
          
          v_task_order := v_task_order + 1;
        END IF;
        
      END LOOP;
      
    END IF;
    
    -- ===========================================
    -- ОБНОВЛЕНИЕ СТАТУСА ПРОЕКТА
    -- ===========================================
    -- Обновляем статус на 'in_production' только если он еще не установлен
    UPDATE public.projects
    SET 
      status = 'in_production',
      started_at = COALESCE(started_at, NOW()),
      updated_at = NOW()
    WHERE id = v_project_id
      AND status IN ('active', 'pending_payment', 'draft');
    
    RAISE NOTICE 'Project % updated. Tasks created for specification %', v_project_id, v_spec_id;
    RAISE NOTICE 'Total tasks created: %', v_task_order;
    
  ELSE
    RAISE NOTICE 'Skipping: status is not paid or already was paid (OLD: %, NEW: %)', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Комментарий к обновленной функции
COMMENT ON FUNCTION auto_create_tasks_on_first_payment() IS 
'Автоматически создает задачи из шаблонов и спецификации при подтверждении первой оплаты.
ВАЖНО: Теперь поддерживает создание задач для нескольких спецификаций в одном проекте (дозаказы).
Проверка уникальности выполняется по source_specification_id, а не по project_id.';
