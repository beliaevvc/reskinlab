-- ===========================================
-- CONCEPT DOCUMENT — TASK TEMPLATE & ITEM NAME
-- ===========================================
-- Добавляем concept_doc в get_item_task_name() и создаём шаблон задачи

-- Шаг 1: Обновляем функцию get_item_task_name — добавляем concept_doc
CREATE OR REPLACE FUNCTION get_item_task_name(item_id TEXT)
RETURNS TEXT AS $$
DECLARE
  item_names JSONB := '{
    "concept_doc": "Concept Document",
    "sym_low": "Low Symbols",
    "sym_mid": "High Symbols", 
    "sym_spec": "Special Symbols (Wild/Bonus)",
    "bg_base_s": "Base BG (Simple)",
    "bg_base_d": "Base BG (Detailed)",
    "bg_bonus_s": "Bonus BG (Simple)",
    "bg_bonus_d": "Bonus BG (Detailed)",
    "pop_win_s": "Big Win (Simple)",
    "pop_win_d": "Big Win (Illustrated)",
    "pop_start_s": "Bonus Start (Simple)",
    "pop_start_d": "Bonus Start (Illustrated)",
    "pop_end_s": "Bonus End (Simple)",
    "pop_end_d": "Bonus End (Illustrated)",
    "pop_extra_s": "Extra Spins (Simple)",
    "pop_extra_d": "Extra Spins (Illustrated)",
    "pop_error_s": "Error/Warning (Simple)",
    "pop_error_d": "Error/Warning (Illustrated)",
    "menu_buy_s": "Bonus Buy Menu (Simple)",
    "menu_buy_d": "Bonus Buy Menu (Detailed)",
    "menu_bet_s": "Bet Selection (Simple)",
    "menu_bet_d": "Bet Selection (Detailed)",
    "menu_auto_s": "Autoplay Menu (Simple)",
    "menu_auto_d": "Autoplay Menu (Detailed)",
    "ui_pack_s": "UI Buttons Pack (Simple)",
    "ui_pack_d": "UI Buttons Pack (Detailed)",
    "screen_load_s": "Loading Screen (Simple)",
    "screen_load_d": "Loading Screen (Detailed)",
    "screen_info_s": "Info/Guide Screen (Simple)",
    "screen_info_d": "Info/Guide Screen (Detailed)",
    "screen_intro_s": "Onboarding (Simple)",
    "screen_intro_d": "Onboarding (Detailed)",
    "promo_cover": "Slot Cover (A/B Pack)",
    "promo_banner": "Promo Banner Pack",
    "promo_poster": "Feature Poster / Key Art",
    "promo_teaser": "Static Promo Teaser",
    "promo_icons": "Store Icons Set"
  }'::JSONB;
BEGIN
  RETURN COALESCE(item_names->>item_id, item_id);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Шаг 2: Создаём шаблон задачи для concept_doc с описанием и чеклистом
INSERT INTO public.task_spec_item_templates (
  item_id,
  task_title,
  task_description,
  animation_task_title_template,
  animation_task_description_template,
  checklist_items
)
SELECT
  'concept_doc',
  'Concept Document',
  'Создание полного концепт-документа проекта: тематическая концепция, мудборд, палитра, эскизы ключевых элементов, арт-дирекшн.',
  NULL,
  NULL,
  '[
    {"title": "Сбор референсов и анализ ТЗ", "order": 0},
    {"title": "Мудборд (20+ тематических референсов с аннотациями)", "order": 1},
    {"title": "Цветовая палитра (5–7 основных оттенков)", "order": 2},
    {"title": "Стилистические пробы (2–3 варианта ключевого символа)", "order": 3},
    {"title": "Эскизы символов (Low, High, Special)", "order": 4},
    {"title": "Эскиз базового фона", "order": 5},
    {"title": "Стилевые пробы UI-элементов", "order": 6},
    {"title": "Текстовое описание арт-направления", "order": 7},
    {"title": "Обсуждение и корректировки с клиентом", "order": 8},
    {"title": "Финальный документ (PDF/Figma)", "order": 9}
  ]'::JSONB
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_spec_item_templates WHERE item_id = 'concept_doc'
);

-- Шаг 3: Если шаблон уже существует (создан через ensure_spec_item_template_exists),
-- обновляем его с правильным описанием и чеклистом
UPDATE public.task_spec_item_templates
SET
  task_title = 'Concept Document',
  task_description = 'Создание полного концепт-документа проекта: тематическая концепция, мудборд, палитра, эскизы ключевых элементов, арт-дирекшн.',
  animation_task_title_template = NULL,
  animation_task_description_template = NULL,
  checklist_items = CASE
    WHEN checklist_items IS NULL OR checklist_items = '[]'::JSONB THEN
      '[
        {"title": "Сбор референсов и анализ ТЗ", "order": 0},
        {"title": "Мудборд (20+ тематических референсов с аннотациями)", "order": 1},
        {"title": "Цветовая палитра (5–7 основных оттенков)", "order": 2},
        {"title": "Стилистические пробы (2–3 варианта ключевого символа)", "order": 3},
        {"title": "Эскизы символов (Low, High, Special)", "order": 4},
        {"title": "Эскиз базового фона", "order": 5},
        {"title": "Стилевые пробы UI-элементов", "order": 6},
        {"title": "Текстовое описание арт-направления", "order": 7},
        {"title": "Обсуждение и корректировки с клиентом", "order": 8},
        {"title": "Финальный документ (PDF/Figma)", "order": 9}
      ]'::JSONB
    ELSE checklist_items
  END,
  updated_at = NOW()
WHERE item_id = 'concept_doc'
  AND (task_title = 'concept_doc' OR task_description IS NULL OR checklist_items = '[]'::JSONB);
