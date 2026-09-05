# SPEC-007: Reportes Financieros & Exportación (P5)

## 1. Contexto & Diagnóstico
`ReportsPage.tsx` y `SpendingBreakdown.tsx` muestran gráficos de Recharts con agregaciones mensuales. Para ser una herramienta completa de análisis personal (estilo Mobills / Wallet), se requiere flexibilidad de rangos de fechas (trimestres, años personalizados, comparativas intermensuales) y la capacidad de exportar los datos para control contable o backups.

---

## 2. Objetivos
1. **Filtros Temporales Flexibles**:
   - Presets: Este Mes, Mes Anterior, Últimos 3 Meses, Año Actual, Rango Personalizado.
2. **Evolutivo de Ingresos vs. Gastos vs. Ahorro**:
   - Gráfico de barras agrupadas / áreas apiladas con tasa de ahorro mensual:
     $$\text{Tasa de Ahorro} = \frac{\text{Ingresos} - \text{Gastos}}{\text{Ingresos}} \times 100$$
3. **Desglose de Gastos por Categoría & Subcategoría**:
   - Gráfico de dona (`Donut Chart`) interactivo con tooltips detallados y tabla de porcentaje de participación.
4. **Exportación de Datos (CSV & Excel)**:
   - Exportar conjunto de transacciones filtradas respetando codificación UTF-8 con BOM (para compatibilidad directa con Microsoft Excel en español).

---

## 3. Arquitectura y Componentes Involucrados

### A. Capa de Exportación (`src/lib/export-utils.ts`)
- `exportTransactionsToCsv(transactions: Transaction[], filename?: string)`:
  - Formateo de fechas localizadas (`DD/MM/YYYY`).
  - Nombres de cuentas y categorías resueltas (no IDs internos).
  - Descarga mediante `Blob` y trigger de descarga seguro en el navegador.

### B. Vistas y Gráficos (`src/components/ReportsPage.tsx`)
- Implementación conforme a las directivas de Recharts:
  - Contenedores siempre en `ResponsiveContainer` con altura explícita.
  - Colores basados en el Design System y tokens semánticos de Tailwind (`primary`, `destructive`, etc.).
  - Card de resumen ejecutivo: Total Ingresos, Total Gastos, Balance Neto y Tasa de Ahorro del período seleccionado.

---

## 4. Plan de Verificación & Compliance
1. **Tests Unitarios**:
   - Validación del generador de CSV: comprobación de cabeceras, escape de comas y caracteres especiales en descripciones.
2. **Validación de Compliance**:
   - `node scripts/check-all.cjs` pasando al 100%.
