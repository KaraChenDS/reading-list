/* 读书清单 · 极简离线缓存：App Shell 优先，跨域 API（GitHub 同步）不缓存 */
const CACHE = "dushu-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icons/icon-32.png", "./icons/icon-180.png",
                "./icons/icon-192.png", "./icons/icon-512.png",
                "./icons/icon-512-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 不缓存跨域 API（GitHub Contents API）
  if (url.origin !== location.origin) return;
  // HTML 导航绕开 HTTP 缓存（Pages 对 HTML 设了 max-age=600），保证刷新即最新版
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  e.respondWith(
    fetch(req, isHTML ? { cache: "no-store" } : undefined).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
