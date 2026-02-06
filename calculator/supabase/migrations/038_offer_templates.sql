-- ============================================
-- 038: Offer Templates System
-- Adds admin-managed offer templates with blocks, variables, and client assignments
-- ============================================

-- 1. offer_templates — шаблоны оферт
CREATE TABLE IF NOT EXISTS public.offer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  validity_days INTEGER NOT NULL DEFAULT 30,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. offer_template_blocks — блоки внутри шаблона
CREATE TABLE IF NOT EXISTS public.offer_template_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.offer_templates(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('heading', 'paragraph', 'list', 'separator', 'variable_block')),
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. offer_block_library — каталог переиспользуемых блоков
CREATE TABLE IF NOT EXISTS public.offer_block_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  block_type TEXT NOT NULL CHECK (block_type IN ('heading', 'paragraph', 'list', 'separator', 'variable_block')),
  content JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. offer_variables — определения переменных
CREATE TABLE IF NOT EXISTS public.offer_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  data_source TEXT NOT NULL CHECK (data_source IN ('client', 'project', 'specification', 'invoice', 'manual', 'computed')),
  data_path TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN ('text', 'number', 'date', 'currency', 'table')),
  format_options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. client_offer_assignments — привязка оферт к клиентам/проектам
CREATE TABLE IF NOT EXISTS public.client_offer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id),
  template_id UUID NOT NULL REFERENCES public.offer_templates(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, project_id)
);

-- 6. Add template_id to existing offers table (nullable for backwards compatibility)
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.offer_templates(id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_offer_template_blocks_template ON public.offer_template_blocks(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_offer_block_library_category ON public.offer_block_library(category);
CREATE INDEX IF NOT EXISTS idx_offer_variables_source ON public.offer_variables(data_source);
CREATE INDEX IF NOT EXISTS idx_client_offer_assignments_client ON public.client_offer_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_offer_assignments_template ON public.client_offer_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_offers_template ON public.offers(template_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- offer_templates: admin only for write, all authenticated can read
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_templates_select" ON public.offer_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "offer_templates_insert" ON public.offer_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_templates_update" ON public.offer_templates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_templates_delete" ON public.offer_templates
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- offer_template_blocks: admin only for write, all authenticated can read
ALTER TABLE public.offer_template_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_template_blocks_select" ON public.offer_template_blocks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "offer_template_blocks_insert" ON public.offer_template_blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_template_blocks_update" ON public.offer_template_blocks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_template_blocks_delete" ON public.offer_template_blocks
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- offer_block_library: admin only
ALTER TABLE public.offer_block_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_block_library_select" ON public.offer_block_library
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "offer_block_library_insert" ON public.offer_block_library
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_block_library_update" ON public.offer_block_library
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_block_library_delete" ON public.offer_block_library
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- offer_variables: admin only for write, all can read
ALTER TABLE public.offer_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_variables_select" ON public.offer_variables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "offer_variables_insert" ON public.offer_variables
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_variables_update" ON public.offer_variables
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "offer_variables_delete" ON public.offer_variables
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- client_offer_assignments: admin for write, client/am can read own
ALTER TABLE public.client_offer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_offer_assignments_select" ON public.client_offer_assignments
  FOR SELECT TO authenticated USING (
    client_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'am'))
  );

CREATE POLICY "client_offer_assignments_insert" ON public.client_offer_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "client_offer_assignments_update" ON public.client_offer_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "client_offer_assignments_delete" ON public.client_offer_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- SEED DATA: Standard variables
-- ============================================
INSERT INTO public.offer_variables (key, label, description, data_source, data_path, value_type, format_options) VALUES
  ('client_name', 'Имя клиента', 'Название компании клиента', 'client', 'company_name', 'text', NULL),
  ('client_contact', 'Контактное лицо', 'ФИО контактного лица клиента', 'client', 'profile.full_name', 'text', NULL),
  ('project_name', 'Название проекта', 'Название проекта', 'project', 'name', 'text', NULL),
  ('grand_total', 'Общая стоимость', 'Итоговая сумма по спецификации', 'specification', 'totals_json.grandTotal', 'currency', '{"locale": "en-US", "currency": "USD"}'),
  ('currency', 'Валюта', 'Валюта оплаты', 'manual', NULL, 'text', '{"default": "USDT"}'),
  ('valid_until', 'Действительна до', 'Дата окончания срока действия оферты', 'computed', NULL, 'date', '{"locale": "ru-RU"}'),
  ('spec_items', 'Позиции спецификации', 'Таблица позиций из спецификации', 'specification', 'state_json', 'table', NULL),
  ('payment_schedule', 'График платежей', 'Этапы оплаты с суммами', 'invoice', NULL, 'table', NULL),
  ('terms_version', 'Версия условий', 'Номер версии текущих условий', 'manual', NULL, 'text', '{"default": "1.0"}'),
  ('publish_date', 'Дата публикации', 'Дата создания оферты', 'computed', NULL, 'date', '{"locale": "ru-RU"}'),
  ('prepayment_amount', 'Сумма предоплаты', '50% от общей стоимости', 'computed', NULL, 'currency', '{"locale": "en-US", "currency": "USD", "formula": "grand_total * 0.5"}'),
  ('production_payment', 'Платёж за производство', '25% от общей стоимости', 'computed', NULL, 'currency', '{"locale": "en-US", "currency": "USD", "formula": "grand_total * 0.25"}'),
  ('final_payment', 'Финальный платёж', '25% от общей стоимости', 'computed', NULL, 'currency', '{"locale": "en-US", "currency": "USD", "formula": "grand_total * 0.25"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SEED DATA: Default offer template (from existing hardcoded text)
-- ============================================
DO $$
DECLARE
  template_id UUID;
BEGIN
  -- Create default template
  INSERT INTO public.offer_templates (name, description, is_active, terms_version, validity_days)
  VALUES ('Стандартная оферта', 'Базовый шаблон оферты на оказание услуг по созданию визуального контента', true, '1.0', 30)
  RETURNING id INTO template_id;

  -- Block 1: Title
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'heading', '{"text": "ОФЕРТА НА ОКАЗАНИЕ УСЛУГ ПО СОЗДАНИЮ ВИЗУАЛЬНОГО КОНТЕНТА"}', 0, false, 'Заголовок');

  -- Block 2: Subject
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'paragraph', '{"text": "1. ПРЕДМЕТ ОФЕРТЫ\n\nИсполнитель (ReSkin Lab, далее — «Студия») настоящим предлагает Заказчику (далее — «Клиент») заключить договор на оказание услуг по созданию визуальных материалов в соответствии с прилагаемой Спецификацией.\n\nСпецификация является неотъемлемой частью настоящей оферты и содержит детальное описание объёма работ, включая:\n• Перечень создаваемых визуальных элементов\n• Выбранный стиль оформления\n• Условия использования (лицензия)\n• Количество включённых раундов правок"}', 1, false, 'Предмет оферты');

  -- Block 3: Cost and payment
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'variable_block', '{"text": "2. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ\n\nОбщая стоимость услуг: {{grand_total}}\n\nОплата производится в криптовалюте USDT (Tether) на кошелёк Студии.\nПоддерживаемые сети: TRC20 (Tron) или ERC20 (Ethereum).\n\nГрафик платежей:\n• 50% — предоплата (до начала работ)\n• 25% — по завершении этапа производства\n• 25% — финальный платёж (перед передачей материалов)\n\nПримечание: Конкретные суммы и сроки платежей указаны в выставленных инвойсах."}', 2, false, 'Стоимость и оплата');

  -- Block 4: Deadlines
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'variable_block', '{"text": "3. СРОКИ ВЫПОЛНЕНИЯ\n\nСроки выполнения работ зависят от объёма проекта и текущей загрузки Студии.\nОриентировочные сроки будут согласованы после получения предоплаты.\n\nОферта действительна до: {{valid_until}}\n\nПосле истечения срока действия оферты Студия оставляет за собой право пересмотреть условия и стоимость работ."}', 3, false, 'Сроки выполнения');

  -- Block 5: Acceptance
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'paragraph', '{"text": "4. АКЦЕПТ ОФЕРТЫ\n\nАкцепт (принятие) настоящей оферты осуществляется Клиентом путём:\n1. Ознакомления с полным текстом оферты и Спецификации\n2. Подтверждения согласия с условиями (нажатие кнопки «Принять оферту»)\n3. Внесения предоплаты согласно выставленному инвойсу\n\nМомент акцепта фиксируется в системе с сохранением:\n• Даты и времени акцепта\n• IP-адреса Клиента\n• Идентификатора браузера\n• Полной копии условий оферты"}', 4, false, 'Акцепт оферты');

  -- Block 6: Intellectual property
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'paragraph', '{"text": "5. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ\n\n5.1. Все создаваемые материалы являются объектами интеллектуальной собственности.\n\n5.2. Права на использование передаются Клиенту в соответствии с выбранной лицензией, указанной в Спецификации, после полной оплаты.\n\n5.3. До момента полной оплаты все права на материалы принадлежат Студии.\n\n5.4. Студия сохраняет право использовать созданные материалы в портфолио и маркетинговых целях, если иное не оговорено отдельно."}', 5, false, 'Интеллектуальная собственность');

  -- Block 7: Revisions
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'paragraph', '{"text": "6. ПРАВКИ И ИЗМЕНЕНИЯ\n\n6.1. Количество раундов правок, включённых в стоимость, указано в Спецификации.\n\n6.2. Дополнительные правки сверх включённых оплачиваются отдельно по согласованным тарифам.\n\n6.3. Существенные изменения в объёме или концепции проекта после начала работ могут потребовать пересмотра стоимости и сроков."}', 6, true, 'Правки и изменения');

  -- Block 8: Disputes
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'paragraph', '{"text": "7. РАЗРЕШЕНИЕ СПОРОВ\n\n7.1. Стороны обязуются решать все возникающие разногласия путём переговоров.\n\n7.2. При невозможности достичь согласия споры подлежат разрешению в соответствии с применимым законодательством."}', 7, true, 'Разрешение споров');

  -- Block 9: Other conditions
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'paragraph', '{"text": "8. ПРОЧИЕ УСЛОВИЯ\n\n8.1. Настоящая оферта является публичной и адресована неопределённому кругу лиц.\n\n8.2. Клиент подтверждает, что ознакомлен со всеми условиями оферты, понимает их и принимает в полном объёме.\n\n8.3. Студия оставляет за собой право вносить изменения в типовые условия оферты. Принятые офферты сохраняют свои условия на момент акцепта."}', 8, false, 'Прочие условия');

  -- Block 10: Footer
  INSERT INTO public.offer_template_blocks (template_id, block_type, content, sort_order, is_optional, label)
  VALUES (template_id, 'variable_block', '{"text": "Версия условий: {{terms_version}}\nДата публикации: {{publish_date}}\n\n© ReSkin Lab — Premium Visual Content Studio"}', 9, false, 'Подвал');

END $$;

-- ============================================
-- SEED DATA: Block library with reusable blocks
-- ============================================
INSERT INTO public.offer_block_library (name, category, block_type, content) VALUES
  ('Конфиденциальность', 'legal', 'paragraph', '{"text": "КОНФИДЕНЦИАЛЬНОСТЬ\n\nСтороны обязуются не разглашать конфиденциальную информацию, полученную в ходе сотрудничества, третьим лицам без предварительного письменного согласия другой стороны.\n\nК конфиденциальной информации относятся:\n• Финансовые условия договора\n• Исходные материалы заказчика\n• Незавершённые работы\n• Внутренние процессы и методологии"}'),
  ('Форс-мажор', 'legal', 'paragraph', '{"text": "ФОРС-МАЖОР\n\nСтороны освобождаются от ответственности за неисполнение обязательств, если оно вызвано обстоятельствами непреодолимой силы (форс-мажор).\n\nК форс-мажорным обстоятельствам относятся: стихийные бедствия, военные действия, эпидемии, решения государственных органов и иные обстоятельства, которые стороны не могли предвидеть и предотвратить."}'),
  ('Гарантии качества', 'legal', 'paragraph', '{"text": "ГАРАНТИИ КАЧЕСТВА\n\nСтудия гарантирует:\n• Соответствие результата работ утверждённой Спецификации\n• Оригинальность создаваемых материалов\n• Отсутствие нарушений прав третьих лиц\n• Техническое качество файлов для указанных целей использования\n\nГарантийный срок составляет 30 дней с момента передачи финальных материалов."}'),
  ('Условия оплаты крипто', 'financial', 'variable_block', '{"text": "УСЛОВИЯ ОПЛАТЫ\n\nОбщая стоимость: {{grand_total}}\nВалюта: USDT (Tether)\nПоддерживаемые сети: TRC20, ERC20\n\nГрафик:\n• Предоплата 50%: {{prepayment_amount}}\n• Этап производства 25%: {{production_payment}}\n• Финальный платёж 25%: {{final_payment}}"}'),
  ('Стандартный разделитель', 'general', 'separator', '{"text": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"}')
ON CONFLICT DO NOTHING;
