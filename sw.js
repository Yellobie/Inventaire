/* Service worker de l'Inventaire.
   Change le numéro de version à chaque nouvelle mise en ligne
   pour forcer le rafraîchissement du cache. */
const CACHE = 'inventaire-v2';
const COQUILLE = [
  './',
  './index.html',
  './manifest.json',
  './icone-192.png',
  './icone-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(COQUILLE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // Tout ce qui touche Google (identification, API Drive) passe toujours par le réseau.
  if(url.hostname.indexOf('google') !== -1 || url.hostname.indexOf('gstatic') !== -1) return;

  // Le reste : réseau d'abord (pour recevoir les mises à jour), cache en secours.
  e.respondWith(
    fetch(req)
      .then(rep => {
        if(rep && rep.status === 200 && url.origin === self.location.origin){
          const copie = rep.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
        }
        return rep;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
