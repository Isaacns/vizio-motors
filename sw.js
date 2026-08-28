/* ============================================================
   Vizio Motors — sw.js · Service Worker MÍNIMO para PWA instalável
   Decisão (§ redesign 1.0.95): NÃO cachear index.html nem as checagens
   de versão (?_v/?_vg) — o version-gate (rota 2, checagem por rede com
   no-store) precisa SEMPRE ver o index fresco. Aqui só há:
     • pré-cache dos ícones/logos (app-shell mínimo p/ offline);
     • navegação = network-first (cai no cache do ícone só se offline);
     • demais requisições = passa direto para a rede (deixa o HTTP cache
       e o cache-buster ?v= dos scripts cuidarem da atualização).
   Bumpar CACHE a cada deploy que mexa nos assets pré-cacheados.
   ============================================================ */
var CACHE = 'vm-v095';
var ASSETS = [
  './vizio-symbol-light.png?v=095',
  './vizio-symbol-dark.png?v=095',
  './medallion.png?v=095',
  './manifest.json?v=095'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS).catch(function(){}); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Canal do version-gate: aplicar a nova versão sem esperar. */
self.addEventListener('message', function(e){
  if(e.data && e.data.type==='PULAR_ESPERA') self.skipWaiting();
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url;
  try{ url = new URL(req.url); }catch(_){ return; }

  /* Só mexemos na própria origem. CDNs (fontes, Chart.js) e Supabase passam direto. */
  if(url.origin !== self.location.origin) return;

  /* NUNCA interceptar as checagens de versão — elas usam no-store de propósito. */
  if(url.searchParams.has('_v') || url.searchParams.has('_vg')) return;

  var isNav = req.mode === 'navigate' ||
              url.pathname === self.location.pathname ||
              /\/(index\.html)?$/.test(url.pathname);

  if(isNav){
    /* Network-first: o index NUNCA vem do cache quando há rede (preserva o version-gate).
       Só cai no cache do ícone/nada se estiver offline. */
    e.respondWith(fetch(req).catch(function(){ return caches.match(req); }));
    return;
  }

  /* Ícones/logos pré-cacheados: cache-first com revalidação em segundo plano. */
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok && res.type==='basic'){
          var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
