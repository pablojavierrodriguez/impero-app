---
name: supabase-integration
description: Usar esta skill siempre que se trabaje con Supabase — cliente JS, autenticación, políticas RLS, CLI, migraciones, o al alternar entre la instancia local (Docker) y el proyecto cloud de producción. También cuando el usuario mencione errores de conexión con Supabase, problemas de login del CLI, o el error "Resource has been removed".
---

# Supabase Integration

Convenciones para este proyecto, que usa un entorno local con Docker y un proyecto cloud de producción.

## Si el MCP de Supabase está conectado

Preferir las herramientas del MCP para consultar el schema real, policies existentes, o correr queries de diagnóstico contra el proyecto cloud, en vez de asumir cómo está armada la base. Especialmente antes de generar una migración nueva o un query complejo: primero confirmar el estado real vía MCP, después escribir el código.

El MCP normalmente apunta al proyecto **cloud**, no a la instancia local de Docker — los comandos CLI de esta skill (`supabase start`, `db reset`, etc.) siguen siendo el camino para todo lo que pasa en el entorno local.

---

## Local (Docker) vs Cloud

- Desarrollo web: `supabase start` levanta el stack local (Postgres, Auth, Storage, Studio) vía Docker.
- La app web lee la URL/anon key desde variables de entorno (`.env.local` apunta al local, `.env.production` al cloud).
- **Supabase Studio local:** puerto `54323` → `http://localhost:54323`
- **API local:** usar siempre `http://127.0.0.1:54321` (nunca `localhost`) para evitar fallos de DNS con Google Login o fallos del SDK.
- **Importante**: en el build nativo Android (Capacitor) el `.env` no se puede releer en runtime — coordinar con la skill `capacitor-mobile-build` para decidir la URL en runtime en vez de en build-time.

---

## CLI: comandos frecuentes

```bash
supabase start              # levanta el entorno local
supabase stop               # lo apaga
supabase db reset           # reaplica migraciones + seed sobre el local
supabase link --project-ref <ref>   # vincula el proyecto local al proyecto cloud
supabase db push            # aplica migraciones locales al cloud
supabase db advisors --local  # ← OBLIGATORIO antes de cerrar cualquier tarea de DB
```

---

## ⚡ Patrón de Consultas Resilientes (Desacopladas con Map)

Cuando se consultan tablas principales en relacionales pesadas (ej: `attendance_records` con `meetings` y `groups`), los joins anidados explícitos de PostgREST como `.select("id, meetings(starts_at, title, groups(name)))"` a veces fallan silenciosamente o devuelven arrays vacíos debido a políticas RLS estrictas o claves foráneas opcionales.

**Solución recomendada para vistas de dashboards / timelines**:
1. Hacer una consulta directa a la tabla base (ej. `attendance_records`).
2. Recolectar los IDs únicos de la entidad secundaria (`meeting_ids`).
3. Consultar la entidad secundaria en un paso dedicado (`supabase.from('meetings').select('...').in('id', meetingIds)`).
4. Mapear en memoria usando un `Map<string, Entity>()` de JavaScript.

Este patrón evita fallos por RLS anidado y garantiza respuestas 100% confiables y de alta performance.

---

## 🔗 Sintaxis Canónica de Relaciones en PostgREST (Embeds)

Para consultas directas con joins embebidos en Supabase JS:

### 1. Relación estándar vía Foreign Key
- **Sintaxis**: `tabla_destino(columna1, columna2)` o `alias:columna_fk(columna1, columna2)`
```ts
// ✅ Correcto (Relación 1 a 1 vía foreign key branch_id):
.select("id, first_name, branch:branch_id(id, name)")

// ✅ Correcto (Relación 1 a N de tabla hija):
.select("id, name, group_members(person_id, role)")
```

### 2. Auto-relación (Self-reference / Jerarquías)
- Cuando una tabla se referencia a sí misma (ej: `groups.parent_group_id`), especificar el nombre de la constraint o tabla con `!` para desambiguar:
```ts
// ✅ Correcto:
.select("id, name, parent_group:parent_group_id(name)")
// o si es ambiguo:
.select("id, name, parent_group:groups!groups_parent_group_id_fkey(name)")
```

### 3. ❌ Anti-patrones que causan error 400 (Bad Request)
- **NUNCA usar `alias:columna_fk(...)` sobre una tabla anidada secundaria:**
  ```ts
  // ❌ Prohibido: PostgREST busca una tabla llamada "household_id" y rompe con error 400
  .select("id, household_members(household_id, households:household_id(name))")

  // ✅ Correcto: resolver vía estado/Map en React o embeber directamente la tabla
  .select("id, household_members(household_id, households(name))")
  ```

## Autenticación del CLI (macOS)

En macOS, el login interactivo del CLI puede fallar por permisos del Keychain (pide acceso repetidamente o falla en scripts/CI). Preferir autenticación por token en vez de login interactivo:

```bash
export SUPABASE_ACCESS_TOKEN=<token generado en app.supabase.com/account/tokens>
```

Con esa variable seteada, el CLI no intenta tocar el Keychain. Usar siempre este método en scripts, tareas del agente, o CI/CD.

---

## Arquitectura de migraciones (ADR-004)

El proyecto usa **6 migraciones activas consolidadas** con prefijo `20270*` + una migración de RLS suelta anterior. Las 113+ migraciones históricas están en `supabase/migrations/archive/` (no se ejecutan, solo historial de Git).

| Archivo | Qué contiene |
|---|---|
| `20270101000000_types_and_enums.sql` | Tipos base y enums |
| `20270102000000_tables_definition.sql` | Tablas y constraints |
| `20270103000000_system_seeds.sql` | Roles y permisos del sistema |
| `20270104000000_functions_and_rpcs.sql` | Funciones y RPCs |
| `20270105000000_triggers_and_rls.sql` | Triggers + políticas RLS |
| `20270106000000_security_and_grants.sql` | `REVOKE`/`GRANT` y privilegios |
| `20260618000000_fix_rls_linter_0003_and_0006.sql` | Fix RLS pendiente de consolidar |
**Política Estricta de Migraciones del Proyecto:**
- **CERO MIGRACIONES PARCHE**: Queda estrictamente prohibido crear archivos de migración como parches temporales para resolver inconsistencias. Para el proyecto se **debe modificar siempre la migración consolidada original correspondiente** (`20270101*` a `20270106*`), garantizando que cualquier `supabase db reset` o inicialización en limpio / CI sea 100% determinista y libre de errores.
- **Deltas para Producción / Cloud**: Para aplicar cambios en bases de datos remotas activas sin pérdida de datos ni recrear la BD, se debe crear **exclusivamente un snippet SQL idempotente** en `supabase/snippets/deltas/nombre_del_cambio_delta.sql`.

**Estructura de un Snippet Delta Idempotente:**
```sql
-- 1. Limpieza de estado previo
DROP POLICY IF EXISTS "nombre_politica" ON public.tabla;

-- 2. Creación o reemplazo seguro
CREATE POLICY "nombre_politica" ON public.tabla ...;

-- 3. Recarga de caché PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## SECURITY INVOKER vs SECURITY DEFINER

Esta distinción causó el **bug del loop de login de Google OAuth** en v0.10.0 (ver más abajo). Seguir las reglas estrictamente.

### Regla 1 — Triggers: INVOKER por defecto, DEFINER con excepción

La mayoría de triggers usa `SECURITY INVOKER` porque corren dentro del contexto del rol que disparó la operación.

**Excepción obligatoria → usar `SECURITY DEFINER` si el trigger:**
- Escribe a tablas de logs o auditoría (`log_activity_internal`, `activity_logs`)
- Hace conteos globales de quotas (`enforce_alfa_people_limit`)
- Sincroniza datos cross-tabla y necesita eludir RLS del usuario (`handle_user_sync`)

### Regla 2 — `SET search_path = public` es SIEMPRE obligatorio

Tanto en `SECURITY DEFINER` como en `SECURITY INVOKER`, sin excepción (silencia Linter 0011):

```sql
CREATE OR REPLACE FUNCTION public.mi_funcion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER           -- o DEFINER según la regla 1
SET search_path = public   -- ← SIEMPRE, en ambos casos
AS $$ ... $$;
```

---

## Grants explícitos (DEFAULT PRIVILEGES)

Desde `20270106000000_security_and_grants.sql`, toda función nueva nace **completamente bloqueada**. Hay que hacer `GRANT EXECUTE` explícito:

| Tipo de función | GRANT |
|---|---|
| Trigger / cron / helper interno | Ninguno (`-- trigger-only: no direct EXECUTE grant`) |
| RPC para usuarios autenticados | `GRANT EXECUTE ... TO authenticated;` |
| RPC público (magic link, visitante sin login) | `GRANT EXECUTE ... TO anon, authenticated;` |
| Helper solo para otras SECURITY DEFINER | `GRANT EXECUTE ... TO service_role;` |

Si la función ya existía, agregar siempre:
```sql
REVOKE EXECUTE ON FUNCTION public.mi_fn(...) FROM PUBLIC, anon, authenticated;
-- luego el GRANT correspondiente
```

---

## RLS — Checklist para tablas nuevas

- `ALTER TABLE public.mi_tabla ENABLE ROW LEVEL SECURITY;` es obligatorio.
- Si la tabla solo se accede vía `SECURITY DEFINER`, agregar política restrictiva para silenciar el linter:
  ```sql
  CREATE POLICY "internal_only" ON public.mi_tabla AS RESTRICTIVE USING (false);
  ```
- Para tablas con acceso directo de usuarios: políticas separadas para `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- **Linter 0003**: Siempre usar subconsulta `(SELECT auth.uid())` — nunca `auth.uid()` directo en `USING`:
  ```sql
  USING ( organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = (SELECT auth.uid())  -- ← subconsulta, no directo
  ))
  ```
- **Linter 0006**: No crear dos políticas `FOR SELECT` permisivas sobre la misma tabla. Unificar con `OR`:
  ```sql
  USING ( <condición_staff> OR <condición_token_público> )
  ```
- Al modificar RLS: siempre `DROP POLICY IF EXISTS "nombre" ON tabla;` antes de recrear.
- Toda query o función que acceda a datos de una org debe filtrar por `organization_id`.

---

## Bug conocido: Loop de Login con Google OAuth (resuelto en v0.10.0)

**Síntoma**: callback de Google OAuth fallaba con `permission denied for table profiles`, redirigiendo al login en loop.

**Causa**: `handle_user_sync` y `handle_new_profile_notifications` usaban `SECURITY INVOKER`. Al ser disparadas por el sistema de Auth de Supabase (rol interno), no tenían permisos para escribir en `profiles` u otras tablas de usuario.

**Solución aplicada**: cambiar ambas funciones a `SECURITY DEFINER SET search_path = public`. Estas funciones son la excepción a la regla de triggers (escriben datos cross-tabla).

**Lección**: si un trigger falla silenciosamente durante la autenticación de Google/OAuth y hay `permission denied` en los logs de Supabase, verificar primero si el trigger necesita ser `SECURITY DEFINER`.

---

## Advertencias intencionales del Supabase Advisor (no "arreglar")

Las siguientes funciones siempre aparecen como `WARN` porque son RPCs públicos **por diseño**. No tocar:

- `register_public_visitor`, `register_visitor` — formulario de visitante sin login
- `get_profile_by_token`, `update_profile_by_token` — magic links
- `join_org_by_code`, `join_org_by_code_onboarding` — onboarding
- Helpers de RLS (`has_permission`, `has_org_role`, `is_active_member`, `can_edit_person`) — rol `authenticated` intencional

---

## Error "Resource has been removed"

Casi siempre indica un `project-ref` mal escrito o desactualizado en el link local. Pasos:

1. Verificar el ref correcto en el dashboard de Supabase (Settings → General → Reference ID).
2. `supabase unlink` (si existe) y volver a `supabase link --project-ref <ref-correcto>`.
3. Confirmar que el token en `SUPABASE_ACCESS_TOKEN` no esté vencido.

---

## Edge Functions & Deno (supabase/functions/)

Las Edge Functions corren sobre el runtime de **Deno** (no Node.js) y usan imports URL o APIs globales nativas.

### Reglas de implementación y runtime (obligatorio):
1. **Uso de `Deno.serve(...)` nativo (Prohibido `std@0.168.0/http/server.ts`)**:
   - En versiones modernas del Supabase CLI / Deno runtime, el paquete antiguo `https://deno.land/std@0.168.0/http/server.ts` está deprecado y causa fallos de conexión al empaquetar (`tcp connect error: Connection refused`).
   - Usar siempre la API nativa de Deno:
     ```ts
     // ✅ Correcto:
     Deno.serve(async (req: Request) => {
       if (req.method === 'OPTIONS') {
         return new Response('ok', { headers: corsHeaders })
       }
       // ...
     })
     ```
2. **Imports URL de Deno y `@ts-ignore`**:
   - En las funciones de `supabase/functions/`, anteponer `// @ts-ignore` sobre los imports de URLs remotas (ej: `https://esm.sh/...`) para que el Language Server de Node/TypeScript del IDE no reporte falsos positivos de módulo no encontrado.
3. **Declaración del entorno Deno**:
   - En el encabezado de las funciones de `supabase/functions/`, declarar siempre `declare const Deno: any;` para que el IDE reconozca la variable global de Deno.
4. **Tipado explícito de Handlers**:
   - Tipar siempre el handler HTTP: `Deno.serve(async (req: Request) => { ... })`.
5. **Validación de tipos de Postgrest en cliente Supabase**:
   - Al realizar consultas con tablas muy relacionadas o dinámicas (como join tables sin tipado estricto o uniones complejas en batch), tipar explícitamente `(supabase.from as any)('table_name')` o mapear con DTOs seguros para evitar que el compilador del IDE entre en bucles de instanciación recursiva (`Type instantiation is excessively deep`).

---

## Sincronización Automática `auth.users` $\rightarrow$ `public.profiles` (`handle_user_sync`)

Todo usuario registrado vía `supabase.auth.signUp()` o proveedores OAuth (Google) debe sincronizarse automáticamente con la tabla `public.profiles`.

1. **Trigger en Base de Datos:**
   - La función `public.handle_user_sync()` (`SECURITY DEFINER SET search_path = public`) se dispara en `AFTER INSERT` y `AFTER UPDATE` sobre `auth.users`.
   - Garantiza que `public.profiles` siempre tenga la fila correspondiente con `id, full_name, email, phone`.
2. **Dependencia Crítica de Foreign Keys:**
   - `public.memberships.user_id` referencia `public.profiles(id)`. Si el trigger no está activo, cualquier inserción en `memberships` (onboarding, invitaciones, `join_org_by_code`) fallará por violación de FK.
3. **Resiliencia en Edge Functions vs Frontend (SuperAdmin Console):**
   - En vistas administrativas como `/admin/users`, cuando se invocan Edge Functions (`admin-user-actions`), incluir siempre un fallback que ejecute la operación directamente contra las tablas de Supabase (`memberships` y `user_roles`) si la Edge Function responde `503 Service Unavailable` (habitual en entornos locales donde Deno serve no está activo).

---

## Validación obligatoria antes de cerrar cualquier tarea de DB o código

```bash
npm run check:db               # Linter estático de reglas de DB, search_path y consolidación
supabase db advisors --local   # Security Advisor de Supabase
npm run check:all              # Validación general rápida (DB + UI + i18n + Releases + TypeScript)
```

Si retorna warnings que NO están en la lista de intencionales de arriba o errores en el compilador, resolver antes de commitear.
