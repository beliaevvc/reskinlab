-- ===========================================
-- UPDATE CHECKLIST POLICIES - VIEW FOR ALL, EDIT FOR STAFF ONLY
-- ===========================================

-- Обновляем RLS политики для task_checklist_items:
-- - Просмотр доступен всем (клиенты видят чеклисты своих задач)
-- - Редактирование только для админа и AM

-- Удаляем старые политики
DROP POLICY IF EXISTS "checklist_items_select_staff" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_insert_staff" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_update_staff" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_delete_staff" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_select" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_insert" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_update" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_items_delete" ON public.task_checklist_items;

-- Политика SELECT: все могут видеть чеклисты для своих задач
CREATE POLICY "checklist_items_select"
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

-- Политика INSERT: только админ и AM могут создавать чеклисты
CREATE POLICY "checklist_items_insert"
ON public.task_checklist_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (is_admin() OR is_am())
  )
);

-- Политика UPDATE: только админ и AM могут обновлять чеклисты
CREATE POLICY "checklist_items_update"
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

-- Политика DELETE: только админ и AM могут удалять чеклисты
CREATE POLICY "checklist_items_delete"
ON public.task_checklist_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklist_items.task_id
      AND (is_admin() OR is_am())
  )
);

-- Обновляем комментарий
COMMENT ON TABLE public.task_checklist_items IS 'Элементы чеклиста для задач. Просмотр доступен всем пользователям, редактирование только админам и AM.';
