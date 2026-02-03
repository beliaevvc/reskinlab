-- =============================================
-- PRICE CONFIGS - ADD COLUMNS & SEED DATA
-- =============================================

-- Step 1: Add missing columns to price_configs table
ALTER TABLE public.price_configs 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS value NUMERIC,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Step 2: Create index for category
CREATE INDEX IF NOT EXISTS idx_price_configs_category ON public.price_configs(category);

-- Step 3: Clear old data (optional - comment out if you want to keep existing)
DELETE FROM price_configs WHERE name IS NOT NULL;

-- =============================================
-- SYMBOLS - Base Prices
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Symbols', 'sym_low_base', 150, 'Low Symbols base price', 'item_price', '{"item_id": "sym_low"}'),
('Symbols', 'sym_mid_base', 250, 'High Symbols base price', 'item_price', '{"item_id": "sym_mid"}'),
('Symbols', 'sym_spec_base', 400, 'Special Symbols (Wild/Bonus) base price', 'item_price', '{"item_id": "sym_spec"}'),
('Symbols', 'sym_low_complexity', 0.8, 'Low Symbols complexity coefficient', 'complexity', '{"item_id": "sym_low"}'),
('Symbols', 'sym_mid_complexity', 1.0, 'High Symbols complexity coefficient', 'complexity', '{"item_id": "sym_mid"}'),
('Symbols', 'sym_spec_complexity', 1.1, 'Special Symbols complexity coefficient', 'complexity', '{"item_id": "sym_spec"}');

-- =============================================
-- BACKGROUNDS - Base Prices
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Backgrounds', 'bg_base_simple', 700, 'Base BG (Simple) base price', 'item_price', '{"item_id": "bg_base_s"}'),
('Backgrounds', 'bg_base_detailed', 1200, 'Base BG (Detailed) base price', 'item_price', '{"item_id": "bg_base_d"}'),
('Backgrounds', 'bg_bonus_simple', 500, 'Bonus BG (Simple) base price', 'item_price', '{"item_id": "bg_bonus_s"}'),
('Backgrounds', 'bg_bonus_detailed', 800, 'Bonus BG (Detailed) base price', 'item_price', '{"item_id": "bg_bonus_d"}'),
('Backgrounds', 'bg_base_simple_complexity', 1.1, 'Base BG (Simple) complexity', 'complexity', '{"item_id": "bg_base_s"}'),
('Backgrounds', 'bg_base_detailed_complexity', 1.3, 'Base BG (Detailed) complexity', 'complexity', '{"item_id": "bg_base_d"}'),
('Backgrounds', 'bg_bonus_simple_complexity', 1.2, 'Bonus BG (Simple) complexity', 'complexity', '{"item_id": "bg_bonus_s"}'),
('Backgrounds', 'bg_bonus_detailed_complexity', 1.4, 'Bonus BG (Detailed) complexity', 'complexity', '{"item_id": "bg_bonus_d"}');

-- =============================================
-- POP-UPS - Base Prices
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Pop-ups', 'pop_win_simple', 500, 'Big Win (Simple) base price', 'item_price', '{"item_id": "pop_win_s"}'),
('Pop-ups', 'pop_win_illustrated', 400, 'Big Win (Illustrated) base price', 'item_price', '{"item_id": "pop_win_d"}'),
('Pop-ups', 'pop_start_simple', 300, 'Bonus Start (Simple) base price', 'item_price', '{"item_id": "pop_start_s"}'),
('Pop-ups', 'pop_start_illustrated', 500, 'Bonus Start (Illustrated) base price', 'item_price', '{"item_id": "pop_start_d"}'),
('Pop-ups', 'pop_end_simple', 300, 'Bonus End (Simple) base price', 'item_price', '{"item_id": "pop_end_s"}'),
('Pop-ups', 'pop_end_illustrated', 500, 'Bonus End (Illustrated) base price', 'item_price', '{"item_id": "pop_end_d"}'),
('Pop-ups', 'pop_extra_simple', 250, 'Extra Spins (Simple) base price', 'item_price', '{"item_id": "pop_extra_s"}'),
('Pop-ups', 'pop_extra_illustrated', 500, 'Extra Spins (Illustrated) base price', 'item_price', '{"item_id": "pop_extra_d"}'),
('Pop-ups', 'pop_error_simple', 250, 'Error/Warning (Simple) base price', 'item_price', '{"item_id": "pop_error_s"}'),
('Pop-ups', 'pop_error_illustrated', 500, 'Error/Warning (Illustrated) base price', 'item_price', '{"item_id": "pop_error_d"}');

-- =============================================
-- UI MENUS - Base Prices
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('UI Menus', 'menu_buy_simple', 500, 'Bonus Buy Menu (Simple) base price', 'item_price', '{"item_id": "menu_buy_s"}'),
('UI Menus', 'menu_buy_detailed', 1000, 'Bonus Buy Menu (Detailed) base price', 'item_price', '{"item_id": "menu_buy_d"}'),
('UI Menus', 'menu_bet_simple', 300, 'Bet Selection (Simple) base price', 'item_price', '{"item_id": "menu_bet_s"}'),
('UI Menus', 'menu_bet_detailed', 600, 'Bet Selection (Detailed) base price', 'item_price', '{"item_id": "menu_bet_d"}'),
('UI Menus', 'menu_auto_simple', 300, 'Autoplay Menu (Simple) base price', 'item_price', '{"item_id": "menu_auto_s"}'),
('UI Menus', 'menu_auto_detailed', 600, 'Autoplay Menu (Detailed) base price', 'item_price', '{"item_id": "menu_auto_d"}'),
('UI Menus', 'ui_pack_simple', 400, 'UI Buttons Pack (Simple) base price', 'item_price', '{"item_id": "ui_pack_s"}'),
('UI Menus', 'ui_pack_detailed', 700, 'UI Buttons Pack (Detailed) base price', 'item_price', '{"item_id": "ui_pack_d"}'),
('UI Menus', 'screen_load_simple', 300, 'Loading Screen (Simple) base price', 'item_price', '{"item_id": "screen_load_s"}'),
('UI Menus', 'screen_load_detailed', 600, 'Loading Screen (Detailed) base price', 'item_price', '{"item_id": "screen_load_d"}'),
('UI Menus', 'screen_info_simple', 500, 'Info/Guide Screen (Simple) base price', 'item_price', '{"item_id": "screen_info_s"}'),
('UI Menus', 'screen_info_detailed', 1000, 'Info/Guide Screen (Detailed) base price', 'item_price', '{"item_id": "screen_info_d"}'),
('UI Menus', 'screen_intro_simple', 400, 'Onboarding (Simple) base price', 'item_price', '{"item_id": "screen_intro_s"}'),
('UI Menus', 'screen_intro_detailed', 900, 'Onboarding (Detailed) base price', 'item_price', '{"item_id": "screen_intro_d"}');

-- =============================================
-- MARKETING - Base Prices
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Marketing', 'promo_cover', 1500, 'Slot Cover (A/B Pack) base price', 'item_price', '{"item_id": "promo_cover"}'),
('Marketing', 'promo_banner', 1200, 'Promo Banner Pack base price', 'item_price', '{"item_id": "promo_banner"}'),
('Marketing', 'promo_poster', 1000, 'Feature Poster / Key Art base price', 'item_price', '{"item_id": "promo_poster"}'),
('Marketing', 'promo_teaser', 600, 'Static Promo Teaser base price', 'item_price', '{"item_id": "promo_teaser"}'),
('Marketing', 'promo_icons', 250, 'Store Icons Set base price', 'item_price', '{"item_id": "promo_icons"}');

-- =============================================
-- STYLES - Coefficients
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Styles', 'style_S1_coeff', 1.0, 'S1 Flat Minimalist coefficient', 'style', '{"style_id": "S1"}'),
('Styles', 'style_S2_coeff', 1.15, 'S2 Cartoon Soft 2D coefficient', 'style', '{"style_id": "S2"}'),
('Styles', 'style_P1_coeff', 1.0, 'P1 Pixel Basic coefficient', 'style', '{"style_id": "P1"}'),
('Styles', 'style_S3_coeff', 1.3, 'S3 Stylized 2D coefficient', 'style', '{"style_id": "S3"}'),
('Styles', 'style_P2_coeff', 1.2, 'P2 Pixel Detailed coefficient', 'style', '{"style_id": "P2"}'),
('Styles', 'style_S4_coeff', 1.5, 'S4 Pseudo-3D coefficient', 'style', '{"style_id": "S4"}'),
('Styles', 'style_P3_coeff', 1.4, 'P3 Pixel HD coefficient', 'style', '{"style_id": "P3"}'),
('Styles', 'style_S5_coeff', 1.8, 'S5 High-Detail 2D coefficient', 'style', '{"style_id": "S5"}'),
('Styles', 'style_S6_coeff', 2.0, 'S6 Stylized 3D coefficient', 'style', '{"style_id": "S6"}'),
('Styles', 'style_S7_coeff', 2.3, 'S7 Cinematic 3D coefficient', 'style', '{"style_id": "S7"}');

-- =============================================
-- ANIMATIONS - Coefficients
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Animations', 'anim_none_coeff', 1.0, 'No animation coefficient', 'animation', '{"anim_id": "none"}'),
('Animations', 'anim_light_coeff', 1.2, 'AN-L Light Motion coefficient', 'animation', '{"anim_id": "AN-L"}'),
('Animations', 'anim_standard_coeff', 1.5, 'AN-S Standard Motion coefficient', 'animation', '{"anim_id": "AN-S"}'),
('Animations', 'anim_full_coeff', 2.0, 'AN-F Full Motion coefficient', 'animation', '{"anim_id": "AN-F"}');

-- =============================================
-- USAGE RIGHTS - Coefficients
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Usage Rights', 'rights_limited_coeff', 1.0, 'Limited usage rights coefficient', 'rights', '{"rights_id": "limited"}'),
('Usage Rights', 'rights_standard_coeff', 1.2, 'Standard usage rights coefficient', 'rights', '{"rights_id": "standard"}'),
('Usage Rights', 'rights_extended_coeff', 1.5, 'Extended usage rights coefficient', 'rights', '{"rights_id": "extended"}'),
('Usage Rights', 'rights_full_coeff', 2.0, 'Full/Exclusive usage rights coefficient', 'rights', '{"rights_id": "full"}');

-- =============================================
-- PAYMENT MODELS - Coefficients
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Payment', 'payment_full_coeff', 1.0, 'Full prepayment coefficient', 'payment', '{"payment_id": "full"}'),
('Payment', 'payment_50_50_coeff', 1.0, '50/50 payment coefficient', 'payment', '{"payment_id": "50_50"}'),
('Payment', 'payment_milestone_coeff', 1.05, 'Milestone payment coefficient (+5%)', 'payment', '{"payment_id": "milestone"}'),
('Payment', 'payment_postpaid_coeff', 1.1, 'Postpaid coefficient (+10%)', 'payment', '{"payment_id": "postpaid"}');

-- =============================================
-- REVISIONS & URGENCY
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Revisions', 'revision_round_coeff', 0.025, 'Per revision round coefficient (2.5%)', 'revision', '{}'),
('Revisions', 'max_revision_rounds', 5, 'Maximum revision rounds included', 'revision', '{}'),
('Urgency', 'urgency_standard_coeff', 1.0, 'Standard timeline coefficient', 'urgency', '{"urgency_id": "standard"}'),
('Urgency', 'urgency_fast_coeff', 1.25, 'Fast delivery coefficient (+25%)', 'urgency', '{"urgency_id": "fast"}'),
('Urgency', 'urgency_express_coeff', 1.5, 'Express delivery coefficient (+50%)', 'urgency', '{"urgency_id": "express"}');

-- =============================================
-- VOLUME DISCOUNTS
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Volume Discounts', 'discount_5k_percent', 5, 'Discount for orders $5,000+ (%)', 'discount', '{"threshold": 5000}'),
('Volume Discounts', 'discount_10k_percent', 10, 'Discount for orders $10,000+ (%)', 'discount', '{"threshold": 10000}'),
('Volume Discounts', 'discount_25k_percent', 15, 'Discount for orders $25,000+ (%)', 'discount', '{"threshold": 25000}'),
('Volume Discounts', 'discount_50k_percent', 20, 'Discount for orders $50,000+ (%)', 'discount', '{"threshold": 50000}');

-- =============================================
-- GLOBAL SETTINGS
-- =============================================
INSERT INTO price_configs (category, name, value, description, config_type, config_data) VALUES
('Global', 'min_order_amount', 500, 'Minimum order amount ($)', 'global', '{}'),
('Global', 'currency', 1, 'Currency (1 = USD)', 'global', '{}'),
('Global', 'tax_rate', 0, 'Tax rate (%)', 'global', '{}');
