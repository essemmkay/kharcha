// Offline-first service worker. Caches immutable static assets and the app
// shell (page HTML). Pages render their data from IndexedDB on the client, so a
// cached shell carries no stale user data — safe to serve instantly and offline.
const CACHE = "kharcha-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Serve from cache immediately, revalidate in the background. `key` lets us
// collapse a route's query-string variants onto one cached shell entry.
async function staleWhileRevalidate(request, key) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(key ?? request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(key ?? request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // App shell: full-document navigations and Next's client-side RSC fetches
  // (<Link> navigation / prefetch). Keyed by pathname — data is client-side, so
  // the shell is identical across ?month=/?account= variants. RSC and HTML are
  // keyed separately so they don't collide.
  const isRsc =
    request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (request.mode === "navigate" || isRsc) {
    event.respondWith(
      staleWhileRevalidate(request, url.origin + url.pathname + (isRsc ? "#rsc" : "")),
    );
    return;
  }

  // Immutable static assets: cache-first.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
  }
});
