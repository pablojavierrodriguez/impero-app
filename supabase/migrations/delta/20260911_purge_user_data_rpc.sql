-- ===========================================================================
-- DELTA MIGRATION: 20260911_purge_user_data_rpc.sql
-- Description: Agrega políticas RLS faltantes a whatsapp_messages y crea la función
--              RPC transaccional purge_user_data() para borrado atómico de datos.
-- ===========================================================================

-- 1. Políticas RLS completas para whatsapp_messages (Permite DELETE y UPDATE en cascadas)
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users update own whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users delete own whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Users update own whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own whatsapp messages" ON public.whatsapp_messages
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 2. Función RPC Atómica purge_user_data
CREATE OR REPLACE FUNCTION public.purge_user_data(p_reseed boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_salary_id   UUID;
  v_food_id     UUID;
  v_trans_id    UUID;
  v_housing_id  UUID;
  v_services_id UUID;
  v_leisure_id  UUID;
  v_health_id   UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Listas de compras y sus artículos
  DELETE FROM public.shopping_list_items
  WHERE list_id IN (SELECT id FROM public.shopping_lists WHERE user_id = v_user_id);
  DELETE FROM public.shopping_lists WHERE user_id = v_user_id;

  -- 2. Reglas de categorización
  DELETE FROM public.transaction_rules WHERE user_id = v_user_id;

  -- 3. Vencimientos y transacciones recurrentes
  DELETE FROM public.bill_reminders WHERE user_id = v_user_id;
  DELETE FROM public.recurring_transactions WHERE user_id = v_user_id;

  -- 4. Presupuestos y metas
  DELETE FROM public.budgets WHERE user_id = v_user_id;
  DELETE FROM public.goals WHERE user_id = v_user_id;

  -- 5. WhatsApp integraciones y mensajes
  DELETE FROM public.whatsapp_messages WHERE user_id = v_user_id;
  DELETE FROM public.whatsapp_integrations WHERE user_id = v_user_id;

  -- 6. Transacciones históricas
  DELETE FROM public.transactions WHERE user_id = v_user_id;

  -- 7. Etiquetas
  DELETE FROM public.tags WHERE user_id = v_user_id;

  -- 8. Cuentas y Categorías
  DELETE FROM public.accounts WHERE user_id = v_user_id;
  DELETE FROM public.categories WHERE user_id = v_user_id AND parent_id IS NOT NULL;
  DELETE FROM public.categories WHERE user_id = v_user_id;

  -- 9. Comprobantes en Storage (bucket receipts)
  BEGIN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'receipts' 
      AND (owner = v_user_id OR (storage.foldername(name))[1] = v_user_id::text);
  EXCEPTION WHEN OTHERS THEN
    -- Silencioso si storage no está disponible o difiere en configuración
  END;

  -- 10. Re-seed de valores predeterminados de día 1 (si p_reseed es true)
  IF p_reseed THEN
    -- Categorías estándar (ingresos)
    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Salario', 'bg-emerald-500', 'income', 'briefcase', 1)
    RETURNING id INTO v_salary_id;

    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Otros Ingresos', 'bg-teal-500', 'income', 'wallet', 2);

    -- Categorías estándar (gastos)
    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Alimentación', 'bg-orange-500', 'expense', 'utensils', 10)
    RETURNING id INTO v_food_id;

    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Transporte', 'bg-sky-500', 'expense', 'car', 20)
    RETURNING id INTO v_trans_id;

    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Vivienda', 'bg-violet-500', 'expense', 'home', 30)
    RETURNING id INTO v_housing_id;

    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Servicios', 'bg-yellow-500', 'expense', 'zap', 40)
    RETURNING id INTO v_services_id;

    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Ocio y Salidas', 'bg-pink-500', 'expense', 'film', 50)
    RETURNING id INTO v_leisure_id;

    INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
    VALUES (v_user_id, 'Salud', 'bg-red-400', 'expense', 'heart-pulse', 60)
    RETURNING id INTO v_health_id;

    -- Cuentas predeterminadas (saldo 0)
    INSERT INTO public.accounts (user_id, name, balance, type, color, icon)
    VALUES
      (v_user_id, 'Efectivo',          0, 'cash',     'bg-emerald-500', 'banknote'),
      (v_user_id, 'Caja de Ahorro',    0, 'savings',  'bg-sky-500',     'landmark'),
      (v_user_id, 'Billetera Virtual', 0, 'checking', 'bg-violet-500',  'wallet');

    -- Asegurar configuración predeterminada de usuario
    INSERT INTO public.user_settings (user_id, currency, language, daily_budget, theme)
    VALUES (v_user_id, 'ARS', 'es', 15000, 'dark')
    ON CONFLICT (user_id) DO UPDATE SET
      daily_budget = 15000;
  END IF;

  RETURN jsonb_build_object('success', true, 'reseeded', p_reseed);
END;
$$;

-- 3. Permisos de seguridad y ejecución
REVOKE EXECUTE ON FUNCTION public.purge_user_data(boolean) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_user_data(boolean) TO authenticated;

-- Notificar recarga de esquema a PostgREST
NOTIFY pgrst, 'reload schema';
