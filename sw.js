// Bộ nhớ đệm để app mở được khi mất mạng
const CACHE = "sothuchi-v2";
const ASSETS = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest",
                "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Thư viện Firebase (có số phiên bản cố định): lấy từ bộ nhớ đệm trước
  if (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    e.respondWith(caches.open(CACHE).then(async cache => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }));
    return;
  }

  // File của app: lấy bản mới nhất từ mạng, mất mạng thì dùng bản đã lưu
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const res = await Promise.race([
        fetch(e.request),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))
      ]);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(e.request)) || (await cache.match("./index.html")) || Response.error();
    }
  }));
});
