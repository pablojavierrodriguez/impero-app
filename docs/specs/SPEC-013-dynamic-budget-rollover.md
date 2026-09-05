# SPEC-013: Presupuestos con Rollover Dinámico y Subcategorías (P11)

## 1. Contexto & Diagnóstico
Actualmente en **m3** los presupuestos mensuales (`BudgetManager.tsx`) son estancos: al comenzar un nuevo mes calendario, el presupuesto se reinicia al monto base fijado.

En la psicología financiera real (patrón de oro en **Mobills** y metodologías como YNAB), los meses no son idénticos. Si en marzo un usuario presupuestó $50.000 para Salidas y solo gastó $30.000, los $20.000 sobrantes deberían poder **acumularse como premio para abril** (Rollover positivo) o derivarse hacia una **meta de ahorro** con un solo toque. Inversamente, si un mes se sobregiró levemente, el déficit debería compensarse en el mes siguiente.

---

## 2. Objetivos & Requisitos de Producto
1. **Configuración de Rollover por Presupuesto:**
   - Cada presupuesto puede activar la opción `enable_rollover: boolean`.
2. **Cálculo de Saldo Acumulado:**
   - $$\text{Presupuesto Efectivo del Mes} = \text{Monto Base} + \text{Remanente del Mes Anterior}$$
   - Indicador visual claro del desglose: *"Base: $50.000 + Rollover acumulado: $20.000 = Total disponible: $70.000"*.
3. **Acción de Derivación a Metas de Ahorro:**
   - Al finalizar el mes, si hay superávit en categorías con rollover o sin él, ofrecer un prompt inteligente: *"¿Querés enviar los $15.000 no gastados en Restaurantes a tu meta 'Vacaciones'?"*.
4. **Soporte de Subcategorías en Presupuestos:**
   - Permitir asignar presupuestos detallados a subcategorías específicas (ej. dentro de "Transporte", presupuestar puntualmente "Combustible" o "Peajes").

---

## 3. Arquitectura y Componentes Involucrados

### A. Base de Datos Supabase
- Modificar tabla `public.budgets`:
  - Agregar columna `enable_rollover boolean DEFAULT false`.
  - Agregar columna `accumulated_rollover numeric(12,2) DEFAULT 0.00`.
  - Permitir `subcategory_id uuid REFERENCES public.subcategories NULL`.

### B. Helpers de Negocio (`src/lib/budget-utils.ts`)
- Función para calcular el remanente del mes previo:
  `calculateMonthlyRollover(budget: Budget, previousMonthSpent: number): number`

### C. Componentes de UI
- `src/components/BudgetManager.tsx`:
  - Switch interactivo para habilitar "Rollover automático".
  - Badge visual en la tarjeta del presupuesto: `+ $X transferidos del mes anterior`.
  - Botón directo para "Mover remanente a Meta de Ahorro".

---

## 4. Criterios de Aceptación (DoD)
- [ ] El remanente del mes anterior se computa y refleja fielmente en el disponible del nuevo periodo.
- [ ] Si se deshabilita el rollover, el presupuesto vuelve inmediatamente a su valor nominal base.
- [ ] Las barras de progreso y la velocidad de gasto (`VelocityBar`) se calculan sobre el presupuesto total disponible.
- [ ] Sin regresiones en los componentes existentes de presupuestos.
