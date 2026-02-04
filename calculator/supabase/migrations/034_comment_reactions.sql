-- ===========================================
-- COMMENT REACTIONS (Discord-style)
-- ===========================================

-- Таблица реакций на комментарии
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Один пользователь может поставить только одну реакцию с определённым эмодзи
  UNIQUE(comment_id, user_id, emoji)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON public.comment_reactions(user_id);

-- RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Все могут видеть реакции
CREATE POLICY "Anyone can view reactions"
  ON public.comment_reactions FOR SELECT
  USING (true);

-- Авторизованные пользователи могут добавлять реакции
CREATE POLICY "Authenticated users can add reactions"
  ON public.comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои реакции
CREATE POLICY "Users can remove their own reactions"
  ON public.comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.comment_reactions IS 'Discord-style emoji reactions on comments';
