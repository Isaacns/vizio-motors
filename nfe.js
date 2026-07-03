/* ============================================================
   Vizio Motors — nfe.js (Fase 5 · Gestão)
   Nota Fiscal: emissão a partir da OS, DANFE/XML (mock), status.
   Depende de app.js (WORK, money, cli, veh, byId, osTotal, modal,
   closeModal, toast, today, fmtFull, uid, svc, prt).
   OBS: emissão REAL exige provedor (Focus NF-e / PlugNotas / SEFAZ).
   Aqui a emissão é simulada para o piloto.
   ============================================================ */
function nfList(){ if(!WORK.notas)WORK.notas=[]; return WORK.notas; }

function abrirNFe(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Nota Fiscal (NF-e)";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderNFe();
}

function chaveFake(){ let s=""; for(let i=0;i<44;i++)s+=Math.floor(Math.random()*10); return s; }
function proxNumNF(){ return Math.max(0,...nfList().map(n=>n.numero||0))+1; }

function renderNFe(){
  const notas=nfList().slice().sort((a,b)=>(b.data+''+b.numero).localeCompare(a.data+''+a.numero));
  const emitidas=notas.filter(n=>n.status==='emitida');
  const valEmit=emitidas.reduce((s,n)=>s+(n.valor||0),0);
  const canc=notas.filter(n=>n.status==='cancelada').length;
  const semNota=WORK.os.filter(o=>o.aprovado && !nfList().some(n=>n.osId===o.id && n.status==='emitida'));

  const kpis=[
    ['Notas emitidas',emitidas.length],['Valor emitido',money(valEmit)],
    ['Canceladas',canc],['OS a emitir',semNota.length],
  ];
  document.getElementById('view').innerHTML=`
   <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>

   <div class="panel"><div class="head"><h3>🧾 Notas fiscais</h3><div class="sp"></div>
       <button class="b" onclick="emitirNF()">+ Emitir NF-e</button></div>
     ${notas.length?`<table class="tbl"><thead><tr><th>Número</th><th>Cliente</th><th>Data</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
       <tbody>${notas.map(n=>`<tr><td><b>${n.numero}</b>/<span style="color:var(--muted)">${n.serie||1}</span></td>
         <td>${n.cliente}</td><td>${fmtFull(n.data)}</td><td style="color:var(--gold-2)">${money(n.valor)}</td>
         <td><span class="badge ${n.status==='emitida'?'s7':'s0'}" style="${n.status==='cancelada'?'background:rgba(229,100,78,.15);color:var(--bad)':''}">${n.status}</span></td>
         <td><button class="b b-ghost b-sm" onclick="verDANFE('${n.id}')">DANFE</button>
             <button class="b b-ghost b-sm" onclick="baixarXML('${n.id}')">XML</button>
             ${n.status==='emitida'?`<button class="b b-danger b-sm" onclick="cancelarNF('${n.id}')">Cancelar</button>`:''}</td></tr>`).join('')}</tbody></table>`
       :'<div style="color:var(--muted);font-size:13px">Nenhuma nota emitida. Emita a partir de uma OS aprovada.</div>'}
   </div>

   <div class="panel"><h3>📋 OS aprovadas prontas para emitir</h3>
     ${semNota.length?semNota.map(o=>{const v=veh(o.veiculoId);return `<div class="veh"><div class="plate">${v.placa||''}</div>
       <div class="info"><div class="t">OS #${o.numero} · ${cli(o.clienteId).nome||''}</div>
       <div class="s">${money(osTotal(o))} · ${v.modelo||''}</div></div>
       <button class="b b-sm" onclick="emitirNF('${o.id}')">Emitir</button></div>`;}).join('')
       :'<div style="color:var(--muted);font-size:13px">Todas as OS aprovadas já têm nota.</div>'}
   </div>

   <div style="font-size:11.5px;color:#6d6552;text-align:center;margin-top:6px">
     Emissão simulada (piloto). Integração fiscal real via provedor (Focus NF-e / PlugNotas) entra na configuração da oficina.</div>`;
}

function emitirNF(osId){
  const aprovadas=WORK.os.filter(o=>o.aprovado);
  if(!aprovadas.length){ toast("Nenhuma OS aprovada para emitir."); return; }
  const opts=aprovadas.map(o=>`<option value="${o.id}" ${o.id===osId?'selected':''}>OS #${o.numero} — ${cli(o.clienteId).nome} — ${money(osTotal(o))}</option>`).join('');
  modal("Emitir NF-e","Selecione a OS de origem",`
    <label>Ordem de Serviço</label><select id="nf_os">${opts}</select>
    <label>Série</label><input id="nf_serie" value="1">
    <div style="font-size:11.5px;color:var(--muted);margin-top:10px">Os itens (serviços e peças) da OS compõem a nota. A chave de acesso é gerada na emissão.</div>`,
   ()=>{const o=byId(WORK.os,document.getElementById('nf_os').value);
     const n={id:uid('NF'),numero:proxNumNF(),serie:+document.getElementById('nf_serie').value||1,
       osId:o.id,cliente:cli(o.clienteId).nome||'',valor:osTotal(o),data:today(),status:'emitida',chave:chaveFake()};
     nfList().push(n);closeModal();toast(`NF-e nº ${n.numero} emitida ✓`);renderNFe();});
}
function cancelarNF(id){ confirmar("Cancelar esta NF-e? (ação registrada)",()=>{const n=byId(nfList(),id);if(n)n.status='cancelada';closeModal();renderNFe();}); }
function verDANFE(id){ const n=byId(nfList(),id); const o=byId(WORK.os,n.osId)||{}; const v=veh(o.veiculoId)||{};
  const itens=(o.itens||[]).map(i=>{const r=i.tipo==='servico'?svc(i.refId):prt(i.refId);return `<div class="itemrow"><div class="g">${r.nome||'—'} ${i.qtd>1?'× '+i.qtd:''}</div><div class="money">${money(i.valor)}</div></div>`;}).join('');
  modal("DANFE — NF-e nº "+n.numero,"Documento Auxiliar (simulado)",`
    <div class="info-line"><span class="k">Emitente</span><span>R3 Centro Automotivo</span></div>
    <div class="info-line"><span class="k">Cliente</span><span>${n.cliente}</span></div>
    <div class="info-line"><span class="k">Veículo</span><span>${v.placa||''} ${v.modelo||''}</span></div>
    <div class="info-line"><span class="k">Emissão</span><span>${fmtFull(n.data)}</span></div>
    <div class="info-line"><span class="k">Chave de acesso</span><span style="font-size:10px;word-break:break-all;max-width:60%;text-align:right">${n.chave}</span></div>
    <div style="margin:12px 0 4px;font-weight:600;color:var(--gold-2)">Itens</div>${itens||'<div style="color:var(--muted)">—</div>'}
    <div class="tot"><div>Total</div><div class="v">${money(n.valor)}</div></div>`,
   ()=>closeModal());
  // troca o botão Salvar por Fechar
  const b=document.getElementById('mSave'); if(b){b.textContent="Fechar";}
}
function baixarXML(id){ const n=byId(nfList(),id); const o=byId(WORK.os,n.osId)||{};
  const itensXml=(o.itens||[]).map((i,k)=>{const r=i.tipo==='servico'?svc(i.refId):prt(i.refId);
    return `    <det nItem="${k+1}"><prod><xProd>${(r.nome||'').replace(/&/g,'e')}</xProd><qCom>${i.qtd}</qCom><vProd>${(i.valor||0).toFixed(2)}</vProd></prod></det>`;}).join("\n");
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<NFe><infNFe versao="4.00" Id="NFe${n.chave}">
  <ide><nNF>${n.numero}</nNF><serie>${n.serie}</serie><dhEmi>${n.data}</dhEmi></ide>
  <emit><xNome>R3 Centro Automotivo</xNome></emit>
  <dest><xNome>${n.cliente}</xNome></dest>
${itensXml}
  <total><ICMSTot><vNF>${(n.valor||0).toFixed(2)}</vNF></ICMSTot></total>
</infNFe></NFe>`;
  const blob=new Blob([xml],{type:'application/xml'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`NFe-${n.numero}.xml`;a.click();URL.revokeObjectURL(url);
  toast("XML gerado (mock)");
}
