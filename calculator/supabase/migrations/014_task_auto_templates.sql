-- ===========================================
-- ADDITIONAL AUTO TASK TEMPLATES
-- ===========================================

-- Таблица для шаблонов дополнительных автоматических задач
-- Эти задачи создаются не из спецификации, а по шаблонам (например, брифинг)
CREATE TABLE IF NOT EXISTS public.task_auto_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Информация о задаче
  title TEXT NOT NULL,
  description TEXT,
  
  -- Привязка к этапу проекта
  stage_key TEXT NOT NULL, -- briefing, moodboard, symbols, ui, animation, revisions, delivery
  
  -- Порядок создания (для сортировки задач)
  "order" INT NOT NULL DEFAULT 0,
  
  -- Настройки задачи
  assignee_id UUID REFERENCES public.profiles(id), -- Исполнитель по умолчанию (может быть переопределен в настройках)
  due_days_offset INT DEFAULT 7, -- Смещение дедлайна в днях от даты создания
  
  -- Включение/отключение
  is_enabled BOOLEAN DEFAULT true,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- RLS для шаблонов (только админы)
ALTER TABLE public.task_auto_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_templates_admin_only" ON public.task_auto_templates;
CREATE POLICY "task_templates_admin_only"
ON public.task_auto_templates
FOR ALL
USING (is_admin());

-- Вставляем дефолтный шаблон для брифинга (если его еще нет)
INSERT INTO public.task_auto_templates (
  title,
  description,
  stage_key,
  "order",
  due_days_offset,
  is_enabled
)
SELECT 
  'Брифинг клиента',
  'Провести брифинг с клиентом для уточнения требований и получения референсов',
  'briefing',
  0,
  7,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_auto_templates WHERE stage_key = 'briefing'
);

-- Индекс для быстрого поиска активных шаблонов
CREATE INDEX IF NOT EXISTS idx_task_auto_templates_enabled_order 
ON public.task_auto_templates(is_enabled, "order");

-- Комментарии
COMMENT ON TABLE public.task_auto_templates IS 'Шаблоны дополнительных автоматических задач, создаваемых при первой оплате (не из спецификации)';
COMMENT ON COLUMN public.task_auto_templates.stage_key IS 'Ключ этапа проекта (briefing, moodboard, symbols, ui, animation, revisions, delivery)';
COMMENT ON COLUMN public.task_auto_templates."order" IS 'Порядок создания задач (меньше = раньше)';
COMMENT ON COLUMN public.task_auto_templates.due_days_offset IS 'Смещение дедлайна в днях от даты создания задачи';
