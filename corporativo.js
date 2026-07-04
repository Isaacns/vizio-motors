/* ============================================================
   Vizio Motors — corporativo.js (Fase 7 · Recursos corporativos)
   Reaproveitado do Inovar: Controle de Ponto, Bem-estar, Alavancagem.
   Depende de app.js (WORK, money, osTotal, svc, modal, closeModal,
   toast, today, fmtFull, uid).
   ============================================================ */
const FUNCS = ["Carlos (mecânico)","André (mecânico)","Ana (recepção)"];
const JORNADA = 8; // horas/dia esperadas
let _corpTab = "ponto";

function pontoList(){ if(!WORK.ponto)WORK.ponto=[
  {id:"PT1",funcionario:"Carlos (mecânico)",data:today(),entrada:"08:00",saida:"17:12",horas:8.2,obs:""},
  {id:"PT2",funcionario:"André (mecânico)",data:today(),entrada:"08:05",saida:"18:30",horas:9.4,obs:"Hora extra"},
  {id:"PT3",funcionario:"Ana (recepção)",data:today(),entrada:"08:00",saida:"17:00",horas:8.0,obs:""}
]; return WORK.ponto; }
function bemList(){ if(!WORK.bemestar)WORK.bemestar=[
  {id:"BE1",funcionario:"Carlos (mecânico)",data:today(),humor:4,clima:4,obs:"Semana tranquila"},
  {id:"BE2",funcionario:"André (mecânico)",data:today(),humor:3,clima:4,obs:"Volume alto de OS"},
  {id:"BE3",funcionario:"Ana (recepção)",data:today(),humor:5,clima:5,obs:""}
]; return WORK.bemestar; }
function metaList(){ if(!WORK.metas)WORK.metas=[
  {id:"MT1",titulo:"Faturamento do mês",alvo:90000,atual:0,unidade:"R$",periodo:"mês"},
  {id:"MT2",titulo:"OS concluídas",alvo:40,atual:0,unidade:"un",periodo:"mês"},
  {id:"MT3",titulo:"Ticket médio",alvo:750,atual:0,unidade:"R$",periodo:"mês"}
]; return WORK.metas; }

function abrirPonto(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Ponto & Equipe";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderCorp();
}
function corpTab(t){ _corpTab=t; renderCorp(); }

function renderCorp(){
  const tabs=[["ponto","⏱ Ponto"],["alav","📈 Alavancagem"]];
  const nav=`<div style="display:flex;gap:8px;margin-bottom:16px">${tabs.map(t=>`
    <button class="b ${_corpTab===t[0]?'':'b-ghost'} b-sm" onclick="corpTab('${t[0]}')">${t[1]}</button>`).join('')}</div>`;
  let body="";
  if(_corpTab==="ponto")body=viewPonto();
  else if(_corpTab==="bem")body=viewBem();
  else body=viewAlav();
  document.getElementById('view').innerHTML=nav+body;
}

/* ---------- PONTO ---------- */
function viewPonto(){
  const reg=pontoList();
  const porFunc={}; reg.forEach(r=>{porFunc[r.funcionario]=(porFunc[r.funcionario]||0)+(r.horas||0);});
  const banco=FUNCS.map(f=>{const h=porFunc[f]||0; const saldo=h-JORNADA; return [f,h,saldo];});
  const totalHoras=reg.reduce((s,r)=>s+(r.horas||0),0);
  const kpis=[
    ['Registros hoje',reg.filter(r=>r.data===today()).length],
    ['Horas lançadas',totalHoras.toFixed(1)+'h'],
    ['Hora extra (saldo+)',banco.filter(b=>b[2]>0).length+' colab.'],
    ['Equipe',FUNCS.length],
  ];
  return `<div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>
   <div class="grid2">
     <div class="panel"><div class="head"><h3>⏱ Registros de ponto</h3><div class="sp"></div>
        <button class="b b-ghost b-sm" onclick="importarPontoInfo()">Importar Excel</button>
        <button class="b b-sm" onclick="registrarPonto()">+ Registrar</button></div>
        <table class="tbl"><thead><tr><th>Colaborador</th><th>Data</th><th>Entrada</th><th>Saída</th><th>Horas</th></tr></thead>
        <tbody>${reg.slice().reverse().map(r=>`<tr><td>${r.funcionario}</td><td>${fmtFull(r.data)}</td>
          <td>${r.entrada||'—'}</td><td>${r.saida||'—'}</td>
          <td style="color:${(r.horas||0)>JORNADA?'var(--ok)':'var(--txt)'};font-weight:600">${(r.horas||0).toFixed(1)}h ${r.obs?'· '+r.obs:''}</td></tr>`).join('')}</tbody></table>
     </div>
     <div class="panel"><h3>🏦 Banco de horas (hoje)</h3>
        ${banco.map(b=>`<div class="info-line"><span class="k">${b[0]}</span>
          <span style="color:${b[2]>=0?'var(--ok)':'var(--bad)'};font-weight:600">${b[1].toFixed(1)}h (${b[2]>=0?'+':''}${b[2].toFixed(1)})</span></div>`).join('')}
        <div style="font-size:11.5px;color:#6d6552;margin-top:12px">Jornada padrão: ${JORNADA}h/dia. Registro secreto de acesso e logout por inatividade (30 min) herdados do padrão INPERSON.</div>
     </div>
   </div>`;
}
function registrarPonto(){
  modal("Registrar ponto","",`
    <label>Colaborador</label><select id="p_func">${FUNCS.map(f=>`<option>${f}</option>`).join('')}</select>
    <div class="frow"><div><label>Data</label><input id="p_data" type="date" value="${today()}"></div>
    <div><label>Obs</label><input id="p_obs" placeholder="Ex.: hora extra"></div></div>
    <div class="frow"><div><label>Entrada</label><input id="p_ent" type="time" value="08:00"></div>
    <div><label>Saída</label><input id="p_sai" type="time" value="17:00"></div></div>`,
   ()=>{const e=document.getElementById('p_ent').value,s=document.getElementById('p_sai').value;
     const h=Math.max(0,(toMin(s)-toMin(e))/60);
     pontoList().push({id:uid('PT'),funcionario:document.getElementById('p_func').value,data:document.getElementById('p_data').value,
       entrada:e,saida:s,horas:+h.toFixed(2),obs:document.getElementById('p_obs').value});
     closeModal();renderCorp();});
}
function toMin(hhmm){ if(!hhmm)return 0; const p=hhmm.split(':'); return (+p[0])*60+(+p[1]); }
function importarPontoInfo(){
  modal("Importar do relógio de ponto","Planilha Excel (3 páginas)",`
    <div style="font-size:13px;line-height:1.6;color:var(--txt)">O relógio exporta um Excel com 3 páginas: <b>resumo de atendimento</b>, <b>formulário de registro de presença</b> e <b>relatório de presença</b>.
    O cálculo de horas usa a página de <b>registro de presença</b>.<br><br>
    <span style="color:var(--muted)">No piloto, o parser é preparado (padrão SheetJS do VIZIO). Suba o arquivo e o sistema vincula cada registro ao colaborador correspondente.</span></div>
    <label style="margin-top:12px">Arquivo (.xls/.xlsx)</label><input type="file" accept=".xls,.xlsx">`,
   ()=>{toast("Parser de ponto será conectado ao arquivo real");closeModal();});
}

/* ---------- BEM-ESTAR ---------- */
function viewBem(){
  const reg=bemList();
  const avg=(k)=>reg.length?(reg.reduce((s,r)=>s+(r[k]||0),0)/reg.length):0;
  const emoji=v=>["😞","😕","😐","🙂","😄"][Math.round(v)-1]||"—";
  const kpis=[
    ['Humor médio',avg('humor').toFixed(1)+' '+emoji(avg('humor'))],
    ['Clima organizacional',avg('clima').toFixed(1)+' '+emoji(avg('clima'))],
    ['Respostas',reg.length],
    ['Equipe engajada',Math.round(avg('humor')/5*100)+'%'],
  ];
  return `<div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>
   <div class="panel"><div class="head"><h3>😊 Pesquisa de bem-estar</h3><div class="sp"></div>
       <button class="b b-sm" onclick="salvarBemestar()">+ Registrar humor</button></div>
     <table class="tbl"><thead><tr><th>Colaborador</th><th>Data</th><th>Humor</th><th>Clima</th><th>Observação</th></tr></thead>
     <tbody>${reg.slice().reverse().map(r=>`<tr><td>${r.funcionario}</td><td>${fmtFull(r.data)}</td>
       <td>${emoji(r.humor)} ${r.humor}/5</td><td>${emoji(r.clima)} ${r.clima}/5</td><td style="color:var(--muted)">${r.obs||'—'}</td></tr>`).join('')}</tbody></table>
   </div>`;
}
function salvarBemestar(){
  const sel=n=>`<select id="${n}"><option value="5">5 😄 Ótimo</option><option value="4">4 🙂 Bom</option><option value="3" selected>3 😐 Neutro</option><option value="2">2 😕 Ruim</option><option value="1">1 😞 Péssimo</option></select>`;
  modal("Registrar bem-estar","",`
    <label>Colaborador</label><select id="b_func">${FUNCS.map(f=>`<option>${f}</option>`).join('')}</select>
    <div class="frow"><div><label>Humor</label>${sel('b_humor')}</div><div><label>Clima</label>${sel('b_clima')}</div></div>
    <label>Observação</label><textarea id="b_obs" placeholder="Como foi a semana?"></textarea>`,
   ()=>{bemList().push({id:uid('BE'),funcionario:document.getElementById('b_func').value,data:today(),
     humor:+document.getElementById('b_humor').value,clima:+document.getElementById('b_clima').value,obs:document.getElementById('b_obs').value});
     closeModal();renderCorp();});
}

/* ---------- ALAVANCAGEM ---------- */
function viewAlav(){
  const os=WORK.os, aprov=os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const concl=os.filter(o=>o.statusIdx>=7).length;
  const ticket=aprov.length?fat/aprov.length:0;
  // atualiza metas dinâmicas
  const M=metaList(); M[0].atual=fat; M[1].atual=concl; M[2].atual=Math.round(ticket);
  // produtividade por mecânico
  const prod={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];
    prod[m]=prod[m]||{os:0,receita:0,tempo:0};
    prod[m].os++; prod[m].receita+=osTotal(o);
    (o.itens||[]).forEach(i=>{if(i.tipo==='servico')prod[m].tempo+=(svc(i.refId).tempoMin||0)*i.qtd;});});
  const rank=Object.entries(prod).sort((a,b)=>b[1].receita-a[1].receita);
  return `<div class="panel"><div class="head"><h3>🎯 Metas</h3><div class="sp"></div>
       <button class="b b-sm" onclick="salvarMeta()">+ Meta</button></div>
     ${M.map(m=>{const pct=Math.min(100,Math.round(m.atual/m.alvo*100));
       return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;font-size:13px">
         <span>${m.titulo}</span><span style="color:var(--gold-2)">${m.unidade==='R$'?money(m.atual):m.atual} / ${m.unidade==='R$'?money(m.alvo):m.alvo+' '+m.unidade} · ${pct}%</span></div>
         <div class="bar"><i style="width:${pct}%"></i></div></div>`;}).join('')}
   </div>
   <div class="panel"><h3>🏅 Produtividade por mecânico</h3>
     <table class="tbl"><thead><tr><th>Mecânico</th><th>OS</th><th>Receita</th><th>Tempo produtivo</th><th>Receita/OS</th></tr></thead>
     <tbody>${rank.map(([m,d])=>`<tr><td><b>${m}</b></td><td>${d.os}</td><td style="color:var(--gold-2)">${money(d.receita)}</td>
       <td>${(d.tempo/60).toFixed(1)}h</td><td>${money(d.receita/d.os)}</td></tr>`).join('')}</tbody></table>
   </div>`;
}
function salvarMeta(){
  modal("Nova meta","",`
    <label>Título</label><input id="m_tit" placeholder="Ex.: Novos clientes">
    <div class="frow"><div><label>Alvo</label><input id="m_alvo" type="number" value="0"></div>
    <div><label>Unidade</label><select id="m_uni"><option>un</option><option>R$</option><option>%</option></select></div></div>`,
   ()=>{if(!document.getElementById('m_tit').value){toast('Informe o título');return;}
     metaList().push({id:uid('MT'),titulo:document.getElementById('m_tit').value,alvo:+document.getElementById('m_alvo').value||0,
       atual:0,unidade:document.getElementById('m_uni').value,periodo:'mês'});
     closeModal();renderCorp();});
}
