-- ===========================================
-- DEBUG VERSION: AUTO TASK CREATION
-- Используйте эту версию для отладки
-- ===========================================

-- Временная функция для проверки работы триггера
CREATE OR REPLACE FUNCTION test_auto_create_tasks(invoice_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  v_invoice RECORD;
  v_project_id UUID;
  v_offer_id UUID;
  v_spec_id UUID;
  v_spec_state JSONB;
  v_result TEXT := '';
BEGIN
  -- Получаем инвойс
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = invoice_id_param;
  
  IF NOT FOUND THEN
    RETURN 'Invoice not found';
  END IF;
  
  v_result := v_result || 'Invoice found: ' || v_invoice.number || E'\n';
  v_result := v_result || 'Status: ' || v_invoice.status || E'\n';
  v_result := v_result || 'Milestone order: ' || COALESCE(v_invoice.milestone_order::TEXT, 'NULL') || E'\n';
  
  v_project_id := v_invoice.project_id;
  v_offer_id := v_invoice.offer_id;
  
  -- Проверяем, что это первая оплата
  IF v_invoice.milestone_order IS NULL OR v_invoice.milestone_order != 1 THEN
    v_result := v_result || 'NOT first payment (milestone_order != 1)' || E'\n';
    RETURN v_result;
  END IF;
  
  -- Проверяем, что для проекта еще не было подтвержденных оплат
  IF EXISTS(
    SELECT 1 FROM public.invoices 
    WHERE project_id = v_project_id 
      AND status = 'paid' 
      AND id != v_invoice.id
  ) THEN
    v_result := v_result || 'Project already has paid invoices' || E'\n';
    RETURN v_result;
  END IF;
  
  -- Получаем specification_id из offer
  SELECT specification_id INTO v_spec_id
  FROM public.offers
  WHERE id = v_offer_id;
  
  IF NOT FOUND THEN
    v_result := v_result || 'Offer not found' || E'\n';
    RETURN v_result;
  END IF;
  
  v_result := v_result || 'Spec ID: ' || v_spec_id::TEXT || E'\n';
  
  -- Получаем state_json из спецификации
  SELECT state_json INTO v_spec_state
  FROM public.specifications
  WHERE id = v_spec_id;
  
  IF NOT FOUND OR v_spec_state IS NULL THEN
    v_result := v_result || 'Specification not found or state_json is null' || E'\n';
    RETURN v_result;
  END IF;
  
  v_result := v_result || 'Specification found' || E'\n';
  v_result := v_result || 'Items count: ' || jsonb_object_keys(v_spec_state->'items')::TEXT || E'\n';
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Использование:
-- SELECT test_auto_create_tasks('invoice-id-here');
