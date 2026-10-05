// Minimal offline-friendly service worker.
const CACHE = "luxe-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/")))
  );
});


// ---- Push notifications ------------------------------------------
// The payload is sent encrypted from the server; we only render it.
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { /* malformed payload */ }

  const title = data.title || "LUXE";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl",
    lang: "he",
    // same tag replaces an earlier notification instead of stacking
    tag: data.tag || "luxe-general",
    renotify: true,
    data: { link: data.link || "/" },
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an open tab, or opens a new one.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "/";

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ("focus" in c) { c.navigate(link); return c.focus(); }
        }
        if (self.clients.openWindow) return self.clients.openWindow(link);
      })
  );
});
