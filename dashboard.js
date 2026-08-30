/* ============================================================
   Vizio Motors — dashboard.js (Fase 6 · Inteligência)
   Dashboard Executivo: KPIs clicáveis (drill-down) + gráficos.
   Paleta multi-hue, layout reestruturado. Usa Chart.js.
   Depende de app.js (WORK, money, cli, veh, svc, prt, osTotal,
   STATUS_FLOW, modal, closeModal).
   ============================================================ */
/* instâncias Chart por ABA (init lazy: cada gráfico só nasce com a sua aba visível) */
let _dashCharts={};
function dashDestroy(){ Object.keys(_dashCharts).forEach(k=>_dashCharts[k].forEach(c=>{try{c.destroy();}catch(e){}})); _dashCharts={}; }
const PALETTE=['#5b8cff','#7fa3ff','#a9c1ff','#6ee2c0','#e6b566','#b7a6ff','#7fbfd6','#8894a6'];

function abrirDash(){
  setNavActive('[data-perm="dashboard"]');
  document.getElementById('pageTitle').textContent="Dashboard Executivo";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderDash();
}
function agg(map){ return Object.entries(map).sort((a,b)=>b[1]-a[1]); }

/* Fonte única das agregações do Dashboard — reaproveitada pelo resumo da Início (§2 redesign).
   Não duplicar esta lógica em outro módulo: consumir dashData(). */
function dashData(){
  const os=WORK.os;
  const aprov=os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const ticket=aprov.length?fat/aprov.length:0;
  const critico=WORK.pecas.filter(p=>p.estoque<p.minimo).length;
  const recServ={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;recServ[n]=(recServ[n]||0)+i.valor;}}));
  const porStatus=STATUS_FLOW.map((s,idx)=>os.filter(o=>o.statusIdx===idx).length);
  const mec={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];mec[m]=(mec[m]||0)+osTotal(o);});
  const servCount={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;servCount[n]=(servCount[n]||0)+i.qtd;}}));
  const pecaCount={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='peca'){const n=prt(i.refId).nome||i.refId;pecaCount[n]=(pecaCount[n]||0)+i.qtd;}}));
  const cliRec={}; os.forEach(o=>{const n=cli(o.clienteId).nome||o.clienteId;cliRec[n]=(cliRec[n]||0)+osTotal(o);});
  return {os,aprov,fat,ticket,critico,recServ,porStatus,mec,servCount,pecaCount,cliRec};
}
window.dashData=dashData;

function renderDash(){
  const D=dashData();
  const os=D.os, fat=D.fat, ticket=D.ticket, critico=D.critico;
  const recServ=D.recServ, porStatus=D.porStatus, mec=D.mec, servCount=D.servCount, pecaCount=D.pecaCount, cliRec=D.cliRec;

  // KPIs clicáveis (drill)
  const kpis=[
    ['Faturamento aprovado',money(fat),'faturamento','#5b8cff'],
    ['OS abertas',os.filter(o=>o.statusIdx<8).length,'abertas','#7fa3ff'],
    ['OS concluídas',os.filter(o=>o.statusIdx>=7).length,'concluidas','#54d1a6'],
    ['Ticket médio',money(ticket),'ticket','#b7a6ff'],
    ['Clientes ativos',WORK.clientes.length,'clientes','#7fbfd6'],
    ['Estoque crítico',critico,'estoque','#e77b7b'],
  ];
  /* ---- os painéis de gráficos antes empilhados viram ABAS (KPIs = cabeçalho; drill-down intacto).
     Agrupamento coerente PRESERVANDO os pares grid2 originais — nenhum painel perdido. ---- */
  const tabReceita=`
   <div class="panel"><h3>💰 Receita por serviço</h3><canvas id="c_recserv" height="150"></canvas></div>
   <div class="panel"><h3>👥 Clientes por receita</h3><canvas id="c_cli" height="150"></canvas></div>`;
  const tabOperacao=`
   <div class="grid2">
     <div class="panel"><h3>🔧 OS por status</h3><canvas id="c_status" height="200"></canvas></div>
     <div class="panel"><h3>🏅 Ranking de mecânicos (receita)</h3><canvas id="c_mec" height="200"></canvas></div>
   </div>`;
  const tabCatalogo=`
   <div class="grid2">
     <div class="panel"><h3>⭐ Serviços mais solicitados</h3><canvas id="c_serv" height="180"></canvas></div>
     <div class="panel"><h3>📦 Peças mais usadas</h3><canvas id="c_peca" height="180"></canvas></div>
   </div>`;
  dashDestroy();
  const D2={recServ,porStatus,mec,servCount,pecaCount,cliRec};
  document.getElementById('view').innerHTML=
   `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="font-size:12px;color:var(--muted)">Clique em qualquer indicador para ver os detalhes.</div><div style="flex:1"></div><button class="b b-ghost b-sm" onclick="relDashboard()">📄 Gerar relatório</button></div>`+
   `<div class="kpis">${kpis.map(k=>`<div class="kpi" style="cursor:pointer" onclick="dashDrill('${k[2]}')">
       <div class="lbl">${k[0]}</div><div class="val" style="color:${k[3]}">${k[1]}</div><div class="dt" style="color:${k[3]};font-size:11px">ver detalhes →</div></div>`).join('')}</div>`+
   vmTabs('dash',[
     {key:'receita',label:'Receita',html:tabReceita},
     {key:'operacao',label:'Operação',html:tabOperacao},
     {key:'catalogo',label:'Catálogo',html:tabCatalogo}
   ],{onShow:(tk,first)=>{
     /* cada aba desenha os SEUS gráficos só quando visível; nas voltas, re-mede (resize). */
     if(first) drawDashTab(tk,D2); else (_dashCharts[tk]||[]).forEach(c=>{try{c.resize();}catch(e){}});
   }});
  vmTabsReady('dash');
}

function relDashboard(){
  if(typeof relatorioPDF!=='function')return;
  const os=WORK.os, aprov=os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const ticket=aprov.length?fat/aprov.length:0;
  const critico=WORK.pecas.filter(p=>p.estoque<p.minimo);
  const recServ={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;recServ[n]=(recServ[n]||0)+i.valor;}}));
  const mec={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];mec[m]=(mec[m]||0)+osTotal(o);});
  const topServ=Object.entries(recServ).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const rankMec=Object.entries(mec).sort((a,b)=>b[1]-a[1]);
  const kpis=[['Faturamento aprovado',money(fat)],['OS abertas',os.filter(o=>o.statusIdx<8).length],['OS concluídas',os.filter(o=>o.statusIdx>=7).length],['Ticket médio',money(ticket)],['Clientes',WORK.clientes.length],['Estoque crítico',critico.length]];
  const corpo=RP.kpis(kpis)+
    RP.sec('Receita por serviço')+RP.table(['Serviço','Receita'],topServ.map(x=>[x[0],money(x[1])]))+
    RP.sec('Ranking de mecânicos')+RP.table(['Mecânico','Receita'],rankMec.map(x=>[x[0],money(x[1])]))+
    RP.sec('Estoque crítico')+RP.table(['Peça','Estoque','Mínimo'],critico.map(p=>[p.nome,String(p.estoque),String(p.minimo)]));
  relatorioPDF({titulo:'Relatório Executivo',subtitulo:'Visão geral da operação',corpo:corpo});
}
window.relDashboard=relDashboard;

/* desenha SÓ os gráficos da aba `key` (canvas já visível → mede != 0). Guarda as instâncias
   em _dashCharts[key] para o resize das voltas. Mesmos gráficos/dados de antes, agora por aba. */
function drawDashTab(key,d){
  if(typeof Chart==="undefined")return;
  if(_dashCharts[key])return;                          // já desenhada (idempotente)
  const arr=_dashCharts[key]=[];
  const _cs=getComputedStyle(document.documentElement);
  const grid=(_cs.getPropertyValue('--line').trim())||'rgba(255,255,255,.045)', tick=(_cs.getPropertyValue('--muted').trim())||'#79838f';
  const el=id=>{const e=document.getElementById(id);return e&&e.getContext?e.getContext('2d'):null;};
  const baseOpts=(money)=>({responsive:true,maintainAspectRatio:true,aspectRatio:3.4,
    plugins:{legend:{display:false}},
    scales:{y:{ticks:{color:tick,font:{family:'Inter',size:10},callback:v=>money?'R$ '+(v/1000)+'k':v},grid:{color:grid,drawBorder:false},border:{display:false}},
      x:{ticks:{color:tick,font:{family:'Inter',size:10}},grid:{display:false},border:{display:false}}}});
  /* CADA BARRA COM SUA COR — paleta categórica derivada dos tokens da marca (Camaleão).
     Fallback para a PALETTE fixa se vmChartColors não existir. */
  const pal=n=>(typeof vmChartColors==='function')?vmChartColors(n):Array.from({length:n},(_,i)=>PALETTE[i%PALETTE.length]);
  function bar(id,pairs,money,color){const c=el(id);if(!c)return;
    arr.push(new Chart(c,{type:'bar',data:{labels:pairs.map(p=>p[0]),
      datasets:[{data:pairs.map(p=>p[1]),backgroundColor:color||pal(pairs.length),borderRadius:6,borderSkipped:false,maxBarThickness:26}]},options:baseOpts(money)}));}
  if(key==='receita'){
    bar('c_recserv',agg(d.recServ).slice(0,7),true);
    bar('c_cli',agg(d.cliRec).slice(0,7),true);
  }else if(key==='operacao'){
    const cs=el('c_status');
    if(cs)arr.push(new Chart(cs,{type:'doughnut',
      data:{labels:STATUS_FLOW,datasets:[{data:d.porStatus,backgroundColor:pal(STATUS_FLOW.length),borderWidth:0}]},
      options:{responsive:true,maintainAspectRatio:true,aspectRatio:2.2,cutout:'72%',plugins:{legend:{position:'right',labels:{color:tick,font:{family:'Inter',size:10},boxWidth:10,boxHeight:10,usePointStyle:true,pointStyle:'circle'}}}}}));
    bar('c_mec',agg(d.mec),true);
  }else if(key==='catalogo'){
    bar('c_serv',agg(d.servCount).slice(0,7),false);
    bar('c_peca',agg(d.pecaCount).slice(0,7),false);
  }
}

/* drill-down: lista os registros por trás do indicador */
function dashDrill(tipo){
  const os=WORK.os; let titulo="", head="", rows="";
  const osRow=o=>{const v=veh(o.veiculoId);return `<tr><td>#${o.numero}</td><td><span class="plate">${esc(v.placa)}</span></td><td>${esc(cli(o.clienteId).nome)}</td><td><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></td><td style="text-align:right;color:var(--gold-2)">${money(osTotal(o))}</td></tr>`;};
  if(tipo==='abertas'||tipo==='faturamento'||tipo==='ticket'){
    let list = tipo==='abertas'? os.filter(o=>o.statusIdx<8) : os.filter(o=>o.aprovado);
    titulo = tipo==='abertas'?'OS abertas':(tipo==='ticket'?'OS aprovadas (base do ticket)':'OS que compõem o faturamento');
    head="<tr><th>OS</th><th>Placa</th><th>Cliente</th><th>Status</th><th style='text-align:right'>Valor</th></tr>";
    rows=list.map(osRow).join('')||'<tr><td colspan="5" style="color:var(--muted)">Nenhuma.</td></tr>';
  } else if(tipo==='concluidas'){
    titulo="OS concluídas / prontas";
    head="<tr><th>OS</th><th>Placa</th><th>Cliente</th><th>Status</th><th style='text-align:right'>Valor</th></tr>";
    rows=os.filter(o=>o.statusIdx>=7).map(osRow).join('')||'<tr><td colspan="5" style="color:var(--muted)">Nenhuma.</td></tr>';
  } else if(tipo==='clientes'){
    titulo="Clientes ativos";
    head="<tr><th>Cliente</th><th>Telefone</th><th>Veículos</th><th style='text-align:right'>OS</th></tr>";
    rows=WORK.clientes.map(c=>{const vs=WORK.veiculos.filter(v=>v.clienteId===c.id).length;const n=WORK.os.filter(o=>o.clienteId===c.id).length;
      return `<tr><td><b>${esc(c.nome)}</b></td><td style="color:var(--muted)">${esc(c.tel)}</td><td>${vs}</td><td style="text-align:right">${n}</td></tr>`;}).join('');
  } else if(tipo==='estoque'){
    titulo="Peças abaixo do mínimo";
    head="<tr><th>Peça</th><th>Fornecedor</th><th style='text-align:center'>Estoque</th><th style='text-align:center'>Mínimo</th></tr>";
    const cr=WORK.pecas.filter(p=>p.estoque<p.minimo);
    rows=cr.map(p=>`<tr><td><b>${esc(p.nome)}</b></td><td style="color:var(--muted)">${esc(p.fornecedor)}</td><td style="text-align:center;color:var(--bad)">${p.estoque}</td><td style="text-align:center">${p.minimo}</td></tr>`).join('')||'<tr><td colspan="4" style="color:var(--muted)">Estoque saudável.</td></tr>';
  }
  modal(titulo,"Detalhe do indicador",`<div style="max-height:52vh;overflow:auto"><table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`, ()=>closeModal());
  const b=document.getElementById('mSave'); if(b)b.textContent="Fechar";
}
