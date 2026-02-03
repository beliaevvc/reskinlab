-- ===========================================
-- AUTO TASK CREATION ON FIRST PAYMENT
-- ===========================================

-- 1. Таблица настроек автоматических задач
CREATE TABLE IF NOT EXISTS public.task_auto_creation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Настройки для разных типов задач
  briefing_task_enabled BOOLEAN DEFAULT true,
  briefing_task_title TEXT DEFAULT 'Брифинг клиента',
  briefing_task_description TEXT DEFAULT 'Провести брифинг с клиентом для уточнения требований и получения референсов',
  
  -- Настройки для задач из спецификации
  spec_tasks_enabled BOOLEAN DEFAULT true,
  animation_tasks_separate BOOLEAN DEFAULT true, -- Разделять анимации на отдельные задачи
  
  -- Настройки по умолчанию для новых задач
  default_assignee_id UUID REFERENCES public.profiles(id),
  default_due_days INT DEFAULT 7, -- Дней до дедлайна по умолчанию
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- RLS для настроек (только админы)
ALTER TABLE public.task_auto_creation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_settings_admin_only" ON public.task_auto_creation_settings;
CREATE POLICY "task_settings_admin_only"
ON public.task_auto_creation_settings
FOR ALL
USING (is_admin());

-- Вставляем дефолтные настройки (только если их еще нет)
INSERT INTO public.task_auto_creation_settings (
  briefing_task_enabled,
  briefing_task_title,
  briefing_task_description,
  spec_tasks_enabled,
  animation_tasks_separate
)
SELECT 
  true,
  'Брифинг клиента',
  'Провести брифинг с клиентом для уточнения требований и получения референсов',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_auto_creation_settings
);

-- 2. Функция для получения названия задачи из item ID
CREATE OR REPLACE FUNCTION get_item_task_name(item_id TEXT)
RETURNS TEXT AS $$
DECLARE
  item_names JSONB := '{
    "sym_low": "Low Symbols",
    "sym_mid": "High Symbols", 
    "sym_spec": "Special Symbols (Wild/Bonus)",
    "bg_base_s": "Base BG (Simple)",
    "bg_base_d": "Base BG (Detailed)",
    "bg_bonus": "Bonus BG",
    "popup_base": "Base Pop-up",
    "popup_bonus": "Bonus Pop-up",
    "ui_menu": "UI Menu",
    "ui_button": "UI Button Set",
    "ui_frame": "UI Frame",
    "marketing_banner": "Marketing Banner",
    "marketing_teaser": "Marketing Teaser",
    "promo_teaser": "Static Promo Teaser",
    "promo_icons": "Store Icons Set"
  }'::JSONB;
BEGIN
  RETURN COALESCE(item_names->>item_id, item_id);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Функция для получения названия анимации
CREATE OR REPLACE FUNCTION get_animation_name(anim_id TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE anim_id
    WHEN 'none' THEN 'Без анимации'
    WHEN 'AN-L' THEN 'AN-L Light Motion'
    WHEN 'AN-S' THEN 'AN-S Standard Motion'
    WHEN 'AN-F' THEN 'AN-F Full Motion'
    ELSE anim_id
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Функция для автоматического создания задач при подтверждении первой оплаты
CREATE OR REPLACE FUNCTION auto_create_tasks_on_first_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_offer_id UUID;
  v_spec_id UUID;
  v_spec_state JSONB;
  v_settings RECORD;
  v_briefing_stage_id UUID;
  v_item_id TEXT;
  v_item_data JSONB;
  v_item_qty INT;
  v_item_anim TEXT;
  v_task_title TEXT;
  v_task_description TEXT;
  v_task_order INT := 0;
  v_has_paid_invoices BOOLEAN;
BEGIN
  -- Проверяем, что статус изменился на 'paid' (из любого другого статуса)
  -- Логируем для отладки
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
    -- (защита от повторного создания при обновлении инвойса)
    -- Проверяем наличие задач со статусом backlog, созданных недавно (в последние 10 минут)
    -- Это защита от повторного создания при повторном обновлении инвойса
    IF EXISTS(
      SELECT 1 FROM public.tasks 
      WHERE project_id = v_project_id 
        AND status = 'backlog'
        AND created_at >= NOW() - INTERVAL '10 minutes'
        AND title LIKE '%Брифинг%'
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
      v_settings.briefing_task_enabled := true;
      v_settings.briefing_task_title := 'Брифинг клиента';
      v_settings.briefing_task_description := 'Провести брифинг с клиентом для уточнения требований и получения референсов';
      v_settings.spec_tasks_enabled := true;
      v_settings.animation_tasks_separate := true;
      v_settings.default_due_days := 7;
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
    
    -- Получаем или создаем stage для briefing
    IF v_settings.briefing_task_enabled THEN
      SELECT id INTO v_briefing_stage_id
      FROM public.workflow_stages
      WHERE project_id = v_project_id AND stage_key = 'briefing';
      
      IF NOT FOUND THEN
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
          'briefing',
          'Briefing',
          'Requirements gathering, references, source game analysis',
          1,
          'in_progress',
          NOW()
        ) RETURNING id INTO v_briefing_stage_id;
      ELSE
        -- Обновляем существующий stage на in_progress, если он еще не начат
        UPDATE public.workflow_stages
        SET 
          status = 'in_progress',
          started_at = COALESCE(started_at, NOW())
        WHERE id = v_briefing_stage_id
          AND status = 'pending';
      END IF;
      
      -- Создаем задачу по брифингу
      INSERT INTO public.tasks (
        project_id,
        stage_id,
        title,
        description,
        status,
        "order",
        due_date,
        assignee_id
      ) VALUES (
        v_project_id,
        v_briefing_stage_id,
        v_settings.briefing_task_title,
        v_settings.briefing_task_description,
        'backlog',
        v_task_order,
        CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
        v_settings.default_assignee_id
      );
      
      v_task_order := v_task_order + 1;
    END IF;
    
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
        
        -- Получаем название задачи
        v_task_title := get_item_task_name(v_item_id);
        
        -- Создаем задачу для элемента (без анимации)
        INSERT INTO public.tasks (
          project_id,
          title,
          description,
          status,
          "order",
          due_date,
          assignee_id
        ) VALUES (
          v_project_id,
          v_task_title || ' (x' || v_item_qty || ')',
          'Задача по созданию ' || LOWER(v_task_title) || ' в количестве ' || v_item_qty || ' шт.',
          'backlog',
          v_task_order,
          CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
          v_settings.default_assignee_id
        );
        
        v_task_order := v_task_order + 1;
        
        -- Если включено разделение анимаций и анимация не 'none', создаем отдельную задачу
        IF v_settings.animation_tasks_separate AND v_item_anim != 'none' THEN
          
          INSERT INTO public.tasks (
            project_id,
            title,
            description,
            status,
            "order",
            due_date,
            assignee_id
          ) VALUES (
            v_project_id,
            'Анимация: ' || v_task_title || ' (' || get_animation_name(v_item_anim) || ')',
            'Задача по созданию анимации для ' || LOWER(v_task_title) || ': ' || get_animation_name(v_item_anim),
            'backlog',
            v_task_order,
            CURRENT_DATE + (v_settings.default_due_days || ' days')::INTERVAL,
            v_settings.default_assignee_id
          );
          
          v_task_order := v_task_order + 1;
        END IF;
        
      END LOOP;
      
    END IF;
    
    RAISE NOTICE 'Tasks created successfully. Total tasks: %', v_task_order;
    
    -- Активируем этап Briefing (если он был создан или обновлен)
    IF v_briefing_stage_id IS NOT NULL THEN
      RAISE NOTICE 'Briefing stage activated (stage_id: %)', v_briefing_stage_id;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping: status is not paid or already was paid (OLD: %, NEW: %)', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем триггер
DROP TRIGGER IF EXISTS trigger_auto_create_tasks_on_first_payment ON public.invoices;
CREATE TRIGGER trigger_auto_create_tasks_on_first_payment
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
  EXECUTE FUNCTION auto_create_tasks_on_first_payment();

-- 6. Комментарии
COMMENT ON TABLE public.task_auto_creation_settings IS 'Настройки автоматического создания задач при подтверждении первой оплаты';
COMMENT ON FUNCTION auto_create_tasks_on_first_payment() IS 'Автоматически создает задачи из спецификации при подтверждении первой оплаты проекта';
COMMENT ON FUNCTION get_item_task_name(TEXT) IS 'Возвращает читаемое название задачи по ID элемента спецификации';
COMMENT ON FUNCTION get_animation_name(TEXT) IS 'Возвращает читаемое название анимации по ID';
