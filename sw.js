const CACHE_NAME = 'diary-local-v10';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* 설치 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

/* 이전 버전 캐시 전부 삭제 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

/* 
   index.html은 항상 최신 버전을 먼저 확인.
   인터넷이 안 될 때만 캐시 사용.
*/
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  const request = event.request;

  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then(response => {

        if (!response || response.status !== 200) {
          return response;
        }

        const copy = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => cache.put(request, copy));

        return response;
      })
      .catch(() =>
        caches.match(request)
          .then(cached => {
            if (cached) {
              return cached;
            }

            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            return Response.error();
          })
      )
  );
});
