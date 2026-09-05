# SPEC-018: Refinamiento del Design System: Contraste WCAG AA, Modo Claro y Safe Areas Móviles (P16)

## 1. Contexto & Diagnóstico
Para que **m3** se posicione como una aplicación de referencia en finanzas personales, debe ofrecer una experiencia visual impecable en cualquier condición de iluminación y dispositivo:
- **Deficiencia en Modo Claro (`.light`):** El tema claro presentaba bordes (`border-border: 240 5% 88%`) y textos muted (`muted-foreground: 240 5% 45%`) con contraste insuficiente frente a la luz solar directa, rozando o incumpliendo el estándar mínimo de accesibilidad WCAG AA (ratio 4.5:1).
- **Ergonomía Táctil en Navegación Móvil:** Algunos botones de navegación o acciones secundarias poseían áreas táctiles menores a 44px, provocando toques erráticos en pantallas compactas.
- **Interacción con Teclados Virtuales:** En dispositivos móviles, la apertura del teclado virtual en modales o sheets puede solapar el botón de confirmación ("Guardar / Siguiente") si no se respetan las áreas seguras (`pb-safe`) y el redimensionamiento dinámico del viewport.

---

## 2. Objetivos & Requisitos de Producto
1. **Calibración de Tokens de Color y Contraste WCAG AA:**
   - Ajustar las variables CSS en `src/index.css` tanto para modo oscuro como claro:
     - Textos primarios y secundarios con contraste garantizado `>= 4.5:1` sobre sus respectivos fondos.
     - Separadores y bordes con nitidez suficiente sin perder sutileza moderna.
2. **Ergonomía Táctil Móvil (Touch Targets de 44×44px):**
   - Garantizar que todo elemento interactivo (botones de `BottomNav`, chips de filtros, botones del teclado numérico) cumpla con una superficie mínima de interacción de **44×44px**.
3. **Gestión de Safe Areas & Viewport Móvil:**
   - Respetar muescas (*notches*) e islas dinámicas con `env(safe-area-inset-bottom)`.
   - Modales y sheets con scroll interno seguro: `max-h-[90vh] overflow-y-auto pb-safe`.
   - Configuración en el HTML de `viewport-fit=cover` e `interactive-widget=resizes-content`.

---

## 3. Arquitectura y Componentes Involucrados

### A. Estilos Globales y Tokens (`src/index.css`)
- Calibración de variables HSL:
  ```css
  .light {
    --background: 0 0% 98%;
    --foreground: 240 10% 8%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 8%;
    --primary: 142 76% 36%;
    --primary-foreground: 0 0% 100%;
    --muted: 240 5% 94%;
    --muted-foreground: 240 5% 35%; /* Ratio > 4.5:1 garantizado */
    --border: 240 5% 84%;
  }
  ```

### B. Barra de Navegación Inferior (`src/components/BottomNav.tsx`)
- Dimensionamiento de botones de pestaña garantizando un touch target de al menos `w-14 h-12` (48px de alto).
- Margen inferior para barras de navegación nativas mediante padding de seguridad.

### C. Hojas de Acción y Modales (`src/components/ResponsiveSheet.tsx`)
- Scroll adaptativo en contenedores con teclado virtual activo.

---

## 4. Criterios de Aceptación (DoD)
- [x] Textos y elementos interactivos en modo claro y oscuro cumplen con el estándar de contraste WCAG AA.
- [x] Los elementos táctiles primarios respetan el tamaño mínimo de 44×44px.
- [x] Los modales y sheets permiten scrollear y confirmar acciones sin que el teclado virtual tape los botones de envío.
- [x] La suite de pruebas y la verificación de build (`npx tsc --noEmit && npm run build`) pasan al 100%.
