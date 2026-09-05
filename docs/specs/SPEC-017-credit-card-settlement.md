# SPEC-017: Flujo Unificado de Conciliación y Pago de Tarjeta de Crédito (P15)

## 1. Contexto & Diagnóstico
La gestión de tarjetas de crédito en aplicaciones de finanzas personales suele ser confusa y fragmentada.
- **Problema en flujos tradicionales:** Cuando la tarjeta llega a su fecha de cierre y se emite el resumen mensual, el usuario normalmente tiene que ir al módulo de transferencias, seleccionar la cuenta de origen (ej. caja de ahorros bancaria), seleccionar la tarjeta de crédito como destino, tipear a mano el importe adeudado y confirmar.
- **Fricción cognitiva:** Este proceso manual es propenso a errores de tipeo, genera duplicación de pasos y no actualiza explícitamente el estado del período cerrado de la tarjeta como "Pagado".

Tanto **Mobills** como **Wallet** cuentan con un botón contextual *"Pagar Resumen"* que realiza la compensación contable en una sola acción atómica.

---

## 2. Objetivos & Requisitos de Producto
1. **Acción Contextual de Pago en 1 Clic:**
   - Botón *"Pagar Resumen"* visible directamente en:
     - El componente de administración de tarjetas (`CreditCardManager.tsx`).
     - La fila de resumen agrupado en el historial de transacciones (`StatementGroupRow` en `TransactionList.tsx`).
2. **Modal de Liquidación Directa:**
   - Pre-completa el monto exacto adeudado del período cerrado.
   - Permite seleccionar con un toque la cuenta líquida desde la cual se debitarán los fondos.
   - Ofrece opción de pago total o pago parcial personalizado.
3. **Compensación Contable Atómica:**
   - Ejecuta la transferencia de fondos entre la cuenta de origen y la tarjeta de crédito.
   - Reduce la deuda de la tarjeta e incrementa el límite de crédito disponible.
   - Marca visualmente el resumen del período como cancelado/pagado.

---

## 3. Arquitectura y Componentes Involucrados

### A. Gestor de Tarjetas (`src/components/CreditCardManager.tsx`)
- Extensión de la vista `pay`:
  - `openPay(card: Account, statementAmount?: number)`
  - Selector de cuenta de origen con saldos disponibles actualizados.
  - Invocación de `onPayCard(cardId, fromAccountId, amount)`.

### B. Fila de Resumen en Lista de Transacciones (`src/components/TransactionList.tsx`)
- Integración en `StatementGroupRow`:
  - Botón de acción rápida al lado del total adeudado para abrir el flujo de pago directo si la tarjeta cuenta con saldo negativo.

### C. Store de Finanzas (`src/lib/finance-store.ts`)
- Función de liquidación de tarjeta (`payCreditCard` o `transferBetweenAccounts` con metadatos de conciliación).

---

## 4. Criterios de Aceptación (DoD)
- [x] El usuario puede iniciar el pago del resumen de su tarjeta de crédito desde el módulo de tarjetas o desde el historial agrupado.
- [x] El monto adeudado del ciclo se pre-carga automáticamente sin requerir cálculo manual.
- [x] Al confirmar, se debita el importe de la cuenta bancaria de origen y se salda el balance de la tarjeta.
- [x] La interfaz refleja de inmediato la recuperación del límite disponible de la tarjeta.
- [x] Validación sin errores de tipado o runtime con `npx tsc --noEmit && npm run build`.
