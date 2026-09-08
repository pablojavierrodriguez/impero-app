-- Delta snippet: recurring_transactions currency & tag_ids text[] fix
-- Aplica los cambios necesarios para persistencia de recurrentes y tags como texto en Supabase Cloud / staging

ALTER TABLE public.recurring_transactions 
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ARS';

ALTER TABLE public.recurring_transactions 
  ALTER COLUMN tag_ids TYPE text[] USING tag_ids::text[];

ALTER TABLE public.transactions 
  ALTER COLUMN tag_ids TYPE text[] USING tag_ids::text[];

NOTIFY pgrst, 'reload schema';
