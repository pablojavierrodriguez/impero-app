-- Migración para persistencia de Reglas de Auto-categorización (Transaction Rules)
CREATE TABLE IF NOT EXISTS public.transaction_rules (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  priority INTEGER DEFAULT 0 NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb NOT NULL,
  actions JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS obligatorio
ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad RLS con subquery de auth.uid()
CREATE POLICY "Users can view their own transaction rules"
  ON public.transaction_rules
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own transaction rules"
  ON public.transaction_rules
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own transaction rules"
  ON public.transaction_rules
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own transaction rules"
  ON public.transaction_rules
  FOR DELETE
  USING ((select auth.uid()) = user_id);
