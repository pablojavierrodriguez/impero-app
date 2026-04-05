## Upgrade x10 Desktop Experience

### 1. Sidebar colapsable con animación
- Agregar estado collapsed/expanded con toggle button
- Mini-mode: solo íconos (w-16) con tooltips
- Expanded: íconos + labels (w-60)
- Transición animada con framer-motion
- Persistir estado en localStorage

### 2. Dashboard multi-columna en desktop
- Layout de 2 columnas en pantallas grandes (lg+)
- Columna izquierda: balance, cuentas, breakdown, health score
- Columna derecha: transacciones recientes, presupuestos, metas, facturas
- Grid responsivo que colapsa a 1 columna en mobile

### 3. Popups desktop-friendly
- QuickAddSheet: en desktop, renderizar como Dialog centrado (max-w-md) en vez de bottom sheet
- TransferSheet: en desktop, renderizar como Dialog centrado en vez de bottom sheet
- TransactionEditSheet: igual tratamiento
- Mobile sigue igual (bottom sheet)

### 4. Perfil de usuario y login/logout (UI placeholder)
- Agregar sección "Mi Perfil" en el sidebar (avatar + nombre)
- Página de perfil con datos editables (nombre, avatar, email)
- Botón login/logout (UI-only por ahora, sin backend)
- Datos de perfil en localStorage

### 5. Polish desktop general
- Contenido principal sin max-w restrictivo en desktop
- Hover states y transiciones premium en sidebar items
- Header contextual en desktop con breadcrumb del tab activo
