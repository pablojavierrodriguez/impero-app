-- =============================================================================
-- m3 — Limpiar datos de seed (para probar importación desde cero)
-- =============================================================================
-- Elimina TODOS los datos de negocio del usuario dev (dev@impero.local)
-- manteniendo intacto el usuario en auth.users y su perfil base.
--
-- ⚠️  Solo para uso en LOCAL. Nunca ejecutar en producción.
--
-- Uso:
--   1. Ejecutar en Supabase Studio > SQL Editor (local)
--   2. O via psql:
--      psql postgresql://postgres:postgres@127.0.0.1:54422/postgres -f supabase/snippets/clear_seed_data.sql
-- =============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Resolver el user_id del usuario de desarrollo
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dev@impero.local'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario dev@impero.local no encontrado. ¿Corriste supabase db reset?';
  END IF;

  RAISE NOTICE 'Limpiando datos de seed para user_id: %', v_user_id;

  -- Orden de borrado respetando FKs (hijos primero, luego padres)
  DELETE FROM public.bill_reminders         WHERE user_id = v_user_id;
  DELETE FROM public.recurring_transactions WHERE user_id = v_user_id;
  DELETE FROM public.budgets                WHERE user_id = v_user_id;
  DELETE FROM public.goals                  WHERE user_id = v_user_id;
  DELETE FROM public.transactions           WHERE user_id = v_user_id;
  DELETE FROM public.tags                   WHERE user_id = v_user_id;
  DELETE FROM public.accounts               WHERE user_id = v_user_id;

  -- Categorías: borrar subcategorías primero (parent_id FK), luego las raíz
  DELETE FROM public.categories WHERE user_id = v_user_id AND parent_id IS NOT NULL;
  DELETE FROM public.categories WHERE user_id = v_user_id;

  -- Settings: resetear a defaults (no borrar, el trigger no lo re-crea)
  UPDATE public.user_settings
  SET
    currency             = 'ARS',
    language             = 'es',
    chart_type           = 'bar',
    daily_budget         = 150,
    show_decimals        = true,
    theme                = 'dark',
    home_sections        = '[]'::jsonb,
    custom_exchange_rates = NULL
  WHERE user_id = v_user_id;

  RAISE NOTICE '✅ Datos de seed eliminados correctamente. El usuario y su perfil siguen intactos.';
  RAISE NOTICE '   Podés ahora probar la importación de CSV/Excel desde cero.';
END $$;
