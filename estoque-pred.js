/* ============================================================
   Vizio Motors — estoque-pred.js (Fase 5 · Gestão)
   Estoque Inteligente/Preditivo: consumo médio, cobertura em dias,
   sugestão de compra, ordem de compra, curva ABC, peças paradas + CRUD.
   Depende de app.js (WORK, money, prt, modal, closeModal, toast, uid,
   fmtFull, today, byId).
   ============================================================ */
const JANELA_DIAS = 30;
const COBERTURA_ALVO = 30;
const ALERTA_DIAS = 15;

function estoqueAnalise(){
  const usado={};
  WORK.os.forEach(o=>(o.itens||[]).forEach(i=>{ if(i.tipo==='peca') usado[i.refId]=(usado[i.refId]||0)+(i.qtd||1); }));
  const rows=WORK.pecas.map(p=>{
    const consumo=usado[p.id]||0;
    const diaria=consumo/JANELA_DIAS;
    const dias=diaria>0 ? Math.floor(p.estoque/diaria) : Infinity;
    const baixo=p.estoque<p.minimo;
    const sugerir = baixo || (dias!==Infinity && dias<ALERTA_DIAS);
    const compra = sugerir ? Math.max(0, Math.ceil(Math.max(p.minimo*2, diaria*COBERTURA_ALVO)) - p.estoque) : 0;
    const valorGiro=(p.preco||0)*consumo;
    return {p,consumo,diaria,dias,baixo,sugerir,compra,valorGiro};
  });
  const tot=rows.reduce((s,r)=>s+r.valorGiro,0)||1;
  const ord=rows.slice().sort((a,b)=>b.valorGiro-a.valorGiro);
  let acc=0; ord.forEach(r=>{ acc+=r.valorGiro; const pc=acc/tot; r.abc = pc<=0.8?'A':(pc<=0.95?'B':'C'); });
  return rows;
}

function relEstoque_pdf(){
  if(typeof relatorioPDF!=='function')return;
  const R=estoqueAnalise();
  const compras=R.filter(r=>r.compra>0).sort((a,b)=>a.dias-b.dias);
  const criticas=R.filter(r=>r.baixo);
  const paradas=R.filter(r=>r.consumo===0);
  const custoCompra=compras.reduce((s,r)=>s+r.compra*(r.p.custo||0),0);
  const money2=v=>"R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
  const kpis=[['Peças cadastradas',R.length],['Sugestões de compra',compras.length],['Peças críticas',criticas.length],['Paradas',paradas.length],['Custo da compra sugerida',money2(custoCompra)]];
  const corpo=RP.kpis(kpis)+
    RP.sec('Sugestão de compra')+RP.table(['Peça','Fornecedor','Estoque','Comprar','Custo'],compras.map(r=>[r.p.nome,r.p.fornecedor||'—',String(r.p.estoque),String(r.compra),money2(r.compra*(r.p.custo||0))]))+
    RP.sec('Peças críticas (abaixo do mínimo)')+RP.table(['Peça','Estoque','Mínimo'],criticas.map(r=>[r.p.nome,String(r.p.estoque),String(r.p.minimo)]))+
    RP.sec('Estoque completo (curva ABC)')+RP.table(['Peça','ABC','Estoque','Mín.','Consumo'],R.map(r=>[r.p.nome,r.abc||'—',String(r.p.estoque),String(r.p.minimo),String(r.consumo)]));
  relatorioPDF({titulo:'Relatório de Estoque',subtitulo:'Análise preditiva, curva ABC e compra sugerida',corpo:corpo});
}
window.relEstoque_pdf=relEstoque_pdf;

function abrirEstoquePred(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Estoque Inteligente";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderEstoquePred();
}

function renderEstoquePred(q){
  q=(q||'').toLowerCase();
  let R=estoqueAnalise();
  const compras=R.filter(r=>r.compra>0).sort((a,b)=>a.dias-b.dias);
  const paradas=R.filter(r=>r.consumo===0);
  const custoCompra=compras.reduce((s,r)=>s+r.compra*(r.p.custo||0),0);
  if(q)R=R.filter(r=>r.p.nome.toLowerCase().includes(q));
  R.sort((a,b)=>a.dias-b.dias);
  const abcBadge=a=>`<span class="badge ${a==='A'?'s7':(a==='B'?'s1':'s0')}">${a}</span>`;
  const diasFmt=d=>d===Infinity?'—':(d+'d');

  const kpis=[
    ['Sugestões de compra',compras.length],
    ['Investimento sugerido',money(custoCompra)],
    ['Abaixo do mínimo',R.filter(r=>r.baixo).length],
    ['Peças paradas',paradas.length],
  ];
  document.getElementById('view').innerHTML=`
   <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>

   <div class="panel"><div class="head"><h3>🛒 Sugestão automática de compra <span class="torque-badge">IA · PREDITIVO</span></h3></div>
     ${compras.length?`<table class="tbl"><thead><tr><th>Peça</th><th>Estoque</th><th>Cobertura</th><th>Comprar</th><th>Custo est.</th><th>Fornecedor</th></tr></thead>
       <tbody>${compras.map(r=>`<tr><td><b>${r.p.nome}</b></td>
         <td style="color:var(--bad)">${r.p.estoque}</td><td style="color:${r.dias<ALERTA_DIAS?'var(--bad)':'var(--txt)'}">${diasFmt(r.dias)}</td>
         <td style="color:var(--gold-2);font-weight:600">+${r.compra}</td><td>${money(r.compra*(r.p.custo||0))}</td>
         <td style="color:var(--muted)">${r.p.fornecedor}</td></tr>`).join('')}</tbody></table>
       <div style="text-align:right;margin-top:10px"><button class="b" onclick="gerarOrdemCompra()">Gerar ordem de compra</button></div>`
       :'<div style="color:var(--muted);font-size:13px">Nenhuma reposição necessária no momento. 👍</div>'}
   </div>

   <div class="panel"><div class="head"><h3>📦 Estoque completo</h3><div class="sp"></div>
       <input class="search" style="width:170px" placeholder="Buscar peça…" oninput="renderEstoquePred(this.value)">
       <button class="b b-ghost b-sm" onclick="relEstoque_pdf()">📄 Relatório</button>
       <button class="b b-sm" onclick="novaPeca()">+ Nova peça</button></div>
     <table class="tbl"><thead><tr><th>Peça</th><th>ABC</th><th style="text-align:center">Estoque</th><th style="text-align:center">Mín.</th><th style="text-align:center">Consumo/mês</th><th style="text-align:center">Cobertura</th><th style="text-align:right">Preço</th><th></th></tr></thead>
     <tbody>${R.map(r=>`<tr><td><b>${r.p.nome}</b>${r.consumo===0?' <span style="color:var(--muted);font-size:11px">(parada)</span>':''}</td>
       <td>${abcBadge(r.abc)}</td>
       <td style="text-align:center;color:${r.baixo?'var(--bad)':'var(--txt)'};font-weight:600">${r.p.estoque}</td>
       <td style="text-align:center;color:var(--muted)">${r.p.minimo}</td>
       <td style="text-align:center">${r.consumo}</td>
       <td style="text-align:center;color:${r.dias!==Infinity&&r.dias<ALERTA_DIAS?'var(--bad)':'var(--txt)'}">${diasFmt(r.dias)}</td>
       <td style="text-align:right;color:var(--gold-2)">${money(r.p.preco)}</td>
       <td style="text-align:right"><button class="b b-ghost b-sm" onclick="editPeca('${r.p.id}')">Editar</button></td></tr>`).join('')}</tbody></table>
     <div style="font-size:11.5px;color:var(--dim);margin-top:10px">Curva ABC por valor de giro (A = itens que mais movimentam receita). Cobertura = dias de estoque no ritmo atual. Janela: ${JANELA_DIAS} dias.</div>
   </div>

   ${paradas.length?`<div class="panel"><h3>🐌 Peças paradas (sem saída na janela)</h3>
     ${paradas.map(r=>`<div class="info-line"><span class="k">${r.p.nome}</span><span style="color:var(--muted)">${r.p.estoque} un · ${money((r.p.custo||0)*r.p.estoque)} parado</span></div>`).join('')}
     <div style="font-size:11.5px;color:var(--dim);margin-top:8px">Considere promoção/combo para girar esse capital.</div></div>`:''}`;
}

function novaPeca(id){ const p=id?byId(WORK.pecas,id):{}; const ed=!!p.id;
  modal(ed?"Editar peça":"Nova peça","",`
    <label>Nome</label><input id="pc_nome" value="${p.nome||''}">
    <div class="frow"><div><label>Custo (R$)</label><input id="pc_custo" type="number" step="0.01" value="${p.custo||0}"></div>
    <div><label>Preço (R$)</label><input id="pc_preco" type="number" step="0.01" value="${p.preco||0}"></div></div>
    <div class="frow"><div><label>Estoque</label><input id="pc_est" type="number" value="${p.estoque||0}"></div>
    <div><label>Mínimo</label><input id="pc_min" type="number" value="${p.minimo||0}"></div></div>
    <label>Fornecedor</label><input id="pc_forn" value="${p.fornecedor||''}">`,
   ()=>{const o={nome:document.getElementById('pc_nome').value,custo:+document.getElementById('pc_custo').value||0,
     preco:+document.getElementById('pc_preco').value||0,estoque:+document.getElementById('pc_est').value||0,
     minimo:+document.getElementById('pc_min').value||0,fornecedor:document.getElementById('pc_forn').value};
     if(!o.nome){toast('Informe o nome');return;}
     if(ed)Object.assign(p,o);else WORK.pecas.push({id:uid('P'),...o});
     closeModal();renderEstoquePred();});
}
function editPeca(id){ novaPeca(id); }

function gerarOrdemCompra(){
  const R=estoqueAnalise().filter(r=>r.compra>0);
  if(!R.length){ toast('Nenhuma compra necessária'); return; }
  const forn={}; R.forEach(r=>{ const k=r.p.fornecedor||'—'; (forn[k]=forn[k]||[]).push(r); });
  let total=0;
  const blocos=Object.keys(forn).map(f=>{
    const items=forn[f];
    const linhas=items.map(r=>{ const sub=(r.p.custo||0)*r.compra; total+=sub;
      return `<tr><td>${r.p.nome}</td><td class="ct">${r.compra}</td><td class="rt">${money(r.p.custo||0)}</td><td class="rt">${money(sub)}</td></tr>`;}).join('');
    const st=items.reduce((s,r)=>s+(r.p.custo||0)*r.compra,0);
    return `<h3 style="margin:18px 0 4px">${f}</h3><table><thead><tr><th>Peça</th><th class="ct">Qtd</th><th class="rt">Custo un.</th><th class="rt">Subtotal</th></tr></thead>
      <tbody>${linhas}<tr><td colspan="3" class="rt"><b>Subtotal</b></td><td class="rt"><b>${money(st)}</b></td></tr></tbody></table>`;
  }).join('');
  const w=window.open('','_blank');
  w.document.write(`<html><head><meta charset="utf-8"><title>Ordem de Compra</title><style>
   body{font-family:Arial,sans-serif;color:#111;padding:32px;max-width:740px;margin:auto}
   h1{font-size:20px;border-bottom:3px solid #111;padding-bottom:8px}h3{font-size:15px}
   table{width:100%;border-collapse:collapse;margin-top:6px}th,td{border-bottom:1px solid #ddd;padding:7px;font-size:13px}
   th{text-align:left;background:#f3f3f3}.ct{text-align:center}.rt{text-align:right}
   .tot{text-align:right;font-size:19px;font-weight:bold;margin-top:16px}
   @media print{button{display:none}}</style></head><body>
   <h1>Ordem de Compra — Vizio Motors</h1>
   <div style="color:#666;font-size:12px">Gerada em ${fmtFull(today())} · sugestão preditiva de reposição</div>
   ${blocos}<div class="tot">Total geral: ${money(total)}</div>
   <script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();
  toast('Ordem de compra gerada ✓');
}
