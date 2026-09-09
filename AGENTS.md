# Global Agent Instructions — IMPERO (Autogobierno • Claridad • Soberanía)

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
- **Invariante Numérica y Formato de Moneda (`es-AR`)**:
  - Toda visualización de montos monetarios o números mayores a 999 DEBE formatearse con punto para miles y coma para decimales (ej. `5.000.000,00` o `1.250`). Centralizar siempre mediante `formatAmount` / `toLocaleString("es-AR")`.
  - Prohibido dejar valores numéricos crudos formateados con comas para miles (`5,000,000`).
  - En inputs editables con teclado, procesar con utilidades bidireccionales (`formatThousandsInput` y `parseThousandsInput`), evitando `<input type="number">` nativo que rechaza comas decimales en mobile.
- **Invariantes de Dominio Financiero (Pasivos y Patrimonio Neto)**:
  - Todo pasivo financiero (deudas de tarjetas de crédito, préstamos) debe mantenerse garantizado como saldo no positivo (`balance <= 0`) en base de datos, servicios y stores (`Math.min(0, balance)` o `-Math.abs(balance)`). Prohibido permitir que un pasivo sume como activo al patrimonio neto (*Net Worth*).
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
- **MENSAJES DE COMMIT AUTODESCRIPTIVOS Y DETALLADOS:**
  - Prohibido usar mensajes vagos, genéricos o basados en jerga de sesión/sprints (ej: *"fix bugs"*, *"sprint 1-4"*, *"update files"*).
  - El título debe resumir claramente el impacto principal del cambio.
  - Cuando el commit englobe múltiples cambios, es obligatorio incluir un cuerpo descriptivo estructurado (macro-resumen y viñetas por módulo: Core, UI, DB, etc.) que explique con precisión **qué** se modificó para que cualquier persona externa entienda el contenido del commit sin haber estado presente.
- Ante la duda, terminar el turno mostrando lo que se modificó y esperar la orden de commit del usuario.

---

## Design System & UX

- **Colores:** Usar preferentemente tokens semánticos de Tailwind (`primary`, `secondary`, `accent`, `destructive`, `muted`, `background`, `card`, `border`).
- **Gradientes:** Usar las clases de utilidad del proyecto (`gradient-primary`, `gradient-card`) o tokens semánticos en lugar de combinaciones ad-hoc con colores arbitrarios.
- **Mobile First & Ergonomía táctil:**
  - Tamaño de toque mínimo de **44×44px** en elementos interactivos principales (mínimo 36px con padding en secundarios).
  - Feedback visual táctil activo (`active:scale-[0.98]` o transiciones suaves).
  - Modales con scroll vertical seguro (`max-h-[90vh] overflow-y-auto`).
- **Estructura Anti-Hacinamiento en Tarjetas Móviles (Invariante de Dos Niveles):**
  - **Prohibido empaquetar más de 2 datos primarios en una sola fila horizontal** en tarjetas móviles (`< 640px`).
  - **Fila 1 (Identidad y Monto):** Ícono de categoría + Columna con Nombre (`truncate`) y Cuenta bancaria (`min-w-0 flex-1`). A la derecha: Monto grande con respiro (`font-mono-data tabular-nums`).
  - **Fila 2 (Contexto y Workflow):** Chips sutiles separados para estado de vencimiento y modalidad (`Débito auto` vs `Pago manual`).
  - **Fila 3 (Acciones):** Estado a la izquierda y botones de acción a la derecha.
- **Límite de Acciones por Fila (`Action Creep`):**
  - Prohibido colocar 3 o 4 botones de acción visibles en una sola fila de lista/tabla en mobile.
  - Mantener **1 sola acción primaria visible** (ej: botón `+` de subcategoría o botón `Pagar`).
  - Todas las acciones secundarias (Editar, Archivar, Eliminar, Ajustar) deben agruparse dentro de un menú accesible (`DropdownMenu` / `MoreVertical`).
- **Recharts responsivo:** Todo gráfico debe estar contenido en `ResponsiveContainer` con altura fija en el contenedor padre.
- **Formularios con RHF y Zod:** Siempre inferir el tipo con `z.infer<typeof schema>` e inicializar campos con strings vacíos `""` en `defaultValues`.

---

## Supabase & Database Standards

- **RLS obligatorio:** Toda tabla en `public` debe tener Row Level Security activado.
- **Funciones SECURITY DEFINER:** Siempre especificar `SET search_path = public, pg_temp`.
- **Subqueries en Auth:** Envolver llamadas a funciones de auth en subqueries: `(select auth.uid())`.
