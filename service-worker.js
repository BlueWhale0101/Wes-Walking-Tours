importScripts("./src/generated/cache-manifest.js");

const CACHE_VERSION = "walking-tours-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/main.js",
  "./src/modules/app.js",
  "./src/modules/audio.js",
  "./src/modules/guide-loader.js",
  "./src/modules/map.js",
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
  if (!["CACHE_GUIDE", "GET_GUIDE_CACHE_STATUS"].includes(event.data?.type)) return;
  const assets = unique(self.GUIDE_CACHE_ASSETS?.[event.data.guideId] || []);
  const port = event.ports[0];

  const reportStatus = async (cache) => {
    const matches = await Promise.all(assets.map((asset) => cache.match(asset)));
    const missing = assets.filter((asset, index) => !matches[index]);
    port?.postMessage({
      ready: assets.length > 0 && missing.length === 0,
      cached: missing.length < assets.length,
      missing,
      total: assets.length
    });
  };

  event.waitUntil(caches.open(CACHE_VERSION).then(async (cache) => {
    if (event.data.type === "GET_GUIDE_CACHE_STATUS") return reportStatus(cache);

    const results = await Promise.all(assets.map(async (asset) => {
      try {
        const response = await fetch(asset);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        await cache.put(asset, response);
        return null;
      } catch (error) {
        return { asset, message: error.message };
      }
    }));
    const failures = results.filter(Boolean);
    port?.postMessage({
      ok: failures.length === 0 && assets.length > 0,
      missing: failures.map(({ asset }) => asset),
      total: assets.length,
      message: failures[0]?.message || (assets.length ? "" : "No guide assets were found")
    });
  }));
});
