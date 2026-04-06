# FinTrack — Personal Finance Manager

App de finanzas personales con soporte multi-cuenta, presupuestos, metas de ahorro, transacciones recurrentes, reportes y más.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Lovable Cloud (Supabase) — PostgreSQL, Auth, RLS
- **UI:** shadcn/ui + Framer Motion
- **Charts:** Recharts

## Requisitos

- Node.js 18+ (o Bun)
- npm / bun

## Desarrollo local

```bash
# 1. Clonar el repo
git clone <repo-url>
cd fintrack

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
#    Crear un archivo .env.local con:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key

# 4. Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## Configuración de Supabase (cloud propia)

Si querés usar tu propia instancia de Supabase:

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → API** y copiar la URL y la anon key
3. Ejecutar las migraciones de la carpeta `supabase/migrations/` en el SQL Editor de Supabase
4. Configurar las variables de entorno como se indica arriba
5. En **Authentication → Settings**, configurar:
   - Site URL: `http://localhost:5173` (o tu dominio)
   - Redirect URLs: agregar `http://localhost:5173/**`

## Funcionalidades

- 🔐 Autenticación (email/password, recuperación de contraseña)
- 💳 Multi-cuenta (corriente, ahorro, crédito, efectivo)
- 📊 Dashboard con salud financiera, velocidad diaria, breakdown
- 💰 Presupuestos mensuales por categoría
- 🎯 Metas de ahorro con progreso visual
- 🔄 Transacciones recurrentes automáticas
- 🔔 Recordatorios de vencimientos
- 📈 Reportes y tendencias mensuales
- 🏷️ Categorías jerárquicas y etiquetas
- 💱 Multi-moneda (ARS, USD, EUR)
- 🌐 Bilingüe (Español / English)
- 🌙 Modo oscuro / claro / sistema
- 📱 Responsive (mobile-first + desktop sidebar)

## Build

```bash
npm run build
```

## Licencia

MIT
