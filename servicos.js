/* ============================================================
   Vizio Motors — servicos.js · Módulo SERVIÇOS (Gestão + Delegação)
   Duas frentes:
   1) DELEGAÇÃO — atribui o mecânico RESPONSÁVEL por cada OS aberta e por
      cada tarefa do quadro (§16.5). A delegação da tarefa reflete no cartão
      do Quadro (agenda-vm.js) e a da OS na Início/Dashboard.
   2) CATÁLOGO — reaproveita WORK.servicos (mt_servicos) e o form de
      configuracoes.js (novoServico/editServico/delServico) — não duplica.
   Multi-tenant: escreve em WORK.os / WORK.tarefas (mt_os/mt_tarefas, RLS por org_id).
   Depende de app.js (WORK, money, byId, cli, veh, osTotal, STATUS_FLOW,
   modal, toast) e corporativo.js (FUNCS).
   ============================================================ */
(function(){
"use strict";
var esc = window.esc || function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };

/* Equipe/mecânicos: usuários cadastrados (RBAC) + os nomes de demonstração (FUNCS),
   sem duplicar. É a lista do campo "Responsável". */
window.equipeMotors=function(){
  var nomes=[];
  try{ var s=JSON.parse(localStorage.getItem('vm_rbac_v1')||'null');
    if(s&&s.usuarios) s.usuarios.forEach(function(u){ if(u.nome && nomes.indexOf(u.nome)<0) nomes.push(u.nome); }); }catch(e){}
  var base=(typeof FUNCS!=='undefined')?FUNCS:['Carlos (mecânico)','André (mecânico)','Ana (recepção)'];
  base.forEach(function(f){ if(nomes.indexOf(f)<0) nomes.push(f); });
  return nomes;
};

function optionsResp(atual){
  var eq=window.equipeMotors(); if(atual && eq.indexOf(atual)<0) eq=[atual].concat(eq);
  return '<option value="">— sem responsável —</option>'+
    eq.map(function(n){ return '<option value="'+esc(n)+'"'+(n===atual?' selected':'')+'>'+esc(n)+'</option>'; }).join('');
}
function chipSem(){ return '<span class="badge s1" style="font-size:10px">a delegar</span>'; }

/* ---------- delegação ---------- */
window.osDelegar=function(id,nome){
  var o=byId(WORK.os,id); if(!o) return;
  o.responsavel=nome||''; renderServicos();
  toast(nome?('OS #'+o.numero+' com '+nome.split(' ')[0]):('OS #'+o.numero+' sem responsável'));
};
window.tarefaDelegar=function(id,nome){
  var t=(WORK.tarefas||[]).filter(function(x){return x.id===id;})[0]; if(!t) return;
  t.responsavel=nome||''; renderServicos();
  if(typeof toast==='function') toast(nome?('Tarefa com '+nome.split(' ')[0]):'Tarefa sem responsável');
};

/* ---------- render ---------- */
function abrirServicos(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  var link=document.querySelector('.nav a[data-perm="servicos"]'); if(link)link.classList.add('active');
  document.getElementById('pageTitle').textContent="Serviços";
  document.getElementById('side').classList.remove('open');
  var q=document.getElementById('q'); if(q)q.value='';
  renderServicos();
}
window.abrirServicos=abrirServicos;

/* ---------- catálogo inteligente (mockup-servicos) ---------- */
var _svcCat=null;                                  /* filtro de categoria ativo */
window.svcFiltrarCat=function(c){ _svcCat=(c==='__all__'?null:c); renderServicos(); };
function fmtMin(m){ m=+m||0; if(m>=60){ var h=Math.floor(m/60), r=m%60; return h+'h'+(r?String(r).padStart(2,'0'):''); } return m+' min'; }
function mecAv(nome){ if(typeof mechAv==='function') return mechAv(nome);
  var ini=(nome||'').trim().split(/\s+/).map(function(w){return w[0]||'';}).slice(0,2).join('').toUpperCase()||'?';
  return {ini:ini,grad:'linear-gradient(135deg,var(--gold-2),var(--accent2))'}; }
function svcIcone(cat){ cat=(cat||'').toLowerCase();
  if(/frei/.test(cat))return'🛑'; if(/susp/.test(cat))return'🚗'; if(/motor|inje|transmiss/.test(cat))return'⚡';
  if(/ar|clima/.test(cat))return'❄️'; if(/revis|óleo|oleo/.test(cat))return'🛢️'; return'🔧'; }
function svcCard(s){
  var mecs=Array.isArray(s.mecanicos)?s.mecanicos:[];
  var avs=mecs.slice(0,3).map(function(n){var a=mecAv(n);return '<span class="s-av" style="background:'+a.grad+'" title="'+esc(n)+'">'+esc(a.ini)+'</span>';}).join('');
  var more=mecs.length>3?'<span class="s-more">+'+(mecs.length-3)+'</span>':'';
  return '<article class="scard" onclick="editServico(\''+s.id+'\')" title="Editar serviço">'+
    '<div class="s-h"><span class="s-ic">'+svcIcone(s.categoria)+'</span>'+
      '<div class="s-ht"><h4>'+esc(s.nome)+'</h4><div class="s-cat">'+(esc(s.categoria)||'Serviço')+'</div></div>'+
      '<div class="s-price"><div class="pv">'+money(s.preco)+'</div><div class="pl">preço base</div></div></div>'+
    '<div class="s-facts"><span class="s-fact">🕒 <b>'+(s.tempoMin?fmtMin(s.tempoMin):'—')+'</b> estimado</span>'+
      (s.garantia?'<span class="s-fact">🛡 garantia <b>'+esc(s.garantia)+'</b></span>':'')+'</div>'+
    (s.pecas?'<div class="s-parts">📦 Peças: <b>'+esc(s.pecas)+'</b></div>':'')+
    '<div class="s-deleg"><span class="s-dl">Faz</span><div class="s-stack">'+(avs||'<span class="s-none">a definir</span>')+more+'</div>'+
      '<button class="s-cfg" onclick="event.stopPropagation();editServico(\''+s.id+'\')">⚙ Delegar</button></div>'+
  '</article>';
}
/* desempenho real: receita e volume vêm das OS; "tempo real" vem do tempo de
   ANDAMENTO cronometrado nas tarefas do Quadro vinculadas às OS que contêm o serviço.
   Sem tarefa vinculada, não há tempo real -> mostra só o estimado. Nada fabricado. */
function desempenhoServicos(){
  var os=(WORK.os||[]); var rec={}, cnt={};
  os.forEach(function(o){ (o.itens||[]).forEach(function(i){ if(i.tipo==='servico'){ var n=svc(i.refId).nome||i.refId;
    rec[n]=(rec[n]||0)+(i.valor||0); cnt[n]=(cnt[n]||0)+(i.qtd||1); } }); });
  var tarByOs={}; (WORK.tarefas||[]).forEach(function(t){ if(t.osId){ (tarByOs[t.osId]=tarByOs[t.osId]||[]).push(t); } });
  var realAgg={};
  os.forEach(function(o){ var arr=tarByOs[o.id]||[]; var seg=0; arr.forEach(function(t){ seg+=(t.segAndamento||0); });
    if(!(seg>0))return; var rm=seg/60;
    (o.itens||[]).filter(function(i){return i.tipo==='servico';}).forEach(function(i){ var n=svc(i.refId).nome||i.refId;
      if(!realAgg[n])realAgg[n]={sum:0,n:0}; realAgg[n].sum+=rm; realAgg[n].n++; }); });
  return {rec:rec,cnt:cnt,realMin:function(n){var a=realAgg[n];return a&&a.n?a.sum/a.n:null;}};
}
function renderServicos(){
  injectServicosCSS();
  var os=(WORK.os||[]), abertas=os.filter(function(o){return o.statusIdx<8;});
  var semResp=abertas.filter(function(o){return !(o.responsavel||'').trim();});
  var tarefas=(WORK.tarefas||[]).filter(function(t){return t.status!=='concluida';});
  var eq=window.equipeMotors();
  var cat=(WORK.servicos||[]);
  var D=desempenhoServicos();

  /* carga da equipe */
  var carga={}; eq.forEach(function(n){ carga[n]={os:0,tar:0}; });
  function bucket(nome){ if(!nome)return null; if(!carga[nome])carga[nome]={os:0,tar:0}; return carga[nome]; }
  abertas.forEach(function(o){ var b=bucket(o.responsavel); if(b)b.os++; });
  tarefas.forEach(function(t){ var b=bucket(t.responsavel); if(b)b.tar++; });
  var cargaRows=Object.keys(carga).filter(function(n){return carga[n].os||carga[n].tar||eq.indexOf(n)>=0;})
    .sort(function(a,b){return (carga[b].os+carga[b].tar)-(carga[a].os+carga[a].tar);});

  var kpis=[
    ['Serviços no catálogo',cat.length],
    ['OS abertas',abertas.length],
    ['A delegar',semResp.length],
    ['Equipe',eq.length]
  ];

  /* categorias */
  var cats=[]; cat.forEach(function(s){ var c=s.categoria||'Sem categoria'; if(cats.indexOf(c)<0)cats.push(c); });
  var catChips='<button class="s-chip'+(_svcCat===null?' on':'')+'" onclick="svcFiltrarCat(\'__all__\')">Todas as categorias</button>'+
    cats.map(function(c){return '<button class="s-chip'+(_svcCat===c?' on':'')+'" onclick="svcFiltrarCat(\''+esc(c).replace(/'/g,"\\'")+'\')">'+esc(c)+'</button>';}).join('');
  var visiveis=cat.filter(function(s){ return _svcCat===null || (s.categoria||'Sem categoria')===_svcCat; });
  /* agrupa por categoria */
  var grupos={}; visiveis.forEach(function(s){ var c=s.categoria||'Sem categoria'; (grupos[c]=grupos[c]||[]).push(s); });
  var catalogo=Object.keys(grupos).map(function(c){
    return '<div class="s-cattitle">'+esc(c)+'</div><div class="svcgrid">'+grupos[c].map(svcCard).join('')+'</div>';
  }).join('')||'<div style="color:var(--muted);font-size:13px;padding:10px">Nenhum serviço nesta categoria. Use <b>+ Novo serviço</b>.</div>';

  /* rail: desempenho por serviço (top por receita) */
  var perf=Object.keys(D.rec).map(function(n){return [n,D.rec[n],D.cnt[n]||0];}).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
  var perfRows=perf.map(function(p,i){var tk=p[2]?p[1]/p[2]:0;
    return '<div class="s-perf"><span class="rk">'+(i+1)+'</span>'+
      '<div class="pn"><b>'+esc(p[0])+'</b><div class="pm">'+p[2]+' em OS</div></div>'+
      '<div class="rev"><div class="rv">'+money(p[1])+'</div><div class="rc">ticket '+money(tk)+'</div></div></div>';
  }).join('')||'<div style="color:var(--muted);font-size:12.5px">Sem serviços faturados ainda.</div>';

  /* rail: tempo real × estimado (só onde há tempo cronometrado) */
  var tbars=cat.map(function(s){ var real=D.realMin(s.nome); if(!(s.tempoMin>0)||real==null) return '';
    var mx=Math.max(real,s.tempoMin)*1.1||1; var estp=Math.round(s.tempoMin/mx*100), realp=Math.round(real/mx*100);
    var over=real>s.tempoMin*1.08; var dif=Math.round((real-s.tempoMin)/s.tempoMin*100);
    return '<div class="s-tbar"><div class="tt"><b>'+esc(s.nome)+'</b><span class="tv">'+fmtMin(Math.round(real))+' · est. '+fmtMin(s.tempoMin)+'</span></div>'+
      '<div class="track" style="--est:'+estp+'%;--real:'+realp+'%"><span class="est"></span><span class="real '+(over?'bad':'good')+'"></span></div>'+
      '<div class="cap">'+(over?(dif+'% acima do estimado — revisar tempo padrão.'):'Dentro do previsto — estimativa saudável.')+'</div></div>';
  }).filter(Boolean).join('')||'<div style="color:var(--muted);font-size:12.5px">Vincule tarefas do Quadro às OS (campo OS na tarefa) para medir o tempo real.</div>';

  /* delegação (mantida) */
  var osRows=abertas.slice().sort(function(a,b){return b.numero-a.numero;}).map(function(o){
    var v=veh(o.veiculoId); var sem=!(o.responsavel||'').trim();
    var serv=(o.itens||[]).filter(function(i){return i.tipo==='servico';}).map(function(i){return (svc(i.refId).nome||'');}).filter(Boolean);
    return '<tr>'+
      '<td onclick="openOS(\''+o.id+'\')" style="cursor:pointer"><b>#'+o.numero+'</b></td>'+
      '<td onclick="openOS(\''+o.id+'\')" style="cursor:pointer"><span class="plate">'+esc(v.placa)+'</span></td>'+
      '<td style="color:var(--muted)">'+esc(serv.join(', ')||'—')+'</td>'+
      '<td><span class="badge s'+o.statusIdx+'">'+STATUS_FLOW[o.statusIdx]+'</span></td>'+
      '<td><select onchange="osDelegar(\''+o.id+'\',this.value)" style="min-width:160px">'+optionsResp(o.responsavel||'')+'</select> '+(sem?chipSem():'')+'</td>'+
    '</tr>';
  }).join('')||'<tr><td colspan="5" style="color:var(--muted)">Nenhuma OS aberta.</td></tr>';

  var tarRows=tarefas.map(function(t){
    var st=t.status==='andamento'?'s4':(t.status==='pendente'?'s1':'s7');
    var nomeSt=t.status==='andamento'?'Em andamento':(t.status==='pendente'?'Pendente':'Concluída');
    return '<tr>'+
      '<td><b>'+esc(t.titulo)+'</b></td>'+
      '<td><span class="badge '+st+'">'+nomeSt+'</span></td>'+
      '<td><select onchange="tarefaDelegar(\''+t.id+'\',this.value)" style="min-width:160px">'+optionsResp(t.responsavel||'')+'</select> '+(!(t.responsavel||'').trim()?chipSem():'')+'</td>'+
    '</tr>';
  }).join('')||'<tr><td colspan="3" style="color:var(--muted)">Nenhuma tarefa ativa no quadro.</td></tr>';

  /* pares p/ o gráfico líquido de receita por serviço (init lazy na aba Desempenho) */
  var pares=Object.keys(D.rec).map(function(n){return [n,D.rec[n]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,6);

  /* ---- as 3 seções (antes empilhadas em .s-cols + painéis abaixo) viram ABAS, conteúdo idêntico ---- */
  var tabCatalogo=
    '<div class="s-catbar">'+catChips+'</div>'+
    '<div class="head" style="margin-bottom:12px"><h3 style="font-family:var(--display);font-weight:600;font-size:16px;margin:0">Catálogo de serviços</h3><div class="sp" style="flex:1"></div>'+
      '<button class="b b-sm" onclick="novoServico()">+ Novo serviço</button></div>'+catalogo;
  var tabDesempenho=
    '<div class="panel"><h3>💰 Receita por serviço</h3><div class="s-chart"><canvas id="servChart"></canvas></div></div>'+
    '<div class="panel"><h3>📊 Desempenho por serviço</h3><div style="font-size:12px;color:var(--muted);margin:-6px 0 10px">Volume e receita no período.</div>'+perfRows+'</div>'+
    '<div class="panel"><h3>⏱ Tempo real × estimado</h3><div style="font-size:12px;color:var(--muted);margin:-6px 0 12px">Real medido pelo Quadro de tarefas vinculado à OS.</div>'+tbars+'</div>';
  var tabDelegacao=
    '<div class="panel"><div class="head"><h3>🧑‍🔧 Delegar ordens de serviço</h3><div class="sp"></div>'+
      '<span style="font-size:12px;color:var(--muted)">escolha o mecânico responsável por cada OS</span></div>'+
      '<div style="overflow:auto"><table class="tbl"><thead><tr><th>OS</th><th>Placa</th><th>Serviços</th><th>Status</th><th>Responsável</th></tr></thead>'+
      '<tbody>'+osRows+'</tbody></table></div></div>'+
    '<div class="grid2">'+
      '<div class="panel"><div class="head"><h3>🗂 Delegar tarefas do quadro</h3><div class="sp"></div>'+
        '<button class="b b-sm" onclick="abrirAgendaQuadro()">Abrir quadro</button></div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:8px">O responsável aparece no cartão do Quadro de tarefas.</div>'+
        '<table class="tbl"><thead><tr><th>Tarefa</th><th>Etapa</th><th>Responsável</th></tr></thead><tbody>'+tarRows+'</tbody></table></div>'+
      '<div class="panel"><h3>👷 Carga da equipe</h3>'+
        cargaRows.map(function(n){var c=carga[n];return '<div class="info-line"><span class="k">'+esc(n)+'</span>'+
          '<span style="font-weight:600">'+c.os+' OS · '+c.tar+' tarefa(s)</span></div>';}).join('')+
        '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Some OS abertas e tarefas ativas por responsável.</div></div>'+
    '</div>';

  document.getElementById('view').innerHTML=
   '<div class="kpis">'+kpis.map(function(k){return '<div class="kpi"><div class="lbl">'+k[0]+'</div><div class="val">'+k[1]+'</div></div>';}).join('')+'</div>'+
   '<div class="s-def"><span class="s-di">🛠️</span><p><b class="vs">Serviços</b> = catálogo + inteligência — o que a oficina vende, a que preço, quem faz e quanto rende. · <b>Ordens de Serviço</b> = a execução em cada veículo.</p></div>'+
   vmTabs('svc',[
     {key:'catalogo',label:'Catálogo',count:cat.length,html:tabCatalogo},
     {key:'desempenho',label:'Desempenho',html:tabDesempenho},
     {key:'delegacao',label:'Delegação',count:semResp.length,html:tabDelegacao}
   ],{onShow:function(k){
     /* gráfico líquido só desenha com a aba Desempenho VISÍVEL (canvas mede != 0). Idempotente. */
     if(k==='desempenho' && typeof vmLiquidChart==='function' && pares.length) vmLiquidChart('servChart', pares);
   }});
  vmTabsReady('svc');
}
window.renderServicos=renderServicos;

function injectServicosCSS(){ if(document.getElementById('svcCSS'))return;
  var s=document.createElement('style'); s.id='svcCSS';
  s.textContent=
   '.s-def{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;margin-bottom:18px;border:1px solid var(--line);background:linear-gradient(120deg,color-mix(in srgb,var(--gold-2) 12%,transparent),color-mix(in srgb,var(--accent2) 8%,transparent))}'+
   '.s-di{width:38px;height:38px;border-radius:11px;flex:none;display:grid;place-items:center;font-size:18px;background:color-mix(in srgb,var(--gold-2) 16%,transparent)}'+
   '.s-def p{margin:0;font-size:13px;color:var(--muted);line-height:1.5}.s-def p b{color:var(--txt);font-weight:600}.s-def .vs{color:var(--gold-2)}'+
   '.s-catbar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}'+
   '.s-chip{height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--glass);color:var(--muted);font-family:var(--display);font-weight:600;font-size:12.5px;cursor:pointer;transition:.16s}'+
   '.s-chip:hover{color:var(--txt);border-color:var(--gold-2)}'+
   '.s-chip.on{color:#fff;background:linear-gradient(120deg,var(--gold-2),var(--gold-4));border-color:transparent;box-shadow:var(--shadow-card)}'+
   '.s-cols{display:grid;grid-template-columns:1.55fr 1fr;gap:16px;align-items:start}'+
   '@media(max-width:1000px){.s-cols{grid-template-columns:1fr}}'+
   '.s-cattitle{font-family:var(--display);font-weight:600;font-size:12.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:10px 2px 10px;display:flex;align-items:center;gap:9px}'+
   '.s-cattitle::after{content:"";flex:1;height:1px;background:var(--line)}'+
   '.svcgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-bottom:8px}'+
   '.scard{border-radius:16px;padding:16px;border:1px solid var(--line);background:var(--glass);backdrop-filter:blur(16px) saturate(1.1);-webkit-backdrop-filter:blur(16px) saturate(1.1);box-shadow:var(--shadow-card);cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s;animation:vmRiseIn .4s ease-out both}'+
   '.scard:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--gold-2) 32%,transparent)}'+
   '.s-h{display:flex;align-items:flex-start;gap:11px;margin-bottom:13px}'+
   '.s-ic{width:40px;height:40px;border-radius:11px;flex:none;display:grid;place-items:center;font-size:18px;background:color-mix(in srgb,var(--gold-2) 14%,transparent)}'+
   '.s-ht{min-width:0;flex:1}.s-ht h4{font-family:var(--display);font-weight:600;font-size:15px;margin:0;line-height:1.2}'+
   '.s-cat{font-size:11.5px;color:var(--muted);margin-top:3px}'+
   '.s-price{text-align:right;flex:none}.s-price .pv{font-family:var(--display);font-weight:600;font-size:16px;color:var(--gold-2);font-variant-numeric:tabular-nums}.s-price .pl{font-size:9.5px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em}'+
   '.s-facts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}'+
   '.s-fact{font-size:11.5px;color:var(--muted);padding:5px 9px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid var(--line)}.s-fact b{color:var(--txt);font-weight:600}'+
   '.s-parts{font-size:12px;color:var(--muted);padding-top:11px;border-top:1px solid var(--line);margin-bottom:12px}.s-parts b{color:var(--txt);font-weight:500}'+
   '.s-deleg{display:flex;align-items:center;gap:8px}'+
   '.s-dl{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em}'+
   '.s-stack{display:flex;align-items:center}'+
   '.s-av{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;color:#0a0d11;font-weight:700;font-size:10px;border:2px solid var(--panel);margin-left:-7px;font-family:var(--display)}.s-av:first-child{margin-left:0}'+
   '.s-more{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:600;background:rgba(255,255,255,.08);color:var(--muted);border:2px solid var(--panel);margin-left:-7px}'+
   '.s-none{font-size:11px;color:var(--dim)}'+
   '.s-cfg{margin-left:auto;font-size:12px;color:var(--gold-2);background:none;border:none;cursor:pointer;font-weight:600;font-family:inherit}.s-cfg:hover{text-decoration:underline}'+
   '.s-rail{display:flex;flex-direction:column;gap:16px}'+
   '.s-chart{position:relative;height:150px}.s-chart canvas{width:100%;height:100%;display:block}'+
   '.s-perf{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)}.s-perf:last-child{border-bottom:none}'+
   '.s-perf .rk{width:22px;font-family:var(--display);font-weight:600;color:var(--dim);text-align:center;flex:none;font-variant-numeric:tabular-nums}'+
   '.s-perf .pn{flex:1;min-width:0}.s-perf .pn b{font-size:13px;font-weight:600}.s-perf .pn .pm{font-size:11.5px;color:var(--muted);margin-top:2px}'+
   '.s-perf .rev{text-align:right;flex:none}.s-perf .rev .rv{font-family:var(--display);font-weight:600;font-size:14px;color:var(--gold-2);font-variant-numeric:tabular-nums}.s-perf .rev .rc{font-size:10.5px;color:var(--dim)}'+
   '.s-tbar{margin-bottom:14px}.s-tbar:last-child{margin-bottom:0}'+
   '.s-tbar .tt{display:flex;align-items:baseline;gap:8px;font-size:12.5px;margin-bottom:7px}.s-tbar .tt b{font-weight:600}.s-tbar .tt .tv{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--muted);font-size:11.5px}'+
   '.s-tbar .track{position:relative;height:8px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}'+
   '.s-tbar .track .est{position:absolute;inset:0;width:var(--est);background:repeating-linear-gradient(90deg,rgba(255,255,255,.10),rgba(255,255,255,.10) 5px,transparent 5px,transparent 10px)}'+
   '.s-tbar .track .real{position:absolute;inset:0;width:var(--real);border-radius:999px}'+
   '.s-tbar .track .real.good{background:linear-gradient(90deg,var(--ok),#8fe0c4)}'+
   '.s-tbar .track .real.bad{background:linear-gradient(90deg,var(--warn),var(--gold-2))}'+
   '.s-tbar .cap{font-size:10.5px;color:var(--dim);margin-top:6px}'+
   '@media(prefers-reduced-motion:reduce){.scard{animation:none}}';
  document.head.appendChild(s);
}

/* Atalho: abrir a Agenda direto no contexto do quadro (a Agenda já mostra o quadro embaixo). */
window.abrirAgendaQuadro=function(){ if(typeof go==='function'){ go('agenda'); }
  setTimeout(function(){ var b=document.querySelector('.tarBoard'); if(b)b.scrollIntoView({behavior:'smooth',block:'center'}); },120); };
})();
