const CACHE = "gymapp-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

async function offlineFirst(request, cache) {
  const cached = await cache.match(request);
  if (request.mode !== "navigate") {
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  }
  // Navigations prefer a fresh shell but fall back to the one under "/".
  const shell = cached || (await cache.match("/"));
  const live = await fetch(request)
    .then((response) => {
      if (response.ok) cache.put("/", response.clone());
      return response;
    })
    .catch(() => null);
  return live || shell;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then((cache) => offlineFirst(request, cache)));
});
