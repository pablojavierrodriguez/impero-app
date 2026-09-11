# SPEC-027: Pull-To-Refresh Móvil con Respuesta Háptica

---

## 🎯 Resumen Ejecutivo
Permitir a los usuarios de dispositivos móviles y PWA instalada refrescar sus balances financieros, cotizaciones de divisas y estado de la cola de sincronización mediante el gesto táctil natural de deslizar hacia abajo ("Pull-to-Refresh"), incorporando resistencia elástica orgánica, spinner visual no intrusivo y respuesta sensorial por vibración háptica.

---

## 🛑 Problema
En la versión móvil y en modo PWA instalada (standalone), no existe la barra de herramientas del navegador ni el botón clásico de recarga. Los usuarios que desean verificar si impactó una transferencia bancaria reciente o refrescar el balance consolidado deben forzar el cierre de la app o navegar entre pestañas para forzar una re-hidratación.

---

## 💡 Solución Propuesta

### 1. Componente `<PullToRefresh>`
Componente contenedor que envuelve el área de contenido principal y escucha eventos táctiles nativos:
- **Detección de Posición:** Solo inicia el seguimiento del gesto si el scroll vertical del contenedor se encuentra en la parte superior (`scrollTop <= 0` / `window.scrollY <= 0`) y la dirección es descendente (`deltaY > 0`).
- **Resistencia Elástica:** Amortiguación física mediante función de resistencia logarítmica/progresiva (distancia máxima visual de desplazamiento de 64–72px).
- **Umbral de Disparo:** Configurado en ~52px. Al cruzar este umbral, el indicador pasa de modo "arrastre" a modo "listo para soltar".
- **Respuesta Háptica Sensorial:** Al cruzar el umbral de disparo en el arrastre, se invoca `navigator.vibrate?.([15])` para brindar una confirmación táctil física antes de soltar el dedo.
- **Ejecución Asíncrona:** Al soltar tras cruzar el umbral, se ejecuta la función `onRefresh()`, manteniéndose visible un spinner giratorio estilizado hasta que la promesa concluya.

### 2. Disparo de Refresco en IMPERO
La función `onRefresh` orquestará:
1. Re-consulta de datos financieros y actualización de balances en `useFinanceStore` (`fetchData`).
2. Actualización de cotizaciones de referencia multi-moneda (`fetchExchangeRates`).
3. Drenado preventivo de la cola de sincronización offline (`processQueue`).

---

## 📋 Criterios de Aceptación
1. [ ] El gesto de deslizar hacia abajo funciona con fluidez en pantallas táctiles y emuladores móviles.
2. [ ] No interfiere con el scroll hacia abajo normal cuando el usuario ya ha bajado en la vista.
3. [ ] Proporciona retroalimentación táctil háptica sutil al alcanzar el umbral de refresco en dispositivos compatibles.
4. [ ] El indicador visual se oculta suavemente tras completar la recarga de datos.
