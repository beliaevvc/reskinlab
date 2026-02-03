-- ===========================================
-- FIX NOTIFICATIONS TRIGGER
-- ===========================================
-- Исправление триггера под реальную структуру БД

-- Удаляем старую функцию и триггер
DROP TRIGGER IF EXISTS trigger_notify_on_new_comment ON public.comments;
DROP FUNCTION IF EXISTS notify_on_new_comment();

-- ===========================================
-- НОВАЯ ФУНКЦИЯ: Создание уведомления о новом комментарии
-- ===========================================
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_task RECORD;
  v_project RECORD;
  v_author RECORD;
  v_client_user_id UUID;
  v_comment_preview TEXT;
BEGIN
  -- Только для комментариев к задачам
  IF NEW.entity_type != 'task' THEN
    RETURN NEW;
  END IF;

  -- Получаем информацию о задаче и проекте
  SELECT 
    t.id as task_id,
    t.title as task_title,
    t.project_id,
    p.name as project_name,
    p.client_id,
    p.am_id,
    c.user_id as client_user_id
  INTO v_task
  FROM public.tasks t
  JOIN public.projects p ON t.project_id = p.id
  JOIN public.clients c ON p.client_id = c.id
  WHERE t.id = NEW.entity_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Получаем автора комментария
  SELECT id, full_name, role INTO v_author
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Обрезаем комментарий для превью
  v_comment_preview := LEFT(NEW.content, 100);
  IF LENGTH(NEW.content) > 100 THEN
    v_comment_preview := v_comment_preview || '...';
  END IF;

  -- Логика уведомлений:
  -- Если комментарий от клиента -> уведомляем админов и AM
  -- Если комментарий от админа/AM -> уведомляем клиента

  IF v_author.role = 'client' THEN
    -- Уведомляем всех админов
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, project_id, metadata)
    SELECT 
      prof.id,
      'comment',
      COALESCE(v_author.full_name, 'Client') || ' commented on ' || v_task.task_title,
      v_comment_preview,
      'task',
      NEW.entity_id,
      v_task.project_id,
      jsonb_build_object(
        'comment_id', NEW.id,
        'task_id', NEW.entity_id,
        'task_title', v_task.task_title,
        'author_id', NEW.author_id,
        'author_name', v_author.full_name
      )
    FROM public.profiles prof
    WHERE prof.role = 'admin' AND prof.id != NEW.author_id;

    -- Уведомляем AM проекта (если есть и это не автор)
    IF v_task.am_id IS NOT NULL AND v_task.am_id != NEW.author_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, project_id, metadata)
      VALUES (
        v_task.am_id,
        'comment',
        COALESCE(v_author.full_name, 'Client') || ' commented on ' || v_task.task_title,
        v_comment_preview,
        'task',
        NEW.entity_id,
        v_task.project_id,
        jsonb_build_object(
          'comment_id', NEW.id,
          'task_id', NEW.entity_id,
          'task_title', v_task.task_title,
          'author_id', NEW.author_id,
          'author_name', v_author.full_name
        )
      );
    END IF;

  ELSE
    -- Комментарий от админа или AM -> уведомляем клиента
    IF v_task.client_user_id IS NOT NULL AND v_task.client_user_id != NEW.author_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, project_id, metadata)
      VALUES (
        v_task.client_user_id,
        'comment',
        COALESCE(v_author.full_name, 'Team') || ' replied on ' || v_task.task_title,
        v_comment_preview,
        'task',
        NEW.entity_id,
        v_task.project_id,
        jsonb_build_object(
          'comment_id', NEW.id,
          'task_id', NEW.entity_id,
          'task_title', v_task.task_title,
          'author_id', NEW.author_id,
          'author_name', v_author.full_name
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Логируем ошибку, но не блокируем создание комментария
    RAISE WARNING 'notify_on_new_comment failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаём триггер заново
CREATE TRIGGER trigger_notify_on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_comment();

COMMENT ON FUNCTION notify_on_new_comment IS 'Создаёт уведомления при новых комментариях (исправленная версия)';
