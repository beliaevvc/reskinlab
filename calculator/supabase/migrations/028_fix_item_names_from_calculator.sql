-- ===========================================
-- FIX ITEM NAMES TO MATCH CALCULATOR (categories.js)
-- ===========================================
-- Эта миграция синхронизирует названия item_id с калькулятором

-- Шаг 1: Обновляем функцию get_item_task_name с ПРАВИЛЬНЫМИ названиями из калькулятора
CREATE OR REPLACE FUNCTION get_item_task_name(item_id TEXT)
RETURNS TEXT AS $$
DECLARE
  item_names JSONB := '{
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

COMMENT ON FUNCTION get_item_task_name(TEXT) IS 'Возвращает название задачи для item_id из калькулятора (синхронизировано с categories.js).';

-- Шаг 2: Создаем маппинг старых названий на новые для обновления задач
-- Это нужно чтобы заменить старые названия в существующих задачах
DO $$
DECLARE
  name_mapping JSONB := '{
    "Win Pop-up (Simple)": "Big Win (Simple)",
    "Win Pop-up (Detailed)": "Big Win (Illustrated)",
    "Start Pop-up (Simple)": "Bonus Start (Simple)",
    "Start Pop-up (Detailed)": "Bonus Start (Illustrated)",
    "End Pop-up (Simple)": "Bonus End (Simple)",
    "End Pop-up (Detailed)": "Bonus End (Illustrated)",
    "Extra Pop-up (Simple)": "Extra Spins (Simple)",
    "Extra Pop-up (Detailed)": "Extra Spins (Illustrated)",
    "Error Pop-up (Simple)": "Error/Warning (Simple)",
    "Error Pop-up (Detailed)": "Error/Warning (Illustrated)",
    "Buy Menu (Simple)": "Bonus Buy Menu (Simple)",
    "Buy Menu (Detailed)": "Bonus Buy Menu (Detailed)",
    "Bet Menu (Simple)": "Bet Selection (Simple)",
    "Bet Menu (Detailed)": "Bet Selection (Detailed)",
    "Auto Menu (Simple)": "Autoplay Menu (Simple)",
    "Auto Menu (Detailed)": "Autoplay Menu (Detailed)",
    "UI Pack (Simple)": "UI Buttons Pack (Simple)",
    "UI Pack (Detailed)": "UI Buttons Pack (Detailed)",
    "Info Screen (Simple)": "Info/Guide Screen (Simple)",
    "Info Screen (Detailed)": "Info/Guide Screen (Detailed)",
    "Intro Screen (Simple)": "Onboarding (Simple)",
    "Intro Screen (Detailed)": "Onboarding (Detailed)",
    "Promo Cover": "Slot Cover (A/B Pack)",
    "Promo Banner": "Promo Banner Pack",
    "Promo Poster": "Feature Poster / Key Art",
    "Base Pop-up": "Big Win (Simple)",
    "Bonus Pop-up": "Big Win (Illustrated)"
  }'::JSONB;
  old_name TEXT;
  new_name TEXT;
BEGIN
  -- Обновляем шаблоны
  FOR old_name, new_name IN SELECT * FROM jsonb_each_text(name_mapping) LOOP
    UPDATE public.task_spec_item_templates
    SET 
      task_title = new_name,
      updated_at = now()
    WHERE task_title = old_name;
    
    IF FOUND THEN
      RAISE NOTICE 'Updated template: % -> %', old_name, new_name;
    END IF;
  END LOOP;
  
  -- Обновляем задачи - заменяем старые названия на новые
  FOR old_name, new_name IN SELECT * FROM jsonb_each_text(name_mapping) LOOP
    UPDATE public.tasks
    SET 
      title = REPLACE(title, old_name, new_name),
      updated_at = now()
    WHERE title LIKE '%' || old_name || '%';
    
    IF FOUND THEN
      RAISE NOTICE 'Updated tasks with: % -> %', old_name, new_name;
    END IF;
  END LOOP;
END $$;

-- Шаг 3: Обновляем шаблоны, где task_title равен item_id (сырому идентификатору)
UPDATE public.task_spec_item_templates
SET 
  task_title = get_item_task_name(item_id),
  task_description = 'Задача по созданию ' || LOWER(get_item_task_name(item_id)) || ' в количестве {qty} шт.',
  updated_at = now()
WHERE task_title = item_id
  AND get_item_task_name(item_id) != item_id;

-- Шаг 4: Обновляем задачи, где в названии содержится сырой item_id
UPDATE public.tasks t
SET 
  title = REPLACE(
    t.title,
    t.spec_item_id,
    get_item_task_name(t.spec_item_id)
  ),
  updated_at = now()
WHERE t.spec_item_id IS NOT NULL
  AND t.title LIKE '%' || t.spec_item_id || '%'
  AND get_item_task_name(t.spec_item_id) != t.spec_item_id;

-- Шаг 5: Выводим статистику
DO $$
DECLARE
  templates_count INT;
  tasks_count INT;
BEGIN
  SELECT COUNT(*) INTO templates_count FROM public.task_spec_item_templates;
  SELECT COUNT(*) INTO tasks_count FROM public.tasks WHERE spec_item_id IS NOT NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration completed!';
  RAISE NOTICE 'Total templates: %', templates_count;
  RAISE NOTICE 'Total spec tasks: %', tasks_count;
  RAISE NOTICE '===========================================';
END $$;
