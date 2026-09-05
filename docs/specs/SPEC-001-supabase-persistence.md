# SPEC-001: Arquitectura de Persistencia Real & Sincronización con Supabase (Fase 1)

## 1. Contexto y Diagnóstico
Actualmente `m3` cuenta con una base de datos PostgreSQL local corriendo en Supabase (`54421`), con tablas ya migradas (`accounts`, `categories`, `transactions`, `budgets`, `goals`, `recurring_transactions`, `bill_reminders`, `user_settings`) y RLS activo. Sin embargo, el frontend en `src/lib/finance-store.ts` maneja su estado en memoria y `localStorage` con transacciones de ejemplo (`SAMPLE_TRANSACTIONS`).

Este documento especifica la transformación de `m3` a una aplicación reactiva de producción conectada a Supabase, base necesaria para habilitar las funcionalidades premium inspiradas en Mobills y Wallet by BudgetBakers.

---

## 2. Objetivos
1. **Persistencia Real**: Todo alta, baja y modificación de cuentas, categorías, transacciones, presupuestos, metas, recordatorios y ajustes se guarda de inmediato en la base de datos de Supabase.
2. **React Query Hooks**: Estandarizar la obtención y mutación de datos con `@tanstack/react-query`, logrando cacheo inteligente, estados de carga (`isLoading`), y revalidación automática.
3. **Cero Pantallas en Blanco & Offline/Optimistic Updates**: Manejo de fallback para una experiencia fluida sin parpadeos.
4. **Almacenamiento de Comprobantes (Storage)**: Creación y configuración del bucket `receipts` en Supabase Storage con políticas seguras para adjuntar fotos o PDFs de tickets en transacciones.
5. **Auto-seeding de Categorías y Cuentas por Defecto**: Al registrarse un nuevo usuario, crear automáticamente sus cuentas y categorías básicas en Supabase si no existen.

---

## 3. Matriz de Componentes y Cambios

### Base de Datos (Supabase)
- **Bucket Storage**: Configuración de bucket `receipts` con políticas RLS para lectura y subida por usuario autenticado (`auth.uid()`).
- **Trigger `on_auth_user_created`**: Ampliar para que al registrarse un usuario se inserten automáticamente las categorías estándar (`Alimentación`, `Transporte`, `Servicios`, `Salario`, etc.) y cuentas iniciales si no existen.

### Servicios de API (`src/services/`)
- `accounts.service.ts`: Listar, crear, actualizar, archivar y ajuste de saldos en `public.accounts`.
- `categories.service.ts`: Gestión de categorías jerárquicas en `public.categories`.
- `transactions.service.ts`: Consultas filtradas, creación simple, creación en cuotas (`installments`) y borrado en `public.transactions`.
- `budgets.service.ts` & `goals.service.ts`: Presupuestos mensuales y metas con aportes.
- `bills.service.ts`: Recordatorios con estados (`pending`, `paid`, `overdue`).

### Capa de Adaptación en Frontend
- Mantener la firma pública de `useFinanceStore` o enriquecerlo mediante React Query para que las vistas (`Index.tsx`, `CreditCardManager.tsx`, `TransactionList.tsx`, `BalanceHeader.tsx`, etc.) sigan funcionando transparentemente sin requerir reescrituras disruptivas.

---

## 4. Plan de Verificación & Compliance
- `npx tsc --noEmit`: 0 errores de tipado TypeScript.
- `npm run test`: Tests unitarios ejecutados con éxito.
- `npm run build`: Compilación de producción en Vite limpia.
- `npm run check:all`: Suite de auto-validación de compliance aprobada.
