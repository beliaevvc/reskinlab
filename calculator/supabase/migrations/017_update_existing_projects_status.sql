-- ===========================================
-- UPDATE EXISTING PROJECTS STATUS
-- ===========================================

-- Обновляем статусы существующих проектов на основе их текущего состояния

-- 1. Проекты с задачами и активированным первым этапом (briefing) -> in_production
-- Это означает, что первая оплата была подтверждена и задачи созданы
UPDATE public.projects
SET 
  status = 'in_production',
  started_at = COALESCE(started_at, NOW()),
  updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT p.id
  FROM public.projects p
  INNER JOIN public.tasks t ON t.project_id = p.id
  INNER JOIN public.workflow_stages ws ON ws.project_id = p.id
  WHERE ws.stage_key = 'briefing'
    AND ws.status = 'in_progress'
    AND p.status NOT IN ('completed', 'cancelled', 'archived')
)
AND status NOT IN ('completed', 'cancelled', 'archived', 'in_production');

-- 2. Проекты с акцептированным оффером, но без задач -> active
-- Это означает, что оффер акцептирован, но оплата еще не подтверждена
UPDATE public.projects
SET 
  status = 'active',
  updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT p.id
  FROM public.projects p
  INNER JOIN public.specifications s ON s.project_id = p.id
  INNER JOIN public.offers o ON o.specification_id = s.id
  WHERE o.status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM public.tasks t WHERE t.project_id = p.id
    )
    AND p.status NOT IN ('completed', 'cancelled', 'archived', 'in_production')
)
AND status NOT IN ('completed', 'cancelled', 'archived', 'active', 'in_production');

-- 3. Логируем результат
DO $$
DECLARE
  v_in_production_count INT;
  v_active_count INT;
BEGIN
  -- Подсчитываем обновленные проекты
  SELECT COUNT(*) INTO v_in_production_count
  FROM public.projects
  WHERE status = 'in_production'
    AND updated_at >= NOW() - INTERVAL '1 minute';
  
  SELECT COUNT(*) INTO v_active_count
  FROM public.projects
  WHERE status = 'active'
    AND updated_at >= NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Projects status update completed:';
  RAISE NOTICE '  - Projects moved to in_production: %', v_in_production_count;
  RAISE NOTICE '  - Projects moved to active: %', v_active_count;
END $$;

-- Комментарий
COMMENT ON TABLE public.projects IS 'Статусы существующих проектов обновлены на основе их текущего состояния (задачи, этапы, офферы)';
