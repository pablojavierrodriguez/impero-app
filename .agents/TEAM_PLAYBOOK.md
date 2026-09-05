# Playbook de Operación Multi-Agente — m3 (Money Master)

Este manual rige la dinámica de trabajo colaborativo en bucle (loop) entre los 5 roles de agentes para llevar m3 al estándar más alto del mercado de software financiero personal.

---

## 🔄 El Bucle de Retroalimentación del Sprint (5 Fases)

```
       [ 1. Discovery & PM ]
                 │
                 ▼
       [ 2. Market Research ] ◄──────────┐
                 │                       │ (Ajustes de UX /
                 ▼                       │  Edge cases)
       [ 3. Design & Motion ]            │
                 │                       │
                 ▼                       │
       [ 4. Engineering & Build ]        │
                 │                       │
                 ▼                       │
       [ 5. QA Sentinel & Audit ] ───────┘
                 │
                 ▼ (Aprobación Unánime)
          [ Sprint Demo ] ──► [ Feedback a Reglas/Skills ]
```

### Fase 1: Briefing & Alineación (PM Orchestrator)
- **Entrada:** Un item del backlog o requerimiento del usuario.
- **Acción:** Abre un nuevo archivo en `docs/sprints/SPRINT-XXX-<slug>.md` usando la plantilla oficial.
- **Salida:** Problema claro, usuarios impactados y objetivos medibles.

### Fase 2: Investigación & Benchmarking (Market Researcher)
- **Acción:** Analiza cómo referentes mundiales (Linear, Notion, Stripe, Copilot Money, Obsidian) abordan esta experiencia.
- **Salida:** Escribe en la sección `[1. RESEARCH & BENCHMARKS]` del sprint doc los patrones ganadores, alertas de errores comunes y edge cases financieros.

### Fase 3: Diseño de Experiencia World-Class (Product Designer)
- **Acción:** Define la anatomía visual, tokens semánticos, animaciones y micro-interacciones.
- **Salida:** Completa la sección `[2. DESIGN & INTERACTION SPEC]` detallando estados táctiles, comportamientos móviles y retroalimentación sensorial.

### Fase 4: Arquitectura e Implementación (Principal Engineer)
- **Acción:** Escribe el código en TypeScript limpio, modular, sin mutaciones directas y con RLS blindado.
- **Validación previa obligatoria:** Ejecución de `npx tsc --noEmit && npm run build`.
- **Salida:** Completa `[3. TECHNICAL IMPLEMENTATION]` y entrega el build al QA Sentinel.

### Fase 5: Auditoría Implacable (QA Auditor)
- **Acción:** Inspecciona en navegador (Browser Subagent / DevTools), evalúa a11y, valida responsive en viewport de 375px y busca desbordes o parpadeos.
- **Loop de Corrección:** Si detecta cualquier fricción, devuelve la tarea al Ingeniero o Diseñador con el reporte exacto.
- **Salida:** Solo cuando el veredicto es 100% verde, firma `[4. QA SIGNOFF]` y el PM presenta el trabajo al usuario.

---

## 🧠 Protocolo de Aprendizaje y Memoria Viva (Knowledge Feeder)

Al cerrar cada sprint:
1. **¿Qué descubrimos sobre el comportamiento móvil o los inputs?** Se actualiza `.agents/skills/mobile-ux-design` o `.agents/skills/forms-rhf-zod`.
2. **¿Qué patrón de arquitectura o base de datos se probó superior?** Se documenta como ADR en `docs/decisions/`.
3. Ningún error de interfaz, accesibilidad o tipado se resuelve dos veces: **se convierte en una regla permanente del proyecto.**
