# SPEC-011: Proyección de Flujo de Caja y Forecast a 30/60/90 días (P9)

## 1. Contexto & Diagnóstico
La mayoría de las herramientas de finanzas personales solo miran hacia atrás (reportando en qué se gastó el dinero el mes pasado). La principal ventaja de soluciones como **Wallet by BudgetBakers** y **Mobills** radica en su capacidad para mirar hacia el futuro respondiendo la pregunta que genera mayor estrés financiero: *"¿Voy a tener suficiente dinero para pagar las tarjetas y facturas que vencen este mes o entraré en sobregiro?"*.

**m3** ya cuenta con datos clave: saldos líquidos de cuentas, recordatorios de facturas (`BillReminders`), gastos recurrentes (`RecurringManager`) y compras en cuotas diferidas de tarjetas de crédito (`CreditCardManager`). Este spec unifica estas fuentes en un motor de previsión matemática temporal.

---

## 2. Objetivos & Requisitos de Producto
1. **Línea de Saldo Proyectada (Forecast Engine):**
   - Proyectar el saldo disponible día por día durante los próximos 30, 60 y 90 días partiendo de:
     $$\text{Saldo Proyectado}_t = \text{Saldo Líquido Actual} + \sum \text{Ingresos Recurrentes}_t - \sum \text{Gastos Recurrentes}_t - \sum \text{Cuotas Tarjetas}_t - \sum \text{Facturas Programadas}_t$$
2. **Visualización Gráfica Interactiva (Recharts):**
   - Gráfico de área/línea continuo que muestra la trayectoria del balance futuro.
   - Puntos de hito (tooltips enriquecidos) al pasar sobre días con vencimientos importantes (sueldo, liquidación de tarjeta de crédito, alquiler).
3. **Detector Temprano de Riesgo de Sobregiro:**
   - Si en algún punto de la curva temporal el saldo cae por debajo de cero (o por debajo de un umbral de seguridad definido por el usuario), la curva cambia a color rojo de advertencia y se notifica con la fecha exacta del déficit estimado.
4. **Filtro por Escenario:**
   - Selector de alcance: Próximos 30 días, 60 días o 90 días.
   - Posibilidad de simular un gasto puntual futuro para evaluar el impacto en la liquidez.

---

## 3. Arquitectura y Componentes Involucrados

### A. Motor de Cálculo (`src/lib/cashflow-forecast.ts`)
- Función pura que recibe:
  - Cuentas líquidas (excluyendo tarjetas de crédito con balance adeudado).
  - Array de transacciones recurrentes activas (`recurring_transactions`).
  - Array de facturas/recordatorios pendientes (`bill_reminders`).
  - Array de cuotas diferidas de tarjetas en los periodos futuros (`credit_cards` e `installments`).
- Genera un dataset temporal indexado por fecha `Array<{ date: string, balance: number, events: Array<{ name: string, amount: number, type: 'in' | 'out' }> }>`.

### B. Componentes de UI
- `src/components/CashFlowForecast.tsx`:
  - Contenedor con `ResponsiveContainer` de Recharts (línea de tiempo con gradiente dinámico).
  - Pestañas de rango: `30D`, `60D`, `90D`.
  - Tarjeta resumen con: "Saldo mínimo proyectado", "Fecha crítica", "Ingresos esperados" y "Egresos comprometidos".
- Integración en `src/pages/Index.tsx` o como sección destacada en `src/components/ReportsPage.tsx`.

---

## 4. Criterios de Aceptación (DoD)
- [ ] La proyección toma en cuenta con precisión las fechas de vencimiento de las tarjetas de crédito configuradas en `CreditCardManager`.
- [ ] No considera las cuentas de tipo deuda o crédito como saldo positivo disponible (solo cuentas líquidas: checking, savings, cash).
- [ ] El gráfico es completamente fluido, responsivo y adaptativo en pantallas móviles.
- [ ] Validación con tests unitarios para escenarios con y sin eventos recurrentes.
