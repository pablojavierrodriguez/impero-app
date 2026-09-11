-- =============================================================================
-- IMPERO — Delta de Producción Consolidado y Autosuficiente (Release v0.2.0)
-- Fecha: 2026-09-10
-- =============================================================================
-- Contiene TODOS los cambios de esquema DDL, restricciones, tablas y endurecimiento
-- de seguridad necesarios para que Supabase Cloud esté 100% sincronizado con la app.
--
-- CARACTERÍSTICAS:
--   - Idempotente: seguro para ejecutar múltiples veces sin romper datos existentes.
--   - No destructivo: no elimina tablas ni trunca registros.
--   - Seguro: incluye 'SET search_path = public, pg_temp' y subqueries (select auth.uid()).
--
-- CÓMO APLICAR EN SUPABASE CLOUD:
--   1. Ir a Supabase Dashboard > SQL Editor
--   2. Pegar y ejecutar el contenido de este archivo
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Función para triggers de actualización (con search_path seguro)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Cuentas (accounts): Divisa y Modalidad de Tarjetas de Crédito
-- ---------------------------------------------------------------------------
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS credit_card_view_mode TEXT NOT NULL DEFAULT 'statement_cycles';

COMMENT ON COLUMN public.accounts.currency IS 'Código de moneda de la cuenta (ARS, USD, EUR)';
COMMENT ON COLUMN public.accounts.credit_card_view_mode IS 'Modalidad de visualización de tarjeta (statement_cycles vs negative_balance)';

-- ---------------------------------------------------------------------------
-- 3. Presupuestos (budgets): Rollover Dinámico
-- ---------------------------------------------------------------------------
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS enable_rollover BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accumulated_rollover NUMERIC NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 4. Transacciones y Recurrentes: Divisa, Origen y Referencia Externa
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'manual' CHECK (origin IN ('manual', 'csv_import', 'whatsapp_bot', 'recurring')),
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_origin ON public.transactions(user_id, origin);

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS';

-- Fix de tipo tag_ids como text[]
DO $$
BEGIN
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
-- 5. Restricción de Frecuencia ('once') en Compromisos y Recurrentes
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- bill_reminders
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bill_reminders_frequency_check'
  ) THEN
    ALTER TABLE public.bill_reminders DROP CONSTRAINT bill_reminders_frequency_check;
  END IF;

  ALTER TABLE public.bill_reminders
    ADD CONSTRAINT bill_reminders_frequency_check
    CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'));

  -- recurring_transactions
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recurring_transactions_frequency_check'
  ) THEN
    ALTER TABLE public.recurring_transactions DROP CONSTRAINT recurring_transactions_frequency_check;
  END IF;

  ALTER TABLE public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_frequency_check
    CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'));
END $$;

-- ---------------------------------------------------------------------------
-- 6. Listas de Compras (shopping_lists) y Artículos (shopping_list_items)
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
-- 7. Reglas de Transacciones (transaction_rules)
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
-- 8. Integración WhatsApp (whatsapp_integrations & whatsapp_messages)
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
-- 9. Storage: Acceso seguro al bucket de comprobantes (receipts)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "Anyone can view public receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;

CREATE POLICY "Users can view their own receipts" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 10. Seguridad RPC: Revocar acceso anónimo a funciones de triggers
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'seed_user_defaults') THEN
    REVOKE EXECUTE ON FUNCTION public.seed_user_defaults() FROM anon, authenticated, PUBLIC;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 11. Permisos Explícitos para roles anon y authenticated
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 12. Recarga de PostgREST Schema Cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
