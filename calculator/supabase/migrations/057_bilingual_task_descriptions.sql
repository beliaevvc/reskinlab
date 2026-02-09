-- ===========================================
-- BILINGUAL TASK TITLES AND DESCRIPTIONS
-- ===========================================
-- Добавляем поддержку двуязычных названий и описаний для задач (RU/EN)

-- 1. Добавляем поля в task_auto_templates (дополнительные автоматические задачи)
ALTER TABLE public.task_auto_templates
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Мигрируем существующие данные
UPDATE public.task_auto_templates
SET title_ru = title,
    title_en = title,
    description_ru = description,
    description_en = description
WHERE title_ru IS NULL;

-- 2. Добавляем поля в task_spec_item_templates (задачи из спецификации)
ALTER TABLE public.task_spec_item_templates
ADD COLUMN IF NOT EXISTS task_title_ru TEXT,
ADD COLUMN IF NOT EXISTS task_title_en TEXT,
ADD COLUMN IF NOT EXISTS task_description_ru TEXT,
ADD COLUMN IF NOT EXISTS task_description_en TEXT,
ADD COLUMN IF NOT EXISTS animation_task_title_template_ru TEXT,
ADD COLUMN IF NOT EXISTS animation_task_title_template_en TEXT,
ADD COLUMN IF NOT EXISTS animation_task_description_template_ru TEXT,
ADD COLUMN IF NOT EXISTS animation_task_description_template_en TEXT;

-- Мигрируем существующие данные
UPDATE public.task_spec_item_templates
SET task_title_ru = task_title,
    task_title_en = task_title,
    task_description_ru = task_description,
    task_description_en = task_description,
    animation_task_title_template_ru = animation_task_title_template,
    animation_task_title_template_en = animation_task_title_template,
    animation_task_description_template_ru = animation_task_description_template,
    animation_task_description_template_en = animation_task_description_template
WHERE task_title_ru IS NULL;

-- 3. Добавляем двуязычные поля в таблицу tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Мигрируем существующие данные в обе колонки
UPDATE public.tasks
SET title_ru = title,
    title_en = title,
    description_ru = description,
    description_en = description
WHERE title_ru IS NULL;

-- 4. Комментарии
COMMENT ON COLUMN public.task_auto_templates.title_ru IS 'Название задачи на русском языке';
COMMENT ON COLUMN public.task_auto_templates.title_en IS 'Название задачи на английском языке';
COMMENT ON COLUMN public.task_auto_templates.description_ru IS 'Описание задачи на русском языке';
COMMENT ON COLUMN public.task_auto_templates.description_en IS 'Описание задачи на английском языке';

COMMENT ON COLUMN public.task_spec_item_templates.task_title_ru IS 'Название задачи на русском языке';
COMMENT ON COLUMN public.task_spec_item_templates.task_title_en IS 'Название задачи на английском языке';
COMMENT ON COLUMN public.task_spec_item_templates.task_description_ru IS 'Описание задачи на русском языке';
COMMENT ON COLUMN public.task_spec_item_templates.task_description_en IS 'Описание задачи на английском языке';
COMMENT ON COLUMN public.task_spec_item_templates.animation_task_title_template_ru IS 'Шаблон названия анимационной задачи на русском языке';
COMMENT ON COLUMN public.task_spec_item_templates.animation_task_title_template_en IS 'Шаблон названия анимационной задачи на английском языке';
COMMENT ON COLUMN public.task_spec_item_templates.animation_task_description_template_ru IS 'Шаблон описания анимационной задачи на русском языке';
COMMENT ON COLUMN public.task_spec_item_templates.animation_task_description_template_en IS 'Шаблон описания анимационной задачи на английском языке';

COMMENT ON COLUMN public.tasks.title_ru IS 'Название задачи на русском языке';
COMMENT ON COLUMN public.tasks.title_en IS 'Название задачи на английском языке';
COMMENT ON COLUMN public.tasks.description_ru IS 'Описание задачи на русском языке';
COMMENT ON COLUMN public.tasks.description_en IS 'Описание задачи на английском языке';

-- 5. Обновляем функцию создания задач для поддержки двуязычных описаний
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
  v_task_title_ru TEXT;
  v_task_title_en TEXT;
  v_task_description TEXT;
  v_task_description_ru TEXT;
  v_task_description_en TEXT;
  v_task_order INT := 0;
  v_has_paid_invoices BOOLEAN;
  v_template_assignee_id UUID;
  v_template_due_days INT;
  v_spec_template RECORD;
  v_anim_name TEXT;
  v_final_title TEXT;
  v_final_title_ru TEXT;
  v_final_title_en TEXT;
  v_final_description TEXT;
  v_final_description_ru TEXT;
  v_final_description_en TEXT;
  v_created_task_id UUID;
  v_checklist_item JSONB;
  v_checklist_item_title TEXT;
  v_checklist_item_order INT;
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
    
    -- Проверяем, что для проекта еще не было подтвержденных оплат
    SELECT EXISTS(
      SELECT 1 FROM public.invoices 
      WHERE project_id = v_project_id 
        AND status = 'paid' 
        AND id != NEW.id
    ) INTO v_has_paid_invoices;
    
    IF v_has_paid_invoices THEN
      -- Уже были оплаты, не создаем задачи повторно
      RAISE NOTICE 'Skipping: project already has paid invoices';
      RETURN NEW;
    END IF;
    
    -- Проверяем, что задачи еще не были созданы для этого проекта
    IF EXISTS(
      SELECT 1 FROM public.tasks 
      WHERE project_id = v_project_id 
        AND status = 'backlog'
        AND created_at >= NOW() - INTERVAL '10 minutes'
    ) THEN
      -- Задачи уже созданы недавно, не создаем повторно
      RAISE NOTICE 'Skipping: backlog tasks already exist for this project (created in last 10 minutes)';
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
    
    -- Получаем specification_id из offer
    SELECT specification_id INTO v_spec_id
    FROM public.offers
    WHERE id = v_offer_id;
    
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;
    
    -- Получаем state_json из спецификации
    SELECT state_json INTO v_spec_state
    FROM public.specifications
    WHERE id = v_spec_id;
    
    IF NOT FOUND OR v_spec_state IS NULL THEN
      RAISE NOTICE 'Skipping: specification not found or state_json is null (spec_id: %)', v_spec_id;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Specification found, creating tasks...';
    
    -- ===========================================
    -- СОЗДАНИЕ ЗАДАЧ ИЗ ШАБЛОНОВ (task_auto_templates)
    -- ===========================================
    -- Проходим по всем активным шаблонам, отсортированным по order
    FOR v_template IN 
      SELECT * FROM public.task_auto_templates
      WHERE is_enabled = true
      ORDER BY "order" ASC
    LOOP
      -- Определяем assignee_id: сначала из шаблона, потом из настроек, потом NULL
      v_template_assignee_id := COALESCE(v_template.assignee_id, v_settings.default_assignee_id);
      
      -- Определяем due_days: сначала из шаблона, потом из настроек
      v_template_due_days := COALESCE(v_template.due_days_offset, v_settings.default_due_days, 7);
      
      -- Получаем или создаем stage для этого шаблона
      SELECT id INTO v_stage_id
      FROM public.workflow_stages
      WHERE project_id = v_project_id AND stage_key = v_template.stage_key;
      
      IF NOT FOUND THEN
        -- Создаем stage, если его нет
        INSERT INTO public.workflow_stages (
          project_id,
          stage_key,
          name,
          description,
          "order",
          status,
          started_at
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
            WHEN 'briefing' THEN 1
            WHEN 'moodboard' THEN 2
            WHEN 'symbols' THEN 3
            WHEN 'ui' THEN 4
            WHEN 'animation' THEN 5
            WHEN 'revisions' THEN 6
            WHEN 'delivery' THEN 7
          ELSE 99
          END,
          'in_progress',
          NOW()
        ) RETURNING id INTO v_stage_id;
      ELSE
        -- Обновляем существующий stage на in_progress, если он еще не начат
        UPDATE public.workflow_stages
        SET 
          status = 'in_progress',
          started_at = COALESCE(started_at, NOW())
        WHERE id = v_stage_id
          AND status = 'pending';
      END IF;
      
      -- Создаем задачу из шаблона с двуязычными названиями и описаниями
      INSERT INTO public.tasks (
        project_id,
        stage_id,
        title,
        title_ru,
        title_en,
        description,
        description_ru,
        description_en,
        status,
        "order",
        due_date,
        assignee_id
      ) VALUES (
        v_project_id,
        v_stage_id,
        COALESCE(v_template.title_en, v_template.title), -- Основное название - английское
        COALESCE(v_template.title_ru, v_template.title),
        COALESCE(v_template.title_en, v_template.title),
        COALESCE(v_template.description_en, v_template.description), -- Основное описание - английское
        COALESCE(v_template.description_ru, v_template.description),
        COALESCE(v_template.description_en, v_template.description),
        'backlog',
        v_task_order,
        CURRENT_DATE + (v_template_due_days || ' days')::INTERVAL,
        v_template_assignee_id
      ) RETURNING id INTO v_created_task_id;
      
      -- Создаем чеклист из шаблона, если он есть
      IF v_template.checklist_items IS NOT NULL AND jsonb_array_length(v_template.checklist_items) > 0 THEN
        v_checklist_item_order := 0;
        FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_template.checklist_items) LOOP
          v_checklist_item_title := v_checklist_item->>'title';
          IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
            INSERT INTO public.task_checklist_items (
              task_id,
              title,
              completed,
              "order"
            ) VALUES (
              v_created_task_id,
              v_checklist_item_title,
              false,
              COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order)
            );
            v_checklist_item_order := v_checklist_item_order + 1;
          END IF;
        END LOOP;
        RAISE NOTICE 'Created checklist for task % from template', v_created_task_id;
      END IF;
      
      v_task_order := v_task_order + 1;
      
      RAISE NOTICE 'Created task from template: % (stage: %)', v_template.title, v_template.stage_key;
    END LOOP;
    
    -- ===========================================
    -- СОЗДАНИЕ ЗАДАЧ ИЗ СПЕЦИФИКАЦИИ С ИСПОЛЬЗОВАНИЕМ ШАБЛОНОВ
    -- ===========================================
    -- Создаем задачи из спецификации, если включено
    IF v_settings.spec_tasks_enabled AND v_spec_state->'items' IS NOT NULL THEN
      
      -- Проходим по всем items в спецификации
      FOR v_item_id, v_item_data IN SELECT * FROM jsonb_each(v_spec_state->'items') LOOP
        
        v_item_qty := (v_item_data->>'qty')::INT;
        v_item_anim := COALESCE(v_item_data->>'anim', 'none');
        
        -- Пропускаем элементы с нулевым количеством
        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
          CONTINUE;
        END IF;
        
        -- Получаем шаблон для этого item_id
        SELECT * INTO v_spec_template
        FROM public.task_spec_item_templates
        WHERE item_id = v_item_id;
        
        -- Если шаблона нет, используем функцию get_item_task_name как fallback
        IF NOT FOUND THEN
          v_task_title := get_item_task_name(v_item_id);
          v_task_title_ru := v_task_title; -- Названия на английском по умолчанию
          v_task_title_en := v_task_title;
          v_task_description := 'Task for creating ' || LOWER(v_task_title) || ' in quantity of ' || v_item_qty || ' pcs.';
          v_task_description_ru := 'Задача по созданию ' || LOWER(v_task_title) || ' в количестве ' || v_item_qty || ' шт.';
          v_task_description_en := 'Task for creating ' || LOWER(v_task_title) || ' in quantity of ' || v_item_qty || ' pcs.';
          v_spec_template := NULL;
        ELSE
          -- Используем шаблон с двуязычными названиями
          v_task_title := COALESCE(v_spec_template.task_title_en, v_spec_template.task_title);
          v_task_title_ru := COALESCE(v_spec_template.task_title_ru, v_spec_template.task_title);
          v_task_title_en := COALESCE(v_spec_template.task_title_en, v_spec_template.task_title);
          -- Заменяем {qty} в описаниях на реальное количество
          v_task_description_ru := COALESCE(
            REPLACE(COALESCE(v_spec_template.task_description_ru, v_spec_template.task_description), '{qty}', v_item_qty::TEXT),
            'Задача по созданию ' || LOWER(v_task_title) || ' в количестве ' || v_item_qty || ' шт.'
          );
          v_task_description_en := COALESCE(
            REPLACE(COALESCE(v_spec_template.task_description_en, v_spec_template.task_description), '{qty}', v_item_qty::TEXT),
            'Task for creating ' || LOWER(v_task_title) || ' in quantity of ' || v_item_qty || ' pcs.'
          );
          v_task_description := v_task_description_en; -- Основное описание - английское
        END IF;
        
        -- Создаем задачу для элемента (без анимации)
        INSERT INTO public.tasks (
          project_id,
          title,
          title_ru,
          title_en,
          description,
          description_ru,
          description_en,
          status,
          "order",
          due_date,
          assignee_id,
          spec_item_id
        ) VALUES (
          v_project_id,
          v_task_title || ' (x' || v_item_qty || ')',
          v_task_title_ru || ' (x' || v_item_qty || ')',
          v_task_title_en || ' (x' || v_item_qty || ')',
          v_task_description,
          v_task_description_ru,
          v_task_description_en,
          'backlog',
          v_task_order,
          CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
          v_settings.default_assignee_id,
          v_item_id
        ) RETURNING id INTO v_created_task_id;
        
        -- Создаем чеклист из шаблона, если он есть
        IF v_spec_template IS NOT NULL AND v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
          v_checklist_item_order := 0;
          FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
            v_checklist_item_title := v_checklist_item->>'title';
            IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
              INSERT INTO public.task_checklist_items (
                task_id,
                title,
                completed,
                "order"
              ) VALUES (
                v_created_task_id,
                v_checklist_item_title,
                false,
                COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order)
              );
              v_checklist_item_order := v_checklist_item_order + 1;
            END IF;
          END LOOP;
          RAISE NOTICE 'Created checklist for spec task % from template', v_created_task_id;
        END IF;
        
        v_task_order := v_task_order + 1;
        
        -- Если включено разделение анимаций и анимация не 'none', создаем отдельную задачу
        IF v_settings.animation_tasks_separate AND v_item_anim != 'none' THEN
          
          -- Получаем название анимации
          v_anim_name := get_animation_name(v_item_anim);
          
          -- Формируем двуязычные названия задачи с анимацией из шаблона
          IF v_spec_template IS NOT NULL AND v_spec_template.animation_task_title_template_ru IS NOT NULL THEN
            v_final_title_ru := REPLACE(
              REPLACE(v_spec_template.animation_task_title_template_ru, '{item_name}', v_task_title_ru),
              '{anim_name}', v_anim_name
            );
          ELSIF v_spec_template IS NOT NULL AND v_spec_template.animation_task_title_template IS NOT NULL THEN
            v_final_title_ru := REPLACE(
              REPLACE(v_spec_template.animation_task_title_template, '{item_name}', v_task_title_ru),
              '{anim_name}', v_anim_name
            );
          ELSE
            v_final_title_ru := 'Анимация: ' || v_task_title_ru || ' (' || v_anim_name || ')';
          END IF;
          
          IF v_spec_template IS NOT NULL AND v_spec_template.animation_task_title_template_en IS NOT NULL THEN
            v_final_title_en := REPLACE(
              REPLACE(v_spec_template.animation_task_title_template_en, '{item_name}', v_task_title_en),
              '{anim_name}', v_anim_name
            );
          ELSIF v_spec_template IS NOT NULL AND v_spec_template.animation_task_title_template IS NOT NULL THEN
            v_final_title_en := REPLACE(
              REPLACE(v_spec_template.animation_task_title_template, '{item_name}', v_task_title_en),
              '{anim_name}', v_anim_name
            );
          ELSE
            v_final_title_en := 'Animation: ' || v_task_title_en || ' (' || v_anim_name || ')';
          END IF;
          
          v_final_title := v_final_title_en; -- Основное название - английское
          
          -- Формируем двуязычные описания для анимационной задачи
          IF v_spec_template IS NOT NULL AND v_spec_template.animation_task_description_template_ru IS NOT NULL THEN
            v_final_description_ru := REPLACE(
              REPLACE(v_spec_template.animation_task_description_template_ru, '{item_name}', LOWER(v_task_title_ru)),
              '{anim_name}', v_anim_name
            );
          ELSIF v_spec_template IS NOT NULL AND v_spec_template.animation_task_description_template IS NOT NULL THEN
            v_final_description_ru := REPLACE(
              REPLACE(v_spec_template.animation_task_description_template, '{item_name}', LOWER(v_task_title_ru)),
              '{anim_name}', v_anim_name
            );
          ELSE
            v_final_description_ru := 'Задача по созданию анимации для ' || LOWER(v_task_title_ru) || ': ' || v_anim_name;
          END IF;
          
          IF v_spec_template IS NOT NULL AND v_spec_template.animation_task_description_template_en IS NOT NULL THEN
            v_final_description_en := REPLACE(
              REPLACE(v_spec_template.animation_task_description_template_en, '{item_name}', LOWER(v_task_title_en)),
              '{anim_name}', v_anim_name
            );
          ELSIF v_spec_template IS NOT NULL AND v_spec_template.animation_task_description_template IS NOT NULL THEN
            v_final_description_en := REPLACE(
              REPLACE(v_spec_template.animation_task_description_template, '{item_name}', LOWER(v_task_title_en)),
              '{anim_name}', v_anim_name
            );
          ELSE
            v_final_description_en := 'Animation task for ' || LOWER(v_task_title_en) || ': ' || v_anim_name;
          END IF;
          
          v_final_description := v_final_description_en; -- Основное описание - английское
          
          INSERT INTO public.tasks (
            project_id,
            title,
            title_ru,
            title_en,
            description,
            description_ru,
            description_en,
            status,
            "order",
            due_date,
            assignee_id,
            spec_item_id,
            spec_anim_id
          ) VALUES (
            v_project_id,
            v_final_title,
            v_final_title_ru,
            v_final_title_en,
            v_final_description,
            v_final_description_ru,
            v_final_description_en,
            'backlog',
            v_task_order,
            CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
            v_settings.default_assignee_id,
            v_item_id,
            v_item_anim
          ) RETURNING id INTO v_created_task_id;
          
          -- Создаем чеклист из шаблона для задачи с анимацией (если есть)
          IF v_spec_template IS NOT NULL AND v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
            v_checklist_item_order := 0;
            FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
              v_checklist_item_title := v_checklist_item->>'title';
              IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
                INSERT INTO public.task_checklist_items (
                  task_id,
                  title,
                  completed,
                  "order"
                ) VALUES (
                  v_created_task_id,
                  v_checklist_item_title,
                  false,
                  COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order)
                );
                v_checklist_item_order := v_checklist_item_order + 1;
              END IF;
            END LOOP;
            RAISE NOTICE 'Created checklist for animation task % from template', v_created_task_id;
          END IF;
          
          v_task_order := v_task_order + 1;
        END IF;
        
      END LOOP;
      
    END IF;
    
    -- ===========================================
    -- ОБНОВЛЕНИЕ СТАТУСА ПРОЕКТА НА in_production
    -- ===========================================
    -- Обновляем статус проекта на 'in_production' после создания задач
    UPDATE public.projects
    SET 
      status = 'in_production',
      started_at = COALESCE(started_at, NOW()),
      updated_at = NOW()
    WHERE id = v_project_id
      AND status IN ('active', 'pending_payment');
    
    RAISE NOTICE 'Project % status updated to in_production', v_project_id;
    RAISE NOTICE 'Tasks created successfully. Total tasks: %', v_task_order;
    
  ELSE
    RAISE NOTICE 'Skipping: status is not paid or already was paid (OLD: %, NEW: %)', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Комментарий
COMMENT ON FUNCTION auto_create_tasks_on_first_payment() IS 'Автоматически создает задачи из шаблонов и спецификации при подтверждении первой оплаты проекта. Поддерживает двуязычные описания (RU/EN).';
