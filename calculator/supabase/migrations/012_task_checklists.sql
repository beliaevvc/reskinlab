-- ===========================================
-- TASK CHECKLISTS
-- ===========================================

-- Таблица для элементов чеклиста задач
CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_task_id 
ON public.task_checklist_items(task_id);

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_order 
ON public.task_checklist_items(task_id, "order");

-- RLS
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- Политики: админы и AM могут управлять чеклистами
CREATE POLICY "checklist_items_select_staff"
ON public.task_checklist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (
        is_admin()
        OR is_am()
        OR p.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
      )
  )
);

CREATE POLICY "checklist_items_insert_staff"
ON public.task_checklist_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (is_admin() OR is_am())
  )
);

CREATE POLICY "checklist_items_update_staff"
ON public.task_checklist_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (is_admin() OR is_am())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (is_admin() OR is_am())
  )
);

CREATE POLICY "checklist_items_delete_staff"
ON public.task_checklist_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (is_admin() OR is_am())
  )
);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_task_checklist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_task_checklist_items_updated_at ON public.task_checklist_items;
CREATE TRIGGER trigger_update_task_checklist_items_updated_at
  BEFORE UPDATE ON public.task_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_task_checklist_items_updated_at();

-- Комментарии
COMMENT ON TABLE public.task_checklist_items IS 'Элементы чеклиста для задач. Доступны только админам и AM для создания и редактирования.';
COMMENT ON COLUMN public.task_checklist_items.task_id IS 'ID задачи, к которой относится элемент чеклиста';
COMMENT ON COLUMN public.task_checklist_items.title IS 'Текст пункта чеклиста';
COMMENT ON COLUMN public.task_checklist_items.completed IS 'Отмечен ли пункт как выполненный';
COMMENT ON COLUMN public.task_checklist_items."order" IS 'Порядок отображения пунктов в чеклисте';
