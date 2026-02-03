-- ===========================================
-- ADD CHECKLIST SUPPORT TO TASK TEMPLATES
-- ===========================================

-- Добавляем поле для хранения чеклиста в шаблонах дополнительных задач
ALTER TABLE public.task_auto_templates
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::JSONB;

-- Добавляем поле для хранения чеклиста в шаблонах задач из спецификации
ALTER TABLE public.task_spec_item_templates
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::JSONB;

-- Комментарии
COMMENT ON COLUMN public.task_auto_templates.checklist_items IS 'Массив элементов чеклиста для задачи. Формат: [{"title": "Пункт 1", "order": 0}, ...]';
COMMENT ON COLUMN public.task_spec_item_templates.checklist_items IS 'Массив элементов чеклиста для задачи. Формат: [{"title": "Пункт 1", "order": 0}, ...]';
