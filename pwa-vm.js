/* ============================================================
   Vizio Motors — pwa-vm.js · Instalação do app (PWA)
   Registra o sw.js (mínimo, network-first no index — não conflita com
   o version-gate) e captura o beforeinstallprompt para oferecer um
   botão "Instalar app". Sem service worker agressivo: o banner de
   atualização (version-gate) continua sendo o caminho de update.
   ============================================================ */
(function(){
  "use strict";

  /* 1) Registrar o service worker (só em contexto seguro: https ou localhost). */
  if('serviceWorker' in navigator){
    var seguro = location.protocol==='https:' ||
                 /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/.test(location.hostname);
    if(seguro){
      window.addEventListener('load', function(){
        navigator.serviceWorker.register('sw.js').catch(function(){ /* silencioso */ });
      });
    }
  }

  /* 2) Botão flutuante "Instalar app" — aparece só quando o navegador permite instalar. */
  var deferred = null;

  function jaInstalado(){
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
           navigator.standalone === true;
  }

  function botao(){
    var b = document.getElementById('vmInstall');
    if(b) return b;
    b = document.createElement('button');
    b.id = 'vmInstall'; b.type = 'button';
    b.innerHTML = '⬇️ Instalar app';
    b.style.cssText = 'position:fixed;left:18px;bottom:18px;z-index:9998;display:none;align-items:center;gap:8px;'+
      'padding:11px 16px;border:1px solid var(--line);border-radius:14px;cursor:pointer;font:inherit;font-size:.86rem;'+
      'font-weight:600;color:#fff;background:linear-gradient(135deg,var(--gold-2),var(--gold-4));'+
      'box-shadow:0 12px 30px -10px rgba(0,0,0,.55);transition:transform .18s,opacity .3s';
    b.onmouseenter = function(){ b.style.transform='translateY(-1px)'; };
    b.onmouseleave = function(){ b.style.transform='none'; };
    b.onclick = instalar;
    document.body.appendChild(b);
    return b;
  }
  function mostrar(){ if(jaInstalado()) return; var b=botao(); b.style.display='inline-flex'; }
  function esconder(){ var b=document.getElementById('vmInstall'); if(b) b.style.display='none'; }

  function instalar(){
    if(!deferred){ if(window.toast) toast('Use o menu do navegador para instalar (Adicionar à tela inicial).'); return; }
    var ev = deferred; deferred = null; esconder();
    ev.prompt();
    ev.userChoice.then(function(r){
      if(window.toast) toast(r && r.outcome==='accepted' ? 'Instalando o app ✓' : 'Instalação cancelada');
    }).catch(function(){});
  }
  /* exposto para um eventual item de menu "Instalar app" */
  window.vmInstallApp = instalar;

  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault(); deferred = e; mostrar();
  });
  window.addEventListener('appinstalled', function(){
    deferred = null; esconder(); if(window.toast) toast('Vizio Motors instalado 🎉');
  });
})();
