# SPEC-014: Modo Privacidad, Seguridad Biométrica Web y Widgets Rápidos (P12)

## 1. Contexto & Diagnóstico
Los usuarios abren con frecuencia sus aplicaciones financieras en el transporte público, la oficina, cafeterías o al mostrar capturas a amigos y familiares. Tanto **Mobills** como **Wallet** ofrecen soluciones pensadas para el resguardo de la intimidad:
- **Mobills:** Ocultamiento instantáneo de números de balance y modo de bloqueo por biometría.
- **Wallet:** Gesto de agitar el teléfono (*shake*) o tocar para ofuscar números y bloqueo con PIN / huella.

En **m3**, como PWA premium de uso diario, es indispensable proveer mecanismos instantáneos para ocultar balances y proteger el acceso sin requerir volver a escribir correo y contraseña en cada sesión.

---

## 2. Objetivos & Requisitos de Producto
1. **Modo Privacidad (Privacy Mode) de un Toque:**
   - Botón toggle en el header (`BalanceHeader` o Top Bar) con icono `Eye` / `EyeOff`.
   - Al activarse:
     - Todos los montos monetarios (balances, gastos, ingresos, totales de tarjetas) se reemplazan visualmente por máscaras: `$ ••••••`.
     - El estado se persiste en `localStorage` o preferencias de usuario.
     - Atajo de teclado para desktop: tecla `H` (Hide) o `P` (Privacy).
2. **Seguridad Biométrica Web (WebAuthn / Local Auth):**
   - Habilitar autenticación biométrica en el dispositivo (FaceID / TouchID / Huella dactilar de Android vía `navigator.credentials`).
   - Opción en Ajustes: *"Bloquear app al suspender"*.
   - Si la app estuvo en segundo plano más de 3 minutos, al volver se solicita confirmación biométrica antes de mostrar la pantalla.
3. **Optimización de Shortcuts Móviles (App Shortcuts):**
   - Extensión de los accesos directos en el menú de la aplicación en la pantalla de inicio del teléfono (`Quick Add Gasto`, `Quick Add Ingreso`, `Escanear Ticket`).

---

## 3. Arquitectura y Componentes Involucrados

### A. Contexto Global de Privacidad (`src/contexts/PrivacyContext.tsx`)
- Proveedor de contexto React:
  - `isPrivacyMode: boolean`
  - `togglePrivacyMode: () => void`
  - Helper `formatMaskedAmount(amount: number, formatted: string): string` que retorna `formatted` o `"$ ••••••"`.

### B. Módulo Biométrico (`src/lib/webauthn-guard.ts`)
- Utilización de la API estándar de la W3C `PublicKeyCredential` / WebAuthn.
- Hook `useBiometricLock.ts` que monitorea `visibilitychange` de la ventana.

### C. Componentes de UI
- `src/components/BalanceHeader.tsx`:
  - Botón de alternar privacidad al lado del saldo total.
- `src/components/AnimatedNumber.tsx`:
  - Soporte para renderizar asteriscos animados con transición fluida de opacidad cuando el modo privacidad está activo.
- `src/components/SettingsPage.tsx`:
  - Sección de "Seguridad y Privacidad":
    - Switch: *Ocultar saldos por defecto al iniciar*.
    - Switch: *Requerir FaceID / Huella al reabrir m3*.

---

## 4. Criterios de Aceptación (DoD)
- [ ] Con el modo privacidad activado, ningún número monetario en el dashboard, tarjetas de cuentas o lista de transacciones queda visible.
- [ ] La experiencia biométrica es no intrusiva y cuenta con fallback seguro (cerrar sesión o PIN de respaldo).
- [ ] Cumplimiento de accesibilidad: las etiquetas ARIA indican claramente *"Saldo oculto por privacidad"*.
- [ ] Verificación de rendimiento y cero regresiones en la suite de tests.
