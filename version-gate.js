/* Vizio Motors — VersionGate (§14.2/14.3 dos Padrões INPERSON/VIZIO)
   "Publicar não é entregar. Entregue é quando o código novo está rodando no navegador dela."

   Busca o próprio index.html com cache:'no-store', extrai o APP_VERSION publicado e
   compara com o que está rodando. Se diferir, mostra o banner (convite, nunca alarme).
   Cadência canônica: 8s após abrir · a cada 10 min · ao voltar o foco.
   NUNCA condicionar a document.hidden — aba em segundo plano é justamente o caso a pegar.
   Renderiza também na tela de login. */
(function(){
  var RODANDO = window.APP_VERSION || '0';
  var INTERVALO = 10 * 60 * 1000;
  var avisado = false;

  function banner(nova){
    if(avisado) return; avisado = true;
    var el = document.getElementById('vgBanner');
    if(!el){
      el = document.createElement('div');
      el.id = 'vgBanner';
      el.innerHTML = '<span>✨ Uma versão novinha do seu sistema está pronta.</span>' +
                     '<button type="button">Atualizar agora</button>';
      document.body.appendChild(el);
      el.querySelector('button').addEventListener('click', function(){ atualizar(nova); });
    }
    /* Revelar NÃO pode depender só de requestAnimationFrame: em aba de segundo plano o
       navegador não executa rAF, então o banner era criado e ficava invisível — justo no
       cenário que o push existe para cobrir. (Pego no teste real de 20/07/2026.)
       O setTimeout roda mesmo oculto; add() é idempotente, os dois caminhos convivem. */
    var mostrar=function(){ el.classList.add('on'); };
    requestAnimationFrame(mostrar);
    setTimeout(mostrar, 60);
  }

  function atualizar(nova){
    try{ sessionStorage.clear(); }catch(e){}
    /* Vizio Motors não tem sw.js hoje (rota 1 do playbook não se aplica). Mantido no
       formato canônico do padrão para funcionar no dia em que houver service worker. */
    try{
      if(navigator.serviceWorker){
        navigator.serviceWorker.getRegistration().then(function(r){
          if(r&&r.waiting) r.waiting.postMessage({type:'PULAR_ESPERA'});
        }).catch(function(){});
      }
    }catch(e){}
    location.replace(location.pathname + '?v=' + encodeURIComponent(nova) + location.hash);
  }

  function checar(){
    fetch(location.pathname + '?_vg=' + Date.now(), { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.text() : null; })
      .then(function(html){
        if(!html) return;
        var m = html.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if(m && m[1] && m[1] !== RODANDO) banner(m[1]);
      })
      .catch(function(){ /* rede instável: tenta de novo no próximo ciclo */ });
  }

  setTimeout(checar, 8000);
  setInterval(checar, INTERVALO);            // roda SEMPRE, inclusive com a aba oculta
  window.addEventListener('focus', checar);
  /* Reativar uma aba de segundo plano nem sempre dispara 'focus' (comprovado no teste de
     19/07/2026). 'visibilitychange' é o sinal confiável para troca de aba. Isto NÃO condiciona
     a checagem periódica a document.hidden — é gatilho adicional, não filtro. */
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) checar(); });

  window.vgChecar = checar;
})();
