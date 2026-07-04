/* ============================================================
   Vizio Motors — crm.js (Fase 6 · Inteligência)
   CRM & Recuperação de Receita: aniversários, inativos,
   revisão/óleo vencidos, campanhas e mensagens (WhatsApp/e-mail).
   Depende de app.js (WORK, money, cli, veh, byId, osTotal, modal,
   closeModal, toast, today, fmtFull, uid).
   ============================================================ */

/* histórico de manutenção (demo) — no live, virá de mt_os por serviço */
const CRM_ULT = {
  C1:{oleo:"2026-06-20", revisao:"2025-11-10"},
  C2:{oleo:"2025-12-05", revisao:"2025-03-15"},
  C3:{oleo:"2026-01-18", revisao:"2026-01-18"},
  C4:{oleo:"2026-05-30", revisao:"2025-08-01"},
  C5:{oleo:"2025-10-12", revisao:"2024-12-20"}
};
const OLEO_MESES=6, REVISAO_MESES=12, INATIVO_MESES=6;

function mesesDe(dstr){ if(!dstr)return 999; const d=new Date(dstr), h=new Date(today());
  return (h.getFullYear()-d.getFullYear())*12 + (h.getMonth()-d.getMonth()); }
function statusRev(meses,limite){ if(meses>limite)return["Vencida","bad"]; if(meses>=limite-2)return["Vence em breve","warn"]; return["Em dia","ok"]; }
function soDig(s){ return (s||"").replace(/\D/g,""); }
function waLink(tel,msg){ let d=soDig(tel); if(d.length<=11)d="55"+d; return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`; }
function mailLink(email,assunto,corpo){ return `mailto:${email||""}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`; }
function crmList(){ if(!WORK.campanhas)WORK.campanhas=[]; return WORK.campanhas; }

function abrirCRM(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="CRM & Recuperação";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderCRM();
}

function crmDados(){
  return WORK.clientes.map(c=>{
    const u=CRM_ULT[c.id]||{};
    const mO=mesesDe(u.oleo), mR=mesesDe(u.revisao);
    const oss=WORK.os.filter(o=>o.clienteId===c.id);
    const gasto=oss.reduce((s,o)=>s+osTotal(o),0);
    const ultVisita=Math.min(mO,mR);
    return {c, oleo:statusRev(mO,OLEO_MESES), rev:statusRev(mR,REVISAO_MESES),
      mO,mR, visitas:oss.length, gasto, inativo:ultVisita>INATIVO_MESES, ultMes:ultVisita};
  });
}

function renderCRM(){
  const D=crmDados();
  const mesAtual=new Date(today()).getMonth();
  const aniver=WORK.clientes.filter(c=>c.nasc && new Date(c.nasc).getMonth()===mesAtual);
  const oleoVenc=D.filter(d=>d.oleo[0]==="Vencida");
  const revVenc=D.filter(d=>d.rev[0]==="Vencida");
  const inativos=D.filter(d=>d.inativo);
  const nps=72;

  const kpis=[
    ['Aniversariantes (mês)',aniver.length,'up','oportunidade de contato','aniver'],
    ['Óleo vencido',oleoVenc.length,oleoVenc.length?'down':'up','recuperação de receita','oleo'],
    ['Revisão vencida',revVenc.length,revVenc.length?'down':'up','recuperação de receita','revisao'],
    ['Clientes inativos',inativos.length,inativos.length?'down':'up','+ de '+INATIVO_MESES+' meses','inativos'],
    ['NPS',nps,'up','satisfação','nps'],
    ['Base de clientes',WORK.clientes.length,'up','ativos cadastrados','base'],
  ];
  const badge=s=>`<span class="badge ${s[1]==='ok'?'s7':(s[1]==='warn'?'s1':'s0')}" style="${s[1]==='bad'?'background:rgba(229,100,78,.15);color:var(--bad)':''}">${s[0]}</span>`;
  const acoes=(c,msg)=>`<a class="b b-sm" style="text-decoration:none" target="_blank" href="${waLink(c.tel,msg)}">WhatsApp</a>
     <a class="b b-ghost b-sm" style="text-decoration:none" target="_blank" href="${mailLink(c.email,(window.BRAND_NAME||'Vizio Motors'),msg)}">E-mail</a>`;

  document.getElementById('view').innerHTML=`
   <div class="kpis">${kpis.map(k=>`<div class="kpi" style="cursor:pointer" onclick="crmDrill('${k[4]}')" title="Ver detalhes"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div><div class="dt ${k[2]}">${k[3]}</div></div>`).join('')}</div>

   <div class="panel"><div class="head"><h3>💛 Recuperação de Receita</h3><div class="sp"></div>
      <button class="b b-sm" onclick="gerarCampanha('oleo')">Campanha: óleo vencido</button>
      <button class="b b-sm" onclick="gerarCampanha('revisao')">Campanha: revisão vencida</button></div>
      <table class="tbl"><thead><tr><th>Cliente</th><th>Última troca de óleo</th><th>Revisão</th><th>Visitas</th><th>Gasto total</th><th>Ação</th></tr></thead>
      <tbody>${D.map(d=>`<tr><td><b>${d.c.nome}</b><br><span style="color:var(--muted);font-size:11px">${d.c.tel||''}</span></td>
        <td>${badge(d.oleo)}</td><td>${badge(d.rev)}</td><td>${d.visitas}</td>
        <td style="color:var(--gold-2)">${money(d.gasto)}</td>
        <td>${acoes(d.c, `Olá ${d.c.nome.split(' ')[0]}! Aqui é a ${window.BRAND_NAME||'nossa oficina'}. Notamos que seu veículo pode estar precisando de revisão/troca de óleo. Quer agendar? 🔧`)}</td></tr>`).join('')}</tbody></table>
   </div>

   <div class="grid2">
     <div class="panel"><h3>🎂 Aniversariantes do mês</h3>
       ${aniver.length?aniver.map(c=>`<div class="veh"><div class="info"><div class="t">${c.nome}</div>
         <div class="s">${fmtFull(c.nasc)} · ${c.tel||''}</div></div>
         <a class="b b-sm" style="text-decoration:none" target="_blank" href="${waLink(c.tel,`Feliz aniversário, ${c.nome.split(' ')[0]}! 🎉 A ${window.BRAND_NAME||'nossa oficina'} deseja tudo de bom. Passe aqui e ganhe uma revisão de cortesia no seu veículo!`)}">Parabenizar</a></div>`).join('')
         :'<div style="color:var(--muted);font-size:13px">Ninguém faz aniversário este mês.</div>'}
     </div>
     <div class="panel"><h3>😴 Clientes inativos</h3>
       ${inativos.length?inativos.map(d=>`<div class="veh"><div class="info"><div class="t">${d.c.nome}</div>
         <div class="s">Sem visita há ~${d.ultMes} meses · ${d.visitas} OS no histórico</div></div>
         <a class="b b-ghost b-sm" style="text-decoration:none" target="_blank" href="${waLink(d.c.tel,`Olá ${d.c.nome.split(' ')[0]}! Sentimos sua falta. Que tal um check-up no seu veículo? Temos condição especial de retorno. 🚐`)}">Reativar</a></div>`).join('')
         :'<div style="color:var(--muted);font-size:13px">Nenhum cliente inativo. 👏</div>'}
     </div>
   </div>

   <div class="panel"><div class="head"><h3>📣 Campanhas geradas</h3><div class="sp"></div>
       <span style="font-size:12px;color:var(--muted)">${crmList().length} campanha(s)</span></div>
     ${crmList().length?crmList().slice().reverse().map(cp=>`<div class="alert"><div class="ai">📣</div><div class="at">
       <b>${cp.titulo}</b> — ${cp.alvos} cliente(s) · criada em ${fmtFull(cp.data)}<br>
       <span style="color:var(--muted)">Mensagem: “${cp.msg}”</span></div></div>`).join('')
       :'<div style="color:var(--muted);font-size:13px">Nenhuma campanha ainda. Gere uma acima — o sistema seleciona os clientes do segmento automaticamente.</div>'}
   </div>`;
}

function gerarCampanha(tipo){
  const D=crmDados();
  let alvos, titulo, msg;
  if(tipo==='oleo'){ alvos=D.filter(d=>d.oleo[0]==="Vencida");
    titulo="Recuperação — Troca de óleo vencida";
    msg="Seu veículo está com a troca de óleo vencida. Agende conosco e ganhe 10% na próxima revisão!"; }
  else { alvos=D.filter(d=>d.rev[0]==="Vencida");
    titulo="Recuperação — Revisão vencida";
    msg="Faz tempo que seu veículo não passa por revisão. Garanta a segurança da sua frota — agende conosco!"; }
  if(!alvos.length){ toast("Nenhum cliente neste segmento agora."); return; }
  crmList().push({id:uid('CP'),titulo,alvos:alvos.length,msg,data:today(),tipo});
  toast(`Campanha criada para ${alvos.length} cliente(s) ✓`);
  renderCRM();
}

/* drill-down dos KPIs do CRM (indicador clicável → detalhe acionável) */
function crmDrill(tipo){
  const D=crmDados();
  const mesAtual=new Date(today()).getMonth();
  const wa=(c,msg)=>`<a class="b b-sm" style="text-decoration:none;white-space:nowrap" target="_blank" href="${waLink(c.tel,msg)}">WhatsApp</a>`;
  const fn=nome=>(nome||'').split(' ')[0];
  let titulo="", sub="Detalhe do indicador", head="", rows="", vazio="Sem itens neste segmento.";
  if(tipo==='aniver'){
    titulo="🎂 Aniversariantes do mês";
    const L=WORK.clientes.filter(c=>c.nasc && new Date(c.nasc).getMonth()===mesAtual);
    head="<tr><th>Cliente</th><th>Nascimento</th><th>Telefone</th><th>Ação</th></tr>";
    rows=L.map(c=>`<tr><td><b>${c.nome}</b></td><td>${fmtFull(c.nasc)}</td><td style="color:var(--muted)">${c.tel||''}</td><td>${wa(c,`Feliz aniversário, ${fn(c.nome)}! 🎉 A ${window.BRAND_NAME||'nossa oficina'} deseja tudo de bom. Passe aqui e ganhe uma revisão de cortesia no seu veículo!`)}</td></tr>`).join('');
    vazio="Ninguém faz aniversário este mês.";
  } else if(tipo==='oleo'){
    titulo="🛢️ Óleo vencido";
    const L=D.filter(d=>d.oleo[0]==="Vencida");
    head="<tr><th>Cliente</th><th>Última troca</th><th>Telefone</th><th>Ação</th></tr>";
    rows=L.map(d=>`<tr><td><b>${d.c.nome}</b></td><td style="color:var(--bad)">há ~${d.mO} meses</td><td style="color:var(--muted)">${d.c.tel||''}</td><td>${wa(d.c,`Olá ${fn(d.c.nome)}! Seu veículo está com a troca de óleo vencida. Quer agendar? 🔧`)}</td></tr>`).join('');
    vazio="Nenhum óleo vencido. 👏";
  } else if(tipo==='revisao'){
    titulo="🔧 Revisão vencida";
    const L=D.filter(d=>d.rev[0]==="Vencida");
    head="<tr><th>Cliente</th><th>Última revisão</th><th>Telefone</th><th>Ação</th></tr>";
    rows=L.map(d=>`<tr><td><b>${d.c.nome}</b></td><td style="color:var(--bad)">há ~${d.mR} meses</td><td style="color:var(--muted)">${d.c.tel||''}</td><td>${wa(d.c,`Olá ${fn(d.c.nome)}! Seu veículo está com a revisão vencida. Vamos agendar? 🚐`)}</td></tr>`).join('');
    vazio="Nenhuma revisão vencida. 👏";
  } else if(tipo==='inativos'){
    titulo="😴 Clientes inativos";
    const L=D.filter(d=>d.inativo);
    head="<tr><th>Cliente</th><th>Sem visita</th><th style='text-align:center'>OS</th><th>Ação</th></tr>";
    rows=L.map(d=>`<tr><td><b>${d.c.nome}</b></td><td>há ~${d.ultMes} meses</td><td style="text-align:center">${d.visitas}</td><td>${wa(d.c,`Olá ${fn(d.c.nome)}! Sentimos sua falta. Que tal um check-up no seu veículo? Temos condição especial de retorno. 🚐`)}</td></tr>`).join('');
    vazio="Nenhum cliente inativo. 👏";
  } else if(tipo==='nps'){
    titulo="⭐ NPS — composição";
    sub="Índice de satisfação (base demo)";
    const seg=[["Promotores (9–10)",78,"var(--ok)"],["Neutros (7–8)",16,"var(--warn)"],["Detratores (0–6)",6,"var(--bad)"]];
    head="<tr><th>Faixa</th><th style='text-align:right'>% da base</th></tr>";
    rows=seg.map(s=>`<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${s[2]};margin-right:8px"></span>${s[0]}</td><td style="text-align:right;font-weight:600">${s[1]}%</td></tr>`).join('')
      +`<tr><td style="border-top:1px solid var(--line)"><b>NPS = %Promotores − %Detratores</b></td><td style="text-align:right;border-top:1px solid var(--line);color:var(--gold-2);font-weight:700">72</td></tr>`;
  } else { // base
    titulo="👥 Base de clientes";
    sub="Ordenada por gasto acumulado";
    head="<tr><th>Cliente</th><th>Telefone</th><th style='text-align:center'>Visitas</th><th style='text-align:right'>Gasto total</th></tr>";
    rows=D.slice().sort((a,b)=>b.gasto-a.gasto).map(d=>`<tr><td><b>${d.c.nome}</b></td><td style="color:var(--muted)">${d.c.tel||''}</td><td style="text-align:center">${d.visitas}</td><td style="text-align:right;color:var(--gold-2);font-weight:600">${money(d.gasto)}</td></tr>`).join('');
    vazio="Nenhum cliente cadastrado.";
  }
  const colspan=(head.match(/<th/g)||[]).length||2;
  if(!rows)rows=`<tr><td colspan="${colspan}" style="color:var(--muted)">${vazio}</td></tr>`;
  modal(titulo,sub,`<div style="max-height:52vh;overflow:auto"><table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`, ()=>closeModal());
  const b=document.getElementById('mSave'); if(b)b.textContent="Fechar";
}
window.crmDrill=crmDrill;
