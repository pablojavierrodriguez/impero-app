# SPEC-015: Unificación de Identidad de Marca, Nomenclatura y Microcopia de Alta Gama (P13)

## 1. Contexto & Diagnóstico
Durante la evolución de prototipos y plantillas base, coexistieron denominaciones dispares en el código y en la interfaz:
- En la barra lateral desktop (`DesktopSidebar.tsx`), la aplicación figuraba como `FinTrack` en vez del nombre del producto: **`m3` (Money Master)**.
- Se detectaron cadenas en inglés en tooltips y modales secundarios (ej. `Transfer`, `Import CSV`, `del` en teclado numérico).
- Existía disparidad en la nomenclatura de métricas ("VelocityBar" vs. "Ritmo de gasto", "HealthScore" vs. "Salud financiera").

Una aplicación financiera de clase mundial (referentes: **Linear, Copilot Money, Stripe**) requiere una homogeneidad absoluta en tono, identidad y claridad idiomática en cada rincón de la interfaz.

---

## 2. Objetivos & Requisitos de Producto
1. **Unificación Total de Marca:**
   - Nombre de producto estandarizado: **`m3` (Money Master)** en headers, sidebars, títulos HTML, Web App Manifest y metadatos sociales.
   - Isotipo homogéneo: icono y colores de acento consistentes en mobile y desktop.
2. **Microcopia 100% Localizada en Español Financiero:**
   - Erradicar cualquier remanente de cadenas en inglés en tooltips, placeholders, alertas y botones de acción.
   - Nombres claros y empáticos:
     - "Transfer" -> **"Transferencia"**
     - "Import CSV" -> **"Importar extracto (CSV)"**
     - "del" -> **"⌫ / Borrar"**
3. **Glosario y Coherencia Semántica de Métricas:**
   - *"Ritmo diario de gasto"* en lugar de términos crudos en inglés.
   - *"Ciclo de facturación / Resumen"* en lugar de términos genéricos.

---

## 3. Arquitectura y Componentes Involucrados

### A. Diccionario de Traducciones (`src/lib/i18n.ts`)
- Centralización de todas las claves de navegación, acciones de barra de herramientas y modales bajo `es` y `en`.
- Garantizar que toda función de traducción `t("nav.transfer")` cuente con fallback seguro en español.

### B. Barra Lateral Desktop (`src/components/DesktopSidebar.tsx`)
- Reemplazo definitivo de cadenas fijas por tokens de traducción:
  - Header: `m3` con logo representativo.
  - Tooltips de acciones rápidas conectados a `t("nav.transfer")` y `t("tx.importCsv")`.

### C. Navegación Móvil (`src/components/BottomNav.tsx`)
- Sincronización de etiquetas y tooltips con el diccionario de internacionalización.

### D. Metadatos de la PWA (`public/manifest.webmanifest` & `index.html`)
- Atributos `name`, `short_name`, `description` alineados con la propuesta de valor de **m3**.

---

## 4. Criterios de Aceptación (DoD)
- [x] Cero menciones a nombres no autorizados (`FinTrack`) en la interfaz visible.
- [x] 100% de los botones y tooltips de navegación se muestran en español consistente.
- [x] El archivo `manifest.webmanifest` e `index.html` reflejan el nombre oficial y descripción de producto.
- [x] Validación de compilación sin errores con `npx tsc --noEmit && npm run build`.
