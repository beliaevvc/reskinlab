-- =============================================
-- CONCEPT DOCUMENT - Price configs seed
-- Adds base price and surcharge percentage for Concept Document item
-- =============================================

-- Concept Document base price ($1000)
INSERT INTO price_configs (category, name, value, description, config_type, config_data)
SELECT 'Concept Document', 'concept_doc_base', 1000, 'Concept Document — base price', 'item_price', '{"item_id": "concept_doc"}'
WHERE NOT EXISTS (SELECT 1 FROM price_configs WHERE name = 'concept_doc_base' AND category = 'Concept Document');

-- Concept Document surcharge (1% of other items total)
INSERT INTO price_configs (category, name, value, description, config_type, config_data)
SELECT 'Concept Document', 'concept_doc_surcharge', 0.01, 'Surcharge — percentage of other items total added to base price', 'item_price', '{"item_id": "concept_doc"}'
WHERE NOT EXISTS (SELECT 1 FROM price_configs WHERE name = 'concept_doc_surcharge' AND category = 'Concept Document');
