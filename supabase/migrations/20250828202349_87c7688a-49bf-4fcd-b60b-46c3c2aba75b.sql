
-- 1) Atualiza o default do JSON enabled_features para incluir as novas chaves
ALTER TABLE public.companies
ALTER COLUMN enabled_features
SET DEFAULT '{
  "marketplace": true,
  "ranking": true,
  "bank": true,
  "store": true,
  "streak": true,
  "challenges": true,
  "trails": true,
  "members": true,
  "courses": true,
  "calendar": true
}'::jsonb;

-- 2) Backfill: garante que todas as empresas tenham todas as chaves,
-- preservando valores atuais e usando true quando a chave não existir
UPDATE public.companies
SET enabled_features =
  COALESCE(enabled_features, '{}'::jsonb)
  || jsonb_build_object(
    'marketplace', COALESCE(enabled_features->'marketplace', 'true'::jsonb),
    'ranking',     COALESCE(enabled_features->'ranking',     'true'::jsonb),
    'bank',        COALESCE(enabled_features->'bank',        'true'::jsonb),
    'store',       COALESCE(enabled_features->'store',       'true'::jsonb),
    'streak',      COALESCE(enabled_features->'streak',      'true'::jsonb),
    'challenges',  COALESCE(enabled_features->'challenges',  'true'::jsonb),
    'trails',      COALESCE(enabled_features->'trails',      'true'::jsonb),
    'members',     COALESCE(enabled_features->'members',     'true'::jsonb),
    'courses',     COALESCE(enabled_features->'courses',     'true'::jsonb),
    'calendar',    COALESCE(enabled_features->'calendar',    'true'::jsonb)
  );
