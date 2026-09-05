# Sprint Spec & Runbook — [ID / Nombre de la Feature]

- **Estado:** `Draft` | `In Review` | `In Engineering` | `In QA` | `Passed QA` | `Shipped`
- **Fecha:** YYYY-MM-DD
- **PM Lead:** PM Orchestrator
- **Epica / Item Backlog:** [Enlace a BACKLOG.md]

---

## 1. 🔍 [RESEARCH] Benchmark de Mercado & Edge Cases (Market Researcher)
> Análisis de apps referentes (Linear, Stripe, Notion, Copilot Money, Obsidian) y patrones de la industria.

- **Referentes analizados:**
- **Patrones de interacción destacados:**
- **Edge cases identificados (financieros / UX):**
- **Recomendaciones para el equipo:**

---

## 2. 🎨 [DESIGN SPEC] Experiencia & Micro-interacciones (Product Designer)
> Anatomía visual, estados, motion y ergonomía móvil de calibre mundial.

- **Tokens & Jerarquía Visual:**
- **Comportamiento Móvil & Touch Targets (≥ 44px):**
- **Micro-interacciones y Feedback Sensorial (Haptics, Motion):**
- **Estados:**
  - *Default:*
  - *Active / Focus:*
  - *Loading / Skeleton:*
  - *Empty State:*

---

## 3. ⚙️ [TECH ARCHITECTURE] Implementación & Robustez (Principal Engineer)
> Arquitectura de componentes, custom hooks, Supabase RLS y tipado estricto.

- **Archivos creados o modificados:**
- **Tipado & Esquemas Zod:**
- **Consideraciones de Performance (60 FPS, INP):**
- **Validación de Compilación:** `tsc --noEmit && npm run build` (Estado: ✅ Aprobado)

---

## 4. 🛡️ [QA MATRIX & AUDIT] Auditoría de Calidad (Rigorous QA Auditor)
> Validación exhaustiva en navegador, a11y WCAG y stress test.

- **Checklist de Calidad:**
  - [ ] Consola limpia de errores o advertencias (DevTools)
  - [ ] Viewport mobile verificado (375px / 390px - Safe areas)
  - [ ] Inputs controlados sin saltos de foco
  - [ ] Touch targets auditados (≥ 44px)
  - [ ] Tests automáticos pasando
- **Hallazgos / Fricciones detectadas y resueltas:**
- **Veredicto:** `[ APROBADO PARA SHIPPED ]`

---

## 5. 🧠 [RETROSPECTIVA & MEMORIA] Aprendizajes para el Sistema
- **Regla o Skill actualizada:**
- **Decisión de arquitectura documentada:**
