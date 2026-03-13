/// <reference lib="webworker" />

/**
 * Digital Signage Service Worker
 *
 * Caching strategy:
 * - playlist.json: Network-first (always try fresh, fallback to cache)
 * - Media files (images/videos): Cache-first (serve from cache, update in background)
 * - App shell: Cache-first
 *
 * This ensures smooth offline playback when internet drops.
 */

const CACHE_NAME = "lcd-signage-v1";
const PLAYLIST_CACHE = "lcd-playlist-v1";
const MEDIA_CACHE = "lcd-media-v1";

const CDN_ORIGIN = "https://lcd-cdn.yeninesilkurs.tr";

// Files to pre-cache on install
const PRECACHE_URLS = ["/", "/manifest.json"];

// Media extensions to cache
const MEDIA_EXTENSIONS =
  /\.(mp4|webm|mov|jpg|jpeg|png|webp|gif)(\?.*)?$/i;

self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE_NAME &&
                key !== PLAYLIST_CACHE &&
                key !== MEDIA_CACHE
            )
            .map((key) => caches.delete(key))
        )
      ),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Playlist JSON: Network-first
  if (url.pathname.endsWith("playlist.json")) {
    event.respondWith(networkFirst(request, PLAYLIST_CACHE));
    return;
  }

  // Media files from CDN: Cache-first
  if (
    url.origin === CDN_ORIGIN &&
    MEDIA_EXTENSIONS.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  // App shell / same-origin: Cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }
});

/**
 * Network-first strategy: Try network, fall back to cache.
 * Always update cache on successful network response.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Strip query params for cache key
      const cacheKey = new Request(request.url.split("?")[0]);
      cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cacheKey = new Request(request.url.split("?")[0]);
    const cached = await cache.match(cacheKey);
    if (cached) {
      console.log("[SW] Serving playlist from cache (offline)");
      return cached;
    }
    return new Response(
      JSON.stringify({ playlist: [] }),
      {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }
    );
  }
}

/**
 * Cache-first strategy: Serve from cache if available,
 * otherwise fetch from network and cache for next time.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background for freshness
    fetchAndCache(request, cache).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline fallback for non-cached requests
    return new Response("", { status: 503 });
  }
}

/**
 * Background fetch and cache update
 */
async function fetchAndCache(request, cache) {
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Periodically clean old media from cache to prevent storage overflow.
 * Keep only the most recent entries.
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Remove oldest entries
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
    console.log(`[SW] Trimmed ${toDelete.length} items from ${cacheName}`);
  }
}

// Trim media cache periodically (keep last 50 items)
setInterval(() => {
  trimCache(MEDIA_CACHE, 50).catch(() => {});
}, 60 * 60 * 1000); // Every hour
