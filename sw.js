const CACHE_NAME = "audiotexto-v12";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        cache.addAll(FILES_TO_CACHE)
      )
  );
});

self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );

  self.clients.claim();

});

self.addEventListener("fetch", event => {

  if (event.request.mode === "navigate") {

    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("./index.html"))
    );

    return;

  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );

});
 
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});


