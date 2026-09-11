# SQL Snippets — IMPERO

Este directorio contiene **scripts utilitarios y consultas de diagnóstico o mantenimiento manual** para desarrollo y soporte local.

---

## ⚠️ Reglas estrictas de higiene para este directorio

1. **PROHIBIDO guardar deltas o migraciones aquí:**
   - Todos los deltas para producción pertenecen a `supabase/migrations/delta/`.
   - La estructura base de base de datos reside en `supabase/migrations/00000000000000_schema_foundation.sql`.
2. **PROHIBIDO commitear consultas automáticas sin nombre (`Untitled query *.sql`):**
   - Supabase Studio guarda en disco las pestañas abiertas en el editor web local.
   - Si creaste una consulta ad-hoc para investigar un bug, eliminala o renombrala a un nombre descriptivo antes de commitear.
3. **Todo snippet debe estar documentado:**
   - Debe incluir un bloque de encabezado explicando para qué sirve, si es seguro para ejecutar y en qué entornos (local vs prod).

---

## Inventario de utilitarios

| Archivo | Propósito | Entorno |
|---|---|---|
| `clear_seed_data.sql` | Limpia los datos de negocio generados por el seed para el usuario `dev@impero.local` sin borrar el perfil ni las cuentas del sistema. | **Solo Local** |
