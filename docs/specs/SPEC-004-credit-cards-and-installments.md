# SPEC-004: Tarjetas de Crédito & Gestión de Cuotas (P2)

## 1. Contexto & Diagnóstico
La compra en cuotas (3, 6, 12, 18) es un patrón financiero central. En la implementación actual, un gasto de `$120.000` en 6 cuotas se registra como un solo movimiento en el mes corriente, lo que destruye la precisión del flujo de caja futuro y el cálculo de la deuda real en la tarjeta.
Además, las cuentas de tipo `credit` tienen campos ya presentes en la base de datos (`credit_limit`, `closing_day`, `payment_day`, `brand`), pero falta la lógica para calcular resúmenes y proyecciones mensuales.

---

## 2. Objetivos
1. **Compras en Cuotas (`Installments`)**:
   - Al registrar un gasto en una cuenta de tipo `credit`, permitir ingresar cantidad de cuotas ($N$).
   - Generar la serie de transacciones futuras vinculadas mediante un identificador de grupo (`installment_group_id`), indicando `cuota X de N`.
   - Fecha de cada cuota calculada automáticamente según el día de cierre de la tarjeta (`closing_day`).
2. **Resumen de Tarjeta (Cierre & Vencimiento)**:
   - Determinar qué transacciones pertenecen al resumen actual (antes de la fecha de cierre) y cuáles ingresan en el próximo resumen.
   - Mostrar días restantes hasta el cierre y hasta el vencimiento del pago.
3. **Control del Límite de Crédito**:
   - Barra de utilización de límite: `Límite Total`, `Saldo Consumido`, `Límite Disponible`.
4. **Pago de Resumen**:
   - Acción de "Pagar Tarjeta": genera una transferencia o cancelación desde una cuenta monetaria (ej. Caja de Ahorro) hacia la cuenta de la tarjeta.

---

## 3. Arquitectura y Componentes Involucrados

### A. Esquema de Base de Datos (`public.transactions`)
- Ya dispone de:
  - `installments_total INTEGER`
  - `installment_number INTEGER`
  - `account_id UUID REFERENCES accounts(id)`
- Se añade o estandariza:
  - `installment_group_id UUID` (para agrupar todas las cuotas de una misma compra y permitir cancelaciones/ediciones en serie).

### B. Lógica de Negocio (`src/lib/credit-card-utils.ts` & `src/services/transactions.service.ts`)
- Función `calculateInstallmentDates(purchaseDate: Date, closingDay: number, installmentsCount: number): Date[]`:
  - Si `purchaseDate.getDate() > closingDay`, la primera cuota entra en el resumen del mes subsiguiente.
  - Genera $N$ fechas correspondientes a los periodos de liquidación.
- `createInstallmentPurchase(txData: Omit<Transaction, "id">, installments: number)`:
  - Inserta las $N$ cuotas dividiendo el monto total entre $N$ (manejando centavos residuales en la primera cuota).

### C. Vistas y Componentes (`src/components/CreditCardManager.tsx`)
- Tablero visual de cada tarjeta:
  - Brand (Visa, Mastercard, Amex, Cabal).
  - Fecha de próximo cierre y próximo vencimiento.
  - Consumos del periodo actual vs. consumos diferidos en cuotas futuras.
  - Listado de compras en cuotas con progreso visual (`Cuota 2/6`).

---

## 4. Plan de Verificación & Compliance
1. **Tests Unitarios**:
   - Test en `credit-card-utils.test.ts`: verificar cálculo de fechas antes y después del día de cierre.
   - Test de división de montos y redondeos de cuotas.
2. **Validación de Compliance**:
   - `node scripts/check-all.cjs` pasando al 100%.
