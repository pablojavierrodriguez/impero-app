# SPEC-020: Convergencia Definitiva m3 — Excelencia Mobills + Potencia Wallet + Innovación Propia

## 1. Visión y Diagnóstico de Competencia

### El Problema
- **Mobills:** Sobresale en la ergonomía de tarjetas de crédito (facturas abiertas/cerradas, cuotas reales, arrastre de deuda), navegación histórica fluida y estética visual. Sin embargo, su modelo de suscripción es sumamente costoso, sus filtros y buscador son limitados y su importación de datos es estática y sin automatizaciones.
- **Wallet (BudgetBakers):** Excelente para listas de compras calculadas (`Shopping List`), gastos fijos/planificados, grupos compartidos y reglas de automatización. Sin embargo, restringe severamente categorías, prohíbe el registro de gastos futuros o cuotas reales diferidas, el flujo de edición tras registrar es engorroso y no modela tarjetas con fecha de cierre/vencimiento (las trata como meras cuentas).
- **m3 (Money Master):** Nace con una ventaja tecnológica superior (Supabase PostgreSQL + RLS, PWA Offline-first, motor de IA con WhatsApp Bot, y soporte multi-moneda). El objetivo es cerrar los gaps ergonómicos y funcionales para ser la herramienta definitiva.

---

## 2. Pilares de la Solución (Target Architecture)

```
       ┌────────────────────────────────────────────────────────┐
       │             m3: THE DEFINITIVE MONEY APP               │
       └──────────────────────────┬─────────────────────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
┌─────▼──────────────┐  ┌─────────▼─────────────┐  ┌──────────▼──────────────┐
│  EXPERIENCIA       │  │  LO MEJOR             │  │  FACTORES WOW           │
│  MOBILLS           │  │  DE WALLET            │  │  EXCLUSIVOS m3          │
├────────────────────┤  ├───────────────────────┤  ├─────────────────────────┤
│• Ciclo de Tarjetas │  │• Shopping Lists       │  │• Bot WhatsApp Nativo    │
│  (cierre / vto)    │    (ítems, qty, cálculo, │    (IA texto, voz, fotos)  │
│• Cuotas diferidas  │    checkout -> gasto)    │• Curva Cashflow Predictivo │
│• Pago de resumen   │• Gastos futuros &        │  (alerta de descubierto)   │
│  parcial/acumulado │    planificados          │• Modo Bimonetario Real     │
│• Desglose visual y │• Motor de reglas auto    │  (ARS/USD/MEP/Cripto)      │
│  edición ágil      │• Tags multidimensionales │• Búsqueda instantánea      │
└────────────────────┘  └───────────────────────┘  └─────────────────────────┘
```

---

## 3. Especificaciones Funcionales por Módulo

### Módulo A: Tarjetas de Crédito & Cuotas (Superando a Mobills)
1. **Ciclos de Facturación:**
   - Período actual abierto vs. períodos pasados cerrados vs. proyecciones futuras.
   - Cálculo automático del resumen a pagar según día de cierre y vencimiento configurados.
2. **Cuotas y Gastos Futuros:**
   - Toda compra en $N$ cuotas distribuye automáticamente el impacto mes a mes.
   - Posibilidad de registrar gastos con fecha futura sin restricciones.
3. **Liquidación Flexible (Pago de Tarjeta):**
   - Modal de pago con opciones: **Pago Total**, **Pago Mínimo**, o **Monto Personalizado**.
   - Si se paga menos del total, el saldo remanente se acumula como deuda para el siguiente resumen con tasa opcional de interés.

### Módulo B: Shopping List Inteligente (Lo mejor de Wallet, pero conectado)
1. **Gestor de Listas de Compras:**
   - Creación de listas temáticas (ej: "Supermercado Mensual", "Farmacia", "Ferretería").
   - Ítems con: `nombre`, `cantidad`, `precio_unitario`, `total_calculado`, `tildado/comprado`, `categoría sugerida`.
2. **Checkout a Gasto en 1 Clic:**
   - Durante la compra, el usuario va tildando lo que pone en el changuito y ajustando importes reales.
   - Botón *"Completar Compra y Registrar Gasto"*: genera automáticamente la transacción en `public.transactions` debitando de la cuenta o tarjeta elegida con el desglose o ticket adjunto.

### Módulo C: Búsqueda y Filtros de Alta Velocidad (Superando a Mobills)
1. **Filtros Multi-Criterio Combinados:**
   - Búsqueda por texto (concepto o nota).
   - Rango de fechas libre y presets rápidos (Hoy, Esta semana, Este mes, Mes anterior, Año actual).
   - Filtro por Cuentas / Tarjetas, Categorías, Tags, Rango de montos (min/max), y Tipo (Ingreso / Gasto / Transferencia / Pago de Tarjeta).
2. **Búsqueda Instantánea con Chips Dinámicos:**
   - Remoción rápida de filtros activos en 1 toque.

### Módulo D: Edición Integral de Transacciones (Eliminando la frustración de Wallet)
1. **Edición Total:** Modificación irrestricta de monto, fecha, cuenta, categoría, notas, tags, comprobante adjunto y recálculo automático de saldos involucrados.

---

## 4. Requisitos de Base de Datos (Supabase Schema)

### Nueva Tabla: `public.shopping_lists`
```sql
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  total_estimated NUMERIC NOT NULL DEFAULT 0,
  target_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  target_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shopping lists" ON public.shopping_lists 
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
```

### Nueva Tabla: `public.shopping_list_items`
```sql
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shopping list items" ON public.shopping_list_items 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND sl.user_id = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND sl.user_id = (select auth.uid()))
  );
```

---

## 5. Criterios de Aceptación (DoD)
- [ ] Tarjetas con soporte completo para pago total, parcial y arrastre de saldo adeudado.
- [ ] Creación, edición y checkout de listas de compras directamente imputadas al balance.
- [ ] Búsqueda y filtrado de transacciones sin lags, con chips descartables y presets de fecha.
- [ ] Edición integral de cualquier transacción existente sin bloqueos.
- [ ] Cero errores de compilación (`npx tsc --noEmit && npm run build`).
- [ ] Diseño 100% Mobile-first con tap targets >= 44px y dark mode premium.
