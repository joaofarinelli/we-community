
-- Atualiza o CHECK constraint de step_type para permitir o novo tipo 'terms'
ALTER TABLE public.onboarding_steps
  DROP CONSTRAINT IF EXISTS onboarding_steps_step_type_check;

ALTER TABLE public.onboarding_steps
  ADD CONSTRAINT onboarding_steps_step_type_check
  CHECK (step_type = ANY (ARRAY['welcome','profile','spaces','tags','terms','finish']));
