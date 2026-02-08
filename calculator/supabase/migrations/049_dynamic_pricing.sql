-- =============================================
-- 049: DYNAMIC PRICING — Single source of truth for calculator prices
-- =============================================
-- Previously, calculator used hardcoded local JS values and price_configs
-- were only displayed in admin panel (disconnected). This migration:
-- 1) Reseeds price_configs with EXACT values matching local calculator data
-- 2) Creates get_public_pricing() RPC for anonymous access (public calculator)
-- 3) GRANTs anon role access to the RPC function
-- =============================================

-- Step 1: Preserve Minimum Order settings, clear everything else
DELETE FROM price_configs WHERE category != 'Minimum Order';

-- =============================================
-- CONCEPT DOCUMENT
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Concept Document', 'concept_doc_base', 1000, 'Concept Document base price', 'item_price', '{"item_id": "concept_doc"}'),
('Concept Document', 'concept_doc_surcharge_percent', 0.01, 'Surcharge as % of other items total (1%)', 'surcharge', '{"item_id": "concept_doc"}');

-- =============================================
-- SYMBOLS — Base Prices & Complexity
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Symbols', 'sym_low_base', 150, 'Low Symbols base price', 'item_price', '{"item_id": "sym_low"}'),
('Symbols', 'sym_low_complexity', 0.8, 'Low Symbols complexity coefficient', 'complexity', '{"item_id": "sym_low"}'),
('Symbols', 'sym_mid_base', 250, 'High Symbols base price', 'item_price', '{"item_id": "sym_mid"}'),
('Symbols', 'sym_mid_complexity', 1.0, 'High Symbols complexity coefficient', 'complexity', '{"item_id": "sym_mid"}'),
('Symbols', 'sym_spec_base', 400, 'Special Symbols (Wild/Bonus) base price', 'item_price', '{"item_id": "sym_spec"}'),
('Symbols', 'sym_spec_complexity', 1.1, 'Special Symbols complexity coefficient', 'complexity', '{"item_id": "sym_spec"}');

-- =============================================
-- BACKGROUNDS — Base Prices & Complexity
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Backgrounds', 'bg_base_s_base', 700, 'Base BG (Simple) base price', 'item_price', '{"item_id": "bg_base_s"}'),
('Backgrounds', 'bg_base_s_complexity', 1.1, 'Base BG (Simple) complexity', 'complexity', '{"item_id": "bg_base_s"}'),
('Backgrounds', 'bg_base_d_base', 1200, 'Base BG (Detailed) base price', 'item_price', '{"item_id": "bg_base_d"}'),
('Backgrounds', 'bg_base_d_complexity', 1.3, 'Base BG (Detailed) complexity', 'complexity', '{"item_id": "bg_base_d"}'),
('Backgrounds', 'bg_bonus_s_base', 500, 'Bonus BG (Simple) base price', 'item_price', '{"item_id": "bg_bonus_s"}'),
('Backgrounds', 'bg_bonus_s_complexity', 1.2, 'Bonus BG (Simple) complexity', 'complexity', '{"item_id": "bg_bonus_s"}'),
('Backgrounds', 'bg_bonus_d_base', 800, 'Bonus BG (Detailed) base price', 'item_price', '{"item_id": "bg_bonus_d"}'),
('Backgrounds', 'bg_bonus_d_complexity', 1.4, 'Bonus BG (Detailed) complexity', 'complexity', '{"item_id": "bg_bonus_d"}');

-- =============================================
-- POP-UPS — Base Prices & Complexity
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Pop-ups', 'pop_win_s_base', 500, 'Big Win (Simple) base price', 'item_price', '{"item_id": "pop_win_s"}'),
('Pop-ups', 'pop_win_s_complexity', 1.0, 'Big Win (Simple) complexity', 'complexity', '{"item_id": "pop_win_s"}'),
('Pop-ups', 'pop_win_d_base', 400, 'Big Win (Illustrated) base price', 'item_price', '{"item_id": "pop_win_d"}'),
('Pop-ups', 'pop_win_d_complexity', 1.2, 'Big Win (Illustrated) complexity', 'complexity', '{"item_id": "pop_win_d"}'),
('Pop-ups', 'pop_start_s_base', 300, 'Bonus Start (Simple) base price', 'item_price', '{"item_id": "pop_start_s"}'),
('Pop-ups', 'pop_start_s_complexity', 1.0, 'Bonus Start (Simple) complexity', 'complexity', '{"item_id": "pop_start_s"}'),
('Pop-ups', 'pop_start_d_base', 500, 'Bonus Start (Illustrated) base price', 'item_price', '{"item_id": "pop_start_d"}'),
('Pop-ups', 'pop_start_d_complexity', 1.2, 'Bonus Start (Illustrated) complexity', 'complexity', '{"item_id": "pop_start_d"}'),
('Pop-ups', 'pop_end_s_base', 300, 'Bonus End (Simple) base price', 'item_price', '{"item_id": "pop_end_s"}'),
('Pop-ups', 'pop_end_s_complexity', 1.0, 'Bonus End (Simple) complexity', 'complexity', '{"item_id": "pop_end_s"}'),
('Pop-ups', 'pop_end_d_base', 500, 'Bonus End (Illustrated) base price', 'item_price', '{"item_id": "pop_end_d"}'),
('Pop-ups', 'pop_end_d_complexity', 1.2, 'Bonus End (Illustrated) complexity', 'complexity', '{"item_id": "pop_end_d"}'),
('Pop-ups', 'pop_extra_s_base', 250, 'Extra Spins (Simple) base price', 'item_price', '{"item_id": "pop_extra_s"}'),
('Pop-ups', 'pop_extra_s_complexity', 1.0, 'Extra Spins (Simple) complexity', 'complexity', '{"item_id": "pop_extra_s"}'),
('Pop-ups', 'pop_extra_d_base', 500, 'Extra Spins (Illustrated) base price', 'item_price', '{"item_id": "pop_extra_d"}'),
('Pop-ups', 'pop_extra_d_complexity', 1.2, 'Extra Spins (Illustrated) complexity', 'complexity', '{"item_id": "pop_extra_d"}'),
('Pop-ups', 'pop_error_s_base', 250, 'Error/Warning (Simple) base price', 'item_price', '{"item_id": "pop_error_s"}'),
('Pop-ups', 'pop_error_s_complexity', 0.8, 'Error/Warning (Simple) complexity', 'complexity', '{"item_id": "pop_error_s"}'),
('Pop-ups', 'pop_error_d_base', 500, 'Error/Warning (Illustrated) base price', 'item_price', '{"item_id": "pop_error_d"}'),
('Pop-ups', 'pop_error_d_complexity', 1.0, 'Error/Warning (Illustrated) complexity', 'complexity', '{"item_id": "pop_error_d"}');

-- =============================================
-- UI MENUS — Base Prices & Complexity
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('UI Menus', 'menu_buy_s_base', 500, 'Bonus Buy Menu (Simple) base price', 'item_price', '{"item_id": "menu_buy_s"}'),
('UI Menus', 'menu_buy_s_complexity', 1.0, 'Bonus Buy Menu (Simple) complexity', 'complexity', '{"item_id": "menu_buy_s"}'),
('UI Menus', 'menu_buy_d_base', 1000, 'Bonus Buy Menu (Detailed) base price', 'item_price', '{"item_id": "menu_buy_d"}'),
('UI Menus', 'menu_buy_d_complexity', 1.2, 'Bonus Buy Menu (Detailed) complexity', 'complexity', '{"item_id": "menu_buy_d"}'),
('UI Menus', 'menu_bet_s_base', 300, 'Bet Selection (Simple) base price', 'item_price', '{"item_id": "menu_bet_s"}'),
('UI Menus', 'menu_bet_s_complexity', 1.0, 'Bet Selection (Simple) complexity', 'complexity', '{"item_id": "menu_bet_s"}'),
('UI Menus', 'menu_bet_d_base', 600, 'Bet Selection (Detailed) base price', 'item_price', '{"item_id": "menu_bet_d"}'),
('UI Menus', 'menu_bet_d_complexity', 1.2, 'Bet Selection (Detailed) complexity', 'complexity', '{"item_id": "menu_bet_d"}'),
('UI Menus', 'menu_auto_s_base', 300, 'Autoplay Menu (Simple) base price', 'item_price', '{"item_id": "menu_auto_s"}'),
('UI Menus', 'menu_auto_s_complexity', 0.9, 'Autoplay Menu (Simple) complexity', 'complexity', '{"item_id": "menu_auto_s"}'),
('UI Menus', 'menu_auto_d_base', 600, 'Autoplay Menu (Detailed) base price', 'item_price', '{"item_id": "menu_auto_d"}'),
('UI Menus', 'menu_auto_d_complexity', 1.1, 'Autoplay Menu (Detailed) complexity', 'complexity', '{"item_id": "menu_auto_d"}'),
('UI Menus', 'ui_pack_s_base', 400, 'UI Buttons Pack (Simple) base price', 'item_price', '{"item_id": "ui_pack_s"}'),
('UI Menus', 'ui_pack_s_complexity', 0.9, 'UI Buttons Pack (Simple) complexity', 'complexity', '{"item_id": "ui_pack_s"}'),
('UI Menus', 'ui_pack_d_base', 700, 'UI Buttons Pack (Detailed) base price', 'item_price', '{"item_id": "ui_pack_d"}'),
('UI Menus', 'ui_pack_d_complexity', 1.1, 'UI Buttons Pack (Detailed) complexity', 'complexity', '{"item_id": "ui_pack_d"}'),
('UI Menus', 'screen_load_s_base', 300, 'Loading Screen (Simple) base price', 'item_price', '{"item_id": "screen_load_s"}'),
('UI Menus', 'screen_load_s_complexity', 1.0, 'Loading Screen (Simple) complexity', 'complexity', '{"item_id": "screen_load_s"}'),
('UI Menus', 'screen_load_d_base', 600, 'Loading Screen (Detailed) base price', 'item_price', '{"item_id": "screen_load_d"}'),
('UI Menus', 'screen_load_d_complexity', 1.2, 'Loading Screen (Detailed) complexity', 'complexity', '{"item_id": "screen_load_d"}'),
('UI Menus', 'screen_info_s_base', 500, 'Info/Guide Screen (Simple) base price', 'item_price', '{"item_id": "screen_info_s"}'),
('UI Menus', 'screen_info_s_complexity', 1.0, 'Info/Guide Screen (Simple) complexity', 'complexity', '{"item_id": "screen_info_s"}'),
('UI Menus', 'screen_info_d_base', 1000, 'Info/Guide Screen (Detailed) base price', 'item_price', '{"item_id": "screen_info_d"}'),
('UI Menus', 'screen_info_d_complexity', 1.2, 'Info/Guide Screen (Detailed) complexity', 'complexity', '{"item_id": "screen_info_d"}'),
('UI Menus', 'screen_intro_s_base', 400, 'Onboarding (Simple) base price', 'item_price', '{"item_id": "screen_intro_s"}'),
('UI Menus', 'screen_intro_s_complexity', 1.0, 'Onboarding (Simple) complexity', 'complexity', '{"item_id": "screen_intro_s"}'),
('UI Menus', 'screen_intro_d_base', 900, 'Onboarding (Detailed) base price', 'item_price', '{"item_id": "screen_intro_d"}'),
('UI Menus', 'screen_intro_d_complexity', 1.2, 'Onboarding (Detailed) complexity', 'complexity', '{"item_id": "screen_intro_d"}');

-- =============================================
-- MARKETING — Base Prices & Complexity
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Marketing', 'promo_cover_base', 1500, 'Slot Cover (A/B Pack) base price', 'item_price', '{"item_id": "promo_cover"}'),
('Marketing', 'promo_cover_complexity', 1.3, 'Slot Cover complexity', 'complexity', '{"item_id": "promo_cover"}'),
('Marketing', 'promo_banner_base', 1200, 'Promo Banner Pack base price', 'item_price', '{"item_id": "promo_banner"}'),
('Marketing', 'promo_banner_complexity', 1.3, 'Promo Banner Pack complexity', 'complexity', '{"item_id": "promo_banner"}'),
('Marketing', 'promo_poster_base', 1000, 'Feature Poster / Key Art base price', 'item_price', '{"item_id": "promo_poster"}'),
('Marketing', 'promo_poster_complexity', 1.4, 'Feature Poster complexity', 'complexity', '{"item_id": "promo_poster"}'),
('Marketing', 'promo_teaser_base', 600, 'Static Promo Teaser base price', 'item_price', '{"item_id": "promo_teaser"}'),
('Marketing', 'promo_teaser_complexity', 1.3, 'Static Promo Teaser complexity', 'complexity', '{"item_id": "promo_teaser"}'),
('Marketing', 'promo_icons_base', 250, 'Store Icons Set base price', 'item_price', '{"item_id": "promo_icons"}'),
('Marketing', 'promo_icons_complexity', 0.8, 'Store Icons Set complexity', 'complexity', '{"item_id": "promo_icons"}');

-- =============================================
-- STYLES — Coefficients (IDs match local data: S1, S2, P1, S3, P2, S4, P3, S5, S6, S7)
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Styles', 'style_S1_coeff', 1.0, 'S1 Flat Minimalist', 'style', '{"style_id": "S1"}'),
('Styles', 'style_S2_coeff', 1.15, 'S2 Cartoon Soft 2D', 'style', '{"style_id": "S2"}'),
('Styles', 'style_P1_coeff', 1.0, 'P1 Pixel Basic', 'style', '{"style_id": "P1"}'),
('Styles', 'style_S3_coeff', 1.3, 'S3 Stylized 2D', 'style', '{"style_id": "S3"}'),
('Styles', 'style_P2_coeff', 1.2, 'P2 Pixel Detailed', 'style', '{"style_id": "P2"}'),
('Styles', 'style_S4_coeff', 1.5, 'S4 Pseudo-3D', 'style', '{"style_id": "S4"}'),
('Styles', 'style_P3_coeff', 1.4, 'P3 Pixel HD', 'style', '{"style_id": "P3"}'),
('Styles', 'style_S5_coeff', 1.8, 'S5 High-Detail 2D', 'style', '{"style_id": "S5"}'),
('Styles', 'style_S6_coeff', 2.0, 'S6 Stylized 3D', 'style', '{"style_id": "S6"}'),
('Styles', 'style_S7_coeff', 2.3, 'S7 Cinematic 3D', 'style', '{"style_id": "S7"}');

-- =============================================
-- ANIMATIONS — Coefficients (IDs match local data: none, AN-L, AN-S, AN-F)
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Animations', 'anim_none_coeff', 1.0, 'No animation (Static)', 'animation', '{"anim_id": "none"}'),
('Animations', 'anim_ANL_coeff', 1.2, 'AN-L Light Motion', 'animation', '{"anim_id": "AN-L"}'),
('Animations', 'anim_ANS_coeff', 1.5, 'AN-S Standard Motion', 'animation', '{"anim_id": "AN-S"}'),
('Animations', 'anim_ANF_coeff', 2.0, 'AN-F Full Motion', 'animation', '{"anim_id": "AN-F"}');

-- =============================================
-- USAGE RIGHTS — Coefficients (IDs match local data: U1, U2, U3)
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Usage Rights', 'rights_U1_coeff', 1.0, 'U1 Public Allowed — portfolio, social media', 'rights', '{"rights_id": "U1"}'),
('Usage Rights', 'rights_U2_coeff', 1.25, 'U2 Private / PDF Only — closed case only', 'rights', '{"rights_id": "U2"}'),
('Usage Rights', 'rights_U3_coeff', 1.5, 'U3 Ghost / NDA — no publication allowed', 'rights', '{"rights_id": "U3"}');

-- =============================================
-- PAYMENT MODELS — Coefficients (IDs match local data: Standard, Pre50, FullPre, Zero)
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Payment', 'payment_Standard_coeff', 1.0, 'Standard (Milestones) — 15% prepayment + milestones', 'payment', '{"payment_id": "Standard"}'),
('Payment', 'payment_Pre50_coeff', 0.9, 'Pre-50% — 50% advance + 50% staged', 'payment', '{"payment_id": "Pre50"}'),
('Payment', 'payment_FullPre_coeff', 0.7, 'Full Prepay — 100% before start', 'payment', '{"payment_id": "FullPre"}'),
('Payment', 'payment_Zero_coeff', 1.2, 'Zero-Prepay Model — no prepayment + milestones', 'payment', '{"payment_id": "Zero"}');

-- =============================================
-- REVISIONS
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Revisions', 'revision_round_coeff', 0.025, 'Per revision round coefficient (2.5% of production)', 'revision', '{}');

-- =============================================
-- Step 2: Create RPC function for public pricing access
-- =============================================
-- Returns all price configs as JSONB array (excluding Minimum Order settings)
-- Accessible by anon role (for public calculator)
-- SECURITY DEFINER bypasses RLS
-- STABLE for query caching
CREATE OR REPLACE FUNCTION get_public_pricing()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', value,
        'config_type', config_type,
        'config_data', config_data
      )
    ),
    '[]'::jsonb
  )
  FROM price_configs
  WHERE category != 'Minimum Order';
$$;

-- Step 3: Grant access to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_public_pricing() TO anon;
GRANT EXECUTE ON FUNCTION get_public_pricing() TO authenticated;
