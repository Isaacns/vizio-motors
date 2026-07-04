/* ============================================================
   Vizio Motors — estoque-pred.js (Fase 5 · Gestão)
   Estoque Inteligente/Preditivo: consumo médio, cobertura em dias,
   sugestão de compra, curva ABC, peças paradas.
   Derivado de WORK.pecas + WORK.os (sem armazenamento novo).
   Depende de app.js (WORK, money, prt).
   ============================================================ */
const JANELA_DIAS = 30;      // janela de consumo considerada
const COBERTURA_ALVO = 30;   // dias de estoque desejados
const ALERTA_DIAS = 15;      // abaixo disso, sugerir compra

function estoqueAnalise(){
  const usado={};
  WORK.os.forEach(o=>(o.itens||[]).forEach(i=>{ if(i.tipo==='peca') usado[i.refId]=(usado[i.refId]||0)+ (i.qtd||1); }));
  const rows=WORK.pecas.map(p=>{
    const consumo=usado[p.id]||0;                 // consumo na janela
    const diaria=consumo/JANELA_DIAS;
    const dias=diaria>0 ? Math.floor(p.estoque/diaria) : Infinity;
    const baixo=p.estoque<p.minimo;
    const sugerir = baixo || (dias!==Infinity && dias<ALERTA_DIAS);
    const compra = sugerir ? Math.max(0, Math.ceil(Math.max(p.minimo*2, diaria*COBERTURA_ALVO)) - p.estoque) : 0;
    const valorGiro=(p.preco||0)*consumo;
    return {p,consumo,diaria,dias,baixo,sugerir,compra,valorGiro};
  });
  // curva ABC por valor de giro
  const tot=rows.reduce((s,r)=>s+r.valorGiro,0)||1;
  const ord=rows.slice().sort((a,b)=>b.valorGiro-a.valorGiro);
  let acc=0; ord.forEach(r=>{ acc+=r.valorGiro; const pc=acc/tot; r.abc = pc<=0.8?'A':(pc<=0.95?'B':'C'); });
  return rows;
}

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
       <div style="text-align:right;margin-top:10px"><button class="b" onclick="toast('Ordem de compra gerada (mock) — integrará com fornecedores')">Gerar ordem de compra</button></div>`
       :'<div style="color:var(--muted);font-size:13px">Nenhuma reposição necessária no momento. 👍</div>'}
   </div>

   <div class="panel"><div class="head"><h3>📦 Estoque completo</h3><div class="sp"></div>
       <input class="search" style="width:180px" placeholder="Buscar peça…" oninput="renderEstoquePred(this.value)"></div>
     <table class="tbl"><thead><tr><th>Peça</th><th>ABC</th><th style="text-align:center">Estoque</th><th style="text-align:center">Mín.</th><th style="text-align:center">Consumo/mês</th><th style="text-align:center">Cobertura</th><th style="text-align:right">Preço</th></tr></thead>
     <tbody>${R.map(r=>`<tr><td><b>${r.p.nome}</b>${r.consumo===0?' <span style="color:var(--muted);font-size:11px">(parada)</span>':''}</td>
       <td>${abcBadge(r.abc)}</td>
       <td style="text-align:center;color:${r.baixo?'var(--bad)':'var(--txt)'};font-weight:600">${r.p.estoque}</td>
       <td style="text-align:center;color:var(--muted)">${r.p.minimo}</td>
       <td style="text-align:center">${r.consumo}</td>
       <td style="text-align:center;color:${r.dias!==Infinity&&r.dias<ALERTA_DIAS?'var(--bad)':'var(--txt)'}">${diasFmt(r.dias)}</td>
       <td style="text-align:right;color:var(--gold-2)">${money(r.p.preco)}</td></tr>`).join('')}</tbody></table>
     <div style="font-size:11.5px;color:#6d6552;margin-top:10px">Curva ABC por valor de giro (A = itens que mais movimentam receita). Cobertura = dias de estoque no ritmo de consumo atual. Janela: ${JANELA_DIAS} dias.</div>
   </div>

   ${paradas.length?`<div class="panel"><h3>🐌 Peças paradas (sem saída na janela)</h3>
     ${paradas.map(r=>`<div class="info-line"><span class="k">${r.p.nome}</span><span style="color:var(--muted)">${r.p.estoque} un · ${money((r.p.custo||0)*r.p.estoque)} parado</span></div>`).join('')}
     <div style="font-size:11.5px;color:#6d6552;margin-top:8px">Considere promoção/combo para girar esse capital.</div></div>`:''}`;
}
