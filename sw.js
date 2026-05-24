const CACHE_NAME = "audiotexto-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        cache.addAll(FILES_TO_CACHE)
      )
  );

});

self.addEventListener("fetch", event => {

  event.respondWith(
    caches.match(event.request)
      .then(response =>
        response || fetch(event.request)
      )
  );

});