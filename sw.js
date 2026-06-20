const CACHE = 'rt08-v6';
const SHELL=['./','./index.html','./lomba.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return; // JANGAN ganggu API Apps Script / Iconify / cuaca

  if(req.mode==='navigate'){ // halaman: utamakan internet, offline pakai cache
    e.respondWith(
      fetch(req).then(r=>{ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return r; })
                .catch(()=>caches.match(req).then(m=>m||caches.match('./index.html')))
    );
    return;
  }
  // aset statis (css/js/gambar lokal): pakai cache dulu, perbarui di belakang
  e.respondWith(
    caches.match(req).then(m=>{
      const net=fetch(req).then(r=>{ if(r&&r.status===200){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return r; }).catch(()=>m);
      return m||net;
    })
  );
});