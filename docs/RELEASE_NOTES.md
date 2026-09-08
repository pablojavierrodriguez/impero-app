# Release Notes — IMPERO (ex-m3)

---

## v0.1.0 — Primera Versión Pública
**Fecha prevista:** Septiembre 2026

### 🎯 Resumen
Primera versión pública de IMPERO (Autogobierno • Claridad • Soberanía): PWA de finanzas personales soberanas, offline-first, multi-moneda y con diseño de alto calibre.

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

*Generado automáticamente — IMPERO by PJR*
