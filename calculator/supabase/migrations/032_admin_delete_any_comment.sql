-- ===========================================
-- ADMIN CAN DELETE ANY COMMENT
-- ===========================================

-- Удаляем старую политику удаления
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;

-- Новая политика: автор может удалять свои, админ — любые
CREATE POLICY "comments_delete"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "comments_delete" ON public.comments IS 'Authors can delete own comments, admins can delete any';
