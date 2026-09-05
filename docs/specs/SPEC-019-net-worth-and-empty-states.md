# SPEC-019: Curva de Evolución Patrimonial (Net Worth Chart) y Empty States Dinámicos (P17)

## 1. Contexto & Diagnóstico
La pantalla principal de **m3** brinda un resumen instantáneo excelente de la liquidez del mes actual (balance total, ingresos y gastos).
- **Carencia detectada:** El usuario no tenía una perspectiva gráfica de cómo evoluciona su patrimonio neto consolidado a lo largo del tiempo (últimas semanas o meses). Las mejores herramientas globales (**Copilot Money, Monarch, Wealthfront**) colocan una curva minimalista de patrimonio neto como protagonista para motivar el progreso financiero.
- **Estados vacíos estáticos:** Cuando una sección carecía de registros (sin transacciones, sin presupuestos o sin metas), la interfaz mostraba mensajes de texto planos que no orientaban al usuario sobre qué hacer a continuación.

---

## 2. Objetivos & Requisitos de Producto
1. **Gráfico de Evolución Patrimonial (Net Worth History):**
   - Gráfico de área minimalista con gradientes suaves construido con Recharts.
   - Cálculo histórico reconstruido a partir de los balances actuales y el historial de transacciones.
   - Selector de horizonte temporal: *30 días*, *90 días* o *Año*.
   - Tooltip interactivo con tipografía monoespaciada (`font-mono-data tabular-nums`).
2. **Rediseño de Estados Vacíos (Empty States Interactivos):**
   - Rediseño de `EmptyState.tsx`:
     - Micro-ilustraciones vectoriales o iconos contextualmente relevantes.
     - Título y descripción empática que explican el beneficio de la sección.
     - Botón de llamada a la acción directo (ej. *"Importar primer extracto bancario"*, *"Crear primera cuenta"*).
3. **Micro-interacciones y Animaciones Fluidas:**
   - Transiciones de entrada orquestadas con Framer Motion (`initial={{ opacity: 0, y: 12 }}`).

---

## 3. Arquitectura y Componentes Involucrados

### A. Componente de Evolución Patrimonial (`src/components/NetWorthChart.tsx` o Reports)
- Contenedor con `ResponsiveContainer` y altura fija.
- Recharts `AreaChart` con gradiente de color primario (`url(#netWorthGradient)`).
- Integración opcional en el Dashboard o en la solapa de Reportes.

### B. Componente Base de Estados Vacíos (`src/components/EmptyState.tsx`)
- Props estructuradas:
  ```ts
  interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }
  ```

### C. Reconstrucción Histórica de Saldos
- Función utilitaria que recorre las transacciones ordenadas cronológicamente para calcular los saldos día a día de forma eficiente.

---

## 4. Criterios de Aceptación (DoD)
- [x] El gráfico de evolución patrimonial se renderiza de forma fluida y responsiva sin desbordes.
- [x] Los números financieros en tooltips y leyendas utilizan `tabular-nums` y respetan el modo privacidad.
- [x] Todos los estados vacíos principales cuentan con llamada a la acción contextual para guiar al usuario.
- [x] Verificación de suite de pruebas unitarias (`npm test`) y compilación exitosa.
