# Release Notes - IMPERO (ex-m3)

---

## v0.1.1 - Refactor Integral de UX Móvil y Unificación de Compromisos
**Fecha:** Septiembre 2026

### 🎯 Resumen
Refactor integral de diseño y arquitectura de interfaz para desktop y mobile. Se unificaron los gastos recurrentes y recordatorios de vencimiento bajo el nuevo módulo de Compromisos (`ObligationsManager`), se erradicó el hacinamiento visual en pantallas compactas (<390px) y se optimizó la ergonomía táctil en Categorías, Cuentas y Presupuestos.

### ✨ Mejoras de Experiencia y Arquitectura
- **Gestor Unificado de Compromisos (`ObligationsManager`):**
  - Reemplazo y consolidación definitiva de `BillReminders.tsx` y `RecurringManager.tsx`.
  - Tarjetas en dos niveles con respiro garantizado para montos, nombres largos sin colapso vertical y chips contextuales de workflow (`Débito auto` vs `Pago manual`) y vencimiento.
  - Widget de vencimientos para dashboard (`BillsSummaryWidget.tsx`).
- **Saneamiento de Acciones y Densidad Móvil:**
  - **Categorías (`CategoryManager`):** Eliminación de los 4 botones pegados por fila; integración de botón directo para subcategoría y menú desplegable accesible (`DropdownMenu`) para Editar, Archivar y Eliminar, liberando el 85% del ancho de pantalla.
  - **Cuentas (`AccountManager`):** Reemplazo de la columna vertical de 3 botones por menú contextual accesible (`Ajustar saldo`, `Editar`, `Archivar`).
  - **Presupuestos (`BudgetManager`):** Distribución fluida del header de tarjeta para acomodar insignias de *Rollover* sin desplazar el botón de eliminación.
- **Teclado y Registro Rápido (`QuickAddSheet` & `finance-store`):**
  - Soporte de fecha explícita para transacciones pasadas y futuras.
  - Mayor contraste y visibilidad en la selección rápida de categorías.
- **Carga Masiva de Extractos (`CsvImportSheet`, `excel-parser`, `pdf-statement-parser`):**
  - Soporte universal de importación para extractos bancarios en formatos CSV, XLSX/XLS y PDF.
  - Inserción y sincronización por lotes (batches) en segundo plano para optimizar rendimiento en bases de datos locales y cloud.
- **Acceso a Cuenta & Sesión en Mobile (`BottomNav`, `SettingsPage`):**
  - Acceso directo a Mi Perfil y botón táctil de Cerrar Sesión en el menú lateral móvil y en Ajustes.
  - Mensajería de errores de autenticación 100% traducida al español.
- **Pulido Visual y Ergonómico en Mobile:**
  - `ResponsiveSheet` y `DashboardCardPicker`: Header unificado, botón de cierre táctil circular y eliminación de desbordes en el badge de widgets activos.
  - `ObligationsManager` y `ReportsPage`: Scroll horizontal con salida suave (`w-6`) y padding inferior seguro (`pb-28`) para evitar solapamientos con la barra de navegación fija.
  - `CashFlowForecast`: Eje Y con ticks dinámicos y formateo de unidades escalonado ($0, $1.5k, $10k, $1.2M), erradicando valores repetidos.

---

## v0.1.0 - Primera Versión Pública
**Fecha prevista:** Septiembre 2026

### 🎯 Resumen
Primera versión pública de IMPERO (Administración financiera con visión y propósito): PWA de finanzas personales soberanas, offline-first, multi-moneda y con diseño de alto calibre.

---

### ✨ Funcionalidades principales

#### Core Financiero
- **Multi-moneda:** Soporte nativo para ARS, USD y EUR con tasas de cambio configurables y visualización consolidada del patrimonio en cualquier divisa.
- **Cuentas y saldos:** Gestión completa de cuentas (efectivo, débito, ahorros, inversiones) con balance en tiempo real.
- **Tarjetas de crédito:** Seguimiento de ciclos de resumen, deuda actual, pagos y vista alternativa de saldo negativo.
- **Transacciones:** Alta rápida, edición, categorización con íconos, sistema de etiquetas (tags), búsqueda y filtros avanzados.
- **Transferencias:** Transferencias entre cuentas con soporte multi-moneda y conversión automática.
- **Presupuestos:** Presupuestos mensuales por categoría con seguimiento de progreso, rollover dinámico y sugerencia automática basada en historial.
- **Recurrentes:** Motor de transacciones recurrentes con periodicidad configurable y procesamiento automático al abrir la app.

#### Análisis y Reportes
- **Dashboard modular:** Secciones del home reordenables y activables individualmente (Balance, Cuentas, Net Worth, Velocidad de gasto, Breakdown, Comparativa mensual).
- **Gráfico de patrimonio neto:** Evolución histórica del patrimonio neto a partir de las transacciones reales.
- **Breakdown de gastos:** Distribución visual de gastos por categoría con Recharts.
- **Comparativa mensual:** Comparación de gastos e ingresos respecto al mes anterior.

#### Experiencia y UX
- **Formato de números argentino:** Separador de miles con punto (.) y decimales con coma (,) en toda la app — 5.000.000,00
- **Modo privacidad:** Oculta todos los montos con un toque (atajo tecla H en desktop).
- **Modo oscuro / claro / sistema:** Sincronizado con la preferencia del sistema operativo.
- **Animaciones de número:** Transiciones fluidas al cambiar montos (AnimatedNumber con Framer Motion).
- **PWA completa:** Instalable en iOS y Android, íconos de alta resolución, manifest optimizado, service worker offline-first.
- **Mobile-first:** Ergonomía táctil con touch targets de mínimo 44x44px, safe areas, scroll seguro en modales.

#### Seguridad y Persistencia
- **Supabase Auth:** Autenticación con email/password, sesiones persistentes.
- **RLS en PostgreSQL:** Row Level Security activo en todas las tablas. Cada usuario solo accede a sus propios datos.
- **Sync remota:** Configuración de usuario sincronizada con Supabase; fallback a localStorage para offline.
- **Inputs sanitizados:** Validación con Zod + React Hook Form en todos los formularios.

---

### Bugs corregidos pre-release

| Bug | Detalle |
|-----|---------|
| Deuda de tarjeta sumaba como activo | fetchAccounts ahora garantiza que el balance de tarjetas de crédito sea siempre <= 0, evitando que datos corruptos en DB inviertan el signo y sumen como patrimonio positivo. |
| Balance de nueva tarjeta con valor inesperado | Se aplica safeBalance = -Math.abs(balance) al insertar en Supabase, eliminando posibles errores de floating point o estado de formulario residual. |
| Campo creditCardViewMode faltante al cargar tarjetas | fetchAccounts e insertAccount ahora mapean correctamente credit_card_view_mode desde la DB, evitando que las tarjetas pierdan su modo de visualización al recargar. |
| Formato de números sin separador de miles | Todos los valores numéricos en la app ahora usan el locale es-AR (punto para miles, coma para decimales). Afectaba: balance header, gráficos, cuentas, tarjetas, presupuestos, transferencias, edición de transacciones. |
| Inputs de monto aceptaban solo formato anglosajón | BudgetManager y TransferSheet ahora usan formatThousandsInput / parseThousandsInput para manejar entradas como 1.500,50. |

---

### Stack Técnico
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui + Radix UI + Framer Motion
- Supabase (PostgreSQL + Auth + RLS)
- Recharts para visualizaciones
- Vitest + Testing Library

---

### Pendiente para próximas versiones (Backlog)
Ver BACKLOG.md para el detalle completo.

---

*Generado automáticamente - IMPERO by PJR*
