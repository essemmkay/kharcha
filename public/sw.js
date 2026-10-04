// Minimal service worker for installability and static-asset caching.
// Single-user app, so only immutable static assets are cached; HTML and API
// responses always go to the network to avoid serving stale authed data.
const CACHE = "kharcha-v1";

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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const cacheable =
    url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons");
  if (!cacheable) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      cache.put(request, res.clone());
      return res;
    }),
  );
});
