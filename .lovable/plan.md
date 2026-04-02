
## Estado actual vs Mobills Premium — Plan de implementación

### ✅ YA IMPLEMENTADO
- Registro de ingresos y gastos con categorías e íconos
- Múltiples cuentas (checking, savings, cash)
- Tarjetas de crédito con cierre/vencimiento y estados de cuenta
- Transferencias entre cuentas
- Categorías personalizables (crear, editar, archivar, subcategorías)
- Filtros de transacciones (por tipo, categoría, cuenta, rango de fecha)
- Importación CSV
- Gráficos de gastos (barras, área, pie)
- Configuración de moneda, idioma, secciones del home
- Velocímetro de gasto diario

### 🔴 FALTANTES — Organizados por prioridad

#### FASE 1: Presupuestos por categoría (core de Mobills)
- **Presupuestos mensuales por categoría**: Definir límite de gasto mensual por categoría
- **Barra de progreso visual** en cada categoría mostrando gastado vs presupuesto
- **Alertas** cuando se alcanza 80% y 100% del presupuesto
- **Vista resumen** de todos los presupuestos del mes con estado

#### FASE 2: Metas de ahorro (Goals)
- **Crear metas** con nombre, monto objetivo, fecha límite, ícono y color
- **Aportar/retirar** fondos a una meta
- **Progreso visual** (barra + porcentaje)
- **Vista de todas las metas** activas y completadas

#### FASE 3: Transacciones recurrentes
- **Marcar transacción como recurrente** (diaria, semanal, quincenal, mensual, anual)
- **Auto-generación** de transacciones según la frecuencia
- **Gestión de recurrentes**: pausar, editar, eliminar serie
- **Vista de próximos vencimientos**

#### FASE 4: Recordatorios de cuentas a pagar (Bill Reminders)
- **Crear recordatorio** con nombre, monto, fecha de vencimiento, frecuencia
- **Estado**: pendiente, pagado, vencido
- **Notificaciones visuales** en el dashboard (badge con cantidad pendiente)
- **Marcar como pagado** genera automáticamente la transacción

#### FASE 5: Reportes y análisis avanzados
- **Reporte mensual completo**: ingresos vs gastos, balance, tendencia
- **Gráfico de evolución mensual** (últimos 6-12 meses)
- **Comparativa mes a mes** (gastaste X% más/menos que el mes anterior)
- **Flujo de caja** (cash flow): visualización de entradas vs salidas por período
- **Top categorías** de gasto con ranking
- **Exportar reporte** a CSV/PDF

#### FASE 6: Etiquetas (Tags)
- **Sistema de tags** en transacciones (ej: "viaje", "trabajo", "fijo")
- **Filtrar por tags** en el historial
- **Gestión de tags**: crear, editar, eliminar
- **Reportes por tag**

#### FASE 7: Adjuntos y notas
- **Adjuntar foto de recibo/comprobante** a una transacción
- **Notas extendidas** en transacciones
- **Galería de comprobantes** por cuenta/período

#### FASE 8: Mejoras de UX (paridad con Mobills)
- **Búsqueda global** de transacciones por texto
- **Ordenar transacciones** por monto, fecha, categoría
- **Duplicar transacción** rápida
- **Transacciones en cuotas** (installments): dividir un gasto en N cuotas mensuales en tarjeta
- **Balance proyectado**: saldo futuro considerando recurrentes y vencimientos
- **Modo oscuro / claro** toggle
- **Onboarding**: wizard inicial para configurar moneda, cuentas y categorías

#### FASE 9: Dashboard mejorado
- **Resumen del mes** en el home: presupuesto usado, metas, vencimientos próximos
- **Widget de gastos de hoy/semana**
- **Indicador de salud financiera** (score simple basado en presupuestos y metas)
- **Gráfico de tendencia** inline en el dashboard

---

### Orden de ejecución sugerido
1. Presupuestos por categoría ← impacto alto, es el core de Mobills
2. Transacciones recurrentes ← muy usado
3. Metas de ahorro ← diferenciador premium
4. Recordatorios/vencimientos
5. Reportes avanzados
6. Tags + Adjuntos
7. Mejoras UX (cuotas, búsqueda, dark mode)
8. Dashboard mejorado

Cada fase es independiente y se puede implementar incrementalmente.
