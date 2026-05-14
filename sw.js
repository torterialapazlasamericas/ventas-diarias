// ============================================================
//  Service Worker — Tortería La Paz
//  Permite instalación como PWA y carga más rápida
// ============================================================

const CACHE_NAME = 'lapaz-v1';

// Archivos a guardar en caché (solo los estáticos)
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://accounts.google.com/gsi/client',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap'
];

// Instalar: guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Solo cachear los archivos locales, los externos pueden fallar
      return cache.addAll(['./index.html', './manifest.json']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: estrategia Network First para las llamadas al script
// Cache First para archivos estáticos
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Las llamadas a Google Apps Script siempre van a la red
  if (url.includes('script.google.com') || url.includes('googleapis.com/gsi')) {
    return; // dejar pasar sin cachear
  }

  // Para el index.html: Network First (siempre actualizado), Cache como fallback
  if (url.includes('index.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para íconos y manifest: Cache First
  if (url.includes('/icons/') || url.includes('manifest.json')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
