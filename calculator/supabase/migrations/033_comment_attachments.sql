-- ===========================================
-- COMMENT ATTACHMENTS
-- ===========================================
-- Добавляем поле для хранения ID прикреплённых файлов в комментариях

-- Добавляем поле attachments (массив UUID файлов)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS attachments UUID[] DEFAULT '{}';

-- Добавляем comment_id в project_files для обратной связи
ALTER TABLE public.project_files 
ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL;

-- Индекс для быстрого поиска файлов по комментарию
CREATE INDEX IF NOT EXISTS idx_project_files_comment ON public.project_files(comment_id);

COMMENT ON COLUMN public.comments.attachments IS 'Array of file IDs attached to this comment';
COMMENT ON COLUMN public.project_files.comment_id IS 'Comment this file is attached to (if any)';
