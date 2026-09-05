/**
 * Service Worker para m3 (Money Master)
 * Estrategia:
 * - Cache-First para recursos estáticos del app shell (HTML, CSS, JS, fuentes, imágenes).
 * - Bypass estricto (Network-Only) para peticiones a Supabase y APIs externas.
 */

const CACHE_NAME = 'm3-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass estricto para APIs externas, Supabase y sockets
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 2. Estrategia Stale-While-Revalidate / Cache-First para recursos del mismo origen o Google Fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano intentamos refrescar la caché
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Sin conexión; se mantiene cachedResponse
          });
        return cachedResponse;
      }

      // Si no está en caché, buscar en red y cachear si es recurso estático
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || (response.type !== 'basic' && !url.hostname.includes('fonts.'))) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Fallback offline para navegación principal
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
