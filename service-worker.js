importScripts("./src/generated/cache-manifest.js");

const CACHE_VERSION = "walking-tours-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/main.js",
  "./src/modules/app.js",
  "./src/modules/audio.js",
  "./src/modules/guide-loader.js",
  "./src/modules/offline.js",
  "./guides/index.json"
];

const unique = (items) => [...new Set(items.filter(Boolean))];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_GUIDE") return;
  const assets = unique(self.GUIDE_CACHE_ASSETS?.[event.data.guideId] || []);
  const port = event.ports[0];

  caches
    .open(CACHE_VERSION)
    .then((cache) => cache.addAll(assets))
    .then(() => port?.postMessage({ ok: true }))
    .catch((error) => port?.postMessage({ ok: false, message: error.message }));
});
