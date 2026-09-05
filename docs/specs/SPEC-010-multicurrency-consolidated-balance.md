# SPEC-010: Soporte Multi-Moneda y Balance Patrimonial Consolidado (P8)

## 1. Contexto & Diagnóstico
Actualmente **m3** opera con una única moneda base asumida de forma global por usuario (ARS por defecto en la interfaz). En economías con alta inflación o para usuarios freelancers, nómadas digitales o ahorristas con posiciones en moneda dura (USD billete, dólar MEP, EUR, criptoactivos USDT/USDC), esta restricción fragmenta la realidad financiera del usuario obligándolo a llevar cálculos paralelos o a ignorar sus activos en moneda extranjera.

Tanto **Mobills** como especialmente **Wallet by BudgetBakers** destacan por resolver esto permitiendo que cada cuenta posea su propia divisa nativa y totalizando el patrimonio neto en una moneda de referencia seleccionada por el usuario.

---

## 2. Objetivos & Requisitos de Producto
1. **Divisa a Nivel de Cuenta:**
   - Cada cuenta en `public.accounts` debe tener un campo `currency` (ej: `'ARS' | 'USD' | 'EUR' | 'USDT' | string`).
   - El saldo actual de la cuenta (`balance`) se expresa siempre en su divisa nativa.
2. **Tabla / Almacén de Cotizaciones de Referencia:**
   - Tabla o preferencias locales con tasas de cambio (`exchange_rates`):
     - Par de divisas (ej. `USD/ARS`, `EUR/ARS`).
     - Tasa de compra/venta o referencia.
     - Fecha de última actualización y origen (manual o fetch desde APIs públicas como DolarApi / Open Exchange Rates).
3. **Selector de Moneda Consolidada en Header / Dashboard:**
   - Switcher en el Dashboard (ej: `Consolidar en: [ARS | USD]`).
   - El `BalanceHeader` convierte los saldos de todas las cuentas a la divisa de visualización elegida sumando el total patrimonial neto de forma instantánea.
4. **Transacciones Multi-Moneda:**
   - Al registrar un gasto o ingreso, se toma por defecto la divisa de la cuenta seleccionada.
   - Posibilidad de registrar transferencias entre cuentas de distinta divisa especificando tipo de cambio implícito (ej. compra de USD con débito en ARS).

---

## 3. Arquitectura y Componentes Involucrados

### A. Base de Datos & Migraciones Supabase
- **Tabla `public.accounts`:**
  - Agregar columna `currency text NOT NULL DEFAULT 'ARS'`.
- **Tabla `public.exchange_rates`:**
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id uuid REFERENCES auth.users NOT NULL`
  - `base_currency text NOT NULL`
  - `target_currency text NOT NULL`
  - `rate numeric(15, 6) NOT NULL`
  - `updated_at timestamptz DEFAULT now()`
  - RLS activado con políticas por `auth.uid()`.

### B. Capa de Servicios & Hooks
- `src/services/currency.service.ts`:
  - CRUD de tasas de cambio y consulta de endpoints públicos de cotización.
- `src/hooks/useCurrencyConversion.ts`:
  - Hook con memoización para convertir cualquier monto `(amount, fromCurrency, toCurrency) => number`.

### C. Componentes de UI
- `src/components/BalanceHeader.tsx`:
  - Selector desplegable de moneda de visualización (`ARS`, `USD`, `EUR`).
  - Desglose secundario de saldos nativos por divisa debajo del total patrimonial.
- `src/components/AccountManager.tsx`:
  - Selector de divisa en el alta y edición de cuentas con insignia visual del código de moneda.
- `src/components/TransferSheet.tsx`:
  - Manejo de arbitraje / tipo de cambio en transferencias bimonetarias.

---

## 4. Criterios de Aceptación (DoD)
- [ ] Las cuentas con moneda extranjera muestran claramente el símbolo y código ISO (`USD $1.500,00`).
- [ ] El patrimonio total en el Header refleja la suma ponderada por el tipo de cambio seleccionado.
- [ ] Transferencias entre cuentas con distinta divisa actualizan ambos balances de forma exacta.
- [ ] Compilación TypeScript limpia (`tsc --noEmit`) y build sin regresiones.
