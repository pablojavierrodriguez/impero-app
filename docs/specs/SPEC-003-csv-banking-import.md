# SPEC-003: Importación de Extractos Bancarios & Conciliación CSV (P1)

## 1. Contexto & Diagnóstico
`m3` cuenta con una utilidad básica en `src/lib/csv-parser.ts` y una vista `CsvImportSheet.tsx`, pero actualmente las transacciones importadas no están integradas plenamente con la persistencia real de Supabase ni cuentan con validación de duplicados o normalización robusta de entidades bancarias comunes (ej. Galicia, Santander, BBVA, Mercado Pago, Brubank).

---

## 2. Objetivos
1. **Detección Automática de Formatos**: Soportar separadores `,` y `;`, formatos numéricos `1.234,56` y `1234.56`, y fechas `DD/MM/YYYY`, `DD-MM-YYYY` y `YYYY-MM-DD`.
2. **Clasificación Predictiva**: Enriquecer el clasificador de categorías por palabras clave para comercios y conceptos frecuentes de Argentina/Latinoamérica.
3. **Mapeo Visual Interactivo**: Permitir al usuario reasignar columnas y previsualizar las filas parseadas antes de la confirmación.
4. **Prevención de Duplicados**: Detección de transacciones preexistentes por combinación de `fecha + monto + descripción similar` en la cuenta seleccionada.
5. **Persistencia por Lotes**: Inserción masiva eficiente en `public.transactions` y actualización atómica del balance de la cuenta seleccionada.

---

## 3. Arquitectura y Componentes Involucrados

### A. Parser de CSV (`src/lib/csv-parser.ts`)
- Detección de headers y mapeo heurístico:
  - Fecha: `fecha`, `date`, `data`, `vencimiento`.
  - Concepto: `desc`, `concepto`, `detalle`, `movimiento`, `referencia`.
  - Importe / Monto: `monto`, `importe`, `amount`, `valor`.
  - Detección de signo o columnas separadas de crédito/débito.
- Diccionario expandido de comercios y servicios.

### B. Servicio de Transacciones (`src/services/transactions.service.ts`)
- Agregar método `insertTransactionsBatch(txs: Omit<Transaction, "id">[]): Promise<Transaction[]>`:
  - Inserción en bloque con `supabase.from("transactions").insert(...)`.
  - Recálculo / actualización de saldos de las cuentas afectadas.

### C. Interfaz de Importación (`src/components/CsvImportSheet.tsx`)
- Wizard en 3 pasos:
  1. **Upload & Mapeo**: Arrastrar archivo CSV y verificar columnas detectadas.
  2. **Previsualización & Corrección**: Tabla de movimientos parseados con dropdowns para cambiar categorías o desmarcar filas que no se deseen importar.
  3. **Confirmación**: Resumen del total a ingresar, confirmación y persistencia.

---

## 4. Plan de Verificación & Compliance
1. **Pruebas con CSV sintéticos**:
   - Extractos con montos positivos/negativos, comas/puntos decimales y fechas en distintos formatos.
2. **Tests Unitarios**:
   - Validar las funciones `parseCsvText`, `guessMapping`, `guessCategory` y `parseAmount`.
3. **Validación de Compliance**:
   - `node scripts/check-all.cjs` en verde (TypeScript + Vitest + Build).
