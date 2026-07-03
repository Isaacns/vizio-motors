/* ============================================================
   Vizio Motors — dashboard.js (Fase 6 · Inteligência)
   Dashboard Executivo: KPIs + gráficos e rankings.
   Depende de app.js (WORK, money, cli, veh, svc, prt, osTotal,
   STATUS_FLOW). Usa Chart.js (carregado no index).
   ============================================================ */
let _dashCharts=[];
function dashDestroy(){ _dashCharts.forEach(c=>{try{c.destroy();}catch(e){}}); _dashCharts=[]; }

function abrirDash(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Dashboard Executivo";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderDash();
}

function agg(map){ return Object.entries(map).sort((a,b)=>b[1]-a[1]); }

function renderDash(){
  const os=WORK.os;
  const aprov=os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const ticket=aprov.length?fat/aprov.length:0;
  const critico=WORK.pecas.filter(p=>p.estoque<p.minimo).length;

  // receita por serviço
  const recServ={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;recServ[n]=(recServ[n]||0)+i.valor;}}));
  // OS por status
  const porStatus=STATUS_FLOW.map((s,idx)=>os.filter(o=>o.statusIdx===idx).length);
  // ranking mecânicos (receita)
  const mec={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];mec[m]=(mec[m]||0)+osTotal(o);});
  // serviços mais solicitados (contagem)
  const servCount={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;servCount[n]=(servCount[n]||0)+i.qtd;}}));
  // peças mais usadas (qtd)
  const pecaCount={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='peca'){const n=prt(i.refId).nome||i.refId;pecaCount[n]=(pecaCount[n]||0)+i.qtd;}}));
  // clientes por receita
  const cliRec={}; os.forEach(o=>{const n=cli(o.clienteId).nome||o.clienteId;cliRec[n]=(cliRec[n]||0)+osTotal(o);});

  const kpis=[
    ['Faturamento aprovado',money(fat)],['OS abertas',os.filter(o=>o.statusIdx<8).length],
    ['OS concluídas',os.filter(o=>o.statusIdx>=7).length],['Ticket médio',money(ticket)],
    ['Clientes ativos',WORK.clientes.length],['Estoque crítico',critico],
  ];
  document.getElementById('view').innerHTML=`
   <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>
   <div class="grid2">
     <div class="panel"><h3>💰 Receita por serviço</h3><canvas id="c_recserv" height="170"></canvas></div>
     <div class="panel"><h3>🔧 OS por status</h3><canvas id="c_status" height="170"></canvas></div>
   </div>
   <div class="grid2">
     <div class="panel"><h3>🏅 Ranking de mecânicos (receita)</h3><canvas id="c_mec" height="170"></canvas></div>
     <div class="panel"><h3>⭐ Serviços mais solicitados</h3><canvas id="c_serv" height="170"></canvas></div>
   </div>
   <div class="grid2">
     <div class="panel"><h3>📦 Peças mais usadas</h3><canvas id="c_peca" height="170"></canvas></div>
     <div class="panel"><h3>👥 Clientes por receita</h3><canvas id="c_cli" height="170"></canvas></div>
   </div>`;
  drawDash({recServ,porStatus,mec,servCount,pecaCount,cliRec});
}

function drawDash(d){
  if(typeof Chart==="undefined")return;
  dashDestroy();
  const GOLD=['#f6d16a','#e7ab30','#c6841b','#8a5a12','#fdeeb0','#b8863a','#d9a441','#a86f1a'];
  const grid='rgba(255,255,255,.05)', tick='#9a927f';
  const el=id=>{const e=document.getElementById(id);return e&&e.getContext?e.getContext('2d'):null;};
  const baseOpts=(money)=>({plugins:{legend:{display:false}},
    scales:{y:{ticks:{color:tick,callback:v=>money?'R$ '+(v/1000)+'k':v},grid:{color:grid}},x:{ticks:{color:tick,font:{size:10}},grid:{display:false}}}});
  function bar(id,pairs,money){const c=el(id);if(!c)return;
    _dashCharts.push(new Chart(c,{type:'bar',data:{labels:pairs.map(p=>p[0]),
      datasets:[{data:pairs.map(p=>p[1]),backgroundColor:GOLD,borderRadius:7,borderSkipped:false}]},options:baseOpts(money)}));}
  bar('c_recserv',agg(d.recServ).slice(0,7),true);
  // doughnut status
  const cs=el('c_status');
  if(cs)_dashCharts.push(new Chart(cs,{type:'doughnut',
    data:{labels:STATUS_FLOW,datasets:[{data:d.porStatus,backgroundColor:['#5aa0ff','#f0b23c','#f0b23c','#e7ab30','#e7ab30','#e7ab30','#e7ab30','#4ecb8f','#4ecb8f'],borderWidth:0}]},
    options:{plugins:{legend:{position:'right',labels:{color:tick,font:{size:10},boxWidth:12}}}}}));
  bar('c_mec',agg(d.mec),true);
  bar('c_serv',agg(d.servCount).slice(0,7),false);
  bar('c_peca',agg(d.pecaCount).slice(0,7),false);
  bar('c_cli',agg(d.cliRec).slice(0,7),true);
}
