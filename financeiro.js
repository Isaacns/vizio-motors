/* ============================================================
   Vizio Motors — financeiro.js (Fase 3 · Gestão)
   Módulo Financeiro: caixa, a receber/pagar, extrato, DRE.
   Depende de: dados.js (DADOS/STATUS_FLOW) e app.js
   (WORK, money, byId, cli, veh, osTotal, modal, closeModal,
   toast, today, uid). Carregado DEPOIS de app.js.
   ============================================================ */

/* semente de lançamentos (injeta no estado de sessão) */
const SEED_FIN = [
  {id:"F1", data:"2026-07-01", tipo:"receita", cat:"Serviços", desc:"OS #1039 — Revisão 40k (entregue)", valor:1180, forma:"PIX", status:"pago"},
  {id:"F2", data:"2026-07-02", tipo:"receita", cat:"Serviços", desc:"OS #1041 — Troca de óleo frota", valor:960, forma:"Cartão", status:"pago"},
  {id:"F3", data:"2026-07-02", tipo:"despesa", cat:"Fornecedores", desc:"DieselParts — reposição de peças", valor:2300, forma:"Boleto", status:"pago"},
  {id:"F4", data:"2026-07-03", tipo:"despesa", cat:"Energia", desc:"Conta de energia (galpão)", valor:640, forma:"Boleto", status:"pago"},
  {id:"F5", data:"2026-07-05", tipo:"despesa", cat:"Aluguel", desc:"Aluguel do galpão", valor:3800, forma:"Boleto", status:"pendente"},
  {id:"F6", data:"2026-07-05", tipo:"despesa", cat:"Salários", desc:"Folha da equipe (2 mecânicos + recepção)", valor:9800, forma:"PIX", status:"pendente"},
  {id:"F7", data:"2026-07-06", tipo:"despesa", cat:"Fornecedores", desc:"FrenaBR — discos e pastilhas", valor:900, forma:"Cartão", status:"pendente"},
  {id:"F8", data:"2026-07-01", tipo:"receita", cat:"Peças", desc:"Venda de peças no balcão", valor:540, forma:"PIX", status:"pago"}
];

const CATS_REC = ["Serviços","Peças","Outros"];
const CATS_DES = ["Fornecedores","Aluguel","Salários","Energia","Impostos","Marketing","Outros"];
const curMonth = () => (typeof today==="function"?today():new Date().toISOString().slice(0,10)).slice(0,7);

function finList(){ if(!WORK.financeiro) WORK.financeiro = JSON.parse(JSON.stringify(SEED_FIN)); return WORK.financeiro; }
const brl = v => "R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

/* gera recebíveis (pendentes) a partir de OS aprovadas ainda não lançadas */
function gerarRecebiveis(){
  const fin=finList(); let n=0;
  WORK.os.filter(o=>o.aprovado).forEach(o=>{
    if(!fin.some(f=>f.osId===o.id)){
      const v=veh(o.veiculoId);
      fin.push({id:uid('F'),data:o.previsao||o.entrada||curMonth()+"-01",tipo:"receita",cat:"Serviços",
        desc:`OS #${o.numero} — ${v.placa||''}`,valor:osTotal(o),forma:"—",
        status:o.statusIdx>=8?"pendente":"pendente",osId:o.id});
      n++;
    }
  });
  toast(n?`${n} recebível(is) gerado(s) das OS`:"Nenhuma OS nova para gerar");
  renderFinanceiro();
}

/* abre o módulo sem depender do mapa de rotas do app.js */
function abrirFin(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Financeiro";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderFinanceiro();
}

function finKPIs(){
  const f=finList(), m=curMonth();
  const sum=(arr)=>arr.reduce((s,x)=>s+(x.valor||0),0);
  const recPago=sum(f.filter(x=>x.tipo==="receita"&&x.status==="pago"));
  const desPago=sum(f.filter(x=>x.tipo==="despesa"&&x.status==="pago"));
  const aReceber=sum(f.filter(x=>x.tipo==="receita"&&x.status==="pendente"));
  const aPagar=sum(f.filter(x=>x.tipo==="despesa"&&x.status==="pendente"));
  const recMes=sum(f.filter(x=>x.tipo==="receita"&&(x.data||'').slice(0,7)===m));
  const desMes=sum(f.filter(x=>x.tipo==="despesa"&&(x.data||'').slice(0,7)===m));
  const lucro=recMes-desMes, margem=recMes?lucro/recMes*100:0;
  return {saldo:recPago-desPago,aReceber,aPagar,recMes,desMes,lucro,margem,recPago,desPago};
}

function renderFinanceiro(){
  const f=finList(), k=finKPIs();
  const receber=f.filter(x=>x.tipo==="receita"&&x.status==="pendente");
  const pagar=f.filter(x=>x.tipo==="despesa"&&x.status==="pendente");
  const extrato=f.slice().sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  const kpis=[
    ['Saldo em caixa',brl(k.saldo),k.saldo>=0?'up':'down','recebido − pago'],
    ['A receber',brl(k.aReceber),'up',receber.length+' lançamento(s)'],
    ['A pagar',brl(k.aPagar),'down',pagar.length+' conta(s)'],
    ['Receita (mês)',brl(k.recMes),'up','entradas do mês'],
    ['Despesa (mês)',brl(k.desMes),'down','saídas do mês'],
    ['Resultado (mês)',brl(k.lucro),k.lucro>=0?'up':'down','margem '+k.margem.toFixed(1)+'%'],
  ];
  /* DRE por categoria */
  const porCat=(tipo,cats)=>cats.map(c=>[c,f.filter(x=>x.tipo===tipo&&x.cat===c&&(x.data||'').slice(0,7)===curMonth()).reduce((s,x)=>s+x.valor,0)]).filter(r=>r[1]>0);
  const recCats=porCat("receita",CATS_REC), desCats=porCat("despesa",CATS_DES);

  document.getElementById('view').innerHTML=`
   <div class="kpis">${kpis.map(x=>`<div class="kpi"><div class="lbl">${x[0]}</div><div class="val">${x[1]}</div><div class="dt ${x[2]}">${x[3]}</div></div>`).join('')}</div>

   <div class="grid2">
     <div class="panel"><div class="head"><h3>💳 Fluxo do mês</h3><div class="sp"></div>
        <button class="b b-ghost b-sm" onclick="gerarRecebiveis()">Gerar recebíveis das OS</button>
        <button class="b b-sm" onclick="novoLanc()">+ Lançamento</button></div>
        <canvas id="finChart" height="150"></canvas>
     </div>
     <div class="panel"><h3>📋 DRE simplificado <span class="torque-badge">MÊS ATUAL</span></h3>
        ${recCats.map(r=>`<div class="info-line"><span class="k">＋ ${r[0]}</span><span style="color:var(--ok)">${brl(r[1])}</span></div>`).join('')||'<div class="info-line"><span class="k">Receitas</span><span>—</span></div>'}
        <div class="info-line"><span class="k" style="color:var(--txt);font-weight:600">Receita bruta</span><span style="color:var(--ok);font-weight:600">${brl(k.recMes)}</span></div>
        ${desCats.map(r=>`<div class="info-line"><span class="k">－ ${r[0]}</span><span style="color:var(--bad)">${brl(r[1])}</span></div>`).join('')}
        <div class="info-line"><span class="k" style="color:var(--txt);font-weight:600">Total de despesas</span><span style="color:var(--bad);font-weight:600">${brl(k.desMes)}</span></div>
        <div class="tot"><div>Resultado do mês</div><div class="v" style="color:${k.lucro>=0?'var(--ok)':'var(--bad)'}">${brl(k.lucro)}</div></div>
     </div>
   </div>

   <div class="grid2">
     <div class="panel"><h3>⬇ Contas a receber</h3>
       ${receber.length?`<table class="tbl"><tbody>${receber.map(x=>`<tr><td>${x.desc}</td><td style="color:var(--muted)">${finD(x.data)}</td>
         <td style="text-align:right;color:var(--ok);font-weight:600">${brl(x.valor)}</td>
         <td style="text-align:right"><button class="b b-sm" onclick="marcarPago('${x.id}')">Receber</button></td></tr>`).join('')}</tbody></table>`
         :'<div style="color:var(--muted);font-size:13px">Nada a receber. Use “Gerar recebíveis das OS”.</div>'}
     </div>
     <div class="panel"><h3>⬆ Contas a pagar</h3>
       ${pagar.length?`<table class="tbl"><tbody>${pagar.map(x=>`<tr><td>${x.desc}<br><span style="color:var(--muted);font-size:11px">${x.cat}</span></td>
         <td style="color:var(--muted)">${finD(x.data)}</td><td style="text-align:right;color:var(--bad);font-weight:600">${brl(x.valor)}</td>
         <td style="text-align:right"><button class="b b-danger b-sm" onclick="marcarPago('${x.id}')">Pagar</button></td></tr>`).join('')}</tbody></table>`
         :'<div style="color:var(--muted);font-size:13px">Nenhuma conta pendente.</div>'}
     </div>
   </div>

   <div class="panel"><div class="head"><h3>🧾 Extrato</h3><div class="sp"></div><button class="b b-sm" onclick="novoLanc()">+ Lançamento</button></div>
     <table class="tbl"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Status</th><th style="text-align:right">Valor</th></tr></thead>
     <tbody>${extrato.map(x=>`<tr><td>${finD(x.data)}</td><td>${x.desc}</td><td style="color:var(--muted)">${x.cat}</td>
       <td style="color:var(--muted)">${x.forma||'—'}</td>
       <td><span class="badge ${x.status==='pago'?'s7':'s1'}">${x.status}</span></td>
       <td style="text-align:right;font-weight:600;color:${x.tipo==='receita'?'var(--ok)':'var(--bad)'}">${x.tipo==='receita'?'+':'−'} ${brl(x.valor)}</td></tr>`).join('')}</tbody></table>
   </div>`;

  drawFinChart(k);
}
function finD(d){if(!d)return'—';const p=d.split('-');return `${p[2]}/${p[1]}`;}

let _finChart=null;
function drawFinChart(k){
  if(typeof Chart==="undefined")return;               // guard (browser only)
  const el=document.getElementById('finChart'); if(!el||!el.getContext)return;
  if(_finChart)_finChart.destroy();
  _finChart=new Chart(el.getContext('2d'),{
    type:'bar',
    data:{labels:['Recebido','A receber','Pago','A pagar'],
      datasets:[{data:[k.recPago,k.aReceber,k.desPago,k.aPagar],
        backgroundColor:['#4ecb8f','rgba(78,203,143,.4)','#e5644e','rgba(229,100,78,.4)'],
        borderRadius:8,borderSkipped:false}]},
    options:{plugins:{legend:{display:false}},
      scales:{y:{ticks:{color:'#9a927f',callback:v=>'R$ '+(v/1000)+'k'},grid:{color:'rgba(255,255,255,.05)'}},
              x:{ticks:{color:'#c9c0aa'},grid:{display:false}}}}
  });
}

/* CRUD */
function novoLanc(){
  modal("Novo lançamento","Entrada ou saída no caixa",`
    <div class="frow"><div><label>Tipo</label><select id="l_tipo" onchange="lancCats()"><option value="receita">Receita (entrada)</option><option value="despesa">Despesa (saída)</option></select></div>
    <div><label>Categoria</label><select id="l_cat"></select></div></div>
    <label>Descrição</label><input id="l_desc" placeholder="Ex.: OS #1050 — freios">
    <div class="frow"><div><label>Valor (R$)</label><input id="l_valor" type="number" step="0.01" value="0"></div>
    <div><label>Data</label><input id="l_data" type="date" value="${typeof today==='function'?today():''}"></div></div>
    <div class="frow"><div><label>Forma</label><select id="l_forma"><option>PIX</option><option>Cartão</option><option>Boleto</option><option>Dinheiro</option><option>—</option></select></div>
    <div><label>Status</label><select id="l_status"><option value="pago">Pago/Recebido</option><option value="pendente">Pendente</option></select></div></div>`,
   ()=>{const v=+document.getElementById('l_valor').value||0;
     if(v<=0){toast('Informe um valor');return;}
     finList().push({id:uid('F'),data:document.getElementById('l_data').value,tipo:document.getElementById('l_tipo').value,
       cat:document.getElementById('l_cat').value,desc:document.getElementById('l_desc').value||'Lançamento',
       valor:v,forma:document.getElementById('l_forma').value,status:document.getElementById('l_status').value});
     closeModal();renderFinanceiro();});
  lancCats();
}
function lancCats(){const t=document.getElementById('l_tipo').value;
  document.getElementById('l_cat').innerHTML=(t==='receita'?CATS_REC:CATS_DES).map(c=>`<option>${c}</option>`).join('');}
function marcarPago(id){const x=byId(finList(),id); if(x&&x.id){x.status='pago'; if(x.forma==='—')x.forma='PIX';} renderFinanceiro();}
