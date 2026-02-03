-- ===========================================
-- UPDATE get_item_task_name FUNCTION WITH ALL ITEM IDs
-- ===========================================

-- Обновляем функцию get_item_task_name, чтобы она знала все item_id из калькулятора
CREATE OR REPLACE FUNCTION get_item_task_name(item_id TEXT)
RETURNS TEXT AS $$
DECLARE
  item_names JSONB := '{
    "sym_low": "Low Symbols",
    "sym_mid": "High Symbols", 
    "sym_spec": "Special Symbols (Wild/Bonus)",
    "bg_base_s": "Base BG (Simple)",
    "bg_base_d": "Base BG (Detailed)",
    "bg_bonus": "Bonus BG",
    "bg_bonus_s": "Bonus BG (Simple)",
    "bg_bonus_d": "Bonus BG (Detailed)",
    "pop_win_s": "Win Pop-up (Simple)",
    "pop_win_d": "Win Pop-up (Detailed)",
    "pop_start_s": "Start Pop-up (Simple)",
    "pop_start_d": "Start Pop-up (Detailed)",
    "pop_end_s": "End Pop-up (Simple)",
    "pop_end_d": "End Pop-up (Detailed)",
    "pop_extra_s": "Extra Pop-up (Simple)",
    "pop_extra_d": "Extra Pop-up (Detailed)",
    "pop_error_s": "Error Pop-up (Simple)",
    "pop_error_d": "Error Pop-up (Detailed)",
    "popup_base": "Base Pop-up",
    "popup_bonus": "Bonus Pop-up",
    "menu_buy_s": "Buy Menu (Simple)",
    "menu_buy_d": "Buy Menu (Detailed)",
    "menu_bet_s": "Bet Menu (Simple)",
    "menu_bet_d": "Bet Menu (Detailed)",
    "menu_auto_s": "Auto Menu (Simple)",
    "menu_auto_d": "Auto Menu (Detailed)",
    "ui_pack_s": "UI Pack (Simple)",
    "ui_pack_d": "UI Pack (Detailed)",
    "ui_menu": "UI Menu",
    "ui_button": "UI Button Set",
    "ui_frame": "UI Frame",
    "screen_load_s": "Loading Screen (Simple)",
    "screen_load_d": "Loading Screen (Detailed)",
    "screen_info_s": "Info Screen (Simple)",
    "screen_info_d": "Info Screen (Detailed)",
    "screen_intro_s": "Intro Screen (Simple)",
    "screen_intro_d": "Intro Screen (Detailed)",
    "promo_cover": "Promo Cover",
    "promo_banner": "Promo Banner",
    "promo_poster": "Promo Poster",
    "promo_teaser": "Static Promo Teaser",
    "promo_icons": "Store Icons Set",
    "marketing_banner": "Marketing Banner",
    "marketing_teaser": "Marketing Teaser"
  }'::JSONB;
BEGIN
  RETURN COALESCE(item_names->>item_id, item_id);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Комментарий
COMMENT ON FUNCTION get_item_task_name(TEXT) IS 'Возвращает название задачи для item_id из калькулятора. Если item_id не найден, возвращает сам item_id.';
