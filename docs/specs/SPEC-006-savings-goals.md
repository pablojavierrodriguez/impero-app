# SPEC-006: Metas de Ahorro y Fondos de Emergencia (P4)

## 1. Contexto & Diagnóstico
`m3` dispone de la tabla `public.goals` y el componente `GoalsManager.tsx`. Sin embargo, actualmente las metas funcionan como registros aislados de información donde el usuario ingresa un saldo acumulado manualmente, en lugar de interactuar financieramente con sus cuentas reales (ej. debitar $50.000 de Banco Galicia y acreditarlo al objetivo "Fondo de Emergencia").

---

## 2. Objetivos
1. **Aportes y Retiros Reales**:
   - Botón "Aportar a la Meta": genera un egreso o transferencia interna desde una cuenta seleccionada hacia la meta.
   - Botón "Retirar": reincorpora fondos de la meta a una cuenta monetaria.
2. **Historial de Movimientos de la Meta**:
   - Registro de cada contribución con fecha, monto y cuenta de origen.
3. **Proyecciones y Ritmo de Ahorro**:
   - Si la meta tiene fecha límite (`deadline`), calcular el aporte mensual recomendado:
     $$\text{Aporte Mensual} = \frac{\text{Monto Objetivo} - \text{Monto Actual}}{\text{Meses Restantes}}$$
4. **Celebración y Estado de Finalización**:
   - Feedback visual festivo al alcanzar el 100% de la meta.

---

## 3. Arquitectura y Componentes Involucrados

### A. Base de Datos (`public.goals` y transacciones)
- `public.goals`:
  - `id`, `user_id`, `name`, `target_amount`, `current_amount`, `color`, `icon`, `deadline`.
- Soporte para transacciones con `goal_id UUID REFERENCES goals(id)` para trazabilidad de aportes.

### B. Servicio de Metas (`src/services/goals.service.ts`)
- `contributeToGoal(goalId: string, fromAccountId: string, amount: number)`:
  - Transacción atómica en base de datos o llamada coordinada:
    1. Descuenta `balance` en `accounts`.
    2. Incrementa `current_amount` en `goals`.
    3. Registra movimiento en `transactions` con tipo de transferencia hacia la meta.

### C. Componentes de UI (`src/components/GoalsManager.tsx`)
- Card visual de meta con progreso circular o lineal animado.
- Modal ergonómico para aportar fondos en 2 toques (monto + selector de cuenta).
- Indicador de ritmo: "A este paso llegarás en [Mes/Año]".

---

## 4. Plan de Verificación & Compliance
1. **Tests Unitarios**:
   - Test de lógica de aportes: balance de cuenta decrementado y meta incrementada en el mismo valor exacto.
2. **Validación de Compliance**:
   - `node scripts/check-all.cjs` pasando al 100%.
