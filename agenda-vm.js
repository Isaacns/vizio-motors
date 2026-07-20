/* ============================================================
   Vizio Motors — agenda-vm.js · Módulo AGENDA (§16 dos Padrões)
   Semana à vista · Manhã/Tarde/Noite · arrastar (§15) · faixa de foco.
   Oficina atende sábado -> Seg–Sáb (§16: "é configuração, não código novo").
   Persistência: WORK.agenda -> mt_agenda (Supabase, RLS por org_id).
   Depende de app.js (WORK, cli, veh, modal, toast, uid, byId, fmtFull).
   ============================================================ */
(function(){
"use strict";

var DIAS_SEMANA = 6;                    /* Seg–Sáb; 5 = Seg–Sex */
var PERIODOS = [
  {id:'manha', nome:'Manhã', ini:0,  fim:11, hora:'09:00', ic:'🌅'},
  {id:'tarde', nome:'Tarde', ini:12, fim:17, hora:'14:00', ic:'☀️'},
  {id:'noite', nome:'Noite', ini:18, fim:23, hora:'19:00', ic:'🌙'}
];
var _off = 0;          /* semanas a partir da atual */
var _fechados = {};    /* períodos recolhidos pelo usuário */

function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function hojeISO(){ return iso(new Date()); }
function segundaDa(off){
  var d=new Date(); d.setHours(0,0,0,0);
  var dow=(d.getDay()+6)%7;            /* 0 = segunda */
  d.setDate(d.getDate()-dow+(off*7));
  return d;
}
function diasDaSemana(){
  var base=segundaDa(_off), out=[];
  for(var i=0;i<DIAS_SEMANA;i++){ var d=new Date(base); d.setDate(base.getDate()+i); out.push(d); }
  return out;
}
function periodoDaHora(h){
  var n=parseInt((h||'00:00').split(':')[0],10)||0;
  for(var i=0;i<PERIODOS.length;i++){ if(n>=PERIODOS[i].ini&&n<=PERIODOS[i].fim) return PERIODOS[i].id; }
  return 'manha';
}
function periodoAgora(){ return periodoDaHora(String(new Date().getHours()).padStart(2,'0')+':00'); }
function periodoPorId(id){ return PERIODOS.filter(function(p){return p.id===id;})[0]||PERIODOS[0]; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

/* ---------- mover (arrastar §15 ou botão, para toque/acessibilidade) ---------- */
window.agMover=function(id, dataDestino, periodoDestino){
  var a=byId(WORK.agenda,id); if(!a) return;
  var pOrigem=periodoDaHora(a.hora), dOrigem=a.data;
  if(dOrigem===dataDestino && pOrigem===periodoDestino) return;   /* §15: soltar no mesmo lugar não faz nada */
  var de=fmtFull(dOrigem)+' '+(a.hora||'');
  a.data=dataDestino;
  /* §15 encaixe inteligente: só reescreve a hora quando MUDA de período */
  if(pOrigem!==periodoDestino) a.hora=periodoPorId(periodoDestino).hora;
  /* §15: movimento é alteração de dado -> trilha */
  if(!Array.isArray(a.historico)) a.historico=[];
  a.historico.push({em:new Date().toISOString(), quem:(window.__vmUserEmail||'sistema'),
                    de:de, para:fmtFull(a.data)+' '+a.hora});
  renderAgenda();
  toast('Movido para '+fmtFull(a.data)+' · '+periodoPorId(periodoDestino).nome);
};

/* ---------- render ---------- */
function cartao(a){
  var v=veh(a.veiculoId)||{}, c=cli(a.clienteId)||{};
  return '<div class="agCard" draggable="true" data-agid="'+a.id+'" onclick="editAg(\''+a.id+'\')" title="Clique para editar · arraste para mover">'+
    '<div class="agHora">'+esc(a.hora||'')+'</div>'+
    '<div class="agInfo"><b>'+esc(a.tipo||'Agendamento')+'</b><span>'+esc(c.nome||'')+(v.placa?' · '+esc(v.placa):'')+'</span></div>'+
    '<div class="agAcoes" onclick="event.stopPropagation()">'+
      '<button class="b b-ghost b-sm" title="Mover" onclick="agMoverMenu(\''+a.id+'\')">↔</button>'+
      '<button class="b b-ghost b-sm" title="Excluir" onclick="delAg(\''+a.id+'\')">🗑</button>'+
    '</div></div>';
}

function renderAgenda(){
  var dias=diasDaSemana(), hoje=hojeISO(), pAgora=periodoAgora();
  var porDia={};
  (WORK.agenda||[]).forEach(function(a){ (porDia[a.data]=porDia[a.data]||[]).push(a); });
  Object.keys(porDia).forEach(function(d){ porDia[d].sort(function(x,y){ return (x.hora||'').localeCompare(y.hora||''); }); });

  var ini=dias[0], fim=dias[dias.length-1];
  var rotulo=ini.getDate()+'/'+(ini.getMonth()+1)+' a '+fim.getDate()+'/'+(fim.getMonth()+1);
  var semanaAtual=(_off===0);

  var colunas=dias.map(function(d){
    var di=iso(d), ehHoje=(di===hoje);
    var lista=porDia[di]||[];
    var blocos=PERIODOS.map(function(p){
      var itens=lista.filter(function(a){ return periodoDaHora(a.hora)===p.id; });
      var agora=(ehHoje && p.id===pAgora);
      /* §16: o período atual abre e vem marcado "agora"; os outros ficam recolhidos.
         Fora de hoje, abre o que tem conteúdo. O clique do usuário manda em tudo. */
      var aberto = (_fechados[p.id]!==undefined) ? !_fechados[p.id]
                 : (agora || (!ehHoje && itens.length>0));
      return '<div class="agPer'+(agora?' agAgora':'')+'" data-dia="'+di+'" data-per="'+p.id+'">'+
        '<div class="agPerTop" onclick="agTogglePeriodo(\''+p.id+'\')">'+
          '<span>'+p.ic+' '+p.nome+(agora?' <i>agora</i>':'')+'</span>'+
          '<span class="agCount">'+itens.length+'</span>'+
        '</div>'+
        '<div class="agSlot'+(aberto?'':' agFechado')+'">'+
          (itens.length?itens.map(cartao).join(''):'<div class="agVazio">—</div>')+
        '</div></div>';
    }).join('');
    return '<div class="agCol'+(ehHoje?' agHoje':'')+'">'+
      '<div class="agColTop"><b>'+['Seg','Ter','Qua','Qui','Sex','Sáb'][ (d.getDay()+6)%7 ]+'</b>'+
        '<span>'+d.getDate()+'/'+(d.getMonth()+1)+'</span>'+
        '<button class="b b-ghost b-sm" title="Novo neste dia" onclick="novoAgEm(\''+di+'\')">+</button></div>'+
      blocos+'</div>';
  }).join('');

  var pn=periodoPorId(pAgora);
  document.getElementById('view').innerHTML=
   '<div class="panel">'+
     '<div class="head"><h3>🗓 Agenda</h3><div class="sp"></div>'+
       '<button class="b b-ghost b-sm" onclick="agSemana(-1)">‹</button>'+
       '<button class="b b-ghost b-sm" onclick="agSemana(0)">Hoje</button>'+
       '<button class="b b-ghost b-sm" onclick="agSemana(1)">›</button>'+
       '<span style="font-size:12px;color:var(--muted);margin:0 10px">'+rotulo+'</span>'+
       '<button class="b" onclick="novoAg()">+ Agendamento</button></div>'+
     (semanaAtual?'<div class="agFoco">'+pn.ic+' Agora é <b>'+pn.nome+'</b> — foque nas atividades deste período.</div>':'')+
     '<div class="agGrade">'+colunas+'</div>'+
     '<div class="agDica">Arraste um agendamento para outro dia ou período. No celular, use o botão ↔ do cartão.</div>'+
   '</div>';
  ligarArrastar();
}

window.agSemana=function(n){ _off = (n===0? 0 : _off+n); renderAgenda(); };
window.agTogglePeriodo=function(pid){ _fechados[pid] = !_fechados[pid]; renderAgenda(); };
window.novoAgEm=function(dataISO){ formAg({data:dataISO, hora:periodoPorId(periodoAgora()).hora}); };

/* Caminho alternativo ao arrasto (§15: arrastar nunca é o único caminho) */
window.agMoverMenu=function(id){
  var a=byId(WORK.agenda,id); if(!a) return;
  var dias=diasDaSemana();
  modal('Mover agendamento','Escolha o dia e o período',
    '<label>Dia</label><select id="mv_dia">'+dias.map(function(d){var di=iso(d);
      return '<option value="'+di+'"'+(di===a.data?' selected':'')+'>'+fmtFull(di)+'</option>';}).join('')+'</select>'+
    '<label>Período</label><select id="mv_per">'+PERIODOS.map(function(p){
      return '<option value="'+p.id+'"'+(p.id===periodoDaHora(a.hora)?' selected':'')+'>'+p.nome+'</option>';}).join('')+'</select>',
    function(){ var d=document.getElementById('mv_dia').value, p=document.getElementById('mv_per').value;
      closeModal(); agMover(id,d,p); });
};

/* ---------- arrastar (§15) ---------- */
function ligarArrastar(){
  var cards=document.querySelectorAll('.agCard');
  Array.prototype.forEach.call(cards,function(el){
    el.addEventListener('dragstart',function(e){
      el.classList.add('dragging');
      /* §15: tipo próprio + text/plain de reserva */
      try{ e.dataTransfer.setData('text/agid', el.dataset.agid); }catch(_){}
      try{ e.dataTransfer.setData('text/plain','agid:'+el.dataset.agid); }catch(_){}
      e.dataTransfer.effectAllowed='move';
    });
    el.addEventListener('dragend',function(){ el.classList.remove('dragging'); limparRealce(); });
  });

  var zonas=document.querySelectorAll('.agPer');
  Array.prototype.forEach.call(zonas,function(z){
    z.addEventListener('dragover',function(e){ if(!idDoEvento(e)) return; e.preventDefault();
      e.dataTransfer.dropEffect='move'; z.classList.add('drop-ok'); });
    z.addEventListener('dragleave',function(){ z.classList.remove('drop-ok'); });
    z.addEventListener('drop',function(e){
      var id=idDoEvento(e); z.classList.remove('drop-ok');
      if(!id) return;                        /* §15: zona ignora o que não entende */
      e.preventDefault(); limparRealce();
      agMover(id, z.dataset.dia, z.dataset.per);
    });
  });
}
function idDoEvento(e){
  try{
    var v=e.dataTransfer.getData('text/agid'); if(v) return v;
    var p=e.dataTransfer.getData('text/plain')||'';
    return p.indexOf('agid:')===0 ? p.slice(5) : '';
  }catch(_){ return ''; }
}
function limparRealce(){
  Array.prototype.forEach.call(document.querySelectorAll('.drop-ok'),function(z){ z.classList.remove('drop-ok'); });
}

/* CSS do módulo — acento do produto, nada de cor fixa (§2/§16) */
function injectCSS(){
  if(document.getElementById('agCSS')) return;
  var s=document.createElement('style'); s.id='agCSS';
  s.textContent=
   '.agFoco{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;margin-bottom:14px;'+
     'background:linear-gradient(90deg,rgba(91,140,255,.14),transparent);border:1px solid var(--line);font-size:13px;color:var(--txt)}'+
   '.agGrade{display:grid;grid-template-columns:repeat('+DIAS_SEMANA+',minmax(150px,1fr));gap:10px;overflow-x:auto}'+
   '.agCol{border:1px solid var(--line);border-radius:14px;padding:8px;background:rgba(255,255,255,.02)}'+
   '.agCol.agHoje{border-color:var(--gold-2);box-shadow:0 0 0 1px var(--gold-2) inset}'+
   '.agColTop{display:flex;align-items:center;gap:6px;padding:2px 4px 8px}'+
   '.agColTop b{font-family:var(--display);font-size:13px}'+
   '.agColTop span{font-size:11px;color:var(--muted);flex:1}'+
   '.agPer{border-radius:10px;padding:4px;margin-bottom:6px;transition:.15s}'+
   '.agPer.agAgora{background:rgba(91,140,255,.07)}'+
   '.agPerTop{display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:11px;color:var(--muted);padding:3px 4px}'+
   '.agPerTop i{font-style:normal;color:var(--gold-2);font-size:10px}'+
   '.agCount{background:var(--line);border-radius:999px;padding:1px 7px;font-size:10px}'+
   '.agSlot{display:flex;flex-direction:column;gap:6px;min-height:34px}'+
   '.agSlot.agFechado{display:none}'+
   '.agVazio{font-size:11px;color:var(--dim);text-align:center;padding:6px 0}'+
   '.agCard{display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:10px;border:1px solid var(--line);'+
     'background:var(--panel-2);cursor:grab;transition:.15s}'+
   '.agCard:hover{border-color:var(--gold-2)}'+
   '.agCard.dragging{opacity:.45;cursor:grabbing}'+          /* §15 feedback na origem */
   '.agHora{font-family:var(--display);font-size:12px;color:var(--gold-2);font-weight:600;flex:none}'+
   '.agInfo{display:flex;flex-direction:column;line-height:1.25;flex:1;min-width:0}'+
   '.agInfo b{font-size:12px;font-weight:600}'+
   '.agInfo span{font-size:10.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
   '.agAcoes{display:flex;gap:4px;flex:none}'+
   '.agPer.drop-ok{outline:2px dashed var(--gold-2);outline-offset:2px;background:rgba(91,140,255,.10)}'+  /* §15 destino */
   '.agDica{font-size:11.5px;color:var(--muted);margin-top:12px}'+
   '@media(prefers-reduced-motion:reduce){.agCard,.agPer{transition:none}}';
  document.head.appendChild(s);
}

/* Substitui o renderAgenda do app.js (este arquivo carrega depois). O nome é o mesmo,
   então router, LISTVIEWS, formAg/delAg e o realtime continuam funcionando sem mudança. */
window.renderAgenda=function(){ injectCSS(); renderAgenda(); };
})();
