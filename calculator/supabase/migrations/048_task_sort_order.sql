-- ===========================================
-- TASK SORT ORDER — порядок создания задач из спецификации
-- ===========================================
-- Добавляем sort_order в task_spec_item_templates и обновляем триггер

-- Шаг 1: Добавляем поле sort_order
ALTER TABLE public.task_spec_item_templates
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 999;

COMMENT ON COLUMN public.task_spec_item_templates.sort_order IS 'Порядок создания задачи (меньшее значение = выше приоритет). Дефолт по расположению items в калькуляторе.';

-- Шаг 2: Задаём дефолтные веса по порядку items в categories.js
-- Concept Document — первый после шаблонов (Briefing)
UPDATE public.task_spec_item_templates SET sort_order = 10 WHERE item_id = 'concept_doc';

-- Символы (Symbols)
UPDATE public.task_spec_item_templates SET sort_order = 100 WHERE item_id = 'sym_low';
UPDATE public.task_spec_item_templates SET sort_order = 110 WHERE item_id = 'sym_mid';
UPDATE public.task_spec_item_templates SET sort_order = 120 WHERE item_id = 'sym_spec';

-- Фоны (Backgrounds)
UPDATE public.task_spec_item_templates SET sort_order = 200 WHERE item_id = 'bg_base_s';
UPDATE public.task_spec_item_templates SET sort_order = 210 WHERE item_id = 'bg_base_d';
UPDATE public.task_spec_item_templates SET sort_order = 220 WHERE item_id = 'bg_bonus_s';
UPDATE public.task_spec_item_templates SET sort_order = 230 WHERE item_id = 'bg_bonus_d';

-- Поп-апы (Pop-ups)
UPDATE public.task_spec_item_templates SET sort_order = 300 WHERE item_id = 'pop_win_s';
UPDATE public.task_spec_item_templates SET sort_order = 310 WHERE item_id = 'pop_win_d';
UPDATE public.task_spec_item_templates SET sort_order = 320 WHERE item_id = 'pop_start_s';
UPDATE public.task_spec_item_templates SET sort_order = 330 WHERE item_id = 'pop_start_d';
UPDATE public.task_spec_item_templates SET sort_order = 340 WHERE item_id = 'pop_end_s';
UPDATE public.task_spec_item_templates SET sort_order = 350 WHERE item_id = 'pop_end_d';
UPDATE public.task_spec_item_templates SET sort_order = 360 WHERE item_id = 'pop_extra_s';
UPDATE public.task_spec_item_templates SET sort_order = 370 WHERE item_id = 'pop_extra_d';
UPDATE public.task_spec_item_templates SET sort_order = 380 WHERE item_id = 'pop_error_s';
UPDATE public.task_spec_item_templates SET sort_order = 390 WHERE item_id = 'pop_error_d';

-- UI Меню и Экраны
UPDATE public.task_spec_item_templates SET sort_order = 400 WHERE item_id = 'menu_buy_s';
UPDATE public.task_spec_item_templates SET sort_order = 410 WHERE item_id = 'menu_buy_d';
UPDATE public.task_spec_item_templates SET sort_order = 420 WHERE item_id = 'menu_bet_s';
UPDATE public.task_spec_item_templates SET sort_order = 430 WHERE item_id = 'menu_bet_d';
UPDATE public.task_spec_item_templates SET sort_order = 440 WHERE item_id = 'menu_auto_s';
UPDATE public.task_spec_item_templates SET sort_order = 450 WHERE item_id = 'menu_auto_d';
UPDATE public.task_spec_item_templates SET sort_order = 460 WHERE item_id = 'ui_pack_s';
UPDATE public.task_spec_item_templates SET sort_order = 470 WHERE item_id = 'ui_pack_d';
UPDATE public.task_spec_item_templates SET sort_order = 480 WHERE item_id = 'screen_load_s';
UPDATE public.task_spec_item_templates SET sort_order = 490 WHERE item_id = 'screen_load_d';
UPDATE public.task_spec_item_templates SET sort_order = 500 WHERE item_id = 'screen_info_s';
UPDATE public.task_spec_item_templates SET sort_order = 510 WHERE item_id = 'screen_info_d';
UPDATE public.task_spec_item_templates SET sort_order = 520 WHERE item_id = 'screen_intro_s';
UPDATE public.task_spec_item_templates SET sort_order = 530 WHERE item_id = 'screen_intro_d';

-- Маркетинг (Promo)
UPDATE public.task_spec_item_templates SET sort_order = 600 WHERE item_id = 'promo_cover';
UPDATE public.task_spec_item_templates SET sort_order = 610 WHERE item_id = 'promo_banner';
UPDATE public.task_spec_item_templates SET sort_order = 620 WHERE item_id = 'promo_poster';
UPDATE public.task_spec_item_templates SET sort_order = 630 WHERE item_id = 'promo_teaser';
UPDATE public.task_spec_item_templates SET sort_order = 640 WHERE item_id = 'promo_icons';

-- Старые item_id (обратная совместимость) — в конец
UPDATE public.task_spec_item_templates SET sort_order = 900 WHERE item_id IN ('bg_bonus', 'popup_base', 'popup_bonus', 'ui_menu', 'ui_button', 'ui_frame', 'marketing_banner', 'marketing_teaser');

-- Создаём индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_task_spec_item_templates_sort_order ON public.task_spec_item_templates (sort_order);

-- Шаг 3: Обновляем ensure_spec_item_template_exists — новые шаблоны получают sort_order из калькулятора
CREATE OR REPLACE FUNCTION ensure_spec_item_template_exists(p_item_id TEXT)
RETURNS void AS $$
DECLARE
  v_task_title TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.task_spec_item_templates WHERE item_id = p_item_id
  ) THEN
    v_task_title := get_item_task_name(p_item_id);
    
    INSERT INTO public.task_spec_item_templates (
      item_id,
      task_title,
      task_description,
      animation_task_title_template,
      animation_task_description_template,
      checklist_items,
      sort_order
    ) VALUES (
      p_item_id,
      v_task_title,
      'Задача по созданию ' || LOWER(v_task_title) || ' в количестве {qty} шт.',
      'Анимация: {item_name} ({anim_name})',
      'Задача по созданию анимации для {item_name}: {anim_name}',
      '[]'::JSONB,
      999
    );
    
    RAISE NOTICE 'Created new template for item_id: % with title: %', p_item_id, v_task_title;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Шаг 4: Обновляем триггер — сортировка spec items по sort_order
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
  v_has_paid_invoices BOOLEAN;
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
  v_sorted_item RECORD;
BEGIN
  -- Проверяем, что статус изменился на 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    v_project_id := NEW.project_id;
    v_offer_id := NEW.offer_id;
    
    -- Проверяем, что это первая оплата (milestone_order = 1)
    IF NEW.milestone_order IS NULL OR NEW.milestone_order != 1 THEN
      RETURN NEW;
    END IF;
    
    -- Проверяем, что для проекта еще не было подтвержденных оплат
    SELECT EXISTS(
      SELECT 1 FROM public.invoices 
      WHERE project_id = v_project_id 
        AND status = 'paid' 
        AND id != NEW.id
    ) INTO v_has_paid_invoices;
    
    IF v_has_paid_invoices THEN
      RETURN NEW;
    END IF;
    
    -- Проверяем, что задачи еще не были созданы для этого проекта
    IF EXISTS(
      SELECT 1 FROM public.tasks 
      WHERE project_id = v_project_id 
        AND status = 'backlog'
        AND created_at >= NOW() - INTERVAL '10 minutes'
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Получаем настройки
    SELECT * INTO v_settings 
    FROM public.task_auto_creation_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
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
      RETURN NEW;
    END IF;
    
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
        UPDATE public.workflow_stages
        SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
        WHERE id = v_stage_id AND status = 'pending';
      END IF;
      
      INSERT INTO public.tasks (
        project_id, stage_id, title, description, status, "order", due_date, assignee_id
      ) VALUES (
        v_project_id, v_stage_id, v_template.title, v_template.description, 'backlog',
        v_task_order, CURRENT_DATE + (v_template_due_days || ' days')::INTERVAL, v_template_assignee_id
      ) RETURNING id INTO v_created_task_id;
      
      -- Создаем чеклист из шаблона
      IF v_template.checklist_items IS NOT NULL AND jsonb_array_length(v_template.checklist_items) > 0 THEN
        v_checklist_item_order := 0;
        FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_template.checklist_items) LOOP
          v_checklist_item_title := v_checklist_item->>'title';
          IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
            INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
            VALUES (v_created_task_id, v_checklist_item_title, false, COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order));
            v_checklist_item_order := v_checklist_item_order + 1;
          END IF;
        END LOOP;
      END IF;
      
      v_task_order := v_task_order + 1;
    END LOOP;
    
    -- ===========================================
    -- СОЗДАНИЕ ЗАДАЧ ИЗ СПЕЦИФИКАЦИИ — СОРТИРОВКА ПО sort_order
    -- ===========================================
    IF v_settings.spec_tasks_enabled AND v_spec_state->'items' IS NOT NULL THEN
      
      -- Сортируем items по sort_order из шаблонов (вместо произвольного jsonb_each)
      FOR v_sorted_item IN
        SELECT 
          items.key AS item_id,
          items.value AS item_data,
          COALESCE(tpl.sort_order, 999) AS sort_order
        FROM jsonb_each(v_spec_state->'items') AS items(key, value)
        LEFT JOIN public.task_spec_item_templates tpl ON tpl.item_id = items.key
        ORDER BY COALESCE(tpl.sort_order, 999), items.key
      LOOP
        
        v_item_id := v_sorted_item.item_id;
        v_item_data := v_sorted_item.item_data;
        v_item_qty := (v_item_data->>'qty')::INT;
        v_item_anim := COALESCE(v_item_data->>'anim', 'none');
        
        -- Пропускаем элементы с нулевым количеством
        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
          CONTINUE;
        END IF;
        
        -- Обеспечиваем существование шаблона
        PERFORM ensure_spec_item_template_exists(v_item_id);
        
        -- Получаем шаблон
        SELECT * INTO v_spec_template
        FROM public.task_spec_item_templates
        WHERE item_id = v_item_id;
        
        v_task_title := v_spec_template.task_title;
        v_task_description := COALESCE(
          REPLACE(v_spec_template.task_description, '{qty}', v_item_qty::TEXT),
          'Задача по созданию ' || LOWER(v_task_title) || ' в количестве ' || v_item_qty || ' шт.'
        );
        
        -- Создаем задачу
        INSERT INTO public.tasks (
          project_id, title, description, status, "order", due_date, assignee_id, spec_item_id
        ) VALUES (
          v_project_id, v_task_title || ' (x' || v_item_qty || ')', v_task_description, 'backlog',
          v_task_order, CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
          v_settings.default_assignee_id, v_item_id
        ) RETURNING id INTO v_created_task_id;
        
        -- Создаем чеклист из шаблона
        IF v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
          v_checklist_item_order := 0;
          FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
            v_checklist_item_title := v_checklist_item->>'title';
            IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
              INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
              VALUES (v_created_task_id, v_checklist_item_title, false, COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order));
              v_checklist_item_order := v_checklist_item_order + 1;
            END IF;
          END LOOP;
        END IF;
        
        v_task_order := v_task_order + 1;
        
        -- Отдельная задача на анимацию
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
            project_id, title, description, status, "order", due_date, assignee_id, spec_item_id, spec_anim_id
          ) VALUES (
            v_project_id, v_final_title, v_final_description, 'backlog',
            v_task_order, CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
            v_settings.default_assignee_id, v_item_id, v_item_anim
          ) RETURNING id INTO v_created_task_id;
          
          -- Чеклист для анимационной задачи
          IF v_spec_template.checklist_items IS NOT NULL AND jsonb_array_length(v_spec_template.checklist_items) > 0 THEN
            v_checklist_item_order := 0;
            FOR v_checklist_item IN SELECT * FROM jsonb_array_elements(v_spec_template.checklist_items) LOOP
              v_checklist_item_title := v_checklist_item->>'title';
              IF v_checklist_item_title IS NOT NULL AND v_checklist_item_title != '' THEN
                INSERT INTO public.task_checklist_items (task_id, title, completed, "order")
                VALUES (v_created_task_id, v_checklist_item_title, false, COALESCE((v_checklist_item->>'order')::INT, v_checklist_item_order));
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
    UPDATE public.projects
    SET 
      status = 'in_production',
      started_at = COALESCE(started_at, NOW()),
      updated_at = NOW()
    WHERE id = v_project_id
      AND status IN ('active', 'pending_payment');
    
    RAISE NOTICE 'Tasks created successfully. Total tasks: %', v_task_order;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
