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

function renderServicos(){
  var os=(WORK.os||[]), abertas=os.filter(function(o){return o.statusIdx<8;});
  var semResp=abertas.filter(function(o){return !(o.responsavel||'').trim();});
  var tarefas=(WORK.tarefas||[]).filter(function(t){return t.status!=='concluida';});
  var eq=window.equipeMotors();

  /* carga da equipe: OS abertas + tarefas ativas por primeiro nome */
  var carga={}; eq.forEach(function(n){ carga[n]={os:0,tar:0}; });
  function bucket(nome){ if(!nome)return null; if(!carga[nome])carga[nome]={os:0,tar:0}; return carga[nome]; }
  abertas.forEach(function(o){ var b=bucket(o.responsavel); if(b)b.os++; });
  tarefas.forEach(function(t){ var b=bucket(t.responsavel); if(b)b.tar++; });
  var cargaRows=Object.keys(carga).filter(function(n){return carga[n].os||carga[n].tar||eq.indexOf(n)>=0;})
    .sort(function(a,b){return (carga[b].os+carga[b].tar)-(carga[a].os+carga[a].tar);});

  var kpis=[
    ['Serviços no catálogo',(WORK.servicos||[]).length],
    ['OS abertas',abertas.length],
    ['A delegar',semResp.length],
    ['Equipe',eq.length]
  ];

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

  var catRows=(WORK.servicos||[]).map(function(s){
    return '<tr style="cursor:pointer" onclick="editServico(\''+s.id+'\')"><td><b>'+esc(s.nome)+'</b></td>'+
      '<td style="color:var(--muted)">'+(esc(s.categoria)||'—')+'</td>'+
      '<td style="text-align:center">'+(s.tempoMin?s.tempoMin+' min':'—')+'</td>'+
      '<td style="text-align:right;color:var(--gold-2)">'+money(s.preco)+'</td>'+
      '<td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()"><button class="b b-ghost b-sm" title="Editar" onclick="editServico(\''+s.id+'\')">✏️</button> <button class="b b-ghost b-sm" title="Excluir" onclick="delServico(\''+s.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="5" style="color:var(--muted)">Nenhum serviço cadastrado.</td></tr>';

  document.getElementById('view').innerHTML=
   '<div class="kpis">'+kpis.map(function(k){return '<div class="kpi"><div class="lbl">'+k[0]+'</div><div class="val">'+k[1]+'</div></div>';}).join('')+'</div>'+
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
   '</div>'+
   '<div class="panel"><div class="head"><h3>🛠️ Catálogo de serviços</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="novoServico()">+ Novo serviço</button></div>'+
     '<div style="font-size:12px;color:var(--muted);margin-bottom:8px">Serviços e preços usados nas Ordens de Serviço.</div>'+
     '<div style="overflow:auto"><table class="tbl"><thead><tr><th>Serviço</th><th>Categoria</th><th style="text-align:center">Tempo</th><th style="text-align:right">Preço</th><th></th></tr></thead>'+
     '<tbody>'+catRows+'</tbody></table></div></div>';
}
window.renderServicos=renderServicos;

/* Atalho: abrir a Agenda direto no contexto do quadro (a Agenda já mostra o quadro embaixo). */
window.abrirAgendaQuadro=function(){ if(typeof go==='function'){ go('agenda'); }
  setTimeout(function(){ var b=document.querySelector('.tarBoard'); if(b)b.scrollIntoView({behavior:'smooth',block:'center'}); },120); };
})();
