-- ===========================================
-- CREATE ALL SPEC ITEM TEMPLATES FOR ALL CALCULATOR ITEMS
-- ===========================================

-- Создаем шаблоны для всех пунктов калькулятора автоматически
-- Используем функцию get_item_task_name для дефолтных названий

-- Функция для создания шаблона, если его еще нет
CREATE OR REPLACE FUNCTION create_spec_item_template_if_not_exists(
  p_item_id TEXT,
  p_task_title TEXT,
  p_task_description TEXT DEFAULT NULL,
  p_animation_task_title_template TEXT DEFAULT 'Анимация: {item_name} ({anim_name})',
  p_animation_task_description_template TEXT DEFAULT 'Задача по созданию анимации для {item_name}: {anim_name}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.task_spec_item_templates (
    item_id,
    task_title,
    task_description,
    animation_task_title_template,
    animation_task_description_template,
    checklist_items
  )
  SELECT 
    p_item_id,
    p_task_title,
    COALESCE(p_task_description, 'Задача по созданию ' || LOWER(p_task_title)),
    p_animation_task_title_template,
    p_animation_task_description_template,
    '[]'::JSONB
  WHERE NOT EXISTS (
    SELECT 1 FROM public.task_spec_item_templates WHERE item_id = p_item_id
  );
END;
$$ LANGUAGE plpgsql;

-- Создаем шаблоны для всех пунктов из калькулятора
-- Используем get_item_task_name для дефолтных названий

-- Символы (Symbols)
SELECT create_spec_item_template_if_not_exists('sym_low', get_item_task_name('sym_low'));
SELECT create_spec_item_template_if_not_exists('sym_mid', get_item_task_name('sym_mid'));
SELECT create_spec_item_template_if_not_exists('sym_spec', get_item_task_name('sym_spec'));

-- Фоны (Backgrounds)
SELECT create_spec_item_template_if_not_exists('bg_base_s', get_item_task_name('bg_base_s'));
SELECT create_spec_item_template_if_not_exists('bg_base_d', get_item_task_name('bg_base_d'));
SELECT create_spec_item_template_if_not_exists('bg_bonus_s', 'Bonus BG (Simple)');
SELECT create_spec_item_template_if_not_exists('bg_bonus_d', 'Bonus BG (Detailed)');

-- Попапы (Pop-ups)
SELECT create_spec_item_template_if_not_exists('pop_win_s', 'Win Pop-up (Simple)');
SELECT create_spec_item_template_if_not_exists('pop_win_d', 'Win Pop-up (Detailed)');
SELECT create_spec_item_template_if_not_exists('pop_start_s', 'Start Pop-up (Simple)');
SELECT create_spec_item_template_if_not_exists('pop_start_d', 'Start Pop-up (Detailed)');
SELECT create_spec_item_template_if_not_exists('pop_end_s', 'End Pop-up (Simple)');
SELECT create_spec_item_template_if_not_exists('pop_end_d', 'End Pop-up (Detailed)');
SELECT create_spec_item_template_if_not_exists('pop_extra_s', 'Extra Pop-up (Simple)');
SELECT create_spec_item_template_if_not_exists('pop_extra_d', 'Extra Pop-up (Detailed)');
SELECT create_spec_item_template_if_not_exists('pop_error_s', 'Error Pop-up (Simple)');
SELECT create_spec_item_template_if_not_exists('pop_error_d', 'Error Pop-up (Detailed)');

-- Меню (Menu)
SELECT create_spec_item_template_if_not_exists('menu_buy_s', 'Buy Menu (Simple)');
SELECT create_spec_item_template_if_not_exists('menu_buy_d', 'Buy Menu (Detailed)');
SELECT create_spec_item_template_if_not_exists('menu_bet_s', 'Bet Menu (Simple)');
SELECT create_spec_item_template_if_not_exists('menu_bet_d', 'Bet Menu (Detailed)');
SELECT create_spec_item_template_if_not_exists('menu_auto_s', 'Auto Menu (Simple)');
SELECT create_spec_item_template_if_not_exists('menu_auto_d', 'Auto Menu (Detailed)');

-- UI Pack
SELECT create_spec_item_template_if_not_exists('ui_pack_s', 'UI Pack (Simple)');
SELECT create_spec_item_template_if_not_exists('ui_pack_d', 'UI Pack (Detailed)');

-- Экраны (Screens)
SELECT create_spec_item_template_if_not_exists('screen_load_s', 'Loading Screen (Simple)');
SELECT create_spec_item_template_if_not_exists('screen_load_d', 'Loading Screen (Detailed)');
SELECT create_spec_item_template_if_not_exists('screen_info_s', 'Info Screen (Simple)');
SELECT create_spec_item_template_if_not_exists('screen_info_d', 'Info Screen (Detailed)');
SELECT create_spec_item_template_if_not_exists('screen_intro_s', 'Intro Screen (Simple)');
SELECT create_spec_item_template_if_not_exists('screen_intro_d', 'Intro Screen (Detailed)');

-- Промо материалы (Promo)
SELECT create_spec_item_template_if_not_exists('promo_cover', 'Promo Cover');
SELECT create_spec_item_template_if_not_exists('promo_banner', get_item_task_name('marketing_banner'));
SELECT create_spec_item_template_if_not_exists('promo_poster', 'Promo Poster');
SELECT create_spec_item_template_if_not_exists('promo_teaser', get_item_task_name('promo_teaser'));
SELECT create_spec_item_template_if_not_exists('promo_icons', get_item_task_name('promo_icons'));

-- Старые item_id для обратной совместимости (если они еще используются)
SELECT create_spec_item_template_if_not_exists('bg_bonus', get_item_task_name('bg_bonus'));
SELECT create_spec_item_template_if_not_exists('popup_base', get_item_task_name('popup_base'));
SELECT create_spec_item_template_if_not_exists('popup_bonus', get_item_task_name('popup_bonus'));
SELECT create_spec_item_template_if_not_exists('ui_menu', get_item_task_name('ui_menu'));
SELECT create_spec_item_template_if_not_exists('ui_button', get_item_task_name('ui_button'));
SELECT create_spec_item_template_if_not_exists('ui_frame', get_item_task_name('ui_frame'));
SELECT create_spec_item_template_if_not_exists('marketing_banner', get_item_task_name('marketing_banner'));
SELECT create_spec_item_template_if_not_exists('marketing_teaser', get_item_task_name('marketing_teaser'));

-- Удаляем временную функцию
DROP FUNCTION IF EXISTS create_spec_item_template_if_not_exists(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Комментарий
COMMENT ON TABLE public.task_spec_item_templates IS 'Шаблоны задач для всех пунктов калькулятора. Создаются автоматически при миграции для всех возможных item_id. Админ может редактировать их в настройках.';
