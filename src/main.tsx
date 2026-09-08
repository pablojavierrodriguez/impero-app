import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registro seguro del Service Worker para PWA
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.info("[IMPERO PWA] Service Worker registrado:", reg.scope);
      })
      .catch((err) => {
        console.warn("[IMPERO PWA] Error al registrar Service Worker:", err);
      });
  });
}
