/* 원형 생활계획표 - 서비스 워커
   앱 내용을 기기에 저장해 인터넷 없이도 열리게 합니다.
   앱을 수정하면 아래 CACHE 버전 숫자를 올리세요(예: v1 -> v2).
   그래야 사용자에게 새 버전이 반영됩니다. */
const CACHE = "wonhyung-timetable-v1";

// 오프라인에 꼭 필요한 핵심 파일들
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // 구글 폰트 등 외부 자원: 네트워크 우선, 받아오면 캐시에 보관(다음엔 오프라인에서도)
  const url = new URL(req.url);
  const isExternal = url.origin !== self.location.origin;

  if (isExternal) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 내 파일: 캐시 우선, 없으면 네트워크(받아오면 캐시에 추가)
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
