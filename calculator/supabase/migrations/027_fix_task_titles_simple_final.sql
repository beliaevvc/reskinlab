-- ===========================================
-- FIX TASK TITLES - SIMPLE FINAL VERSION
-- ===========================================
-- Самая простая и надежная версия миграции

-- Шаг 1: Исправляем шаблоны
UPDATE public.task_spec_item_templates
SET 
  task_title = get_item_task_name(item_id),
  updated_at = now()
WHERE task_title = item_id
  AND get_item_task_name(item_id) != item_id;

-- Шаг 2: Исправляем ВСЕ задачи, где в названии есть item_id
-- Просто заменяем item_id на нормальное название из шаблона или функции
UPDATE public.tasks t
SET 
  title = REPLACE(
    t.title,
    t.spec_item_id,
    COALESCE(
      (SELECT task_title FROM public.task_spec_item_templates WHERE item_id = t.spec_item_id),
      get_item_task_name(t.spec_item_id)
    )
  ),
  updated_at = now()
WHERE t.spec_item_id IS NOT NULL
  AND POSITION(t.spec_item_id IN t.title) > 0
  AND get_item_task_name(t.spec_item_id) != t.spec_item_id;
