/* ============================================================
   Vizio Motors — dashboard.js (Fase 6 · Inteligência)
   Dashboard Executivo: KPIs clicáveis (drill-down) + gráficos.
   Paleta multi-hue, layout reestruturado. Usa Chart.js.
   Depende de app.js (WORK, money, cli, veh, svc, prt, osTotal,
   STATUS_FLOW, modal, closeModal).
   ============================================================ */
let _dashCharts=[];
function dashDestroy(){ _dashCharts.forEach(c=>{try{c.destroy();}catch(e){}}); _dashCharts=[]; }
const PALETTE=['#f6d16a','#5aa0ff','#4ecb8f','#f0894e','#b78bff','#39c5c5','#e5647e','#c6a44a'];

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

  const recServ={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;recServ[n]=(recServ[n]||0)+i.valor;}}));
  const porStatus=STATUS_FLOW.map((s,idx)=>os.filter(o=>o.statusIdx===idx).length);
  const mec={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];mec[m]=(mec[m]||0)+osTotal(o);});
  const servCount={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='servico'){const n=svc(i.refId).nome||i.refId;servCount[n]=(servCount[n]||0)+i.qtd;}}));
  const pecaCount={}; os.forEach(o=>(o.itens||[]).forEach(i=>{if(i.tipo==='peca'){const n=prt(i.refId).nome||i.refId;pecaCount[n]=(pecaCount[n]||0)+i.qtd;}}));
  const cliRec={}; os.forEach(o=>{const n=cli(o.clienteId).nome||o.clienteId;cliRec[n]=(cliRec[n]||0)+osTotal(o);});

  // KPIs clicáveis (drill)
  const kpis=[
    ['Faturamento aprovado',money(fat),'faturamento','#f6d16a'],
    ['OS abertas',os.filter(o=>o.statusIdx<8).length,'abertas','#5aa0ff'],
    ['OS concluídas',os.filter(o=>o.statusIdx>=7).length,'concluidas','#4ecb8f'],
    ['Ticket médio',money(ticket),'ticket','#b78bff'],
    ['Clientes ativos',WORK.clientes.length,'clientes','#39c5c5'],
    ['Estoque crítico',critico,'estoque','#e5647e'],
  ];
  document.getElementById('view').innerHTML=`
   <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Clique em qualquer indicador para ver os detalhes.</div>
   <div class="kpis">${kpis.map(k=>`<div class="kpi" style="cursor:pointer;border-left:3px solid ${k[3]}" onclick="dashDrill('${k[2]}')">
       <div class="lbl">${k[0]}</div><div class="val">${k[1]}</div><div class="dt" style="color:${k[3]};font-size:11px">ver detalhes →</div></div>`).join('')}</div>

   <div class="panel"><h3>💰 Receita por serviço</h3><canvas id="c_recserv" height="150"></canvas></div>

   <div class="grid2">
     <div class="panel"><h3>🔧 OS por status</h3><canvas id="c_status" height="200"></canvas></div>
     <div class="panel"><h3>🏅 Ranking de mecânicos (receita)</h3><canvas id="c_mec" height="200"></canvas></div>
   </div>
   <div class="grid2">
     <div class="panel"><h3>⭐ Serviços mais solicitados</h3><canvas id="c_serv" height="180"></canvas></div>
     <div class="panel"><h3>📦 Peças mais usadas</h3><canvas id="c_peca" height="180"></canvas></div>
   </div>
   <div class="panel"><h3>👥 Clientes por receita</h3><canvas id="c_cli" height="150"></canvas></div>`;
  drawDash({recServ,porStatus,mec,servCount,pecaCount,cliRec});
}

function drawDash(d){
  if(typeof Chart==="undefined")return;
  dashDestroy();
  const grid='rgba(255,255,255,.05)', tick='#9a927f';
  const el=id=>{const e=document.getElementById(id);return e&&e.getContext?e.getContext('2d'):null;};
  const baseOpts=(money)=>({plugins:{legend:{display:false}},
    scales:{y:{ticks:{color:tick,callback:v=>money?'R$ '+(v/1000)+'k':v},grid:{color:grid}},x:{ticks:{color:tick,font:{size:10}},grid:{display:false}}}});
  function bar(id,pairs,money,color){const c=el(id);if(!c)return;
    _dashCharts.push(new Chart(c,{type:'bar',data:{labels:pairs.map(p=>p[0]),
      datasets:[{data:pairs.map(p=>p[1]),backgroundColor:color||pairs.map((p,i)=>PALETTE[i%PALETTE.length]),borderRadius:7,borderSkipped:false}]},options:baseOpts(money)}));}
  bar('c_recserv',agg(d.recServ).slice(0,7),true);
  const cs=el('c_status');
  if(cs)_dashCharts.push(new Chart(cs,{type:'doughnut',
    data:{labels:STATUS_FLOW,datasets:[{data:d.porStatus,backgroundColor:['#5aa0ff','#f0b23c','#f0894e','#f6d16a','#c6a44a','#b78bff','#39c5c5','#4ecb8f','#2fa373'],borderWidth:0}]},
    options:{plugins:{legend:{position:'right',labels:{color:tick,font:{size:10},boxWidth:12}}}}}));
  bar('c_mec',agg(d.mec),true,PALETTE);
  bar('c_serv',agg(d.servCount).slice(0,7),false,'#5aa0ff');
  bar('c_peca',agg(d.pecaCount).slice(0,7),false,'#4ecb8f');
  bar('c_cli',agg(d.cliRec).slice(0,7),true,'#39c5c5');
}

/* drill-down: lista os registros por trás do indicador */
function dashDrill(tipo){
  const os=WORK.os; let titulo="", head="", rows="";
  const osRow=o=>{const v=veh(o.veiculoId);return `<tr><td>#${o.numero}</td><td><span class="plate">${v.placa||''}</span></td><td>${cli(o.clienteId).nome||''}</td><td><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></td><td style="text-align:right;color:var(--gold-2)">${money(osTotal(o))}</td></tr>`;};
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
      return `<tr><td><b>${c.nome}</b></td><td style="color:var(--muted)">${c.tel||''}</td><td>${vs}</td><td style="text-align:right">${n}</td></tr>`;}).join('');
  } else if(tipo==='estoque'){
    titulo="Peças abaixo do mínimo";
    head="<tr><th>Peça</th><th>Fornecedor</th><th style='text-align:center'>Estoque</th><th style='text-align:center'>Mínimo</th></tr>";
    const cr=WORK.pecas.filter(p=>p.estoque<p.minimo);
    rows=cr.map(p=>`<tr><td><b>${p.nome}</b></td><td style="color:var(--muted)">${p.fornecedor}</td><td style="text-align:center;color:var(--bad)">${p.estoque}</td><td style="text-align:center">${p.minimo}</td></tr>`).join('')||'<tr><td colspan="4" style="color:var(--muted)">Estoque saudável.</td></tr>';
  }
  modal(titulo,"Detalhe do indicador",`<div style="max-height:52vh;overflow:auto"><table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`, ()=>closeModal());
  const b=document.getElementById('mSave'); if(b)b.textContent="Fechar";
}
