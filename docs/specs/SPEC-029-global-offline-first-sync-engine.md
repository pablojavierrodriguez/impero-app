# SPEC-029: Motor Global Offline-First & Cola de Sincronización Diferida (Outbox Pattern)

---

## 1. Contexto y Diagnóstico

IMPERO es una Progressive Web App (PWA) de finanzas personales diseñada para operar tanto en escritorio como en dispositivos móviles. Sin embargo, en su arquitectura original, la mayoría de los módulos centrales (`transactions`, `accounts`, `budgets`, `goals`, `bills`) dependían de una conexión constante y activa contra Supabase:

1. **Latencia y Fallback Nulo al Iniciar la App:**
   - Al montar `useFinanceStore`, la aplicación se bloqueaba mostrando spinners o esqueletos de carga mientras ejecutaba un `Promise.all` masivo contra las APIs remotas.
   - Si el usuario abría la aplicación en un ascensor, subsuelo, estacionamiento o zona rural sin señal, la llamada fallaba y la app quedaba vacía o con errores, impidiendo consultar saldos o presupuestos.
2. **Rollbacks Destructivos al Cargar Gastos sin Señal:**
   - En `addTransaction`, si la mutación remota contra `public.transactions` fallaba por micro-cortes o falta de red, el store ejecutaba una función `rollback()` que revertía el balance y descartaba el movimiento.
   - Como resultado, **el gasto registrado por el usuario en la calle se perdía**, destruyendo la confianza y generando inconsistencia en el registro diario.
3. **Falta de Visibilidad de Sincronización:**
   - No existía un indicador global que informara al usuario si sus datos estaban replicados en la nube o si había operaciones guardadas localmente pendientes de sincronización.

---

## 2. Objetivos de Producto & Arquitectura

1. **Apertura Instantánea a Cero Latencia (0ms Initial Paint):**
   - El store financiero (`useFinanceStore`) se hidrata de inmediato desde la memoria local (`localStorage`), permitiendo al usuario ver su saldo neto, sus cuentas y sus últimos movimientos al instante sin esperar el handshake de red.
   - En segundo plano (*Stale-While-Revalidate*), la app consulta Supabase de forma asíncrona y actualiza silenciosamente el estado si hubo cambios.
2. **Cobertura Universal de Entidades (Cero Pérdida de Datos en Toda la App):**
   - El usuario puede registrar, editar o eliminar cualquiera de las 9 entidades de dominio en modo offline:
     1. **Transacciones (`transactions`):** Inserción, edición, eliminación con recálculo de balance.
     2. **Cuentas (`accounts`):** Creación, edición, archivo/desarchivo, eliminación y ajustes de saldo.
     3. **Categorías (`categories`):** Creación, edición, archivo y borrado.
     4. **Presupuestos (`budgets`):** Creación, edición y eliminación de techos mensuales.
     5. **Metas (`goals`):** Creación, edición, aportes (`contribute`), retiros (`withdraw`) y eliminación.
     6. **Facturas y Servicios (`bills`):** Creación, edición, marcado de pago y eliminación.
     7. **Transacciones Recurrentes (`recurring_transactions`):** Creación, edición, pausa/reanudación y eliminación.
     8. **Etiquetas (`tags`):** Creación y eliminación.
     9. **Reglas de Categorización (`transaction_rules`):** Creación, edición, activación/pausa y eliminación.
   - Toda nueva entidad genera su identificador `UUID v4` en el cliente (`crypto.randomUUID()`), garantizando relaciones foráneas íntegras en memoria y persistencia idempotente en Postgres (`upsert` con `onConflict: "id"`).
   - Si la llamada remota falla, **prohibido hacer rollback destructivo**: el cambio se persiste localmente y se encola en la cola de salida (*Outbox Pattern*).
3. **Cola Global de Sincronización Diferida (`sync-queue.service`):**
   - Cola unificada y persistente (`impero-global-sync-queue`) que almacena las mutaciones pendientes (`GlobalSyncOperation`).
   - Procesamiento secuencial (FIFO) e idempotente con reintentos automáticos al recuperar conectividad (`window.addEventListener("online")`).
   - Soporte de sincronización forzada bajo demanda desde la UI.
4. **UX Cohesiva y Transparente:**
   - Un chip discreto y elegante en la cabecera principal (`BalanceHeader`):
     - `Al día`: Indica que el dispositivo está 100% sincronizado con Supabase Cloud.
     - `X pendientes`: Aparece sutilmente cuando hay operaciones encoladas en modo offline, con animación de sincronización al procesar y botón táctil para forzar reenvío.

---

## 3. Componentes y Módulos

- `src/services/sync-queue.service.ts` [NUEVO]:
  - Administrador central de la cola Outbox (`GlobalSyncOperation`).
  - Despachador de mutaciones para todas las 9 entidades de dominio con `upsert` (`onConflict: "id"`), `update` y `delete`.
  - Listeners de estado de red (`navigator.onLine`, eventos `online`/`offline`).
- `src/lib/finance-store.ts` [MODIFICADO]:
  - Hidratación instantánea (0ms) de todas las entidades desde caché local.
  - Eliminación de rollbacks destructivos en todos los métodos de mutación (transacciones, cuentas, categorías, presupuestos, metas, facturas, recurrentes, tags, reglas).
  - Encolado automático mediante `enqueueGlobalSyncOp` ante errores de red.
  - Exposición de `pendingGlobalSyncCount`, `isGlobalSyncing` y `syncGlobalQueue`.
- `src/services/` (`transactions`, `accounts`, `categories`, `planning`, `tags`) [MODIFICADOS]:
  - Soporte de IDs de cliente (`UUID v4`) e inserciones idempotentes con `upsert`.
- `src/components/BalanceHeader.tsx` [MODIFICADO]:
  - Indicador global de sincronización en cabecera móvil y desktop.
- `src/test/global-offline-sync.test.ts` [NUEVO]:
  - Batería de pruebas automatizadas simulando caída de red, acumulación en cola FIFO, retención por errores de servidor y sincronización idempotente para todas las entidades.

---

## 4. Criterios de Aceptación (DoD)

- [x] La app inicia y muestra saldos y movimientos en 0ms utilizando la caché local sin bloquear la interfaz.
- [x] Es posible operar y realizar mutaciones en las 9 entidades de dominio en modo desconectado sin errores ni pérdida de datos.
- [x] Las entidades creadas sin red quedan registradas en la cola diferida con UUID v4 y su impacto reflejado inmediatamente en la UI.
- [x] Al recuperar la conectividad, las operaciones pendientes se envían a Supabase automáticamente sin duplicar registros.
- [x] El indicador en la cabecera refleja con precisión el estado de la sincronización.
- [x] Tolerancia cero a errores de compilación (`tsc --noEmit && npm run build`) y tests unitarios en verde.
