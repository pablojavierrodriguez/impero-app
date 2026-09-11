# Gestión de Migraciones y Base de Datos — m3

---

## 📂 Estructura

```
supabase/
├── migrations/
│   ├── 00000000000000_schema_foundation.sql   ← FUENTE DE VERDAD: esquema completo actual
│   ├── delta/                                  ← Deltas idempotentes para aplicar en cloud
│   │   └── 20260908_consolidation_delta.sql    ← Estado actual desde v1.1.0
│   └── archive/                                ← Historial de migraciones anteriores (solo referencia)
│       ├── 20260406215403_c2aaec7d.sql
│       ├── 20260406220000_storage_and_user_defaults.sql
│       ├── 20260406221000_grant_permissions.sql
│       ├── 20260904180845_whatsapp_bot_persistence.sql
│       ├── 20260905000000_account_currency.sql
│       ├── 20260906000000_shopping_lists.sql
│       ├── 20260907220000_transaction_currency.sql
│       └── 20260908000000_transaction_rules.sql
├── releases/                                   ← Resúmenes consolidados por versión de producto
│   ├── release_v1.0.0_core_foundation.sql
│   └── release_v1.1.0_ai_whatsapp_and_multicurrency.sql
└── snippets/                                   ← Scripts utilitarios puntuales (no son migraciones)
    └── README.md
```

---

## 🚀 Inicialización local (desde cero)

```bash
supabase db reset
```

Aplica **solo** `migrations/00000000000000_schema_foundation.sql`. Todo el esquema en un paso, sin errores de migraciones faltantes.

---

## ☁️ Actualización en cloud (sin perder datos)

Ejecutar el delta correspondiente desde Supabase Studio → SQL Editor:

```
migrations/delta/20260908_consolidation_delta.sql
```

---

## 🛠️ Reglas para nuevos cambios de esquema

> Seguir el flujo completo documentado en `.agents/skills/db-ops/SKILL.md`

1. **Editar `00000000000000_schema_foundation.sql`** — integrar el cambio directamente en la definición de la tabla (no como ALTER TABLE al final).
2. **Crear `migrations/delta/YYYYMMDD_<nombre>.sql`** — delta idempotente para aplicar en cloud.
3. **Validar localmente** con `supabase db reset` → debe completar sin errores.
4. **Auditoría** con `supabase db advisors --local` → sin warnings.
5. **Aplicar el delta en cloud** manualmente.

---

## 📋 Releases de Producto

### `release_v1.0.0_core_foundation.sql`
- **Contenido:** Esquema base completo (`profiles`, `accounts`, `categories`, `transactions`, `budgets`, `goals`, `recurring_transactions`, `bill_reminders`), políticas RLS, Storage bucket `receipts` y permisos.
- **Uso:** Referencia histórica. Para inicialización usar `00000000000000_schema_foundation.sql`.

### `release_v1.1.0_ai_whatsapp_and_multicurrency.sql`
- **Contenido:** Tablas WhatsApp (`whatsapp_integrations`, `whatsapp_messages`), columna `currency` en `accounts`.
- **Uso:** Referencia histórica del delta v1.1.0.
