-- =============================================================================
-- m3 Money Master — Consolidation Delta
-- Fecha: 2026-09-08
-- =============================================================================
-- Aplica en cloud todos los cambios desde v1.1.0 hasta el estado actual.
-- IDEMPOTENTE: usar IF NOT EXISTS / ADD COLUMN IF NOT EXISTS en todo.
-- NO elimina ni trunca datos.
--
-- Orden de ejecución: aplicar manualmente en Supabase Studio (SQL Editor)
-- o via CLI: psql <connection_string> -f migrations/delta/20260908_consolidation_delta.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. WhatsApp Integration tables (if not already created from v1.1.0)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.whatsapp_integrations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone_number            TEXT NOT NULL UNIQUE,
  is_verified             BOOLEAN NOT NULL DEFAULT false,
  verification_otp        TEXT,
  otp_expires_at          TIMESTAMPTZ,
  default_account_id      UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  default_currency        TEXT NOT NULL DEFAULT 'ARS' CHECK (default_currency IN ('ARS', 'USD', 'EUR')),
  auto_confirm_threshold  NUMERIC NOT NULL DEFAULT 0.85,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own whatsapp integration" ON public.whatsapp_integrations;
CREATE POLICY "Users manage own whatsapp integration" ON public.whatsapp_integrations
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS update_whatsapp_integrations_updated_at ON public.whatsapp_integrations;
CREATE TRIGGER update_whatsapp_integrations_updated_at
  BEFORE UPDATE ON public.whatsapp_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_whatsapp_integrations_phone
  ON public.whatsapp_integrations(phone_number) WHERE is_active = true;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS origin             TEXT DEFAULT 'manual' CHECK (origin IN ('manual', 'csv_import', 'whatsapp_bot', 'recurring')),
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_origin ON public.transactions(user_id, origin);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  whatsapp_message_id TEXT NOT NULL,
  direction           TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type        TEXT NOT NULL CHECK (message_type IN ('text', 'audio', 'image', 'document', 'interactive')),
  raw_payload         JSONB,
  text_content        TEXT,
  media_url           TEXT,
  parsed_data         JSONB,
  confidence_score    NUMERIC,
  status              TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'needs_confirmation', 'failed', 'ignored')),
  transaction_id      UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own whatsapp messages"   ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users insert own whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Users view own whatsapp messages"   ON public.whatsapp_messages FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own whatsapp messages" ON public.whatsapp_messages FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_created ON public.whatsapp_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_external_id  ON public.whatsapp_messages(whatsapp_message_id);

-- ---------------------------------------------------------------------------
-- 2. accounts.currency
-- ---------------------------------------------------------------------------

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS';

COMMENT ON COLUMN public.accounts.currency IS 'Currency code for the account (e.g. ARS, USD, EUR, USDT)';

-- ---------------------------------------------------------------------------
-- 3. Shopping lists
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  target_account_id  UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  target_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users manage own shopping lists" ON public.shopping_lists
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON public.shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON public.shopping_lists(user_id);

CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id    UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  quantity   NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own shopping list items" ON public.shopping_list_items;
CREATE POLICY "Users manage own shopping list items" ON public.shopping_list_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND sl.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND sl.user_id = (select auth.uid())));

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON public.shopping_list_items(list_id);

-- ---------------------------------------------------------------------------
-- 4. transactions.currency + recurring_transactions.currency
-- ---------------------------------------------------------------------------

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS';

COMMENT ON COLUMN public.transactions.currency IS 'Currency code for the transaction (e.g. ARS, USD, EUR)';

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS';

COMMENT ON COLUMN public.recurring_transactions.currency IS 'Currency code for the recurring transaction (e.g. ARS, USD, EUR)';

-- ---------------------------------------------------------------------------
-- 5. tag_ids type fix (ensure text[] — idempotent via USING cast)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Only alter if column is not already text[]
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'tag_ids') != 'ARRAY' THEN
    ALTER TABLE public.transactions ALTER COLUMN tag_ids TYPE text[] USING tag_ids::text[];
  END IF;

  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'recurring_transactions' AND column_name = 'tag_ids') != 'ARRAY' THEN
    ALTER TABLE public.recurring_transactions ALTER COLUMN tag_ids TYPE text[] USING tag_ids::text[];
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. transaction_rules
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transaction_rules (
  id         TEXT PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE NOT NULL,
  priority   INTEGER DEFAULT 0 NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb NOT NULL,
  actions    JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transaction rules"   ON public.transaction_rules;
DROP POLICY IF EXISTS "Users can insert their own transaction rules" ON public.transaction_rules;
DROP POLICY IF EXISTS "Users can update their own transaction rules" ON public.transaction_rules;
DROP POLICY IF EXISTS "Users can delete their own transaction rules" ON public.transaction_rules;
CREATE POLICY "Users can view their own transaction rules"   ON public.transaction_rules FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own transaction rules" ON public.transaction_rules FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own transaction rules" ON public.transaction_rules FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own transaction rules" ON public.transaction_rules FOR DELETE USING ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- SCHEMA RELOAD
-- ---------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
