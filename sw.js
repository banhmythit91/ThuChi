// Đổi số phiên bản mỗi khi cập nhật index.html để điện thoại tải bản mới
const CACHE = "sothuchi-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Mở ngay từ bộ nhớ đệm (chạy được khi mất mạng), đồng thời tải bản mới ở nền
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request);
    const network = fetch(e.request)
      .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => cached || Response.error());
    return cached || network;
  }));
});
