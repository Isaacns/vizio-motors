/* ============================================================
   Vizio Motors — app.js (lógica do sistema)
   Depende de dados.js (DADOS, STATUS_FLOW). Estado em memória
   (cópia de sessão). No go-live, persistência via Supabase.
   ============================================================ */
/* ===== emblema ===== */
const GEAR=(()=>{const n=12,rt=250,rr=214,tf=.36,rf=.62,s=2*Math.PI/n,P=(r,a)=>[300+r*Math.cos(a),300+r*Math.sin(a)];let p=[];
 for(let i=0;i<n;i++){const a=i*s-Math.PI/2;p.push(P(rr,a-s*rf/2),P(rt,a-s*tf/2),P(rt,a+s*tf/2),P(rr,a+s*rf/2));}
 return "M"+p.map(q=>q[0].toFixed(1)+" "+q[1].toFixed(1)).join(" L")+" Z";})();
const MED=327,MOFF=(600-MED)/2;
function emblemSVG(){var L=(window.BRAND_LOGO||'vizio-symbol-light.png');return `<svg viewBox="0 0 100 100" width="100%" height="100%" style="max-width:110px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image x="1" y="1" width="98" height="98" href="${L}" xlink:href="${L}"/></svg>`}

/* ===== estado ===== */
let WORK = JSON.parse(JSON.stringify(DADOS));
let CUR = "home";
const money = v => "R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const byId = (arr,id)=>arr.find(x=>x.id===id)||{};
const cli = id=>byId(WORK.clientes,id);
const veh = id=>byId(WORK.veiculos,id);
const svc = id=>byId(WORK.servicos,id);
const prt = id=>byId(WORK.pecas,id);
const osTotal = o => (o.itens||[]).reduce((s,i)=>s+(i.valor||0),0);
const nextNum = ()=> Math.max(1000,...WORK.os.map(o=>o.numero))+1;
const uid = p => p+"_"+Math.random().toString(36).slice(2,8);

/* ===== login / nav ===== */
function entrar(e){e.preventDefault();
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('emblemSide').innerHTML=emblemSVG();
  document.getElementById('emblemSide').firstElementChild.style.maxWidth='44px';
  go('home');
}
function sair(){location.hash='';location.reload();}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>{
  if(a.dataset.m){document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active');
    go(a.dataset.m,a.dataset.t);document.getElementById('side').classList.remove('open');}
}));
const TITLES={home:"Início",os:"Ordens de Serviço",agenda:"Agenda",clientes:"Clientes & Veículos",estoque:"Estoque Inteligente"};
function go(m,t){CUR=m;document.getElementById('q').value='';
  document.getElementById('pageTitle').textContent=TITLES[m]||t||"";
  ({home:renderHome,os:renderOS,agenda:renderAgenda,clientes:renderClientes,estoque:renderEstoque,stub:()=>renderStub(t)}[m]||renderHome)();
}
function onSearch(){const q=document.getElementById('q').value;
  if(CUR==='clientes')renderClientes(q);else if(CUR==='os')renderOS(q);else if(CUR==='estoque')renderEstoque(q);}

/* ===== HOME ===== */
function renderHome(){
  const emExec=WORK.os.filter(o=>o.statusIdx<8);
  const concl=WORK.os.filter(o=>o.statusIdx>=7);
  const critico=WORK.pecas.filter(p=>p.estoque<p.minimo);
  const aprov=WORK.os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const ticket=aprov.length?fat/aprov.length:0;
  const kpis=[
    ['Faturamento (aprovado)',money(fat),'up','▲ OS aprovadas no período'],
    ['OS em execução',emExec.length,'up',WORK.os.filter(o=>o.statusIdx===2).length+' aguardando aprovação'],
    ['Prontas p/ retirada',WORK.os.filter(o=>o.statusIdx===8).length,'up','concluídas: '+concl.length],
    ['Clientes ativos',WORK.clientes.length,'up','▲ base cadastrada'],
    ['Estoque crítico',critico.length,critico.length?'down':'up','itens abaixo do mínimo'],
    ['Ticket médio',money(ticket),'up','▲ por OS aprovada'],
  ];
  const alertas=[
    ['📦', critico.length?`<b>${critico.length} peça(s)</b> abaixo do mínimo: ${critico.map(p=>esc(p.nome)).join(', ')} — sugerir compra.`:'Estoque saudável — nenhuma peça abaixo do mínimo.'],
    ['🔔','<b>17 clientes</b> com troca de óleo vencida — campanha de recuperação pronta para disparo.'],
    ['⭐','<b>João Pereira</b> está há 8 meses sem revisão e tem histórico de aceitar preventiva.'],
    ['📉','Margem do serviço <b>“Revisão 40k”</b> caiu <b>18%</b> — custo de peça subiu no fornecedor atual.'],
  ];
  document.getElementById('view').innerHTML=`
   <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div><div class="dt ${k[2]}">${k[3]}</div></div>`).join('')}</div>
   <div class="grid2">
     <div class="panel"><div class="head"><h3>🚐 Veículos em execução</h3><div class="sp"></div><button class="b b-sm" onclick="go('os')">Ver todas</button></div>
       ${emExec.map(o=>{const v=veh(o.veiculoId),pct=Math.round(o.statusIdx/8*100);return `
        <div class="veh" onclick="openOS('${o.id}')"><div class="plate">${esc(v.placa)}</div>
          <div class="info"><div class="t">${esc(v.modelo)}</div><div class="s">OS #${o.numero} · ${esc(cli(o.clienteId).nome)}</div>
            <div class="bar"><i style="width:${pct}%"></i></div></div>
          <div class="stage">${STATUS_FLOW[o.statusIdx]}<br><span style="color:var(--dim);font-weight:400">${pct}%</span></div></div>`;}).join('')||'<div style="color:var(--muted);font-size:13px">Nenhum veículo em execução.</div>'}
     </div>
     <div class="panel"><h3>⚡ Motor Torque <span class="torque-badge">IA · RECOMENDA</span></h3>
       ${alertas.map(a=>`<div class="alert"><div class="ai">${a[0]}</div><div class="at">${a[1]}</div></div>`).join('')}
     </div>
   </div>`;
}

/* ===== ORDENS DE SERVIÇO ===== */
function renderOS(q){q=(q||'').toLowerCase();
  let list=WORK.os.slice().sort((a,b)=>b.numero-a.numero);
  if(q)list=list.filter(o=>{const v=veh(o.veiculoId),c=cli(o.clienteId);
    return (o.numero+'').includes(q)||(v.placa||'').toLowerCase().includes(q)||(c.nome||'').toLowerCase().includes(q);});
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>🔧 Ordens de Serviço</h3><div class="sp"></div>
     <button class="b" onclick="novaOS()">+ Nova OS</button></div>
     <table class="tbl"><thead><tr><th>OS</th><th>Placa</th><th>Cliente</th><th>Status</th><th>Previsão</th><th style="text-align:right">Valor</th></tr></thead>
     <tbody>${list.map(o=>{const v=veh(o.veiculoId);return `<tr onclick="openOS('${o.id}')">
       <td><b>#${o.numero}</b></td><td><span class="plate">${esc(v.placa)}</span></td>
       <td>${esc(cli(o.clienteId).nome)}</td><td><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></td>
       <td>${fmtD(o.previsao)}</td><td style="text-align:right;color:var(--gold-2);font-weight:600">${money(osTotal(o))}</td></tr>`;}).join('')}</tbody></table>
     ${list.length?'':'<div style="color:var(--muted);padding:14px;font-size:13px">Nenhuma OS encontrada.</div>'}</div>`;
}
function fmtD(d){if(!d)return'—';const p=d.split('-');return `${p[2]}/${p[1]}`;}

function openOS(id){const o=byId(WORK.os,id);const v=veh(o.veiculoId),c=cli(o.clienteId);
  document.getElementById('pageTitle').textContent="OS #"+o.numero;
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  const link=location.origin+location.pathname+"#p="+o.token;
  document.getElementById('view').innerHTML=`
   <button class="b-ghost b b-sm" onclick="go('os')">← Voltar</button>
   <div class="osgrid" style="margin-top:14px">
    <div>
     <div class="panel">
       <div class="head"><h3>Acompanhamento</h3><div class="sp"></div>
         <button class="b b-ghost b-sm" onclick="stepOS('${o.id}',-1)">◀ Voltar etapa</button>
         <button class="b b-sm" onclick="stepOS('${o.id}',1)">Avançar etapa ▶</button></div>
       <div class="timeline">${STATUS_FLOW.map((s,i)=>`<div class="step ${i<o.statusIdx?'done':''} ${i===o.statusIdx?'cur':''}"><div class="dot"></div>${s}</div>`).join('')}</div>
     </div>
     <div class="panel"><h3>Itens (serviços & peças)</h3>
       <div id="itens">${itensHTML(o)}</div>
       <div style="margin-top:12px"><button class="b b-ghost b-sm" onclick="addItem('${o.id}')">+ Adicionar item</button></div>
       <div class="tot"><div>Total da OS</div><div class="v">${money(osTotal(o))}</div></div>
     </div>
     <div class="panel"><h3>Checklist de entrada</h3>
       ${(o.checklist||[]).map((ck,i)=>`<div class="chk ${ck.ok?'on':''}" onclick="toggleChk('${o.id}',${i})"><div class="box">${ck.ok?'✓':''}</div>${ck.item}</div>`).join('')||'<div style="color:var(--muted);font-size:13px">Sem itens.</div>'}
     </div>
    </div>
    <div>
     <div class="panel">
       <h3>Dados da OS</h3>
       <div class="info-line"><span class="k">Status</span><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></div>
       <div class="info-line"><span class="k">Cliente</span><span>${esc(c.nome)}</span></div>
       <div class="info-line"><span class="k">Veículo</span><span>${esc(v.modelo)}</span></div>
       <div class="info-line"><span class="k">Placa</span><span class="plate">${esc(v.placa)}</span></div>
       <div class="info-line"><span class="k">Entrada</span><span>${fmtD(o.entrada)}</span></div>
       <div class="info-line"><span class="k">Previsão</span><span>${fmtD(o.previsao)}</span></div>
       <div class="info-line"><span class="k">Responsável</span><span>${esc(o.responsavel)||'—'}</span></div>
       <div class="info-line"><span class="k">Orçamento</span><span style="color:${o.aprovado?'var(--ok)':'var(--warn)'}">${o.aprovado?'Aprovado':'Aguardando'}</span></div>
       <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
         <button class="b b-sm" onclick="toggleAprov('${o.id}')">${o.aprovado?'Marcar pendente':'Aprovar orçamento'}</button>
         <button class="b b-ghost b-sm" onclick="printOS('${o.id}')">🖨 Imprimir</button>
         <button class="b b-ghost b-sm" onclick="editOS('${o.id}')">Editar</button>
         <button class="b b-danger b-sm" onclick="delOS('${o.id}')">Excluir</button>
       </div>
     </div>
     <div class="panel">
       <h3>📲 Portal do Cliente</h3>
       <div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Link de acompanhamento (sem login) para enviar ao cliente:</div>
       <input readonly value="${link}" onclick="this.select()" style="font-size:11.5px">
       <div style="margin-top:10px;display:flex;gap:8px"><button class="b b-sm" onclick="copyLink('${link}')">Copiar link</button>
         <button class="b b-ghost b-sm" onclick="abrirPortal('${o.token}')">Abrir portal</button></div>
     </div>
     <div class="panel"><h3>Observações</h3><div style="font-size:13px;color:var(--txt);line-height:1.5">${esc(o.obs)||'—'}</div></div>
    </div>
   </div>`;
}
function itensHTML(o){return (o.itens||[]).map((it,i)=>{const ref=it.tipo==='servico'?svc(it.refId):prt(it.refId);
  return `<div class="itemrow"><div class="g">${it.tipo==='servico'?'🔧':'📦'} ${esc(ref.nome)||'—'} ${it.qtd>1?'× '+it.qtd:''}</div>
   <div class="money">${money(it.valor)}</div><button class="b b-danger b-sm" onclick="delItem('${o.id}',${i})">✕</button></div>`;}).join('')
   ||'<div style="color:var(--muted);font-size:13px">Nenhum item ainda.</div>';}
function stepOS(id,d){const o=byId(WORK.os,id);o.statusIdx=Math.max(0,Math.min(8,o.statusIdx+d));openOS(id);}
function toggleChk(id,i){const o=byId(WORK.os,id);o.checklist[i].ok=!o.checklist[i].ok;openOS(id);}
function toggleAprov(id){const o=byId(WORK.os,id);o.aprovado=!o.aprovado;openOS(id);}
function delItem(id,i){const o=byId(WORK.os,id);o.itens.splice(i,1);openOS(id);}
function copyLink(l){if(navigator.clipboard)navigator.clipboard.writeText(l);toast('Link copiado!');}
function addItem(id){const o=byId(WORK.os,id);
  const opts=`<optgroup label="Serviços">${WORK.servicos.map(s=>`<option value="servico:${s.id}">${esc(s.nome)} — ${money(s.preco)}</option>`).join('')}</optgroup>
   <optgroup label="Peças">${WORK.pecas.map(p=>`<option value="peca:${p.id}">${esc(p.nome)} — ${money(p.preco)}</option>`).join('')}</optgroup>`;
  modal("Adicionar item","OS #"+o.numero,`
    <label>Item</label><select id="f_item">${opts}</select>
    <label>Quantidade</label><input id="f_qtd" type="number" value="1" min="1">`,
   ()=>{const parts=document.getElementById('f_item').value.split(':');const tipo=parts[0],refId=parts[1];const qtd=+document.getElementById('f_qtd').value||1;
     const ref=tipo==='servico'?svc(refId):prt(refId);o.itens.push({tipo,refId,qtd,valor:(ref.preco||0)*qtd});closeModal();openOS(id);});
}
function novaOS(){
  modal("Nova Ordem de Serviço","Selecione cliente e veículo",`
    <label>Cliente</label><select id="f_cli" onchange="fillVeic()">${WORK.clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select>
    <label>Veículo</label><select id="f_vei"></select>
    <div class="frow"><div><label>Responsável</label><input id="f_resp" placeholder="Mecânico"></div>
    <div><label>Previsão</label><input id="f_prev" type="date"></div></div>
    <label>Observações</label><textarea id="f_obs" placeholder="Relato do cliente…"></textarea>`,
   ()=>{const o={id:uid('OS'),numero:nextNum(),clienteId:document.getElementById('f_cli').value,
     veiculoId:document.getElementById('f_vei').value,entrada:today(),previsao:document.getElementById('f_prev').value||'',
     responsavel:document.getElementById('f_resp').value,statusIdx:0,aprovado:false,token:'vm-'+Date.now().toString(36)+Math.random().toString(36).slice(2,12),
     checklist:[{item:'Pneus',ok:false},{item:'Nível de óleo',ok:false},{item:'Freios',ok:false},{item:'Bateria',ok:false}],
     itens:[],obs:document.getElementById('f_obs').value};
     WORK.os.push(o);closeModal();openOS(o.id);});
  fillVeic();
}
function fillVeic(){const c=document.getElementById('f_cli').value;const sel=document.getElementById('f_vei');
  const vs=WORK.veiculos.filter(v=>v.clienteId===c);
  sel.innerHTML=vs.map(v=>`<option value="${v.id}">${esc(v.placa)} — ${esc(v.modelo)}</option>`).join('')||'<option value="">Sem veículo cadastrado</option>';}
function editOS(id){const o=byId(WORK.os,id);
  modal("Editar OS","#"+o.numero,`
    <div class="frow"><div><label>Responsável</label><input id="f_resp" value="${esc(o.responsavel)}"></div>
    <div><label>Previsão</label><input id="f_prev" type="date" value="${o.previsao||''}"></div></div>
    <label>Observações</label><textarea id="f_obs">${esc(o.obs)}</textarea>`,
   ()=>{o.responsavel=document.getElementById('f_resp').value;o.previsao=document.getElementById('f_prev').value;
     o.obs=document.getElementById('f_obs').value;closeModal();openOS(id);});
}
function delOS(id){confirmar("Excluir esta OS?",()=>{WORK.os=WORK.os.filter(o=>o.id!==id);closeModal();go('os');});}
function printOS(id){const o=byId(WORK.os,id),c=cli(o.clienteId),v=veh(o.veiculoId);
  const linhas=(o.itens||[]).map(i=>{const r=i.tipo==='servico'?svc(i.refId):prt(i.refId);
    return `<tr><td>${esc(r.nome)}</td><td class="ct">${i.qtd}</td><td class="rt">${money(i.valor)}</td></tr>`;}).join('');
  const chk=(o.checklist||[]).map(x=>`<span style="display:inline-block;margin:2px 8px 2px 0">${x.ok?'☑':'☐'} ${x.item}</span>`).join('');
  const nome=(window.BRAND_NAME)||(document.getElementById('brandName')?document.getElementById('brandName').textContent:'Vizio Motors');
  const w=window.open('','_blank');
  w.document.write(`<html><head><meta charset="utf-8"><title>OS ${o.numero}</title><style>
   body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:32px;max-width:740px;margin:auto}
   .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #111;padding-bottom:10px}
   h1{font-size:20px;margin:0}.muted{color:#666;font-size:12px}
   table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ddd;padding:8px;font-size:13px}
   th{text-align:left;background:#f3f3f3}.ct{text-align:center}.rt{text-align:right}
   .tot{text-align:right;font-size:19px;font-weight:bold;margin-top:12px}
   .box{border:1px solid #ddd;border-radius:8px;padding:12px;margin-top:14px;font-size:13px}
   .sign{margin-top:70px;display:flex;justify-content:space-between}
   .sign div{border-top:1px solid #111;width:44%;text-align:center;padding-top:6px;font-size:12px}
   @media print{button{display:none}}
  </style></head><body>
   <div class="hd"><div><h1>${esc(nome)}</h1><div class="muted">Ordem de Serviço</div></div>
     <div class="rt"><h1>OS #${o.numero}</h1><div class="muted">Entrada: ${fmtFull(o.entrada||'')} · Prev.: ${fmtFull(o.previsao||'')}</div></div></div>
   <div class="box"><b>Cliente:</b> ${esc(c.nome)} — ${esc(c.tel)}<br>
     <b>Veículo:</b> ${esc(v.modelo)} — Placa <b>${esc(v.placa)}</b><br>
     <b>Responsável:</b> ${esc(o.responsavel)||'—'} · <b>Status:</b> ${STATUS_FLOW[o.statusIdx]} · <b>Orçamento:</b> ${o.aprovado?'Aprovado':'Pendente'}</div>
   <table><thead><tr><th>Item (serviço/peça)</th><th class="ct">Qtd</th><th class="rt">Valor</th></tr></thead>
     <tbody>${linhas||'<tr><td colspan="3">Sem itens</td></tr>'}</tbody></table>
   <div class="tot">Total: ${money(osTotal(o))}</div>
   ${chk?`<div class="box"><b>Checklist de entrada:</b><br>${chk}</div>`:''}
   ${o.obs?`<div class="box"><b>Observações:</b> ${esc(o.obs)}</div>`:''}
   <div class="sign"><div>Assinatura do cliente</div><div>Responsável técnico</div></div>
   <div style="text-align:center;margin-top:24px;color:#999;font-size:11px">Emitido por Vizio Motors · ${fmtFull(today())}</div>
   <script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();}

/* ===== CLIENTES & VEÍCULOS ===== */
function renderClientes(q){q=(q||'').toLowerCase();
  let list=WORK.clientes.filter(c=>!q||c.nome.toLowerCase().includes(q)||(c.tel||'').includes(q));
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>🚐 Clientes</h3><div class="sp"></div>
     <button class="b b-ghost b-sm" onclick="novoVeic()">+ Veículo</button>
     <button class="b" onclick="novoCli()">+ Cliente</button></div>
     <table class="tbl"><thead><tr><th>Cliente</th><th>Contato</th><th>Veículos</th><th>OS</th><th></th></tr></thead>
     <tbody>${list.map(c=>{const vs=WORK.veiculos.filter(v=>v.clienteId===c.id);const nos=WORK.os.filter(o=>o.clienteId===c.id).length;
       return `<tr><td onclick="openCli('${c.id}')"><b>${esc(c.nome)}</b></td><td onclick="openCli('${c.id}')">${esc(c.tel)}<br><span style="color:var(--muted);font-size:12px">${esc(c.email)}</span></td>
       <td onclick="openCli('${c.id}')">${vs.map(v=>`<span class="plate" style="margin:1px">${esc(v.placa)}</span>`).join(' ')||'—'}</td>
       <td onclick="openCli('${c.id}')">${nos}</td>
       <td class="acoes">${window.waBtn?waBtn(c.tel,`Olá ${(c.nome||'').split(' ')[0]}! Aqui é da ${window.BRAND_NAME||'nossa oficina'}. Como podemos ajudar com o seu veículo?`,'WhatsApp →'):''}
       <button class="b b-ghost b-sm" onclick="editCli('${c.id}')">Editar</button></td></tr>`;}).join('')}</tbody></table></div>`;
}
function openCli(id){const c=byId(WORK.clientes,id);const vs=WORK.veiculos.filter(v=>v.clienteId===id);
  const oss=WORK.os.filter(o=>o.clienteId===id).sort((a,b)=>b.numero-a.numero);
  document.getElementById('view').innerHTML=`
   <button class="b b-ghost b-sm" onclick="go('clientes')">← Voltar</button>
   <div class="osgrid" style="margin-top:14px">
     <div>
       <div class="panel"><div class="head"><h3>Veículos de ${esc(c.nome)}</h3><div class="sp"></div><button class="b b-sm" onclick="novoVeic('${id}')">+ Veículo</button></div>
         ${vs.map(v=>`<div class="veh"><div class="plate">${esc(v.placa)}</div><div class="info"><div class="t">${esc(v.modelo)}</div>
           <div class="s">${v.ano} · ${(v.km||0).toLocaleString('pt-BR')} km · ${esc(v.cor)} · ${esc(v.combustivel)}</div></div>
           <button class="b b-ghost b-sm" onclick="editVeic('${v.id}')">Editar</button></div>`).join('')||'<div style="color:var(--muted);font-size:13px">Sem veículos.</div>'}
       </div>
       <div class="panel"><h3>Histórico de OS</h3>
         <table class="tbl"><tbody>${oss.map(o=>`<tr onclick="openOS('${o.id}')"><td>#${o.numero}</td><td>${fmtD(o.entrada)}</td>
           <td><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></td><td style="text-align:right;color:var(--gold-2)">${money(osTotal(o))}</td></tr>`).join('')||'<tr><td style="color:var(--muted)">Nenhuma OS.</td></tr>'}</tbody></table>
       </div>
     </div>
     <div class="panel"><h3>Ficha</h3>
       <div class="info-line"><span class="k">Telefone</span><span>${esc(c.tel)||'—'}</span></div>
       <div class="info-line"><span class="k">E-mail</span><span>${esc(c.email)||'—'}</span></div>
       <div class="info-line"><span class="k">Aniversário</span><span>${c.nasc?fmtFull(c.nasc):'—'}</span></div>
       <div class="info-line"><span class="k">Observações</span><span style="max-width:180px;text-align:right">${esc(c.obs)||'—'}</span></div>
       <div style="margin-top:14px;display:flex;gap:8px"><button class="b b-sm" onclick="editCli('${id}')">Editar cliente</button>
         ${window.waBtn?waBtn(c.tel,`Olá ${(c.nome||'').split(' ')[0]}! Aqui é da ${window.BRAND_NAME||'nossa oficina'}. Como podemos ajudar com o seu veículo?`,'WhatsApp →'):''}</div>
     </div>
   </div>`;
}
function fmtFull(d){const p=d.split('-');return `${p[2]}/${p[1]}/${p[0]}`;}
function novoCli(){formCli();}
function editCli(id){formCli(byId(WORK.clientes,id));}
function formCli(c){c=c||{};const ed=!!c.id;
  modal(ed?"Editar cliente":"Novo cliente","",`
    <label>Nome</label><input id="f_nome" value="${esc(c.nome)}">
    <div class="frow"><div><label>Telefone</label><input id="f_tel" value="${esc(c.tel)}"></div>
    <div><label>Aniversário</label><input id="f_nasc" type="date" value="${c.nasc||''}"></div></div>
    <label>E-mail</label><input id="f_email" value="${esc(c.email)}">
    <label>Observações</label><textarea id="f_obs">${esc(c.obs)}</textarea>`,
   ()=>{const o={nome:document.getElementById('f_nome').value,tel:document.getElementById('f_tel').value,
     nasc:document.getElementById('f_nasc').value,email:document.getElementById('f_email').value,obs:document.getElementById('f_obs').value};
     if(!o.nome){toast('Informe o nome');return;}
     if(ed){Object.assign(c,o);}else{WORK.clientes.push({id:uid('C'),...o});}
     closeModal();go('clientes');});
}
function novoVeic(cliId){formVeic({clienteId:cliId});}
function editVeic(id){formVeic(byId(WORK.veiculos,id));}
function formVeic(v){v=v||{};const ed=!!v.id;
  modal(ed?"Editar veículo":"Novo veículo","",`
    <label>Cliente</label><select id="f_cli">${WORK.clientes.map(c=>`<option value="${c.id}" ${c.id===v.clienteId?'selected':''}>${esc(c.nome)}</option>`).join('')}</select>
    <div class="frow"><div><label>Placa</label><input id="f_placa" value="${esc(v.placa)}"></div>
    <div><label>Ano</label><input id="f_ano" type="number" value="${v.ano||''}"></div></div>
    <label>Modelo</label><input id="f_modelo" value="${esc(v.modelo)}" placeholder="Ex.: Fiat Toro 2.0">
    <div class="frow"><div><label>KM</label><input id="f_km" type="number" value="${v.km||0}"></div>
    <div><label>Cor</label><input id="f_cor" value="${esc(v.cor)}"></div></div>
    <label>Combustível</label><select id="f_comb"><option ${v.combustivel==='Diesel'?'selected':''}>Diesel</option><option ${v.combustivel==='Flex'?'selected':''}>Flex</option><option ${v.combustivel==='Gasolina'?'selected':''}>Gasolina</option></select>`,
   ()=>{const o={clienteId:document.getElementById('f_cli').value,placa:document.getElementById('f_placa').value.toUpperCase(),
     ano:+document.getElementById('f_ano').value,modelo:document.getElementById('f_modelo').value,km:+document.getElementById('f_km').value,
     cor:document.getElementById('f_cor').value,combustivel:document.getElementById('f_comb').value};
     if(!o.placa){toast('Informe a placa');return;}
     if(ed){Object.assign(v,o);}else{WORK.veiculos.push({id:uid('V'),...o});}
     closeModal();CUR==='clientes'?openCli(o.clienteId):go('clientes');});
}

/* ===== ESTOQUE ===== */
function renderEstoque(q){q=(q||'').toLowerCase();
  let list=WORK.pecas.filter(p=>!q||p.nome.toLowerCase().includes(q));
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>📦 Estoque Inteligente</h3><div class="sp"></div>
     <span style="font-size:12px;color:var(--muted)">${WORK.pecas.filter(p=>p.estoque<p.minimo).length} abaixo do mínimo</span></div>
     <table class="tbl"><thead><tr><th>Peça</th><th>Fornecedor</th><th style="text-align:center">Estoque</th><th style="text-align:center">Mínimo</th><th style="text-align:right">Preço</th><th></th></tr></thead>
     <tbody>${list.map(p=>{const low=p.estoque<p.minimo;return `<tr><td><b>${esc(p.nome)}</b></td><td style="color:var(--muted)">${esc(p.fornecedor)}</td>
       <td style="text-align:center;color:${low?'var(--bad)':'var(--txt)'};font-weight:600">${p.estoque}</td>
       <td style="text-align:center;color:var(--muted)">${p.minimo}</td><td style="text-align:right;color:var(--gold-2)">${money(p.preco)}</td>
       <td style="text-align:right">${low?'<span class="badge s1">Repor</span>':'<span class="badge s7">OK</span>'}</td></tr>`;}).join('')}</tbody></table></div>`;
}

/* ===== AGENDA ===== */
function renderAgenda(){
  const dias={};WORK.agenda.slice().sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora)).forEach(a=>{(dias[a.data]=dias[a.data]||[]).push(a);});
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>🗓 Agenda</h3><div class="sp"></div><button class="b" onclick="novoAg()">+ Agendamento</button></div>
     ${Object.keys(dias).map(d=>`<div style="margin-bottom:18px"><div style="font-family:var(--display);color:var(--gold-2);font-size:15px;margin-bottom:8px">${fmtFull(d)}</div>
       ${dias[d].map(a=>{const v=veh(a.veiculoId);return `<div class="veh" style="cursor:pointer" onclick="editAg('${a.id}')"><div class="plate">${a.hora}</div>
         <div class="info"><div class="t">${esc(a.tipo)} · ${esc(cli(a.clienteId).nome)}</div><div class="s">${esc(v.placa)} ${esc(v.modelo)} — ${esc(a.obs)}</div></div>${agBadge(a)}
         <div style="display:flex;gap:6px" onclick="event.stopPropagation()"><button class="b b-ghost b-sm" title="Editar" onclick="editAg('${a.id}')">✏️</button><button class="b b-ghost b-sm" title="Excluir" onclick="delAg('${a.id}')">🗑</button></div></div>`;}).join('')}</div>`).join('')}
   </div>`;
}
function formAg(a){a=a||{};const ed=!!a.id;const TIPOS=['Revisão','Retorno','Diagnóstico','Orçamento'];
  modal(ed?"Editar agendamento":"Novo agendamento","",`
   <div class="frow"><div><label>Data</label><input id="a_data" type="date" value="${a.data||today()}"></div>
   <div><label>Hora</label><input id="a_hora" type="time" value="${a.hora||'09:00'}"></div></div>
   <label>Cliente</label><select id="a_cli" onchange="agVeic()">${WORK.clientes.map(c=>`<option value="${c.id}"${a.clienteId===c.id?' selected':''}>${esc(c.nome)}</option>`).join('')}</select>
   <label>Veículo</label><select id="a_vei"></select>
   <div class="frow"><div><label>Tipo</label><select id="a_tipo">${TIPOS.map(t=>`<option${a.tipo===t?' selected':''}>${t}</option>`).join('')}</select></div>
   <div><label>Obs</label><input id="a_obs" value="${esc(a.obs)}"></div></div>`,
  ()=>{const rec={data:document.getElementById('a_data').value,hora:document.getElementById('a_hora').value,
    clienteId:document.getElementById('a_cli').value,veiculoId:document.getElementById('a_vei').value,
    tipo:document.getElementById('a_tipo').value,obs:document.getElementById('a_obs').value};
    if(ed){Object.assign(a,rec);}else{WORK.agenda.push(Object.assign({id:uid('A')},rec));}
    closeModal();renderAgenda();});
  agVeic(); if(ed&&a.veiculoId){const sel=document.getElementById('a_vei');if(sel)sel.value=a.veiculoId;}
}
function novoAg(){formAg();}
function editAg(id){formAg(byId(WORK.agenda,id));}
function delAg(id){confirmar("Excluir este agendamento?",()=>{WORK.agenda=WORK.agenda.filter(a=>a.id!==id);closeModal();renderAgenda();});}
function agVeic(){const c=document.getElementById('a_cli').value,sel=document.getElementById('a_vei');
  const vs=WORK.veiculos.filter(v=>v.clienteId===c);sel.innerHTML=vs.map(v=>`<option value="${v.id}">${esc(v.placa)} — ${esc(v.modelo)}</option>`).join('');}

/* ===== alertas de agenda (5/10/15 min antes) ===== */
function agMins(a){try{const t=new Date((a.data||'')+'T'+(a.hora||'00:00')+':00');return (t-Date.now())/60000;}catch(e){return 99999;}}
function agBadge(a){const m=agMins(a); if(m>=0&&m<=15){return `<div class="stage" style="color:var(--warn)">⏰ em ${Math.max(0,Math.round(m))} min</div>`;} return '';}
const _agAlerted={};
function checkAgendaAlerts(){(WORK.agenda||[]).forEach(a=>{const m=agMins(a);[15,10,5].forEach(th=>{const key=a.id+'-'+th;
  if(m>0&&m<=th&&m>th-2&&!_agAlerted[key]){_agAlerted[key]=1;toast('⏰ '+(cli(a.clienteId).nome||'Cliente')+' — agendamento em ~'+th+' min');}});});}

function renderStub(t){document.getElementById('view').innerHTML=`
   <div class="panel" style="text-align:center;padding:60px 24px"><div style="font-family:var(--display);font-size:22px;color:var(--gold-2);margin-bottom:8px">${t||''}</div>
     <div style="color:var(--muted);max-width:460px;margin:0 auto;line-height:1.6">Módulo mapeado no kickoff do Vizio Motors. Entra na fase correspondente do plano de execução — a fundação viva já está pronta para recebê-lo.</div></div>`;}

/* ===== MODAL / TOAST ===== */
function modal(title,sub,body,onSave){document.getElementById('modal-root').innerHTML=`
   <div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">
     <h3>${title}</h3>${sub?`<div class="msub">${sub}</div>`:''}${body}
     <div class="mact"><button class="b b-ghost" onclick="closeModal()">Cancelar</button><button class="b" id="mSave">Salvar</button></div>
   </div></div>`;document.getElementById('mSave').onclick=onSave;}
function confirmar(msg,onYes){document.getElementById('modal-root').innerHTML=`
   <div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-width:380px">
     <h3>Confirmar</h3><div class="msub">${msg}</div>
     <div class="mact"><button class="b b-ghost" onclick="closeModal()">Cancelar</button><button class="b b-danger" id="mYes">Excluir</button></div></div></div>`;
   document.getElementById('mYes').onclick=onYes;}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
function toast(m){const t=document.createElement('div');t.textContent=m;
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99;background:var(--panel);border:1px solid var(--line);color:var(--gold-2);padding:11px 20px;border-radius:12px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.4)';
  document.body.appendChild(t);setTimeout(()=>t.remove(),1800);}
function today(){return new Date().toISOString().slice(0,10);}

/* ===== PORTAL DO CLIENTE (público, sem login) ===== */
function abrirPortal(token){location.hash='p='+token;renderPortal(token);}
function renderPortal(token){
  const o=WORK.os.find(x=>x.token===token);
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='none';
  const P=document.getElementById('portal');P.style.display='flex';
  if(!o){P.innerHTML=`<div class="pcard card-glass" style="padding:40px;text-align:center">OS não encontrada.</div>`;return;}
  const v=veh(o.veiculoId);const pct=Math.round(o.statusIdx/8*100);
  P.innerHTML=`<div class="pcard">
    <div class="phead"><div class="emblem" id="emblemP" style="width:76px;margin:0 auto"></div>
      <div class="pbrand">${esc((window.BRAND_NAME||'Vizio Motors').toUpperCase())}</div>
      <div style="color:var(--muted);font-size:12px;letter-spacing:1px">ACOMPANHAMENTO DO SEU VEÍCULO</div></div>
    <div class="card-glass pbig">
      <div style="color:var(--muted);font-size:12px">OS #${o.numero} · ${esc(v.modelo)}</div>
      <div class="plate" style="margin:8px 0;font-size:15px">${esc(v.placa)}</div>
      <div class="stt">${STATUS_FLOW[o.statusIdx]}</div>
      <div style="color:var(--muted);font-size:13px">${o.statusIdx>=8?'Seu veículo está pronto! 🎉':'Previsão de entrega: '+fmtFull(o.previsao||o.entrada)}</div>
      <div class="pbar"><i style="width:${pct}%"></i></div>
      <div style="color:var(--muted);font-size:12px">${pct}% concluído</div>
    </div>
    <div class="card-glass" style="padding:14px 18px;margin-top:16px">
      ${STATUS_FLOW.map((s,i)=>`<div class="pstep ${i<o.statusIdx?'done':''} ${i===o.statusIdx?'cur':''}">
        <div class="pd">${i<o.statusIdx?'✓':(i===o.statusIdx?'●':i+1)}</div>
        <div class="pl">${s}${i===o.statusIdx?'<small>etapa atual</small>':''}</div></div>`).join('')}
    </div>
    <div class="card-glass" style="padding:16px 18px;margin-top:16px">
      <div class="info-line"><span class="k">Responsável</span><span>${esc(o.responsavel)||'Equipe'}</span></div>
      ${o.aprovado?`<div class="info-line"><span class="k">Valor aprovado</span><span style="color:var(--gold-2);font-weight:600">${money(osTotal(o))}</span></div>`:''}
      <div class="info-line" style="border:none"><span class="k">Observações</span><span style="max-width:60%;text-align:right">${esc(o.obs)||'—'}</span></div>
      <button class="btn" style="margin-top:14px" onclick="this.textContent='🔔 Você será avisado quando ficar pronto!';this.disabled=true">🔔 Receber notificação quando finalizar</button>
    </div>
    <div style="text-align:center;color:var(--dim);font-size:11px;margin:18px 0">Atualiza em tempo real · powered by <b style="color:var(--gold-2)">Vizio Motors</b></div>
  </div>`;
  document.getElementById('emblemP').innerHTML=emblemSVG();
  document.getElementById('emblemP').firstElementChild.style.maxWidth='76px';
}

/* ===== movimento ambiente ===== */
const glow=document.getElementById('cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.opacity=1;glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';});
window.addEventListener('pointerleave',()=>glow.style.opacity=0);
(function(){const bg=document.getElementById('bg');for(let i=0;i<14;i++){const s=document.createElement('div');s.className='spark';
  s.style.left=Math.random()*100+'%';s.style.animationDuration=(9+Math.random()*10)+'s';s.style.animationDelay=(-Math.random()*12)+'s';
  s.style.opacity=(.2+Math.random()*.4);s.style.width=s.style.height=(4+Math.random()*4)+'px';bg.appendChild(s);}})();

/* ===== boot ===== */
document.getElementById('emblemLogin').innerHTML=emblemSVG();
document.getElementById('emblemLogin').firstElementChild.style.maxWidth='120px';
(function boot(){const h=location.hash;
  if(h.indexOf('#p=')===0){renderPortal(h.slice(3));}
  setInterval(checkAgendaAlerts,30000);
})();
