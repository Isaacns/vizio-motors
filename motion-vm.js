/* ============================================================
   Vizio Motors — motion-vm.js  (§20 movimento tasteful · PADRAO-MOVIMENTO)
   count-up dos números-chave (.kpi .val) SEM tocar cada módulo:
   um MutationObserver central em #view anima os valores recém-inseridos.

   Regras de ouro (§20):
   - Só mexe em texto (número contando); a entrada fade+rise é 100% CSS (index.html).
   - prefers-reduced-motion:reduce → NÃO conta; mostra o valor final estático.
   - Segurança em dinheiro: o quadro FINAL é SEMPRE o texto original exato
     (só os quadros intermediários são sintetizados) — count-up nunca altera o valor.
   Referência de curva/tempo: Ateliê Manager (Num): dur 700ms, ease-out cúbico, começa de 0.
   ============================================================ */
(function(){
  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)');
  var reduce = mq ? mq.matches : false;
  if(mq){ try{ mq.addEventListener('change',function(e){reduce=e.matches;}); }
          catch(_){ try{ mq.addListener(function(e){reduce=e.matches;}); }catch(__){} } }

  // Divide "R$ 1.234,56 (12,3%)" → prefixo | número pt-BR | sufixo.
  var RE = /^([^\d-]*?)(-?[\d.,]+)(.*)$/;

  // Reconstrói um quadro intermediário preservando prefixo/sufixo e as casas do original.
  function frame(orig, value){
    var m = orig.match(RE); if(!m) return orig;
    var pre = m[1], num = m[2], suf = m[3];
    var dec = 0, ci = num.indexOf(',');
    if(ci >= 0) dec = num.length - ci - 1;
    var s = Math.abs(value).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
    return pre + (value < 0 ? '-' : '') + s + suf;
  }

  function countUp(el, orig, target){
    var t0 = null, dur = 700;
    el.textContent = frame(orig, 0);
    function tick(now){
      if(t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      if(t < 1){ el.textContent = frame(orig, target * e); requestAnimationFrame(tick); }
      else { el.textContent = orig; }   // quadro final = valor exato
    }
    requestAnimationFrame(tick);
  }

  function process(el){
    if(el.getAttribute('data-cu')) return;   // já processado neste ciclo de render
    el.setAttribute('data-cu','1');
    if(reduce) return;
    if(el.children.length) return;           // só texto puro
    var orig = (el.textContent || '').trim();
    if(!orig || /[\/:]/.test(orig)) return;  // ignora datas/horas ("01/06", "12:30")
    var m = orig.match(RE); if(!m) return;
    if(/\d/.test(m[1])) return;              // dígito no prefixo = formato inesperado
    // sufixo permitido: vazio, "%", ou anotação entre parênteses (ex.: margem do Financeiro)
    if(m[3] && !/^\s*(%?|\(.*\))\s*$/.test(m[3])) return;
    var target = parseFloat(m[2].replace(/\./g,'').replace(',','.'));
    if(!isFinite(target) || Math.abs(target) < 1) return;  // 0/decimais minúsculos não valem animação
    countUp(el, orig, target);
  }

  var pending = false;
  function scanAll(){
    pending = false;
    var list = document.querySelectorAll('#view .kpi .val');
    for(var i=0;i<list.length;i++) process(list[i]);
  }
  function schedule(){ if(pending) return; pending = true; requestAnimationFrame(scanAll); }

  function boot(){
    var v = document.getElementById('view');
    if(!v){ setTimeout(boot,250); return; }
    try{ new MutationObserver(schedule).observe(v,{childList:true,subtree:true}); }catch(_){}
    schedule();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
