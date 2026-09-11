# SPEC-022: Resiliencia Offline-First en Shopping List (Listas de Compras)

---

## 1. Contexto y Diagnóstico

Las listas de compras son utilizadas primordialmente en situaciones de movilidad y campo (supermercados, mayoristas, farmacias, comercios barriales) donde la conectividad celular puede ser inestable, lenta o inexistente.

Previamente, el módulo de Shopping List realizaba llamadas síncronas directas contra las tablas `public.shopping_lists` y `public.shopping_list_items` de Supabase. Ante cualquier micro-corte o pérdida de red:
- La vista de listas se bloqueaba o permanecía en estado de carga infinito.
- Se arrojaban toasts de error repetitivos e intrusivos en cada interacción.
- Se impedía la creación de nuevos artículos o la marcación de ítems comprados en la góndola.

---

## 2. Objetivos de Producto & Arquitectura

1. **Cero Latencia en Carga Inicial:**
   - La vista de Shopping List se hidrata de forma inmediata a partir de la caché persistida en `localStorage` (`impero-shopping-lists-cache`), eliminando el flash de carga y permitiendo operar en 0 ms.
2. **Operatividad 100% Offline (Local-First):**
   - Todas las operaciones CRUD (crear lista, agregar ítem, tildar/destildar producto, eliminar y checkout a gasto) se completan de forma optimista sobre el estado y la caché local.
   - Generación de identificadores estándar UUID v4 en el cliente para garantizar compatibilidad con Postgres sin colisiones.
3. **Cola de Sincronización Diferida (Background Sync Queue):**
   - Si la llamada remota a Supabase falla o no hay conexión activa, la acción se encola en `impero-shopping-sync-queue`.
   - Al restablecerse la red (`window.addEventListener("online")`) o al invocar sincronización manual, la cola se vacía de forma idempotente con `upsert` y llamadas atómicas.
4. **UX No Intrusiva:**
   - Supresión de toasts de error alarmistas cuando la causa es la falta de red.
   - Inclusión de un chip minimalista en la cabecera indicando el estado:
     - `Al día` (sincronizado con la nube).
     - `X pendientes` (guardado localmente; botón táctil para reintentar sincronización manual).

---

## 3. Componentes Involucrados

- `src/services/shopping.service.ts`:
  - Caché local `getStoredShoppingLists` / `saveStoredShoppingLists`.
  - Cola de operaciones `ShoppingSyncOperation` y procesador `syncPendingShoppingQueue`.
  - Soporte de fallback transparente en `fetchShoppingLists`, `createShoppingList`, `createShoppingListItemRemote`, etc.
- `src/components/ShoppingListManager.tsx`:
  - Inicialización directa con caché local.
  - Listener de evento `online` para auto-sincronización.
  - Indicador visual de estado de sincronización.
- `src/test/shopping-offline.test.ts`:
  - Suite de pruebas de aislamiento y tolerancia a fallos.

---

## 4. Criterios de Aceptación (DoD)

- [x] Las listas de compras se visualizan al instante aún sin conexión a internet.
- [x] Es posible crear listas, agregar ítems y marcarlos como comprados en modo avión o sin red.
- [x] Los ítems creados localmente persisten en el dispositivo entre reinicios de la app.
- [x] Al recuperar la conexión, las mutaciones locales se propagan a Supabase automáticamente.
- [x] Cero errores de compilación (`tsc --noEmit && npm run build`).
