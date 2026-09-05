# SPEC-009: App PWA Mobile para Android e iOS (P7)

## 1. Contexto & Diagnóstico

**m3 (Money Master)** fue diseñada con una interfaz táctil, reactiva y mobile-first (bottom navigation bar, touch targets >= 44px, drawer sheets y retroalimentación táctil). Sin embargo, cuando el usuario accede mediante el navegador web del teléfono (Safari en iOS, Chrome en Android):
- Las barras de URL y navegación del navegador consumen espacio vertical valioso.
- No existe icono dedicado en el cajón de aplicaciones / pantalla de inicio.
- Al perder la conexión a internet (modo avión, túneles, datos intermitentes), la app muestra pantallas en blanco del navegador.
- No hay integración con las capacidades nativas del sistema operativo (accesos directos, splash screen adaptativo, safe-areas de muesca/isla dinámica).

Para lograr una experiencia indistinguible de una aplicación nativa descargada desde Google Play Store o Apple App Store sin el costo de mantenimiento de tiendas, se requiere convertir **m3** en una **Progressive Web App (PWA) de clase mundial**.

---

## 2. Objetivos del Producto

1. **Instalabilidad Inmediata (A2HS - Add to Home Screen)**:
   - Capacidad de instalación en un toque tanto en Android (prompt nativo `beforeinstallprompt`) como en iOS (guía contextual paso a paso de Safari).
2. **Experiencia Standalone Fullscreen**:
   - Eliminación total de la barra de direcciones del navegador (`display: standalone`).
   - Respeto de Safe Areas del sistema operativo (`viewport-fit=cover`, soporte para muesca, Dynamic Island y barra de gestos).
3. **Resiliencia y Disponibilidad Offline**:
   - Service Worker con estrategia **Stale-While-Revalidate / Cache-First** para los activos estáticos (HTML, JS, CSS, iconos y fuentes tipográficas).
   - Capacidad de abrir la aplicación y consultar saldos cacheados aun sin conexión a internet.
4. **Accesos Directos Táctiles (App Shortcuts)**:
   - Al mantener presionado el ícono de la app en la pantalla de inicio:
     - ⚡ **Alta Rápida**: Abrir directamente el modal para cargar un gasto.
     - 📊 **Reportes**: Abrir la vista ejecutiva de finanzas.
5. **Branding & Look & Feel Premium**:
   - Splash screens acordes al tema oscuro oficial (`#0a0a0f`) y claro (`#f7f7f7`).
   - Iconografía completa en formato SVG y PNG adaptativo (maskable icons para Android, apple-touch-icon para iOS).

---

## 3. Arquitectura Técnica

```
 ┌──────────────────────────────────────────────────────────┐
 │                     index.html                           │
 │  - <link rel="manifest" href="/manifest.webmanifest">   │
 │  - <meta name="apple-mobile-web-app-capable" content="yes">
 │  - <meta name="theme-color" content="#0a0a0f">           │
 └────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │            public/manifest.webmanifest                   │
 │  - name: "m3 — Money Master"                             │
 │  - short_name: "m3"                                      │
 │  - start_url: "/"                                        │
 │  - display: "standalone"                                 │
 │  - background_color: "#0a0a0f"                           │
 │  - theme_color: "#0a0a0f"                                │
 │  - icons: [192x192, 512x512, maskable]                   │
 │  - shortcuts: [Alta Rápida, Reportes]                    │
 └────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │                public/sw.js (Service Worker)             │
 │  - install: Precache de shell estático                   │
 │  - activate: Limpieza de caches antiguos                 │
 │  - fetch: Estrategia de cache para recursos estáticos    │
 └────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │                src/components/PwaInstallPrompt.tsx       │
 │  - Captura del evento beforeinstallprompt                │
 │  - Detección de dispositivo iOS / Safari                 │
 │  - Modal / Banner accesible desde Settings y Header      │
 └──────────────────────────────────────────────────────────┘
```

---

## 4. Requerimientos de Implementación

### A. Web App Manifest (`public/manifest.webmanifest`)
- Declaración JSON con especificación W3C Web App Manifest:
  - `name`: "m3 — Money Master"
  - `short_name`: "m3"
  - `description`: "Control financiero personal inteligente, sin fricción."
  - `start_url`: "/"
  - `scope`: "/"
  - `display`: "standalone"
  - `orientation`: "portrait-primary"
  - `background_color`: "#0a0a0f"
  - `theme_color`: "#0a0a0f"
  - `shortcuts`:
    - Acción directa para abrir el alta de gastos: `url: "/?action=quick-add"`.

### B. Service Worker (`public/sw.js`)
- Manejador de eventos `install`, `activate` y `fetch`.
- Cacheo de `index.html`, fuentes de Google Fonts, scripts y estilos del bundle.
- Omisión inteligente de peticiones API a Supabase (`*.supabase.co`) para garantizar datos frescos en llamadas transaccionales.

### C. Registro del Service Worker (`src/main.tsx`)
- Registro seguro en entornos de producción y soporte seguro en `navigator.serviceWorker.register('/sw.js')`.

### D. Componente Prompt de Instalación (`src/components/PwaInstallPrompt.tsx`)
- Hook `usePwaInstall`:
  - En Android/Chrome: expone función `installApp()` aprovechando `prompt()` de `BeforeInstallPromptEvent`.
  - En iOS/Safari: muestra instrucciones ilustradas: *"Tocá el botón Compartir y seleccioná 'Agregar a pantalla de inicio'"*.
- Integrado en `SettingsPage.tsx` bajo la sección "Aplicación móvil".

### E. Iconografía PWA
- Generación de iconos adaptativos en `public/icons/`:
  - `pwa-192x192.png`
  - `pwa-512x512.png`
  - `apple-touch-icon.png`
  - `pwa-maskable.png`

---

## 5. Criterios de Aceptación

1. **Auditoría Lighthouse PWA**:
   - Pasa satisfactoriamente los checks de PWA instalable (Manifest válido, Service Worker registrado, iconografía presente, theme-color).
2. **Android**:
   - Al navegar en Chrome móvil se dispara o permite disparar el prompt nativo de instalación.
   - La app se abre sin barra de direcciones, en modo pantalla completa con el splash oscuro `#0a0a0f`.
3. **iOS (iPhone / iPad)**:
   - Al tocar "Compartir -> Agregar a pantalla de inicio" se añade el icono oficial de m3 con título "m3".
   - Al abrirla corre como app independiente aislada de Safari (`apple-mobile-web-app-capable`).
4. **Validación de Calidad**:
   - `node scripts/check-all.cjs` ejecuta al 100% sin errores de compilación ni fallos en tests.
