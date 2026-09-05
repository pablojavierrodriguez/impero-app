# SPEC-012: Motor de Automatizaciones y Reglas de Transacciones (P10)

## 1. Contexto & Diagnóstico
Uno de los puntos más valorados por los usuarios avanzados de **Wallet by BudgetBakers** es su motor de reglas automáticas (*"Automations & Rules"*). En **m3**, a medida que ingresan movimientos masivos (vía importación de extractos bancarios CSV/PDF) o transacciones veloces por el **Bot Autónomo de WhatsApp**, el usuario se ve obligado a reclasificar manualmente comercios que m3 no categorizó por defecto o a asignar tags específicos de seguimiento repetidamente.

Implementar un motor de reglas programables por el usuario garantiza consistencia absoluta, personalización total y ahorra horas de edición manual.

---

## 2. Objetivos & Requisitos de Producto
1. **Estructura Condicional Trigger / Action:**
   - **Condiciones (Triggers):**
     - Si la descripción / concepto: `contiene`, `empieza con` o `es igual a` un texto dado.
     - Si el monto: `es mayor a`, `es menor a` o `está entre`.
     - Si la cuenta de origen: `es igual a [Cuenta]`.
     - Si el tipo de transacción: `gasto` o `ingreso`.
   - **Acciones (Actions):**
     - Asignar categoría: `[Categoría]` (y opcionalmente subcategoría).
     - Asignar tags: `[Tag 1, Tag 2]`.
     - Marcar descripción limpia: (ej. reemplazar `"MERCPAGO*RAPPI"` por `"Rappi"`).
2. **Ejecución en Tiempo Real (Pipeline de Ingesta):**
   - El pipeline procesa cada transacción antes de su persistencia en Supabase:
     1. Ingesta rápida en `QuickAddSheet`.
     2. Ingesta masiva en `CsvImportSheet`.
     3. Ingesta autónoma en el webhook del Bot de WhatsApp.
3. **Ejecución Retroactiva:**
   - Opción para "Aplicar esta regla al historial existente" (actualiza transacciones pasadas que cumplan la condición).
4. **Prioridad y Orden de Reglas:**
   - El usuario puede reordenar reglas por prioridad y activar/desactivar reglas con un toggle.

---

## 3. Arquitectura y Componentes Involucrados

### A. Base de Datos Supabase
- **Tabla `public.transaction_rules`:**
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id uuid REFERENCES auth.users NOT NULL`
  - `name text NOT NULL`
  - `is_active boolean DEFAULT true`
  - `priority integer DEFAULT 0`
  - `conditions jsonb NOT NULL` (ej: `{ field: 'description', operator: 'contains', value: 'coto' }`)
  - `actions jsonb NOT NULL` (ej: `{ set_category_id: 'uuid...', add_tags: ['supermercado'] }`)
  - `created_at timestamptz DEFAULT now()`
  - RLS activado con políticas por `(select auth.uid())`.

### B. Motor de Evaluación (`src/lib/rules-engine.ts`)
- Función pura:
  `applyRulesToTransaction(transaction: DraftTransaction, rules: TransactionRule[]): DraftTransaction`
- Evalúa ordenadamente y aplica transformaciones sin mutar el objeto original.

### C. Componentes de UI
- `src/components/RulesManager.tsx`:
  - Lista de reglas con switch activo/inactivo.
  - Dialog para crear y editar reglas con constructores visuales de condiciones ("SI...") y acciones ("ENTONCES...").
  - Botón de prueba interactiva: *"Probar regla contra una transacción"*.

---

## 4. Criterios de Aceptación (DoD)
- [ ] Las reglas se evalúan de forma no bloqueante y con rendimiento óptimo (< 5ms por lote).
- [ ] Durante la importación CSV, las reglas del usuario prevalecen sobre las predicciones genéricas del sistema.
- [ ] La interfaz para crear reglas es intuitiva y compatible con dispositivos móviles.
- [ ] Cobertura de tests unitarios completa para todos los operadores de condición.
