-- Ativar a feature 'store' para a empresa Cae Club
UPDATE companies 
SET enabled_features = jsonb_set(enabled_features, '{store}', 'true'::jsonb)
WHERE name = 'Cae Club';