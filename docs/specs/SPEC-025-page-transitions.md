# SPEC-025: Transiciones Cinemáticas de Vistas (Framer Motion)

---

## 🎯 Resumen Ejecutivo
Brindar una experiencia visual continua, fluida y cinematográfica a 60 FPS en IMPERO al alternar entre módulos principales (Dashboard, Transacciones, Tarjetas, Presupuestos, Listas de Compras, etc.), eliminando cambios abruptos o parpadeos de contenido y respetando estrictamente las preferencias de accesibilidad (`prefers-reduced-motion`).

---

## 🛑 Problema
En aplicaciones web estándar de React, el intercambio condicional de pestañas (`activeTab === "..." && <Component />`) provoca que el DOM se desmonte y monte de golpe. Aunque la lógica es rápida, el usuario percibe un salto brusco ("layout snap") que rompe la sensación de aplicación artesanal y de alta gama.

---

## 💡 Solución Propuesta

### 1. Componente `<PageTransition>`
Crear un componente contenedor basado en `framer-motion` que estandarice las variantes de entrada y salida:
- **Entrada (`initial` $\rightarrow$ `animate`):** Opacidad de 0 a 1 con leve elevación vertical (`y: 6` $\rightarrow$ `y: 0`).
- **Salida (`exit`):** Desvanecimiento suave (`y: -6`, `opacity: 0`).
- **Curva y Duración:** Curva orgánica ultra-rápida (`[0.22, 1, 0.36, 1]`, ~200ms) para evitar sensación de lentitud o latencia agregada.

### 2. Respeto Estricto a la Accesibilidad
- Lectura de la media query `(prefers-reduced-motion: reduce)`. Si está activa, desactivar el desplazamiento en el eje Y y limitar la transición a un desvanecimiento instantáneo o nulo.

### 3. Integración en `Index.tsx`
- Envolver el contenedor dinámico de pestañas en `<AnimatePresence mode="wait">` con `key={activeTab}` para garantizar que el desmontaje de la vista saliente coordine suavemente con el montaje de la entrante.

---

## 📋 Criterios de Aceptación
1. [ ] Al alternar entre cualquier pestaña principal, el contenido entra con una animación fluida a 60 FPS.
2. [ ] La duración de la animación no supera los 250ms y no introduce bloqueos de interacción en botones o inputs.
3. [ ] Si el usuario tiene activado "Reducir movimiento" en su sistema operativo, la animación respeta la preferencia sin errores.
4. [ ] Se mantiene el estado de modales flotantes, sheets y overlays sin colisión de z-index.
