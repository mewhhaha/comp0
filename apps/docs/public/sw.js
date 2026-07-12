// Kill switch for stale service workers registered on this origin by other
// localhost projects: browsers keep re-fetching /sw.js for updates, which
// otherwise 404s into the router. Installing this worker unregisters the
// registration and reloads any tabs it controlled.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })(),
  );
});
