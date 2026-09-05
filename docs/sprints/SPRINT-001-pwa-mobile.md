# Sprint 1 Runbook: P7 — App PWA Mobile para Android e iOS (SPEC-009)

- **Estado:** `Shipped`
- **Fecha:** 2026-09-04
- **PM Lead:** PM Orchestrator
- **Epica / Item Backlog:** [P7 — App PWA Mobile (SPEC-009)](../specs/SPEC-009-pwa-mobile.md)

---

## 1. 🔍 [RESEARCH] Benchmark de Mercado & Edge Cases (Market Researcher)
- **Referentes analizados:** Copilot Money, Linear Mobile, Notion Mobile.
- **Patrones de interacción destacados:** Modo fullscreen sin barras de navegación, tema `#0a0a0f` adaptativo y shortcuts de alta rápida.
- **Edge cases prevenidos:** Bypass estricto de caché para llamadas a Supabase (`*.supabase.co`) para garantizar balance transaccional fresco; manejo de guía paso a paso para iOS Safari donde `beforeinstallprompt` no está disponible nativamente.

---

## 2. 🎨 [DESIGN SPEC] Experiencia & Micro-interacciones (Product Designer)
- **Iconografía & Assets:** Icono vectorial SVG y PNGs adaptativos generados en `public/icons/` (192x192, 512x512, Apple Touch Icon y Maskable).
- **Componente `PwaInstallPrompt`:** Banner premium integrado en Ajustes con detección de estado instalada, botón con escala al tacto y modal interactivo para iOS Safari.

---

## 3. ⚙️ [TECH ARCHITECTURE] Implementación & Robustez (Principal Engineer)
- **Archivos creados / modificados:**
  - `public/manifest.webmanifest`: Declaración W3C PWA completa con shortcuts `/?action=quick-add`.
  - `public/sw.js`: Service Worker con estrategia Cache-First para estáticos y bypass para Supabase.
  - `src/main.tsx`: Registro seguro del Service Worker en producción.
  - `src/hooks/usePwaInstall.ts`: Hook para capturar eventos de instalación y detectar standalone / iOS.
  - `src/components/PwaInstallPrompt.tsx`: UI adaptativa para instalación.
  - `src/components/SettingsPage.tsx`: Integración en la pantalla de Ajustes.
  - `src/pages/Index.tsx`: Soporte para deep-link del atajo `?action=quick-add`.
- **Validación:** `node scripts/check-all.cjs` (TypeScript, Vitest y Vite Build) ejecutado con éxito al 100%.

---

## 4. 🛡️ [QA MATRIX & AUDIT] Auditoría de Calidad (Rigorous QA Auditor)
- [x] TypeScript `tsc --noEmit`: 0 errores.
- [x] Suite de Vitest: 100% pasando sin regresiones.
- [x] Build de Producción: Generado exitosamente.
- [x] Atajo de inicio rápido (`?action=quick-add`) operativo.
- **Veredicto:** `[ APROBADO PARA SHIPPED ]`

---

## 5. 🧠 [RETROSPECTIVA & MEMORIA] Aprendizajes para el Sistema
- Las PWAs que consumen bases de datos en tiempo real (Supabase) deben excluir explícitamente el origen de la API en el Service Worker para prevenir inconsistencias de saldo en transacciones financieras.
