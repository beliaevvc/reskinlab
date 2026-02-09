-- =============================================
-- 053: DYNAMIC ITEM NAMES — Editable display names for calculator items
-- =============================================
-- Adds display_name field to price_configs for customizable item names.
-- Updates get_public_pricing() to return display_name.
-- =============================================

-- Step 1: Add display_name column
ALTER TABLE price_configs ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Step 2: Populate display_name from description (extract clean names)
-- For item_price configs, extract name from description by removing suffixes
UPDATE price_configs
SET display_name = regexp_replace(
  description,
  ' (base price|complexity coefficient|complexity)$',
  '',
  'i'
)
WHERE config_type IN ('item_price', 'complexity', 'surcharge')
  AND display_name IS NULL;

-- For styles, extract clean name
UPDATE price_configs
SET display_name = regexp_replace(description, '^[A-Z0-9]+ ', '')
WHERE config_type = 'style'
  AND display_name IS NULL;

-- For animations, use description as is
UPDATE price_configs
SET display_name = description
WHERE config_type = 'animation'
  AND display_name IS NULL;

-- For usage rights, extract name before " — "
UPDATE price_configs
SET display_name = split_part(description, ' — ', 1)
WHERE config_type = 'rights'
  AND display_name IS NULL;

-- For payment models, extract name before " — "
UPDATE price_configs
SET display_name = split_part(description, ' — ', 1)
WHERE config_type = 'payment'
  AND display_name IS NULL;

-- For revisions and other, use description
UPDATE price_configs
SET display_name = description
WHERE display_name IS NULL;

-- Step 3: Update get_public_pricing() to include display_name
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
        'config_data', config_data,
        'display_name', display_name
      )
    ),
    '[]'::jsonb
  )
  FROM price_configs
  WHERE category != 'Minimum Order';
$$;

-- Ensure grants are preserved
GRANT EXECUTE ON FUNCTION get_public_pricing() TO anon;
GRANT EXECUTE ON FUNCTION get_public_pricing() TO authenticated;
