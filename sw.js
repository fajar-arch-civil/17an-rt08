const CACHE = 'rt08-v2.3.3';

const ASSETS = [
  './',
  './index.html',
  './lomba.html',
  './panitia.html',
  './logo.svg',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];

function isApiRequest(request){
  try{
    const url = new URL(request.url);

    return (
      url.hostname === 'script.google.com' ||
      url.hostname === 'script.googleusercontent.com' ||
      url.hostname === 'docs.google.com' ||
      url.hostname === 'drive.google.com'
    );
  }catch(e){
    return false;
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if(request.method !== 'GET'){
    return;
  }

  // Jangan cache API / Google data.
  if(isApiRequest(request)){
    event.respondWith(
      fetch(request, { cache: 'no-store' })
    );
    return;
  }

  // HTML/navigation: network-first.
  if(request.mode === 'navigate'){
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Asset lokal: cache-first.
  event.respondWith(
    caches.match(request).then(cached => {
      if(cached) return cached;

      return fetch(request).then(response => {
        const copy = response.clone();

        caches.open(CACHE).then(cache => {
          cache.put(request, copy);
        });

        return response;
      });
    })
  );
});