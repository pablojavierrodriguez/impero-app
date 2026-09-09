-- =============================================================================
-- m3 Impero — Comprehensive Dev Seed Data
-- =============================================================================
-- Este script puebla completamente la base de datos de desarrollo local para
-- probar la totalidad de las funcionalidades y entidades del sistema.
--
-- Modos de ejecución:
-- 1. Automático: Se ejecuta en cada `supabase db reset` (configurado en supabase/config.toml).
-- 2. Manual (Studio / psql):
--    - Para el usuario dev por defecto (dev@impero.local):
--        Ejecutar todo este archivo tal cual.
--    - Para un usuario específico ya existente en auth.users:
--        Cambiar el valor de `v_target_email` en el bloque DO $$ abajo
--        o llamar a: SELECT public.seed_dev_data('TU_USER_UUID'::uuid);
-- =============================================================================

CREATE OR REPLACE FUNCTION public.seed_dev_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  -- Cuentas
  v_acc_cash_ars     UUID;
  v_acc_cash_usd     UUID;
  v_acc_bank_ars     UUID;
  v_acc_wallet_ars   UUID;
  v_acc_card_visa    UUID;
  v_acc_card_master  UUID;

  -- Categorías Padre
  v_cat_salary       UUID;
  v_cat_investments  UUID;
  v_cat_freelance    UUID;
  v_cat_food         UUID;
  v_cat_housing      UUID;
  v_cat_transport    UUID;
  v_cat_services     UUID;
  v_cat_leisure      UUID;
  v_cat_health       UUID;
  v_cat_shopping     UUID;

  -- Subcategorías
  v_sub_super        UUID;
  v_sub_restaurants  UUID;
  v_sub_fuel         UUID;
  v_sub_rides        UUID;
  v_sub_streaming    UUID;
  v_sub_pharmacy     UUID;

  -- Tags
  v_tag_super        TEXT;
  v_tag_vacaciones   TEXT;
  v_tag_trabajo      TEXT;
  v_tag_fijo         TEXT;
  v_tag_dolar        TEXT;

  -- Recurrentes y Reglas
  v_rec_salary       UUID;
  v_rec_rent         UUID;
  v_rec_spotify      UUID;

  -- Listas de Compras
  v_list_super       UUID;
  v_list_ferreteria  UUID;

  -- WhatsApp Bot
  v_wa_msg_1         UUID;
  v_wa_msg_2         UUID;
  v_tx_wa            UUID;

  -- Cuotas
  v_installment_grp  TEXT := 'inst-macbook-' || to_char(now(), 'YYYYMM');
BEGIN
  RAISE NOTICE 'Iniciando carga de seed data para el usuario %...', p_user_id;

  -- ---------------------------------------------------------------------------
  -- 1. LIMPIEZA PREVIA DEL USUARIO (Idempotencia garantizada)
  -- ---------------------------------------------------------------------------
  DELETE FROM public.transaction_rules WHERE user_id = p_user_id;
  DELETE FROM public.shopping_lists WHERE user_id = p_user_id;
  DELETE FROM public.whatsapp_messages WHERE user_id = p_user_id;
  DELETE FROM public.whatsapp_integrations WHERE user_id = p_user_id;
  DELETE FROM public.bill_reminders WHERE user_id = p_user_id;
  DELETE FROM public.recurring_transactions WHERE user_id = p_user_id;
  DELETE FROM public.goals WHERE user_id = p_user_id;
  DELETE FROM public.budgets WHERE user_id = p_user_id;
  DELETE FROM public.transactions WHERE user_id = p_user_id;
  DELETE FROM public.tags WHERE user_id = p_user_id;
  DELETE FROM public.accounts WHERE user_id = p_user_id;
  DELETE FROM public.categories WHERE user_id = p_user_id;

  -- ---------------------------------------------------------------------------
  -- 2. USER SETTINGS Y PROFILE
  -- ---------------------------------------------------------------------------
  INSERT INTO public.profiles (user_id, name, email, avatar_url, updated_at)
  VALUES (p_user_id, 'Pablo Tester', 'dev@impero.local', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ImperoDev', now())
  ON CONFLICT (user_id) DO UPDATE
    SET name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

  INSERT INTO public.user_settings (
    user_id, currency, language, chart_type, daily_budget, show_decimals, theme, home_sections, custom_exchange_rates
  )
  VALUES (
    p_user_id,
    'ARS',
    'es',
    'bar',
    25000,
    true,
    'dark',
    '[
      {"id": "net-worth", "name": "Patrimonio Neto", "enabled": true, "order": 0, "category": "balances", "column": "left"},
      {"id": "total-balance", "name": "Saldo Disponible", "enabled": true, "order": 1, "category": "balances", "column": "left"},
      {"id": "monthly-overview", "name": "Resumen Mensual", "enabled": true, "order": 2, "category": "summary", "column": "left"},
      {"id": "cashflow-forecast", "name": "Flujo de Caja", "enabled": true, "order": 3, "category": "analytics", "column": "left"},
      {"id": "accounts-carousel", "name": "Mis Cuentas", "enabled": true, "order": 4, "category": "accounts", "column": "right"},
      {"id": "credit-cards", "name": "Tarjetas de Crédito", "enabled": true, "order": 5, "category": "accounts", "column": "right"},
      {"id": "recent-transactions", "name": "Movimientos Recientes", "enabled": true, "order": 6, "category": "transactions", "column": "right"},
      {"id": "budget-progress", "name": "Presupuestos", "enabled": true, "order": 7, "category": "analytics", "column": "right"},
      {"id": "goals-summary", "name": "Metas de Ahorro", "enabled": true, "order": 8, "category": "planning", "column": "right"},
      {"id": "obligations-widget", "name": "Próximos Vencimientos", "enabled": true, "order": 9, "category": "planning", "column": "right"}
    ]'::jsonb,
    '{"ARS": 1, "USD": 1380, "EUR": 1500}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE
    SET currency = EXCLUDED.currency,
        language = EXCLUDED.language,
        chart_type = EXCLUDED.chart_type,
        daily_budget = EXCLUDED.daily_budget,
        show_decimals = EXCLUDED.show_decimals,
        theme = EXCLUDED.theme,
        home_sections = EXCLUDED.home_sections,
        custom_exchange_rates = EXCLUDED.custom_exchange_rates,
        updated_at = now();

  -- ---------------------------------------------------------------------------
  -- 3. CATEGORÍAS (Padres y Subcategorías jerárquicas)
  -- ---------------------------------------------------------------------------
  -- Ingresos
  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Sueldo & Honorarios', 'bg-emerald-500', 'income', 'briefcase', 1)
  RETURNING id INTO v_cat_salary;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Freelance & Consultoría', 'bg-teal-500', 'income', 'laptop', 2)
  RETURNING id INTO v_cat_freelance;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Rendimientos & Inversiones', 'bg-cyan-500', 'income', 'trending-up', 3)
  RETURNING id INTO v_cat_investments;

  -- Gastos Padres
  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Alimentación', 'bg-orange-500', 'expense', 'utensils', 10)
  RETURNING id INTO v_cat_food;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Vivienda', 'bg-violet-500', 'expense', 'home', 20)
  RETURNING id INTO v_cat_housing;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Transporte', 'bg-sky-500', 'expense', 'car', 30)
  RETURNING id INTO v_cat_transport;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Servicios & Suscripciones', 'bg-yellow-500', 'expense', 'zap', 40)
  RETURNING id INTO v_cat_services;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Salidas & Ocio', 'bg-pink-500', 'expense', 'film', 50)
  RETURNING id INTO v_cat_leisure;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Salud & Cuidado', 'bg-red-400', 'expense', 'heart-pulse', 60)
  RETURNING id INTO v_cat_health;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (p_user_id, 'Compras & Tecnología', 'bg-indigo-500', 'expense', 'shopping-bag', 70)
  RETURNING id INTO v_cat_shopping;

  -- Subcategorías
  INSERT INTO public.categories (user_id, name, color, type, icon, parent_id, sort_order)
  VALUES (p_user_id, 'Supermercado', 'bg-orange-600', 'expense', 'shopping-cart', v_cat_food, 11)
  RETURNING id INTO v_sub_super;

  INSERT INTO public.categories (user_id, name, color, type, icon, parent_id, sort_order)
  VALUES (p_user_id, 'Restaurantes & Delivery', 'bg-amber-500', 'expense', 'utensils', v_cat_food, 12)
  RETURNING id INTO v_sub_restaurants;

  INSERT INTO public.categories (user_id, name, color, type, icon, parent_id, sort_order)
  VALUES (p_user_id, 'Combustible', 'bg-sky-600', 'expense', 'fuel', v_cat_transport, 31)
  RETURNING id INTO v_sub_fuel;

  INSERT INTO public.categories (user_id, name, color, type, icon, parent_id, sort_order)
  VALUES (p_user_id, 'Uber / Cabify / Taxi', 'bg-blue-500', 'expense', 'car', v_cat_transport, 32)
  RETURNING id INTO v_sub_rides;

  INSERT INTO public.categories (user_id, name, color, type, icon, parent_id, sort_order)
  VALUES (p_user_id, 'Streaming & Apps', 'bg-yellow-600', 'expense', 'tv', v_cat_services, 41)
  RETURNING id INTO v_sub_streaming;

  INSERT INTO public.categories (user_id, name, color, type, icon, parent_id, sort_order)
  VALUES (p_user_id, 'Farmacia & Medicamentos', 'bg-rose-500', 'expense', 'pill', v_cat_health, 61)
  RETURNING id INTO v_sub_pharmacy;

  -- ---------------------------------------------------------------------------
  -- 4. CUENTAS (Multimoneda y Tarjetas con balance <= 0 garantizado)
  -- ---------------------------------------------------------------------------
  -- 4.1 Efectivo ARS
  INSERT INTO public.accounts (
    user_id, name, balance, type, color, icon, currency
  ) VALUES (
    p_user_id, 'Efectivo Billetera', 45000, 'cash', 'bg-emerald-500', 'banknote', 'ARS'
  ) RETURNING id INTO v_acc_cash_ars;

  -- 4.2 Efectivo USD (Ahorro físico)
  INSERT INTO public.accounts (
    user_id, name, balance, type, color, icon, currency
  ) VALUES (
    p_user_id, 'Dólares Colchón', 1250, 'cash', 'bg-teal-500', 'safe', 'USD'
  ) RETURNING id INTO v_acc_cash_usd;

  -- 4.3 Cuenta Corriente / Caja de Ahorro Bancaria en ARS
  INSERT INTO public.accounts (
    user_id, name, balance, type, color, icon, currency
  ) VALUES (
    p_user_id, 'Banco Galicia (Sueldo)', 845600, 'checking', 'bg-sky-500', 'landmark', 'ARS'
  ) RETURNING id INTO v_acc_bank_ars;

  -- 4.4 Billetera Virtual (Mercado Pago / Rendimientos diarios)
  INSERT INTO public.accounts (
    user_id, name, balance, type, color, icon, currency
  ) VALUES (
    p_user_id, 'Mercado Pago', 128400, 'savings', 'bg-blue-500', 'wallet', 'ARS'
  ) RETURNING id INTO v_acc_wallet_ars;

  -- 4.5 Tarjeta de Crédito Visa Signature (Deuda negativa: -284.500 ARS)
  -- Invariante AGENTS.md: balance <= 0 estricto
  INSERT INTO public.accounts (
    user_id, name, balance, type, color, icon, currency,
    credit_limit, closing_day, payment_day, brand
  ) VALUES (
    p_user_id, 'Visa Signature Galicia', -284500, 'credit', 'bg-indigo-600', 'credit-card', 'ARS',
    2500000, 20, 5, 'visa'
  ) RETURNING id INTO v_acc_card_visa;

  -- 4.6 Tarjeta de Crédito Mastercard Black (Deuda negativa: -95.200 ARS)
  INSERT INTO public.accounts (
    user_id, name, balance, type, color, icon, currency,
    credit_limit, closing_day, payment_day, brand
  ) VALUES (
    p_user_id, 'Mastercard Black Santander', -95200, 'credit', 'bg-amber-600', 'credit-card', 'ARS',
    2000000, 24, 7, 'mastercard'
  ) RETURNING id INTO v_acc_card_master;

  -- ---------------------------------------------------------------------------
  -- 5. TAGS
  -- ---------------------------------------------------------------------------
  INSERT INTO public.tags (user_id, name, color) VALUES (p_user_id, 'Supermercado', 'bg-orange-500') RETURNING id::text INTO v_tag_super;
  INSERT INTO public.tags (user_id, name, color) VALUES (p_user_id, 'Vacaciones', 'bg-emerald-500') RETURNING id::text INTO v_tag_vacaciones;
  INSERT INTO public.tags (user_id, name, color) VALUES (p_user_id, 'Trabajo', 'bg-sky-500') RETURNING id::text INTO v_tag_trabajo;
  INSERT INTO public.tags (user_id, name, color) VALUES (p_user_id, 'Gasto Fijo', 'bg-zinc-500') RETURNING id::text INTO v_tag_fijo;
  INSERT INTO public.tags (user_id, name, color) VALUES (p_user_id, 'Dólar', 'bg-teal-500') RETURNING id::text INTO v_tag_dolar;

  -- ---------------------------------------------------------------------------
  -- 6. REGLAS DE CATEGORIZACIÓN (Transaction Rules)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.transaction_rules (id, user_id, name, is_active, priority, conditions, actions, created_at)
  VALUES
    (
      'rule-coto-' || p_user_id,
      p_user_id,
      'Auto-categorizar Coto & Carrefour',
      true,
      10,
      jsonb_build_array(
        jsonb_build_object('field', 'description', 'operator', 'contains', 'value', 'coto'),
        jsonb_build_object('field', 'description', 'operator', 'contains', 'value', 'carrefour')
      ),
      jsonb_build_object('setCategoryId', v_sub_super, 'addTags', jsonb_build_array(v_tag_super)),
      now() - interval '20 days'
    ),
    (
      'rule-ypf-' || p_user_id,
      p_user_id,
      'Combustible YPF / Shell',
      true,
      8,
      jsonb_build_array(
        jsonb_build_object('field', 'description', 'operator', 'contains', 'value', 'ypf')
      ),
      jsonb_build_object('setCategoryId', v_sub_fuel, 'cleanDescription', 'YPF Combustible'),
      now() - interval '18 days'
    ),
    (
      'rule-uber-' || p_user_id,
      p_user_id,
      'Viajes en Uber / Cabify',
      true,
      5,
      jsonb_build_array(
        jsonb_build_object('field', 'description', 'operator', 'contains', 'value', 'uber')
      ),
      jsonb_build_object('setCategoryId', v_sub_rides),
      now() - interval '15 days'
    );

  -- ---------------------------------------------------------------------------
  -- 7. RECURRING TRANSACTIONS (Gastos e ingresos fijos recurrentes)
  -- ---------------------------------------------------------------------------
  -- Sueldo mensual
  INSERT INTO public.recurring_transactions (
    user_id, amount, description, category_id, type, account_id,
    frequency, start_date, next_date, paused, tag_ids, currency
  ) VALUES (
    p_user_id, 1450000, 'Sueldo Desarrollador Senior', v_cat_salary, 'income', v_acc_bank_ars,
    'monthly', now() - interval '3 months', now() + interval '22 days', false, ARRAY[v_tag_trabajo, v_tag_fijo], 'ARS'
  ) RETURNING id INTO v_rec_salary;

  -- Alquiler departamento
  INSERT INTO public.recurring_transactions (
    user_id, amount, description, category_id, type, account_id,
    frequency, start_date, next_date, paused, tag_ids, currency
  ) VALUES (
    p_user_id, 420000, 'Alquiler Palermo Soho', v_cat_housing, 'expense', v_acc_bank_ars,
    'monthly', now() - interval '6 months', now() + interval '2 days', false, ARRAY[v_tag_fijo], 'ARS'
  ) RETURNING id INTO v_rec_rent;

  -- Suscripción Spotify + Netflix
  INSERT INTO public.recurring_transactions (
    user_id, amount, description, category_id, type, account_id,
    frequency, start_date, next_date, paused, tag_ids, currency
  ) VALUES (
    p_user_id, 14500, 'Netflix & Spotify Familiar', v_sub_streaming, 'expense', v_acc_card_visa,
    'monthly', now() - interval '8 months', now() + interval '12 days', false, ARRAY[v_tag_fijo], 'ARS'
  ) RETURNING id INTO v_rec_spotify;

  -- ---------------------------------------------------------------------------
  -- 8. RECORDATORIOS DE FACTURAS (Bill Reminders)
  -- ---------------------------------------------------------------------------
  -- 1. Factura de Luz (Pendiente de pago próxima)
  INSERT INTO public.bill_reminders (
    user_id, name, amount, due_date, frequency, category_id, account_id, status, auto_pay
  ) VALUES (
    p_user_id, 'Edenor Electricidad', 28400, now() + interval '4 days', 'monthly', v_cat_services, v_acc_bank_ars, 'pending', true
  );

  -- 2. Expensas Edificio (Vencida - para probar alertas de overdue)
  INSERT INTO public.bill_reminders (
    user_id, name, amount, due_date, frequency, category_id, account_id, status, auto_pay
  ) VALUES (
    p_user_id, 'Expensas Ordinarias', 85000, now() - interval '3 days', 'monthly', v_cat_housing, v_acc_bank_ars, 'overdue', false
  );

  -- 3. Seguro del Auto (Pagado recientemente)
  INSERT INTO public.bill_reminders (
    user_id, name, amount, due_date, frequency, category_id, account_id, status, auto_pay
  ) VALUES (
    p_user_id, 'Seguro Todo Riesgo Zurich', 54000, now() - interval '10 days', 'monthly', v_cat_transport, v_acc_bank_ars, 'paid', true
  );

  -- 4. Cuota Gimnasio (Pendiente a fin de mes)
  INSERT INTO public.bill_reminders (
    user_id, name, amount, due_date, frequency, category_id, account_id, status, auto_pay
  ) VALUES (
    p_user_id, 'Megatlon Membresía Anual', 32000, now() + interval '18 days', 'monthly', v_cat_health, v_acc_card_visa, 'pending', false
  );

  -- ---------------------------------------------------------------------------
  -- 9. PRESUPUESTOS (Budgets) - Mes actual y anterior
  -- ---------------------------------------------------------------------------
  -- Mes actual (extract(month from now()) - 1 porque en JS/DB month es 0-11)
  INSERT INTO public.budgets (user_id, category_id, amount, month, year)
  VALUES
    (p_user_id, v_cat_food,      350000, CAST(extract(month from now()) - 1 AS INT), CAST(extract(year from now()) AS INT)),
    (p_user_id, v_cat_transport, 120000, CAST(extract(month from now()) - 1 AS INT), CAST(extract(year from now()) AS INT)),
    (p_user_id, v_cat_leisure,   180000, CAST(extract(month from now()) - 1 AS INT), CAST(extract(year from now()) AS INT)),
    (p_user_id, v_cat_services,  150000, CAST(extract(month from now()) - 1 AS INT), CAST(extract(year from now()) AS INT)),
    (p_user_id, v_cat_health,     90000, CAST(extract(month from now()) - 1 AS INT), CAST(extract(year from now()) AS INT));

  -- ---------------------------------------------------------------------------
  -- 10. METAS DE AHORRO (Goals)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.goals (
    user_id, name, target_amount, current_amount, deadline, color, icon, completed
  ) VALUES
    (
      p_user_id,
      'Fondo de Emergencia (6 Meses)',
      4500000,
      3100000,
      now() + interval '180 days',
      'bg-emerald-500',
      'shield-check',
      false
    ),
    (
      p_user_id,
      'Vacaciones en Bariloche / Invierno',
      1200000,
      850000,
      now() + interval '90 days',
      'bg-sky-500',
      'plane',
      false
    ),
    (
      p_user_id,
      'Upgrade Monitor 4K',
      600000,
      600000,
      now() - interval '10 days',
      'bg-violet-500',
      'tv',
      true
    );

  -- ---------------------------------------------------------------------------
  -- 11. LISTAS DE COMPRAS (Shopping Lists & Items)
  -- ---------------------------------------------------------------------------
  -- Lista 1: Supermercado Semanal (Activa)
  INSERT INTO public.shopping_lists (
    user_id, name, status, target_account_id, target_category_id
  ) VALUES (
    p_user_id, 'Supermercado Semanal', 'active', v_acc_bank_ars, v_sub_super
  ) RETURNING id INTO v_list_super;

  INSERT INTO public.shopping_list_items (list_id, name, quantity, unit_price, is_checked, sort_order)
  VALUES
    (v_list_super, 'Leche deslactosada 1L', 4, 1450, true, 1),
    (v_list_super, 'Huevos de campo x30', 1, 4800, true, 2),
    (v_list_super, 'Pechugas de pollo 2kg', 2, 8500, false, 3),
    (v_list_super, 'Café en grano tostado 500g', 1, 12000, false, 4),
    (v_list_super, 'Aceite de oliva extra virgen', 1, 9500, false, 5);

  -- Lista 2: Arreglos Hogar (Completada)
  INSERT INTO public.shopping_lists (
    user_id, name, status, target_account_id, target_category_id
  ) VALUES (
    p_user_id, 'Ferretería & Iluminación', 'completed', v_acc_card_visa, v_cat_housing
  ) RETURNING id INTO v_list_ferreteria;

  INSERT INTO public.shopping_list_items (list_id, name, quantity, unit_price, is_checked, sort_order)
  VALUES
    (v_list_ferreteria, 'Lámparas LED Cálidas E27', 6, 2100, true, 1),
    (v_list_ferreteria, 'Pintura Látex Interior 4L', 1, 28000, true, 2),
    (v_list_ferreteria, 'Rodillo y pincel n°20', 1, 6500, true, 3);

  -- ---------------------------------------------------------------------------
  -- 12. WHATSAPP BOT INTEGRATION & MENSAJES
  -- ---------------------------------------------------------------------------
  INSERT INTO public.whatsapp_integrations (
    user_id, phone_number, is_verified, default_account_id, default_currency, auto_confirm_threshold, is_active
  ) VALUES (
    p_user_id, '+5491198765432', true, v_acc_wallet_ars, 'ARS', 0.85, true
  );

  -- Mensaje procesado que originó una transacción
  INSERT INTO public.whatsapp_messages (
    user_id, whatsapp_message_id, direction, message_type,
    text_content, parsed_data, confidence_score, status, created_at
  ) VALUES (
    p_user_id,
    'wamid.dev.001',
    'inbound',
    'text',
    'Gaste 18500 en coto con mercado pago',
    jsonb_build_object('amount', 18500, 'merchant', 'Coto', 'category', 'Alimentación', 'account', 'Mercado Pago'),
    0.95,
    'processed',
    now() - interval '2 days'
  ) RETURNING id INTO v_wa_msg_1;

  INSERT INTO public.whatsapp_messages (
    user_id, whatsapp_message_id, direction, message_type,
    text_content, status, created_at
  ) VALUES (
    p_user_id,
    'wamid.dev.002',
    'outbound',
    'text',
    '¡Listo! Registré tu gasto de $ 18.500,00 en Coto (Alimentación) en Mercado Pago.',
    'processed',
    now() - interval '2 days' + interval '2 seconds'
  ) RETURNING id INTO v_wa_msg_2;

  -- ---------------------------------------------------------------------------
  -- 13. TRANSACCIONES REALISTAS Y VARIADAS
  -- ---------------------------------------------------------------------------

  -- 13.1 Ingreso Principal de Sueldo (mes en curso)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin, tag_ids, note
  ) VALUES (
    p_user_id, 1450000, 'Acreditación Haberes Mensuales', v_cat_salary, now() - interval '8 days', 'income',
    v_acc_bank_ars, 'ARS', 'recurring', ARRAY[v_tag_trabajo, v_tag_fijo], 'Sueldo depósito bancario Galicia'
  );

  -- 13.2 Ingreso Freelance Internacional en USD
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin, tag_ids, note
  ) VALUES (
    p_user_id, 850, 'Cobro Proyecto UI/UX Cliente USA', v_cat_freelance, now() - interval '14 days', 'income',
    v_acc_cash_usd, 'USD', 'manual', ARRAY[v_tag_trabajo, v_tag_dolar], 'Honorarios wire transfer a efectivo'
  );

  -- 13.3 Rendimiento Billetera Virtual (Mercado Pago intereses diarios)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin, tag_ids
  ) VALUES (
    p_user_id, 3450, 'Rendimientos Mercado Fondo', v_cat_investments, now() - interval '1 day', 'income',
    v_acc_wallet_ars, 'ARS', 'manual', ARRAY[v_tag_fijo]
  );

  -- 13.4 Gasto generado por WhatsApp (Coto Supermercado)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    external_reference, tag_ids
  ) VALUES (
    p_user_id, 18500, 'Coto Sucursal Palermo', v_sub_super, now() - interval '2 days', 'expense',
    v_acc_wallet_ars, 'ARS', 'whatsapp_bot', 'wamid.dev.001', ARRAY[v_tag_super]
  ) RETURNING id INTO v_tx_wa;

  UPDATE public.whatsapp_messages SET transaction_id = v_tx_wa WHERE id = v_wa_msg_1;

  -- 13.5 Gasto en Efectivo cotidiano
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin
  ) VALUES (
    p_user_id, 4200, 'Café de especialidad & medialunas', v_sub_restaurants, now() - interval '1 day', 'expense',
    v_acc_cash_ars, 'ARS', 'manual'
  );

  -- 13.6 Combustible YPF con Débito
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin, tag_ids
  ) VALUES (
    p_user_id, 38500, 'YPF Infinia Nafta', v_sub_fuel, now() - interval '4 days', 'expense',
    v_acc_bank_ars, 'ARS', 'manual', ARRAY[v_tag_fijo]
  );

  -- 13.7 Cena Restaurante en Visa con Tarjeta de Crédito
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin, tag_ids
  ) VALUES (
    p_user_id, 45200, 'Cena en La Cabrera', v_sub_restaurants, now() - interval '5 days', 'expense',
    v_acc_card_visa, 'ARS', 'manual', ARRAY[v_tag_vacaciones]
  );

  -- 13.8 Compra en CUOTAS: Monitor / Tecnología (Plan de 3 cuotas en Mastercard Black)
  -- Cuota 1/3 (mes anterior)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    installment_current, installment_total, installment_group_id, note
  ) VALUES (
    p_user_id, 95000, 'Smart TV Samsung 55 (Cuota 1/3)', v_cat_shopping, now() - interval '35 days', 'expense',
    v_acc_card_master, 'ARS', 'manual', 1, 3, 'inst-tv-samsung', 'Compra en cuotas sin interés'
  );

  -- Cuota 2/3 (mes actual)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    installment_current, installment_total, installment_group_id, note
  ) VALUES (
    p_user_id, 95000, 'Smart TV Samsung 55 (Cuota 2/3)', v_cat_shopping, now() - interval '6 days', 'expense',
    v_acc_card_master, 'ARS', 'manual', 2, 3, 'inst-tv-samsung', 'Segunda cuota en resumen actual'
  );

  -- 13.9 Pago de Tarjeta de Crédito (Transferencia / Cancelación de Saldo)
  -- Movimiento 1: Débito en Cuenta Galicia (is_card_payment = true)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    is_card_payment, is_transfer, note
  ) VALUES (
    p_user_id, 180000, 'Pago Resumen Visa Galicia', v_cat_services, now() - interval '12 days', 'expense',
    v_acc_bank_ars, 'ARS', 'manual', true, true, 'Cancelación total resumen anterior'
  );

  -- Movimiento 2: Crédito de balance en la Tarjeta para reducir la deuda
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    is_card_payment, is_transfer, note
  ) VALUES (
    p_user_id, 180000, 'Acreditación Pago Resumen Visa', v_cat_services, now() - interval '12 days', 'income',
    v_acc_card_visa, 'ARS', 'manual', true, true, 'Pago recibido de Banco Galicia'
  );

  -- 13.10 Transferencia entre Cuentas Propias (Billetera a Efectivo)
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    is_transfer, note
  ) VALUES (
    p_user_id, 20000, 'Extracción cajero automático Galicia', NULL, now() - interval '7 days', 'expense',
    v_acc_bank_ars, 'ARS', 'manual', true, 'Extracción para gastos en efectivo'
  );

  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin,
    is_transfer, note
  ) VALUES (
    p_user_id, 20000, 'Ingreso efectivo de cajero', NULL, now() - interval '7 days', 'income',
    v_acc_cash_ars, 'ARS', 'manual', true, 'Efectivo ingresado a billetera'
  );

  -- 13.11 Compra de Farmacia con recibo simulado
  INSERT INTO public.transactions (
    user_id, amount, description, category_id, date, type, account_id, currency, origin, receipt_url, tag_ids
  ) VALUES (
    p_user_id, 14200, 'Farmacity Medicamentos & Vitaminas', v_sub_pharmacy, now() - interval '3 days', 'expense',
    v_acc_wallet_ars, 'ARS', 'manual', 'https://images.unsplash.com/photo-1554415707-9e4426d0292a?w=400', ARRAY[v_tag_fijo]
  );

  RAISE NOTICE '¡Seed data cargado exitosamente para el usuario %!', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- =============================================================================
-- BLOQUE DE EJECUCIÓN INMEDIATA (Para supabase db reset o corrida manual)
-- =============================================================================
DO $$
DECLARE
  v_target_email TEXT := 'dev@impero.local';
  v_user_id      UUID;
BEGIN
  -- 1. Intentar encontrar el usuario existente en auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_target_email
  LIMIT 1;

  -- 2. Si no existe dev@impero.local, buscar el primer usuario registrado en auth.users
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- 3. Si no hay NINGÚN usuario en la base (ej. después de db reset limpio),
  -- crear el usuario de desarrollo 'dev@impero.local' con password 'password123'
  IF v_user_id IS NULL THEN
    v_user_id := 'd0000000-0000-0000-0000-000000000001'::uuid;

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_target_email,
      -- Hash bcrypt para 'password123'
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Pablo Tester","avatar_url":"https://api.dicebear.com/7.x/avataaars/svg?seed=ImperoDev"}'::jsonb,
      now(),
      now()
    );

    -- También insertar identidad en auth.identities para autenticación correcta con Supabase Auth
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_target_email),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider, id) DO NOTHING;
  END IF;

  -- 4. Ejecutar la función de seed para el usuario resuelto
  PERFORM public.seed_dev_data(v_user_id);
END $$;
