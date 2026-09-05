# SPEC-002: Comprobantes y Adjuntos en Alta Rápida (P0)

## 1. Contexto & Diagnóstico
Actualmente la subida de comprobantes (`receiptUrl`) al bucket `receipts` de Supabase Storage está implementada únicamente en `TransactionEditSheet.tsx` (flujo posterior a la creación). 
En el uso cotidiano de la aplicación móvil y web, el momento en el que el usuario tiene el ticket físico o captura de pantalla de la transferencia en mano es **al momento de cargar el gasto** en `QuickAddSheet.tsx`.

---

## 2. Objetivos
1. Permitir adjuntar imágenes (JPG, PNG, WebP) o PDFs de comprobantes directamente en el paso 2 (`details`) de `QuickAddSheet`.
2. Mostrar feedback visual inmediato:
   - Estado de subida con indicador de carga (`loading spinner`).
   - Vista previa miniatura de la imagen adjuntada con botón para descartar/eliminar antes de guardar.
3. Almacenar el archivo de forma segura en la ruta `receipts/{auth.uid()}/{timestamp}_{filename}` utilizando `storage.service.ts`.
4. Persistir la URL resultante en el campo `receipt_url` de la tabla `public.transactions`.

---

## 3. Arquitectura y Componentes Involucrados

### A. Capa de UI (`src/components/QuickAddSheet.tsx`)
- En el paso `details`, agregar una sección de adjunto con icono de cámara/clip:
  - `<input type="file" accept="image/*,application/pdf" ... />`
  - Soporte para cámara nativa en móviles (`capture="environment"` opcional o selector de archivo).
  - Preview interactivo: si es imagen, mostrar thumbnail; si es PDF, mostrar badge con nombre de archivo.
  - Botón de remover comprobante.
- Extender la función `onSubmit` para admitir `receiptUrl?: string` en el objeto de parámetros.

### B. Capa de Almacenamiento (`src/services/storage.service.ts`)
- Ya existe la función `uploadReceipt(file: File): Promise<string>`.
- Se mantiene su contrato asegurando manejo de errores y validación de tipos MIME y límite de peso (hasta 10MB según configuración de Supabase Storage).

### C. Estado y Mutaciones (`src/lib/finance-store.ts` & `src/services/transactions.service.ts`)
- Asegurar que `addTransaction` pase `receiptUrl` a `insertTransaction` en `transactions.service.ts`.
- `insertTransaction` ya mapea `receipt_url: tx.receiptUrl || null`.

---

## 4. Plan de Verificación & Compliance
1. **Tests Unitarios**:
   - Agregar test en `src/test/finance-store.test.tsx` verificando que `addTransaction` almacena correctamente `receiptUrl`.
2. **Validación de Compilación**:
   - `npx tsc --noEmit && npm run build` (0 errores).
3. **Validación Funcional**:
   - Abrir `QuickAddSheet`, seleccionar categoría, monto, adjuntar una imagen, guardar y corroborar que en la lista de transacciones aparezca el icono de ticket y abra la imagen correspondiente.
