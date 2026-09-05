---
name: db-ops
description: Operaciones locales de base de datos para m3. Usar para aplicar migraciones, reiniciar base de datos local, ejecutar seed data y correr validaciones obligatorias de seguridad y performance (db advisors).
---

# DB Ops — Herramientas y Flujo de Base de Datos Local

Guía operativa y scripts de base de datos local (Docker) para `m3`.

## Variables y Conexión Local

- **Host:** `127.0.0.1`
- **DB Port:** `54422` (definido en `supabase/config.toml`)
- **API Port:** `54421`
- **Studio Port:** `54423`
- **Cadena de conexión:** `postgresql://postgres:postgres@127.0.0.1:54422/postgres`

---

## Comandos Operativos

### 1. Iniciar o verificar entorno local
```bash
supabase start
```

### 2. Reiniciar base de datos local y correr seed
```bash
supabase db reset
```

### 3. Crear nueva migración
```bash
supabase migration new <nombre_migracion>
```

### 4. Auditoría obligatoria de seguridad y performance (OBLIGATORIO antes de cerrar tarea de DB)
```bash
supabase db advisors --local
```

### 5. Consolidación por Release Version (Regla de Mantenimiento)
Mantener siempre sincronizadas las migraciones incrementales en `supabase/migrations/` y generar deltas consolidados por versión en `supabase/releases/`:
- `supabase/releases/release_v1.0.0_core_foundation.sql`: Inicialización desde cero de tablas base, RLS y Storage.
- `supabase/releases/release_v1.1.0_ai_whatsapp_and_multicurrency.sql`: Delta con bot de WhatsApp y soporte multi-moneda.
- Cada nuevo paquete de versión debe contar con su script consolidado e idempotente (`IF NOT EXISTS`) para despliegues limpios.

---

## Inspección con MCP Postgres

Cuando el servidor MCP `postgres-local` esté activo, preferir ejecutar consultas directas de solo lectura (schemas, columnas, políticas RLS) para confirmar el estado real antes de escribir código TypeScript o migraciones SQL.
