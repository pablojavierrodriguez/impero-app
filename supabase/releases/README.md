# Gestión de Migraciones y Releases de Base de Datos

Este directorio contiene las migraciones individuales de Supabase y los deltas consolidados por versión de release para despliegues limpios y reproducibles.

---

## 📂 Estructura

```
supabase/
├── migrations/          # Migraciones incrementales numeradas (ejecutadas por `supabase migration up`)
│   ├── 20260406215403_c2aaec7d-762a-4c25-bea2-1d773e8f6c13.sql
│   ├── 20260406220000_storage_and_user_defaults.sql
│   ├── 20260406221000_grant_permissions.sql
│   ├── 20260904180845_whatsapp_bot_persistence.sql
│   └── 20260905000000_account_currency.sql
└── releases/            # Deltas consolidados por version de release del producto
    ├── release_v1.0.0_core_foundation.sql
    └── release_v1.1.0_ai_whatsapp_and_multicurrency.sql
```

---

## 🚀 Releases Consolidadas

### `release_v1.0.0_core_foundation.sql`
- **Contenido:** Esquema base completo (`profiles`, `accounts`, `categories`, `transactions`, `budgets`, `goals`, `recurring_transactions`, `bill_reminders`), políticas RLS, Storage bucket `receipts` y permisos de base de datos.
- **Uso:** Inicialización desde cero de una base de datos nueva en producción o staging.

### `release_v1.1.0_ai_whatsapp_and_multicurrency.sql`
- **Contenido:** Tablas para ingesta y persistencia del bot de WhatsApp (`whatsapp_audit_logs`, `whatsapp_message_queue`), webhooks, funciones auxiliares y columna `currency` en `public.accounts` para balances multi-moneda.
- **Uso:** Delta consolidado para actualizar cualquier base de datos que ya esté en `v1.0.0`.

---

## 🛠️ Reglas Operativas para el Equipo

1. **Cada cambio de esquema requiere migración incremental:**
   - Crear archivo con timestamp en `supabase/migrations/YYYYMMDDHHMMSS_<nombre>.sql`.
   - Aplicar localmente con `npx supabase migration up --local` y validar con `supabase db advisors --local`.
2. **Consolidación por Release:**
   - Al cerrar un paquete de features o versión de release, generar el script consolidado correspondiente en `supabase/releases/`.
   - Garantizar idempotencia (`IF NOT EXISTS`, `OR REPLACE`).
