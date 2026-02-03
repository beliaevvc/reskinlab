-- ===========================================
-- COMMENT READS TRACKING
-- ===========================================
-- Отслеживание прочитанных комментариев пользователями

-- Таблица для отслеживания прочитанных комментариев
CREATE TABLE IF NOT EXISTS public.comment_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_reads_user ON public.comment_reads(user_id);
CREATE INDEX idx_comment_reads_comment ON public.comment_reads(comment_id);

-- RLS для comment_reads
ALTER TABLE public.comment_reads ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть и управлять только своими записями
CREATE POLICY "Users can view own comment reads"
  ON public.comment_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comment reads"
  ON public.comment_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment reads"
  ON public.comment_reads FOR DELETE
  USING (auth.uid() = user_id);

-- Функция для получения количества комментариев и непрочитанных для задачи
CREATE OR REPLACE FUNCTION get_task_comments_stats(p_task_id UUID, p_user_id UUID)
RETURNS TABLE(total_count BIGINT, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(c.id) as total_count,
    COUNT(c.id) FILTER (WHERE cr.id IS NULL AND c.author_id != p_user_id) as unread_count
  FROM public.comments c
  LEFT JOIN public.comment_reads cr ON cr.comment_id = c.id AND cr.user_id = p_user_id
  WHERE c.entity_type = 'task' AND c.entity_id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для отметки всех комментариев задачи как прочитанных
CREATE OR REPLACE FUNCTION mark_task_comments_as_read(p_task_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.comment_reads (user_id, comment_id)
  SELECT p_user_id, c.id
  FROM public.comments c
  WHERE c.entity_type = 'task' 
    AND c.entity_id = p_task_id
    AND c.author_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.comment_reads cr 
      WHERE cr.user_id = p_user_id AND cr.comment_id = c.id
    )
  ON CONFLICT (user_id, comment_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View для задач с подсчётом комментариев (для текущего пользователя)
CREATE OR REPLACE VIEW tasks_with_comments AS
SELECT 
  t.*,
  COALESCE(comment_stats.total_count, 0) as comments_count,
  COALESCE(comment_stats.unread_count, 0) as unread_comments_count
FROM public.tasks t
LEFT JOIN LATERAL (
  SELECT 
    COUNT(c.id) as total_count,
    COUNT(c.id) FILTER (WHERE cr.id IS NULL AND c.author_id != auth.uid()) as unread_count
  FROM public.comments c
  LEFT JOIN public.comment_reads cr ON cr.comment_id = c.id AND cr.user_id = auth.uid()
  WHERE c.entity_type = 'task' AND c.entity_id = t.id
) comment_stats ON true;

COMMENT ON TABLE public.comment_reads IS 'Отслеживание прочитанных комментариев пользователями';
COMMENT ON FUNCTION get_task_comments_stats IS 'Получить статистику комментариев для задачи';
COMMENT ON FUNCTION mark_task_comments_as_read IS 'Отметить все комментарии задачи как прочитанные';
