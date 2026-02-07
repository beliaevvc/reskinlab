-- =============================================
-- MINIMUM ORDER SETTINGS
-- Move min_order_amount from Global to dedicated category
-- Add toggle and custom message support
-- =============================================

-- Step 1: Remove old min_order_amount from Global category (if exists)
DELETE FROM price_configs WHERE name = 'min_order_amount' AND category = 'Global';

-- Step 2: Insert Minimum Order settings (idempotent — skip if already exist)
INSERT INTO price_configs (category, name, value, description, config_type, config_data)
SELECT 'Minimum Order', 'min_order_enabled', 1, 'Enable minimum order amount for first order in a project', 'global', '{}'
WHERE NOT EXISTS (SELECT 1 FROM price_configs WHERE name = 'min_order_enabled' AND category = 'Minimum Order');

INSERT INTO price_configs (category, name, value, description, config_type, config_data)
SELECT 'Minimum Order', 'min_order_amount', 1000, 'Minimum amount ($) for first order in project', 'global', '{}'
WHERE NOT EXISTS (SELECT 1 FROM price_configs WHERE name = 'min_order_amount' AND category = 'Minimum Order');

INSERT INTO price_configs (category, name, value, description, config_type, config_data)
SELECT 'Minimum Order', 'min_order_message', 0, 'Minimum order amount is $1,000 for your first order', 'global', '{"type": "message"}'
WHERE NOT EXISTS (SELECT 1 FROM price_configs WHERE name = 'min_order_message' AND category = 'Minimum Order');
