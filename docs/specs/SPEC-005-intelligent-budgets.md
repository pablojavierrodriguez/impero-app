# SPEC-005: Presupuestos Inteligentes & Alertas de Desvío (P3)

## 1. Contexto & Diagnóstico
Actualmente los presupuestos se definen en `BudgetManager.tsx` por categoría y mes, pero carecen de contextualización temporal dinámica (velocidad de gasto respecto al día del mes transcurrido) y de alertas proactivas antes de que el usuario exceda el límite pactado.

---

## 2. Objetivos
1. **Presupuestos Mensuales & Recurrentes**:
   - Definir límites por categoría principal y opción de renovar automáticamente cada mes.
2. **Métrica de Velocidad de Gasto (`Burn Rate / Velocity`)**:
   - Comparar el `% de presupuesto consumido` contra el `% del mes transcurrido`.
   - Si en el día 10 del mes (33% del tiempo) ya se consumió el 60% del presupuesto de Alimentación, indicar estado de alerta temprana.
3. **Semáforo Visual de Salud de Categoría**:
   - 🟢 **Verde** (< 75% y velocidad adecuada): Dentro de los límites planificados.
   - 🟡 **Amarillo** (75% - 99% o velocidad acelerada): Advertencia preventiva.
   - 🔴 **Rojo** (>= 100%): Presupuesto superado con indicador del monto excedente.
4. **Sugerencia de Presupuestos Basada en Historial**:
   - Opción de autorellenar presupuestos basados en el promedio de gasto de los últimos 3 meses.

---

## 3. Arquitectura y Componentes Involucrados

### A. Capa de Servicios (`src/services/budgets.service.ts`)
- Mapeo contra la tabla `public.budgets`.
- Consultas agregadas del gasto mensual acumulado por categoría:
  - `SELECT category_id, SUM(amount) FROM transactions WHERE type = 'expense' AND date BETWEEN start_of_month AND end_of_month GROUP BY category_id`.

### B. Capa de Cálculo & Helpers (`src/lib/budget-utils.ts`)
- Funciones puras para cálculo de métricas:
  - `calculateBudgetVelocity(spent: number, limit: number, date: Date)`: devuelve ritmo estimado de fin de mes.
  - `getBudgetStatusColor(spent: number, limit: number)`: devuelve tokens semánticos de Tailwind.

### C. Componentes de UI (`src/components/BudgetManager.tsx` & `VelocityBar.tsx`)
- Integración en la pantalla principal y en la pestaña de presupuestos:
  - Barra de progreso interactiva con marcador del día actual del mes.
  - Indicador de saldo disponible por día restante (`Te quedan $X por día`).

---

## 4. Plan de Verificación & Compliance
1. **Tests Unitarios**:
   - Probar cálculo de porcentajes y días restantes en meses bisiestos y de 30/31 días.
2. **Validación de Compliance**:
   - `node scripts/check-all.cjs` pasando al 100%.
