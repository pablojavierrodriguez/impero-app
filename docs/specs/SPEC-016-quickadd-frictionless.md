# SPEC-016: QuickAdd 2.0 con Fricción Mínima, Smart Chips y Feedback Sensorial (P14)

## 1. Contexto & Diagnóstico
La carga de gastos diarios en movimiento (un café, transporte público, almuerzo rápido) es el momento de mayor fricción y la causa principal de abandono en las aplicaciones de finanzas personales.
- **Flujo anterior:** El usuario debía tipear el monto, tocar obligatoriamente "Siguiente", seleccionar categoría, seleccionar cuenta y presionar "Guardar" (4 a 5 interacciones obligatorias).
- **Falta de feedback sensorial:** Al presionar los números en el teclado táctil in-app dentro de la PWA no existía respuesta física, sintiéndose plano y desconectado en comparación con las apps nativas de iOS/Android.

Referentes de clase mundial como **Copilot Money** y **Linear** optimizan los flujos repetitivos para que una acción frecuente se complete en 1 a 2 toques con confirmación háptica instantánea.

---

## 2. Objetivos & Requisitos de Producto
1. **Smart Chips de Categorías Frecuentes (1-Tap Save):**
   - Mostrar una fila horizontal de chips con las categorías más populares o frecuentes del usuario justo sobre el teclado numérico.
   - Si el usuario ingresa un monto (ej. `$1.500`) y presiona el chip *"Café"* o *"Supermercado"*, la transacción se registra inmediatamente en un solo toque, asociándola con la cuenta predeterminada y cerrando la hoja con animación fluida.
2. **Feedback Sensorial Háptico (Web Vibration API):**
   - Implementar respuesta táctil nativa mediante `navigator.vibrate`:
     - Pulsación de tecla numérica: vibración sutil (`8ms`).
     - Selección de smart chip o avance: vibración media (`12-15ms`).
     - Confirmación exitosa de guardado: vibración de confirmación (`25ms`).
   - Fallback transparente y seguro en navegadores de escritorio o dispositivos sin soporte de motor de vibración.
3. **Ergonomía Táctil:**
   - Botones numéricos con superficie táctil mínima de 48px de altura, sombras inset elegantes y estados activos `active:scale-[0.98]`.

---

## 3. Arquitectura y Componentes Involucrados

### A. Hoja de Carga Rápida (`src/components/QuickAddSheet.tsx`)
- Integración de función `triggerHaptic(duration: number)`.
- Derivación de categorías frecuentes activas:
  ```ts
  const topCategories = filteredCats.slice(0, 4);
  ```
- Manejador de guardado directo:
  ```ts
  const handleQuickCategorySubmit = (cat: Category) => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    triggerHaptic(15);
    onSubmit(val, cat.name, cat, type, selectedAccount, {});
    resetAndClose();
  };
  ```

### B. Feedback en Teclado y Botón Submit
- Disparo de vibración táctil en `handleKey`, `handleNext` y `handleSubmit`.

---

## 4. Criterios de Aceptación (DoD)
- [x] Al tipear un monto mayor a cero, se visualizan los Smart Chips de categorías frecuentes sobre el teclado.
- [x] Tocar un Smart Chip guarda la transacción de forma inmediata sin necesidad de ir a la pantalla de detalles.
- [x] El teclado numérico y las acciones de confirmación emiten vibración háptica en dispositivos móviles compatibles.
- [x] No genera errores en entornos sin soporte de vibración (desktops / Safari iOS tradicional).
- [x] Validación de compilación estricta sin errores con `npx tsc --noEmit && npm run build`.
