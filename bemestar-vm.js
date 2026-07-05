/* ============================================================
   Vizio Motors — bemestar-vm.js (Fase 7 · Corporativo)
   Bem-estar & Pausas — no formato do sistema Inovar.
   Lembretes amigáveis (toast não-bloqueante) de hidratação,
   movimento, descanso visual e mental, com snooze e preferências.
   Ativado por padrão; persistência por dispositivo (localStorage).
   ============================================================ */
(function(){
"use strict";
var PKEY="vm_bemestar_v1";
var TIPOS={
  agua:{nome:"Hidratação",emoji:"💧",cor:"#5aa0ff",intervalo:60,msgs:[
    "Hora do gole! Dê uma golada na sua água para manter o foco.",
    "Seu cérebro precisa de combustível. Que tal um copo de água agora?",
    "Hidratação em dia, mente leve! Beba um pouco de água. 💧"]},
  movimento:{nome:"Movimento & Postura",emoji:"🪑",cor:"#c99a6a",intervalo:120,msgs:[
    "Hora de esticar as pernas! Levante-se e dê uma curta caminhada.",
    "Vamos alinhar a postura? Gire os ombros para trás e relaxe o pescoço.",
    "Pausa de 1 minuto: entrelace os dedos e empurre as mãos para o teto."]},
  visual:{nome:"Descanso Visual (20-20-20)",emoji:"👁️",cor:"#b78bff",intervalo:40,msgs:[
    "Descanse os olhos! Olhe para algo distante por 20 segundos.",
    "Pisque algumas vezes e mude o foco da tela por um instante."]},
  mental:{nome:"Bem-estar Mental",emoji:"🧠",cor:"#ec4899",intervalo:90,msgs:[
    "Inspire fundo… segure… e expire devagar. Sinta o alívio.",
    "Pausa mental: pense em três coisas pelas quais você é grato hoje.",
    "Feche os olhos por 30 segundos e apenas escute os sons ao seu redor."]}
};
var ORD=["agua","movimento","visual","mental"];
function defPrefs(){var t={};ORD.forEach(function(k){t[k]={on:true,intervalo:TIPOS[k].intervalo};});return {master:true,tipos:t};}
function load(){try{var s=JSON.parse(localStorage.getItem(PKEY)||"null");if(s&&s.tipos){ORD.forEach(function(k){if(!s.tipos[k])s.tipos[k]={on:true,intervalo:TIPOS[k].intervalo};});return s;}}catch(e){}return defPrefs();}
function save(p){try{localStorage.setItem(PKEY,JSON.stringify(p));}catch(e){}}

function injectCSS(){
  if(document.getElementById("bem-css"))return;
  var c=
  "#bemWrap{position:fixed;left:20px;bottom:20px;z-index:75;display:flex;flex-direction:column;gap:10px;max-width:340px}"+
  "@media(max-width:560px){#bemWrap{left:10px;right:10px;bottom:80px;max-width:none}}"+
  ".bemT{background:rgba(27,26,23,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--line);border-left:4px solid var(--gold-3);border-radius:14px;padding:13px 15px;color:var(--txt);box-shadow:0 18px 40px rgba(0,0,0,.5);animation:bemIn .3s ease}"+
  "@keyframes bemIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}"+
  ".bemT.out{animation:bemOut .3s ease forwards}@keyframes bemOut{to{opacity:0;transform:translateX(-20px)}}"+
  ".bemT .h{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.82rem;margin-bottom:4px;font-family:var(--display)}"+
  ".bemT .h .e{font-size:1.1rem}"+
  ".bemT .m{font-size:.86rem;line-height:1.45;color:var(--muted)}"+
  ".bemT .b{display:flex;gap:8px;margin-top:10px}"+
  ".bemT .b button{flex:1;font-size:.76rem;font-weight:600;border-radius:8px;padding:7px 9px;cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--txt)}"+
  ".bemT .b button.ok{background:var(--gold-3);border-color:var(--gold-3);color:#fff}"+
  ".bemPop{position:fixed;left:50%;top:28%;transform:translateX(-50%);z-index:200;background:rgba(27,26,23,.96);backdrop-filter:blur(18px);border:1px solid var(--line);border-radius:20px;padding:24px 28px;text-align:center;box-shadow:0 26px 64px rgba(0,0,0,.5);max-width:310px;cursor:pointer;animation:bemPopIn .36s cubic-bezier(.2,.9,.3,1.5)}"+
  ".bemPop .e{font-size:2.6rem;margin-bottom:6px;line-height:1}.bemPop .m{color:var(--txt);font-size:.98rem;font-weight:600;line-height:1.45}"+
  ".bemPop.out{animation:bemPopOut .3s ease forwards}"+
  "@keyframes bemPopIn{from{opacity:0;transform:translateX(-50%) scale(.8) translateY(12px)}to{opacity:1;transform:translateX(-50%) scale(1)}}"+
  "@keyframes bemPopOut{to{opacity:0;transform:translateX(-50%) scale(.92)}}"+
  ".bemSw{position:relative;display:inline-block;width:46px;height:26px;flex:none}.bemSw input{display:none}.bemSw span{position:absolute;inset:0;background:rgba(140,150,165,.4);border-radius:999px;transition:.2s;cursor:pointer}.bemSw span:before{content:'';position:absolute;width:20px;height:20px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}.bemSw input:checked+span{background:#22c55e}.bemSw input:checked+span:before{transform:translateX(20px)}";
  var s=document.createElement("style");s.id="bem-css";s.textContent=c;document.head.appendChild(s);
}
var REC=["Boa! Seu corpo agradece. 🎉","Mandou bem! Pequenas pausas, grandes resultados. 💪","Isso! Você está cuidando de você. 🌟","Feito! Mente renovada para seguir. ☕"];
var ADI=["Sem problema! Te lembro em 5 minutos. 💛","Tudo bem, sua tarefa vem primeiro. Volto já. 🙂","Combinado! Daqui a pouco a gente se vê. ⏰"];
function celebrar(tipo){injectCSS();var arr=(tipo==="adiar")?ADI:REC;var msg=arr[Math.floor(Math.random()*arr.length)];
  var el=document.createElement("div");el.className="bemPop";el.innerHTML='<div class="e">'+(tipo==="adiar"?"⏰":"🎉")+'</div><div class="m">'+msg+'</div>';
  document.body.appendChild(el);var rem=function(){if(!el.parentNode)return;el.classList.add("out");setTimeout(function(){el.remove();},300);};
  el.onclick=rem;setTimeout(rem,(tipo==="adiar")?2600:3200);}
function bwrap(){var w=document.getElementById("bemWrap");if(!w){w=document.createElement("div");w.id="bemWrap";document.body.appendChild(w);}return w;}
function bemToast(tipo){injectCSS();var t=TIPOS[tipo];var msg=t.msgs[Math.floor(Math.random()*t.msgs.length)];
  var el=document.createElement("div");el.className="bemT";el.style.borderLeftColor=t.cor;
  el.innerHTML='<div class="h"><span class="e">'+t.emoji+'</span>'+t.nome+'</div><div class="m">'+msg+'</div>'+
    '<div class="b"><button class="snooze">⏰ Adiar 5 min</button><button class="ok">Feito 👍</button></div>';
  bwrap().appendChild(el);
  var rem=function(){el.classList.add("out");setTimeout(function(){el.remove();},320);};
  el.querySelector(".ok").onclick=function(){rem();celebrar("feito");};
  el.querySelector(".snooze").onclick=function(){STATE[tipo]=Date.now()+5*60*1000;rem();celebrar("adiar");};
  setTimeout(function(){if(el.parentNode)rem();},22000);}

var STATE={};
function reprograma(){var p=load();var now=Date.now();ORD.forEach(function(k){
  if(p.master&&p.tipos[k]&&p.tipos[k].on){if(!STATE[k])STATE[k]=now+(p.tipos[k].intervalo||TIPOS[k].intervalo)*60*1000;}else{STATE[k]=null;}});}
function tick(){var p=load();if(!p.master)return;var now=Date.now();ORD.forEach(function(k){
  if(!(p.tipos[k]&&p.tipos[k].on)){STATE[k]=null;return;}
  if(!STATE[k]){STATE[k]=now+(p.tipos[k].intervalo||TIPOS[k].intervalo)*60*1000;return;}
  if(now>=STATE[k]){bemToast(k);STATE[k]=now+(p.tipos[k].intervalo||TIPOS[k].intervalo)*60*1000;}});}

function esc(s){return (s==null?"":String(s)).replace(/</g,"&lt;");}
function renderBemEstar(){
  injectCSS();
  var p=load();var INTS=[15,20,30,40,45,60,90,120,180];
  function selInt(k){return '<select onchange="BEM.setInt(\''+k+'\',this.value)" style="flex:none;min-width:150px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;color:var(--txt);font:inherit">'+
    INTS.map(function(m){return '<option value="'+m+'"'+(Number(p.tipos[k].intervalo)===m?" selected":"")+'>a cada '+(m<60?m+" min":(m/60)+"h"+(m%60?" "+(m%60)+"min":""))+'</option>';}).join("")+'</select>';}
  var linhas=ORD.map(function(k){var t=TIPOS[k];var on=p.tipos[k].on;
    return '<div style="display:flex;align-items:center;gap:14px;padding:14px 2px;border-bottom:1px solid var(--line)">'+
      '<div style="width:42px;height:42px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;background:'+t.cor+'22">'+t.emoji+'</div>'+
      '<div style="flex:1 1 auto;min-width:140px"><div style="font-weight:600">'+t.nome+'</div><div style="font-size:.82rem;color:var(--muted);line-height:1.4">'+esc(t.msgs[0])+'</div></div>'+
      '<div style="flex:none;display:flex;align-items:center;gap:12px">'+selInt(k)+'<label class="bemSw"><input type="checkbox" '+(on?"checked":"")+' onchange="BEM.toggle(\''+k+'\',this.checked)"><span></span></label></div>'+
    '</div>';}).join("");
  document.getElementById('view').innerHTML=
    '<div class="panel" style="display:flex;align-items:center;gap:16px">'+
      '<div style="width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,#f97316,#fb923c);display:flex;align-items:center;justify-content:center;font-size:1.7rem;box-shadow:0 8px 20px rgba(249,115,22,.28)">🌱</div>'+
      '<div style="flex:1"><h3 style="margin:0">Bem-estar & Pausas</h3><div style="font-size:13px;color:var(--muted)">Lembretes amigáveis para você cuidar de si durante o trabalho. Não interrompem o que você está fazendo — aparecem discretamente no canto da tela.</div></div>'+
      '<label class="bemSw" style="transform:scale(1.15)"><input type="checkbox" '+(p.master?"checked":"")+' onchange="BEM.master(this.checked)"><span></span></label>'+
    '</div>'+
    '<div class="panel"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Tipos de lembrete &amp; frequência</div>'+linhas+
      '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="b b-sm" onclick="BEM.testar()">🔔 Testar um lembrete agora</button>'+
      '<span style="font-size:.8rem;color:var(--muted)">Suas preferências ficam salvas neste aparelho.</span></div></div>';
}
function abrirBemEstar(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent="Bem-estar & Pausas";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderBemEstar();
}
window.abrirBemEstar=abrirBemEstar;
window.BEM={
  master:function(b){var p=load();p.master=!!b;save(p);STATE={};reprograma();},
  toggle:function(k,b){var p=load();p.tipos[k].on=!!b;save(p);STATE[k]=null;reprograma();},
  setInt:function(k,m){var p=load();p.tipos[k].intervalo=Number(m)||TIPOS[k].intervalo;save(p);STATE[k]=null;reprograma();},
  testar:function(){var ks=ORD.filter(function(k){return load().tipos[k].on;});bemToast(ks[Math.floor(Math.random()*ks.length)]||"agua");}
};
/* agendador ambiente */
reprograma();
if(!window._bemTimer)window._bemTimer=setInterval(tick,60000);
})();
