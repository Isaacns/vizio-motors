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
  const tabs=[["ponto","⏱ Ponto"],["prod","📈 Produtividade"]];
  const nav=`<div style="display:flex;gap:8px;margin-bottom:16px">${tabs.map(t=>`
    <button class="b ${_corpTab===t[0]?'':'b-ghost'} b-sm" onclick="corpTab('${t[0]}')">${t[1]}</button>`).join('')}</div>`;
  let body="";
  if(_corpTab==="prod")body=viewProd();
  else body=viewPonto();
  document.getElementById('view').innerHTML=nav+body;
}

/* ---------- PONTO (formato Inovar — importa o Excel do relógio) ---------- */
function viewPonto(){
  const inov=WORK.pontoInovar;
  if(inov && (inov.resumo.length || inov.registro.length)) return viewPontoInovar(inov);
  return viewPontoManual();
}

/* Relatório no formato Inovar, a partir do Excel importado do relógio */
function viewPontoInovar(inov){
  const R=inov.resumo;
  const tAtrasoF=R.reduce((s,r)=>s+(r.atrasoFreq||0),0);
  const tAtrasoM=R.reduce((s,r)=>s+(r.atrasoMin||0),0);
  const tCedoF=R.reduce((s,r)=>s+(r.cedoFreq||0),0);
  const kpis=[
    ['Colaboradores',R.length],
    ['Atrasos (ocorrências)',tAtrasoF+' · '+tAtrasoM+' min'],
    ['Saídas antecipadas',tCedoF],
    ['Período',inov.periodo||'—'],
  ];
  const linhaMin=v=>v?`<span style="color:var(--bad)">${v}</span>`:'<span style="color:var(--muted)">—</span>';
  const resumoTbl=`<div class="panel"><div class="head"><h3>📋 Resumo de presença <span style="font-size:11px;color:var(--muted)">(Inovar · relógio de ponto)</span></h3><div class="sp"></div>
      <button class="b b-ghost b-sm" onclick="relPonto_pdf()">📄 Relatório</button>
      <button class="b b-ghost b-sm" onclick="importarPonto()">Reimportar</button>
      <button class="b b-ghost b-sm" onclick="limparPontoInovar()">Limpar</button></div>
     <div style="overflow:auto"><table class="tbl"><thead>
       <tr><th>Nº</th><th>Nome</th><th>Departamento</th><th>Atrasos (qtd/min)</th><th>Saídas antecip. (qtd/min)</th><th>Horas extras</th><th>Dias</th></tr></thead>
       <tbody>${R.map(r=>`<tr><td>${r.num}</td><td><b>${r.nome}</b></td><td style="color:var(--muted)">${r.depto||'—'}</td>
         <td>${r.atrasoFreq||0} / ${linhaMin(r.atrasoMin)}</td>
         <td>${r.cedoFreq||0} / ${linhaMin(r.cedoMin)}</td>
         <td>${r.extra?('<span style="color:var(--ok)">'+r.extra+'</span>'):'—'}</td>
         <td>${r.dias||'—'}</td></tr>`).join('')||'<tr><td colspan="7" style="color:var(--muted)">Sem resumo na planilha.</td></tr>'}</tbody></table></div>
   </div>`;
  const reg=inov.registro||[];
  const registroBlk=reg.length?`<div class="panel"><h3>🕐 Registro de presença (batidas por dia)</h3>
     ${reg.map(c=>{ const dias=(c.batidas||[]).filter(b=>b.horas&&b.horas.length);
       return `<details style="margin-bottom:8px"><summary style="cursor:pointer;padding:8px 0;font-weight:600">${c.nome||('Colab. '+c.numero)} <span style="color:var(--muted);font-weight:400">· ${dias.length} dia(s) com batidas</span></summary>
         ${dias.length?`<table class="tbl" style="margin-top:6px"><thead><tr><th style="width:70px">Dia</th><th>Batidas</th></tr></thead>
           <tbody>${dias.map(b=>`<tr><td>${b.dia}</td><td style="font-variant-numeric:tabular-nums">${b.horas.join('  ·  ')}</td></tr>`).join('')}</tbody></table>`
           :'<div style="color:var(--muted);font-size:12px;padding:6px 0">Sem batidas registradas.</div>'}
       </details>`;}).join('')}
   </div>`:'';
  return `<div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>
   ${resumoTbl}${registroBlk}`;
}

/* Visão manual (fallback quando ainda não houve importação) */
function viewPontoManual(){
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
   <div class="alert" style="margin-bottom:14px"><div class="ai">⏱</div><div class="at">
     <b>Importe o Excel do relógio de ponto</b> para ver o relatório no formato Inovar (resumo de atrasos, saídas antecipadas, horas extras e batidas por dia).
     <div style="margin-top:8px"><button class="b b-sm" onclick="importarPonto()">Importar Excel do relógio</button></div></div></div>
   <div class="grid2">
     <div class="panel"><div class="head"><h3>⏱ Registros manuais</h3><div class="sp"></div>
        <button class="b b-sm" onclick="registrarPonto()">+ Registrar</button></div>
        <table class="tbl"><thead><tr><th>Colaborador</th><th>Data</th><th>Entrada</th><th>Saída</th><th>Horas</th></tr></thead>
        <tbody>${reg.slice().reverse().map(r=>`<tr><td>${r.funcionario}</td><td>${fmtFull(r.data)}</td>
          <td>${r.entrada||'—'}</td><td>${r.saida||'—'}</td>
          <td style="color:${(r.horas||0)>JORNADA?'var(--ok)':'var(--txt)'};font-weight:600">${(r.horas||0).toFixed(1)}h ${r.obs?'· '+r.obs:''}</td></tr>`).join('')}</tbody></table>
     </div>
     <div class="panel"><h3>🏦 Banco de horas (hoje)</h3>
        ${banco.map(b=>`<div class="info-line"><span class="k">${b[0]}</span>
          <span style="color:${b[2]>=0?'var(--ok)':'var(--bad)'};font-weight:600">${b[1].toFixed(1)}h (${b[2]>=0?'+':''}${b[2].toFixed(1)})</span></div>`).join('')}
        <div style="font-size:11.5px;color:var(--muted);margin-top:12px">Jornada padrão: ${JORNADA}h/dia. No formato Inovar, o cálculo vem direto das batidas do relógio.</div>
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

/* ---- Importação real (SheetJS) do Excel exportado pelo relógio de ponto ---- */
function _pnNorm(s){ return (''+s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function _pnNum(v){ const n=parseFloat((''+v).replace(',','.')); return isNaN(n)?0:n; }
function parsePontoWB(wb){
  const out={resumo:[],registro:[],periodo:''};
  const rName=wb.SheetNames.find(n=>_pnNorm(n).includes('resumo'));
  const gName=wb.SheetNames.find(n=>_pnNorm(n).includes('registro'));
  if(rName){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[rName],{header:1,raw:false,defval:''});
    rows.forEach(r=>{ const j=r.join(' '); const m=j.match(/(\d{4}[\/-]\d{2}[\/-]\d{2}\s*~\s*[\d\/-]+)/); if(m&&!out.periodo)out.periodo=m[1].trim(); });
    rows.forEach(r=>{ const num=(''+(r[0]||'')).trim().replace(/\.0$/,'');
      if(/^\d+$/.test(num) && r[1] && _pnNorm(r[1])!=='nome'){
        out.resumo.push({num, nome:(''+r[1]).trim(), depto:(''+(r[2]||'')).trim(),
          atrasoFreq:_pnNum(r[5]), atrasoMin:_pnNum(r[6]),
          cedoFreq:_pnNum(r[7]), cedoMin:_pnNum(r[8]),
          extra:((_pnNum(r[9])+_pnNum(r[10]))||''), dias:(''+(r[11]||'')).trim() });
      }});
  }
  if(gName){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[gName],{header:1,raw:false,defval:''});
    let cur=null;
    rows.forEach(r=>{ const j=r.join(' ');
      if(/NOME\s*[:：]/.test(j)){
        let nome=''; let aft=(j.split(/NOME\s*[:：]/i)[1]||'').split(/DEPART/i)[0]; nome=aft.replace(/[|:：]/g,' ').replace(/\s+/g,' ').trim();
        let numero=''; for(let i=0;i<r.length;i++){const v=(''+r[i]).trim().replace(/\.0$/,''); if(/^\d+$/.test(v)){numero=v;break;}}
        cur={numero,nome,batidas:[]}; out.registro.push(cur);
      } else if(cur){
        r.forEach((c,idx)=>{ const times=(''+c).match(/\d{1,2}:\d{2}/g); if(times&&times.length){ cur.batidas.push({dia:idx+1,horas:times}); } });
      }
    });
  }
  return out;
}
function importarPonto(){
  modal("Importar do relógio de ponto (Inovar)","Excel exportado pelo relógio (.xls/.xlsx)",`
    <div style="font-size:13px;line-height:1.6;color:var(--txt)">Suba o arquivo do relógio. O sistema lê a página <b>Resumo de presença</b> (atrasos, saídas antecipadas, horas extras, dias) e o <b>Registro de presença</b> (batidas por dia) e monta o relatório no formato Inovar.</div>
    <label style="margin-top:12px">Arquivo (.xls / .xlsx)</label><input id="pt_file" type="file" accept=".xls,.xlsx">`,
   ()=>{
     const f=document.getElementById('pt_file'); const file=f&&f.files&&f.files[0];
     if(!file){ toast('Selecione o arquivo do relógio'); return; }
     if(typeof XLSX==='undefined'){ toast('Leitor de Excel ainda carregando — tente novamente em instantes'); return; }
     const rd=new FileReader();
     rd.onload=ev=>{ try{
       const wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
       const parsed=parsePontoWB(wb);
       if(!parsed.resumo.length && !parsed.registro.length){ toast('Não reconheci o formato do relógio nesse arquivo'); return; }
       WORK.pontoInovar=parsed;
       closeModal(); renderCorp();
       toast('Ponto importado: '+parsed.resumo.length+' colaborador(es) ✓');
     }catch(err){ toast('Erro ao ler o arquivo: '+err.message); } };
     rd.onerror=()=>toast('Falha ao ler o arquivo');
     rd.readAsArrayBuffer(file);
   });
}
function limparPontoInovar(){ if(!window.confirmar){ WORK.pontoInovar=null; renderCorp(); return; }
  confirmar('Limpar a importação do relógio?', ()=>{ WORK.pontoInovar=null; renderCorp(); toast('Importação removida'); }); }
window.importarPonto=importarPonto; window.limparPontoInovar=limparPontoInovar;
function relPonto_pdf(){
  if(typeof relatorioPDF!=='function')return;
  var inov=WORK.pontoInovar; if(!inov||!inov.resumo.length){ if(window.toast)toast('Importe o Excel do relógio primeiro'); return; }
  var R=inov.resumo;
  var kpis=[['Colaboradores',R.length],['Atrasos (ocorr.)',R.reduce(function(s,r){return s+(r.atrasoFreq||0);},0)],['Saídas antecip.',R.reduce(function(s,r){return s+(r.cedoFreq||0);},0)],['Período',inov.periodo||'—']];
  var corpo=RP.kpis(kpis)+
    RP.sec('Resumo de presença — '+(inov.periodo||''))+RP.table(['Nº','Nome','Departamento','Atrasos (qtd/min)','Saídas (qtd/min)','Dias'],
      R.map(function(r){return [r.num,r.nome,r.depto||'—',(r.atrasoFreq||0)+'/'+(r.atrasoMin||0),(r.cedoFreq||0)+'/'+(r.cedoMin||0),r.dias||'—'];}));
  relatorioPDF({titulo:'Relatório de Ponto',subtitulo:'Resumo de presença (relógio de ponto)',corpo:corpo});
}
window.relPonto_pdf=relPonto_pdf;

/* ---------- PRODUTIVIDADE ---------- */
function viewProd(){
  const os=WORK.os;
  const prod={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];
    prod[m]=prod[m]||{os:0,receita:0,tempo:0}; prod[m].os++; prod[m].receita+=osTotal(o);
    (o.itens||[]).forEach(i=>{if(i.tipo==='servico')prod[m].tempo+=(svc(i.refId).tempoMin||0)*i.qtd;});});
  const rank=Object.entries(prod).sort((a,b)=>b[1].receita-a[1].receita);
  return `<div class="panel"><h3>🏅 Produtividade por mecânico</h3>
    <table class="tbl"><thead><tr><th>Mecânico</th><th>OS</th><th>Receita</th><th>Tempo produtivo</th><th>Receita/OS</th></tr></thead>
    <tbody>${rank.map(([m,d])=>`<tr><td><b>${m}</b></td><td>${d.os}</td><td style="color:var(--gold-2)">${money(d.receita)}</td><td>${(d.tempo/60).toFixed(1)}h</td><td>${money(d.receita/d.os)}</td></tr>`).join('')||'<tr><td colspan="5" style="color:var(--muted)">Sem dados.</td></tr>'}</tbody></table>
  </div>`;
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
