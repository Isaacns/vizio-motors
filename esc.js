/* ============================================================
   Vizio Motors — esc.js · HELPER ÚNICO DE ESCAPE HTML
   Fix do achado 🔴-1 (Stored XSS sistêmico via innerHTML) — 23/07/2026.

   Escapa & < > " ' antes de qualquer interpolação em template string
   destinada a innerHTML / document.write. Cobre contexto de TEXTO,
   de ATRIBUTO com aspas duplas E de atributo com aspas simples.

   Referência canônica: esc() de agenda-vm.js:40 (padrão interno que já
   escapava) — aqui elevado a helper global e ampliado com ' (aspas
   simples), superset OWASP, para também blindar atributos single-quote.

   DEVE ser carregado ANTES de app.js e de todos os módulos (é a 1ª tag
   <script> local no index.html). Exposto como window.esc.
   ============================================================ */
(function(){
  var MAP = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return MAP[c]; });
  }
  window.esc = esc;
})();
