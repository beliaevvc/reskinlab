-- ===========================================
-- TASK SPECIFICATION ITEM TEMPLATES
-- ===========================================

-- Таблица для шаблонов задач из пунктов спецификации
-- Позволяет настраивать названия задач для каждого item_id калькулятора
CREATE TABLE IF NOT EXISTS public.task_spec_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связь с пунктом спецификации калькулятора
  item_id TEXT NOT NULL UNIQUE, -- sym_low, sym_mid, bg_base_s, etc.
  
  -- Название задачи (по умолчанию берется из get_item_task_name)
  task_title TEXT NOT NULL,
  
  -- Описание задачи (опционально)
  task_description TEXT,
  
  -- Шаблон для названия задачи с анимацией (опционально)
  -- Может содержать плейсхолдеры: {item_name}, {anim_name}
  animation_task_title_template TEXT DEFAULT 'Анимация: {item_name} ({anim_name})',
  
  -- Шаблон для описания задачи с анимацией (опционально)
  animation_task_description_template TEXT DEFAULT 'Задача по созданию анимации для {item_name}: {anim_name}',
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- RLS для шаблонов (только админы)
ALTER TABLE public.task_spec_item_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spec_item_templates_admin_only" ON public.task_spec_item_templates;
CREATE POLICY "spec_item_templates_admin_only"
ON public.task_spec_item_templates
FOR ALL
USING (is_admin());

-- Вставляем дефолтные шаблоны из функции get_item_task_name
INSERT INTO public.task_spec_item_templates (
  item_id,
  task_title,
  task_description,
  animation_task_title_template,
  animation_task_description_template
)
SELECT 
  item_id,
  task_title,
  'Задача по созданию ' || LOWER(task_title) || ' в количестве {qty} шт.',
  'Анимация: ' || task_title || ' ({anim_name})',
  'Задача по созданию анимации для ' || LOWER(task_title) || ': {anim_name}'
FROM (
  VALUES
    ('sym_low', 'Low Symbols'),
    ('sym_mid', 'High Symbols'),
    ('sym_spec', 'Special Symbols (Wild/Bonus)'),
    ('bg_base_s', 'Base BG (Simple)'),
    ('bg_base_d', 'Base BG (Detailed)'),
    ('bg_bonus', 'Bonus BG'),
    ('popup_base', 'Base Pop-up'),
    ('popup_bonus', 'Bonus Pop-up'),
    ('ui_menu', 'UI Menu'),
    ('ui_button', 'UI Button Set'),
    ('ui_frame', 'UI Frame'),
    ('marketing_banner', 'Marketing Banner'),
    ('marketing_teaser', 'Marketing Teaser'),
    ('promo_teaser', 'Static Promo Teaser'),
    ('promo_icons', 'Store Icons Set')
) AS items(item_id, task_title)
ON CONFLICT (item_id) DO NOTHING;

-- Добавляем поля для связи задач с пунктами спецификации
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS spec_item_id TEXT, -- ID пункта спецификации (sym_low, sym_mid, etc.)
ADD COLUMN IF NOT EXISTS spec_anim_id TEXT; -- ID анимации (AN-L, AN-S, AN-F, none)

-- Индекс для быстрого поиска задач по пункту спецификации
CREATE INDEX IF NOT EXISTS idx_tasks_spec_item_id ON public.tasks(spec_item_id);
CREATE INDEX IF NOT EXISTS idx_tasks_spec_anim_id ON public.tasks(spec_anim_id);

-- Комментарии
COMMENT ON TABLE public.task_spec_item_templates IS 'Шаблоны названий задач для пунктов спецификации калькулятора';
COMMENT ON COLUMN public.tasks.spec_item_id IS 'ID пункта спецификации, из которого создана задача (sym_low, sym_mid, bg_base_s, etc.)';
COMMENT ON COLUMN public.tasks.spec_anim_id IS 'ID анимации для задачи (AN-L, AN-S, AN-F, none)';
