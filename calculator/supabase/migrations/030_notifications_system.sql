-- ===========================================
-- NOTIFICATIONS SYSTEM
-- ===========================================
-- Универсальная система уведомлений с поддержкой Realtime

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'comment', 'task_status', 'file_upload', 'mention', etc.
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT, -- 'task', 'project', 'comment', etc.
  entity_id UUID,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_project ON public.notifications(project_id);

-- RLS - простая политика: пользователь видит только свои уведомления
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Системная политика для создания уведомлений (через триггеры)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Включаем Realtime для таблицы notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ===========================================
-- ФУНКЦИЯ: Создание уведомления о новом комментарии
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_task RECORD;
  v_project RECORD;
  v_author RECORD;
  v_recipient_id UUID;
  v_comment_preview TEXT;
BEGIN
  -- Только для комментариев к задачам
  IF NEW.entity_type != 'task' THEN
    RETURN NEW;
  END IF;

  -- Получаем информацию о задаче
  SELECT t.*, p.id as project_id, p.name as project_name
  INTO v_task
  FROM public.tasks t
  JOIN public.projects p ON t.project_id = p.id
  WHERE t.id = NEW.entity_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Получаем автора комментария
  SELECT full_name INTO v_author
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Обрезаем комментарий для превью
  v_comment_preview := LEFT(NEW.content, 100);
  IF LENGTH(NEW.content) > 100 THEN
    v_comment_preview := v_comment_preview || '...';
  END IF;

  -- Создаём уведомления для админов и AM (кроме автора комментария)
  FOR v_recipient_id IN
    SELECT DISTINCT pm.user_id
    FROM public.project_members pm
    JOIN public.profiles prof ON pm.user_id = prof.id
    WHERE pm.project_id = v_task.project_id
      AND pm.user_id != NEW.author_id
      AND prof.role IN ('admin', 'account_manager')
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      entity_type,
      entity_id,
      project_id,
      metadata
    ) VALUES (
      v_recipient_id,
      'comment',
      v_author.full_name || ' commented on ' || v_task.title,
      v_comment_preview,
      'task',
      NEW.entity_id,
      v_task.project_id,
      jsonb_build_object(
        'comment_id', NEW.id,
        'task_id', NEW.entity_id,
        'task_title', v_task.title,
        'author_id', NEW.author_id,
        'author_name', v_author.full_name
      )
    );
  END LOOP;

  -- Если комментарий от админа/AM — уведомляем клиентов проекта
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = NEW.author_id AND role IN ('admin', 'account_manager')
  ) THEN
    FOR v_recipient_id IN
      SELECT DISTINCT pm.user_id
      FROM public.project_members pm
      JOIN public.profiles prof ON pm.user_id = prof.id
      WHERE pm.project_id = v_task.project_id
        AND pm.user_id != NEW.author_id
        AND prof.role = 'client'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        body,
        entity_type,
        entity_id,
        project_id,
        metadata
      ) VALUES (
        v_recipient_id,
        'comment',
        v_author.full_name || ' commented on ' || v_task.title,
        v_comment_preview,
        'task',
        NEW.entity_id,
        v_task.project_id,
        jsonb_build_object(
          'comment_id', NEW.id,
          'task_id', NEW.entity_id,
          'task_title', v_task.title,
          'author_id', NEW.author_id,
          'author_name', v_author.full_name
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание комментария
DROP TRIGGER IF EXISTS trigger_notify_on_new_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_comment();

-- ===========================================
-- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- ===========================================

-- Функция для отметки уведомления как прочитанного
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для отметки всех уведомлений как прочитанных
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE user_id = auth.uid() AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения количества непрочитанных уведомлений
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = auth.uid() AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.notifications IS 'Универсальная система уведомлений';
COMMENT ON FUNCTION notify_on_new_comment IS 'Триггер-функция для создания уведомлений о новых комментариях';
