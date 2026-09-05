# Discovery & Evaluación Competitiva: m3 vs. Mobills Premium & Wallet by BudgetBakers

**Fecha:** Septiembre 2026  
**Líderes de Análisis:** Market & UX Researcher + PM Orchestrator  
**Objetivo:** Contrastar el estado actual de **m3 (Money Master)** frente a las dos soluciones líderes globales/regionales en finanzas personales móviles (**Mobills Premium** y **Wallet Premium by BudgetBakers**), identificar ventajas competitivas, faltantes críticos y definir el backlog de los próximos sprints (P8 a P12).

---

## 1. Perfil de los Contendientes

| Dimensión | **m3 (Money Master)** | **Mobills Premium** | **Wallet by BudgetBakers** |
| :--- | :--- | :--- | :--- |
| **Arquetipo** | PWA Offline-first + Supabase + IA Multimodal | App Móvil Nativa (Brasil/Global) orientada a presupuestos y tarjetas | App Móvil/Web Fintech (Europa/Global) orientada a sincronización bancaria multi-cuenta |
| **Público Objetivo** | Usuarios que buscan control total, cero fricción de registro (WhatsApp/IA), cuotas reales y privacidad | Familias y personas con alto uso de tarjetas de crédito y presupuestos mensuales estrictos | Usuarios con múltiples cuentas bancarias internacionales, inversiones y auditoría financiera |
| **Diferenciador Clave** | **Ingesta sin fricción vía WhatsApp + IA** (audio, foto de ticket, lenguaje natural) y cálculo real de cuotas diferidas en moneda local | **Planificación y control de tarjetas de crédito**, reportes consolidados y geolocalización de gastos | **Sincronización bancaria automática (Open Banking)**, soporte multi-divisa avanzado con cotizaciones y reglas automáticas |

---

## 2. Matriz Comparativa de Capacidades (Feature Breakdown)

| Capacidades Clave | **m3 Actual** | **Mobills Premium** | **Wallet Premium** | Veredicto & Oportunidad m3 |
| :--- | :---: | :---: | :---: | :--- |
| **Ingesta Rápida & IA** | 🟢 **Superior** (Bot WhatsApp con Whisper, Visión OCR y Sheet ágil) | 🟡 Manual o SMS reader (Android únicamente) | 🟡 Manual o reglas fijas | **Fuerte ventaja de m3**. Mobills y Wallet carecen de ingesta conversacional vía mensajería. |
| **Tarjetas & Cuotas Diferidas** | 🟢 **Excelente** (Proyección cuota a cuota, cierres y vencimientos) | 🟢 **Excelente** (Facturas de tarjeta, límites visuales y consolidado) | 🟡 Parcial (Registro de pagos de tarjeta, pero cuotas diferidas rígidas) | Paridad alta con Mobills; m3 supera a Wallet en cuotas locales. |
| **Presupuestos y Desvíos** | 🟢 **Bueno** (Límites por categoría y Velocity Bar en Dashboard) | 🟢 **Líder** (Presupuestos acumulativos, alertas tempranas y subpresupuestos) | 🟢 **Líder** (Presupuestos vinculados a cuentas específicas o tags) | m3 debe incorporar rollover (presupuesto restante que pasa al mes siguiente). |
| **Multi-Moneda & Tipo de Cambio** | 🟡 Básico (Moneda única base por usuario) | 🟢 Soporte multidivisa | 🟢 **Líder** (Multi-moneda con tasas en vivo y balance patrimonial consolidado) | **Grave debilidad en m3:** Vital para LATAM/global (dólares, euros, pesos, cripto). |
| **Conciliación & Reglas Automáticas** | 🟢 Importador CSV con preview y deduplicación | 🟡 Importación manual OFX/XLS | 🟢 **Líder** (Reglas *"Si el comercio contiene X, asignar categoría Y y tag Z"*)| m3 tiene categorización predictiva pero le falta un motor de Reglas y Automatizaciones de usuario. |
| **Flujo de Caja Proyectado** | 🟡 Parcial (Recordatorios de facturas y cuotas) | 🟢 **Líder** (Gráfico predictivo de saldo futuro a 30/60/90 días) | 🟢 **Líder** (Proyección de saldo futuro con base en recurrentes) | **Gap crítico:** El usuario quiere ver si llega a fin de mes antes de gastar hoy. |
| **Espacios Compartidos / Finanzas en Pareja** | 🔴 No disponible (Monousuario) | 🟢 Mobills Family (Cuentas y presupuestos compartidos) | 🟢 Group Sharing (Cuentas familiares con roles) | Oportunidad de expansión colaborativa sobre RLS de Supabase. |
| **Seguridad Biométrica y Privacidad** | 🟡 Login Supabase + PWA | 🟢 FaceID / PIN + Ocultar saldos con toggle rápido | 🟢 FaceID / PIN + Modo incógnito al agitar el teléfono | Implementar bloqueo biométrico web (`WebAuthn`) y toggle "Ocultar saldos sensibles". |

---

## 3. Psicología Financiera y Patrones de UX Destacados

### Lo que Mobills hace excepcionalmente bien:
1. **Reducción de Ansiedad en Tarjetas:** Mobills muestra claramente cuánto debés hoy vs. cuánto vencerá el mes próximo, desglosando la "factura abierta" de la "factura cerrada".
2. **Rollover de Presupuestos:** Si te sobraron $10.000 en Supermercado, podés pasarlos al mes siguiente o derivarlos a una meta de ahorro.
3. **Logros y Salud Financiera Gamificada:** Gamificación suave que premia días consecutivos de registro y ahorro.

### Lo que Wallet hace excepcionalmente bien:
1. **Proyección del Saldo Futuro (Forecast Chart):** Un gráfico que combina tu saldo actual, tus ingresos recurrentes y tus gastos programados/cuotas para dibujar una línea de tiempo a 30, 60 y 90 días. Responde la duda: *"¿Tendré dinero el día 25 para pagar la tarjeta?"*.
2. **Motor de Reglas y Tags:** Capacidad para que el usuario cree reglas condicionales automáticas (*"Cualquier gasto mayor a $50.000 marcarlo con tag #Revisar"*).
3. **Consolidado Multi-Moneda:** Permite ver el patrimonio neto en una moneda de referencia, convirtiendo automáticamente cuentas en USD, EUR y ARS.

---

## 4. Backlog de Trabajo Propuesto para los Próximos Sprints (P8 a P12)

Para posicionar a **m3** no solo como un competidor digno, sino como la herramienta definitiva que supera a Mobills y Wallet en conveniencia y precisión, proponemos incorporar al backlog:

### 🌟 P8 — Soporte Multi-Moneda y Balance Patrimonial Consolidado
- **Problema:** Los usuarios en mercados inflacionarios o internacionales gestionan cuentas en moneda local (ARS, BRL, MXN) y ahorros/inversiones en moneda dura (USD, EUR, USDT). Hoy m3 asume una única divisa.
- **Alcance:**
  - Asignar moneda por cuenta (`ARS`, `USD`, `EUR`, `USDT`).
  - Cotizaciones de referencia configurables (manual o fetch de APIs públicas como Dólar Oficial/Blue / Fixer / CoinGecko).
  - Selector de "Moneda de visualización consolidada" en el Header del Dashboard con conversión al vuelo.
- **Impacto:** Altísimo. Indispensable para usuarios multi-cuenta.

### 🌟 P9 — Proyección de Flujo de Caja (Cash Flow Forecasting a 30/60/90 días)
- **Problema:** Los dashboards tradicionales miran hacia el pasado (lo que ya gastaste). El valor premium de Mobills/Wallet es mirar hacia el futuro.
- **Alcance:**
  - Gráfico de línea temporal interactivo que proyecta el saldo diario estimado.
  - Combina: Saldo actual de cuentas líquidas + Ingresos recurrentes esperados - Gastos fijos programados - Cuotas de tarjeta por vencer.
  - Alerta temprana de "Riesgo de sobregiro" si la curva proyectada perfora el cero.
- **Impacto:** Altísimo (Game Changer para planificación financiera real).

### 🌟 P10 — Motor de Automatizaciones y Reglas de Transacciones
- **Problema:** En compras repetitivas o importaciones masivas, el usuario tiene que reclasificar o taguear manualmente transacciones similares.
- **Alcance:**
  - Gestor de reglas tipo IFTTT: *Si concepto contiene [X] -> Asignar categoría [Y], Cuenta [Z], y Tags [W]*.
  - Opción de aplicar regla retroactivamente o solo a nuevas transacciones (incluidas las que entran vía Bot de WhatsApp y CSV).
- **Impacto:** Alto (Ahorro masivo de tiempo y consistencia de datos).

### 🌟 P11 — Presupuestos con Rollover Dinámico y Subcategorías
- **Problema:** Los presupuestos estáticos mensuales se reinician en cero, desincentivando el ahorro o castigando meses con compras puntuales compensables.
- **Alcance:**
  - Check opcional de "Rollover" por presupuesto: el saldo remanente positivo o negativo se traslada automáticamente al mes siguiente.
  - Botón de un toque para derivar el sobrante a una "Meta de Ahorro".
  - Notificaciones en tiempo real al alcanzar el 80% y 100% de la velocidad estimada.
- **Impacto:** Alto (Fidelización y control de gastos más flexible).

### 🌟 P12 — Modo Privacidad, Seguridad Biométrica y Widgets Móviles
- **Problema:** El usuario abre la app en público (transporte, oficina) y no quiere que terceros vean su saldo total o movimientos sensibles.
- **Alcance:**
  - Botón "Modo Ojo / Privacidad" (`EyeOff`) en el Header que ofusca saldos (`$ ••••••`) con un toque o gesto.
  - Bloqueo por FaceID/TouchID (`navigator.credentials` / WebAuthn) al reanudar la PWA tras 5 minutos de inactividad.
  - Optimización de atajos rápidos PWA (Quick Actions) para Android/iOS.
- **Impacto:** Medio-Alto (Confianza, seguridad y estética de grado bancario).
