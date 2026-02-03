-- ===========================================
-- ACTIVATE BRIEFING STAGE FOR EXISTING PROJECTS
-- ===========================================

-- Активируем этап Briefing для всех проектов, где есть задачи, но этап еще не активирован
UPDATE public.workflow_stages
SET 
  status = 'in_progress',
  started_at = COALESCE(started_at, NOW())
WHERE 
  stage_key = 'briefing'
  AND status = 'pending'
  AND project_id IN (
    -- Находим проекты, где есть задачи
    SELECT DISTINCT project_id 
    FROM public.tasks
  );

-- Если этап Briefing не существует для проекта с задачами, создаем его и активируем
INSERT INTO public.workflow_stages (
  project_id,
  stage_key,
  name,
  description,
  "order",
  status,
  started_at
)
SELECT DISTINCT
  t.project_id,
  'briefing',
  'Briefing',
  'Requirements gathering, references, source game analysis',
  1,
  'in_progress',
  NOW()
FROM public.tasks t
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.workflow_stages ws
  WHERE ws.project_id = t.project_id 
    AND ws.stage_key = 'briefing'
)
ON CONFLICT (project_id, stage_key) DO NOTHING;

-- Логируем результат
DO $$
DECLARE
  v_updated_count INT;
  v_created_count INT;
BEGIN
  -- Подсчитываем обновленные этапы
  SELECT COUNT(*) INTO v_updated_count
  FROM public.workflow_stages
  WHERE stage_key = 'briefing'
    AND status = 'in_progress'
    AND started_at >= NOW() - INTERVAL '1 minute';
  
  -- Подсчитываем созданные этапы (те, что были созданы в этой миграции)
  -- Это приблизительная оценка, так как точный подсчет требует временных меток
  SELECT COUNT(*) INTO v_created_count
  FROM public.workflow_stages ws
  WHERE ws.stage_key = 'briefing'
    AND ws.status = 'in_progress'
    AND ws.started_at >= NOW() - INTERVAL '1 minute'
    AND EXISTS (
      SELECT 1 FROM public.tasks t 
      WHERE t.project_id = ws.project_id
    );
  
  RAISE NOTICE 'Briefing stage activation completed. Check logs for details.';
END $$;

-- Комментарий
COMMENT ON TABLE public.workflow_stages IS 'Этап Briefing активирован для всех существующих проектов с задачами';
