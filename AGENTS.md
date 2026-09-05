# Global Agent Instructions — m3 (Money Master)

---

## Idioma

- Responder **siempre en español**, sin excepción.
- Código, variables, funciones y comentarios técnicos: **en inglés**.
- Documentación de producto y decisiones de arquitectura: **en español**.

---

## Comportamiento general

1. **Plan antes de ejecutar.** Ante cualquier tarea no trivial, presentar un plan claro antes de escribir código o hacer cambios. Esperar confirmación.
2. **Preguntar cuando haya ambigüedad real.** No asumir. Si hay más de una interpretación razonable, preguntar antes de avanzar.
3. **Soluciones simples que escalen.** Evitar over-engineering. La solución más simple que resuelva el problema correctamente y pueda crecer es la correcta.
4. **Documentar decisiones importantes.** Cualquier decisión de arquitectura, patrón o desvío del estándar del proyecto debe quedar documentado.
5. **No romper lo que funciona.** Antes de refactorizar, entender el impacto completo y pedir confirmación al usuario antes de actuar.
6. **Ante inconsistencia entre reglas y código, consultar al usuario antes de actuar.**

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** shadcn/ui + Radix UI + Framer Motion
- **Formularios:** React Hook Form + Zod
- **Charts:** Recharts
- **Testing:** Vitest + Testing Library

---

## Buenas prácticas innegociables

- **Tolerancia cero a errores de compilación y problemas en el editor (Validación obligatoria)**: Ante cualquier cambio de código en cualquier archivo del proyecto (frontend, backend o scripts), es obligatorio validar que el proyecto compila sin errores mediante `npx tsc --noEmit && npm run build`. Prohibido entregar cambios o dar por concluida una tarea con errores de tipado, imports rotos o problemas que generen pantallas en blanco.
- **Homogeneidad de UI y reutilización**: Respetar el Design System y los componentes base en `src/components/ui`. Toda vista similar debe compartir los mismos tokens, espaciados y microtipografía.
- **Seguridad**: validar y sanitizar inputs siempre (Zod schemas). Políticas RLS activas en todas las tablas de Supabase. Nunca exponer secrets o service role keys en código cliente o repositorios.
- **Inputs controlados**: Todo `<input>` o `<textarea>` debe tener valor inicial definido (usar `""` en lugar de `undefined`) para evitar warnings de componentes no controlados a controlados.
- **Eficiencia y optimización de tokens**:
  - **Lecturas quirúrgicas**: Usar `view_file` con rangos de líneas o `grep_search` en lugar de leer archivos completos.
  - **Modificaciones compactas**: Priorizar `replace_file_content` o `multi_replace_file_content` sobre reescrituras completas.
  - **Progressive disclosure**: Consultar las guías detalladas en Skills (`.agents/skills/`) según la tarea en curso.

---

## Reglas de Git — Commits y Pushes

> [!CAUTION]
> **NUNCA realizar commits ni pushes sin autorización expresa y explícita del usuario para CADA acción.**

- **PROHIBIDO INFERIR PERMISOS:** La aprobación previa de un commit o push NUNCA otorga permiso tácito para ejecutar commits o pushes posteriores.
- **PALABRAS DE TAREA NO SON PERMISO DE COMMIT:** Frases como *"ok"*, *"adelante"*, *"armalo"*, *"hacelo"*, *"listo"* o *"procedé"* significan **exclusivamente implementar o editar el código**, **JAMÁS** ejecutar `git commit` ni `git push`.
- **REGLA DE ACCIÓN ÚNICA Y VERBAL:** Cada commit y cada push requiere un mensaje de autorización individual que contenga la palabra *"commit"* o *"push"* explícita.
- Ante la duda, terminar el turno mostrando lo que se modificó y esperar la orden de commit del usuario.

---

## Design System & UX

- **Colores:** Usar preferentemente tokens semánticos de Tailwind (`primary`, `secondary`, `accent`, `destructive`, `muted`, `background`, `card`, `border`).
- **Gradientes:** Usar las clases de utilidad del proyecto (`gradient-primary`, `gradient-card`) o tokens semánticos en lugar de combinaciones ad-hoc con colores arbitrarios.
- **Mobile First & Ergonomía táctil:**
  - Tamaño de toque mínimo de **44×44px** en elementos interactivos.
  - Feedback visual táctil activo.
  - Modales con scroll vertical seguro (`max-h-[90vh] overflow-y-auto`).
- **Recharts responsivo:** Todo gráfico debe estar contenido en `ResponsiveContainer` con altura fija en el contenedor padre.
- **Formularios con RHF y Zod:** Siempre inferir el tipo con `z.infer<typeof schema>` e inicializar campos con strings vacíos `""` en `defaultValues`.

---

## Supabase & Database Standards

- **RLS obligatorio:** Toda tabla en `public` debe tener Row Level Security activado.
- **Funciones SECURITY DEFINER:** Siempre especificar `SET search_path = public, pg_temp`.
- **Subqueries en Auth:** Envolver llamadas a funciones de auth en subqueries: `(select auth.uid())`.
