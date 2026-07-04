/* ============================================================
   Vizio Motors — alavancagem-vm.js (Fase 6 · Comercial)
   Máquina de Vendas / Alavancagem (formato Inovar/Ateliê):
   META do período, OPORTUNIDADES automáticas e COMBOS promocionais
   (sugeridos + personalizados) para vender mais.
   Depende de app.js (WORK, money, cli, veh, svc, prt, osTotal,
   modal, closeModal, toast, uid, go, today).
   ============================================================ */
const ALAV_META = 90000;            // meta de faturamento (referência)
const ALAV_CKEY = "vm_combos_v1";
function alavCombos(){ try{return JSON.parse(localStorage.getItem(ALAV_CKEY)||"[]")||[];}catch(e){return [];} }
function alavSaveCombos(l){ try{localStorage.setItem(ALAV_CKEY,JSON.stringify(l));}catch(e){} }

function abrirAlavancagem(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Alavancagem";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderAlavancagem();
}

function alavOportunidades(){
  const out=[], os=WORK.os, mesAtual=new Date(today()).getMonth();
  const pend=os.filter(o=>!o.aprovado);
  if(pend.length) out.push({ic:"💰",cor:"#e5644e",t:pend.length+" orçamento(s) aguardando aprovação",
    d:"≈ "+money(pend.reduce((s,o)=>s+osTotal(o),0))+" parados. Ligue e feche a aprovação.",cta:"Ver Ordens de Serviço",act:"go('os')"});
  const aniv=WORK.clientes.filter(c=>c.nasc && new Date(c.nasc).getMonth()===mesAtual);
  if(aniv.length) out.push({ic:"🎂",cor:"#5aa0ff",t:aniv.length+" aniversariante(s) no mês",
    d:"Felicite e ofereça um brinde/revisão de cortesia — ótimo gancho de venda.",cta:"Ver CRM & Receita",act:"abrirCRM()"});
  const paradas=WORK.pecas.filter(p=>!os.some(o=>(o.itens||[]).some(i=>i.tipo==='peca'&&i.refId===p.id)));
  if(paradas.length) out.push({ic:"📦",cor:"#f0894e",t:paradas.length+" peça(s) paradas em estoque",
    d:"Capital parado: "+money(paradas.reduce((s,p)=>s+(p.custo||0)*p.estoque,0))+". Crie um combo para girar.",cta:"Ver Estoque",act:"abrirEstoquePred()"});
  const umaVisita=WORK.clientes.filter(c=>os.filter(o=>o.clienteId===c.id).length===1);
  if(umaVisita.length) out.push({ic:"⭐",cor:"#4ecb8f",t:umaVisita.length+" cliente(s) de 1ª visita",
    d:"Ofereça um plano de revisão preventiva para fidelizar e aumentar o LTV.",cta:"Ver Clientes",act:"go('clientes')"});
  return out;
}

function alavSugestoes(){
  const s=[]; const find=kw=>{const re=new RegExp(kw,"i");
    return WORK.servicos.find(x=>re.test(x.nome))||WORK.pecas.find(x=>re.test(x.nome));};
  function combo(nome,itens,desc){itens=itens.filter(Boolean); if(itens.length<2)return;
    const normal=itens.reduce((a,x)=>a+(x.preco||0),0); const promo=Math.round(normal*0.85);
    s.push({nome,itens:itens.map(x=>({nome:x.nome,preco:x.preco||0})),precoNormal:normal,precoPromo:promo,desc});}
  combo("Combo Revisão + Filtros",[find("Revisão 40"),find("Filtro de óleo"),find("Filtro de combust")],"Revisão com a troca dos filtros — ticket maior.");
  combo("Combo Freios Completo",[find("Freios"),find("Pastilha"),find("Disco de freio")],"Serviço + pastilhas + discos, tudo de uma vez.");
  combo("Combo Suspensão",[find("Suspensão"),find("Amortecedor")],"Suspensão com os amortecedores inclusos.");
  return s;
}

function renderAlavancagem(){
  const os=WORK.os, aprov=os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const pct=Math.min(100,Math.round(fat/ALAV_META*100));
  const ops=alavOportunidades(), sug=alavSugestoes(), cbs=alavCombos();
  // produtividade por mecânico
  const prod={}; os.forEach(o=>{const m=(o.responsavel||'—').split(' ')[0];
    prod[m]=prod[m]||{os:0,receita:0}; prod[m].os++; prod[m].receita+=osTotal(o);});
  const rank=Object.entries(prod).sort((a,b)=>b[1].receita-a[1].receita);

  const kpis=[
    ['Meta do mês',money(ALAV_META)],['Faturado',money(fat)],
    ['Oportunidades',ops.length],['Combos',cbs.length+' (+'+sug.length+' sug.)'],
  ];
  const comboCard=(c,sugerido,idx)=>{
    const eco=(c.precoNormal||0)-(c.precoPromo||0);
    const itens=(c.itens||[]).map(x=>x.nome).join(" + ");
    return `<div class="veh" style="align-items:flex-start;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px;width:100%"><b style="flex:1">${c.nome}</b>
        ${sugerido?'<span class="badge s1">sugestão</span>':(c.periodo?`<span class="badge s0">${c.periodo}</span>`:'')}</div>
      <div style="font-size:12px;color:var(--muted)">${itens}${c.desc?' — '+c.desc:''}</div>
      <div style="display:flex;align-items:baseline;gap:10px"><span style="text-decoration:line-through;color:var(--muted);font-size:12px">${money(c.precoNormal)}</span>
        <b style="color:var(--ok);font-size:17px">${money(c.precoPromo)}</b>${eco>0?`<span style="font-size:11px;color:var(--ok)">economize ${money(eco)}</span>`:''}</div>
      <div style="display:flex;gap:7px;margin-top:2px">
        ${sugerido?`<button class="b b-sm" onclick="alavCriarSug(${idx})">+ Salvar combo</button>`
          :`<button class="b b-sm" onclick="alavCopiar('${c.id}')">📋 Copiar oferta</button>
            <button class="b b-ghost b-sm" onclick="alavRemover('${c.id}')">🗑</button>`}</div>
    </div>`;};

  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>⚡ Máquina de Vendas <span class="torque-badge">ALAVANCAGEM</span></h3></div>
     <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>Progresso da meta</span>
       <span style="color:var(--gold-2)">${money(fat)} / ${money(ALAV_META)} · ${pct}%</span></div>
     <div class="bar"><i style="width:${pct}%"></i></div>
   </div>
   <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div></div>`).join('')}</div>

   <div class="panel"><h3>🎯 Oportunidades do período</h3>
     <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Geradas automaticamente a partir das OS, clientes e estoque.</div>
     ${ops.length?ops.map(o=>`<div class="alert" style="border-left-color:${o.cor}"><div class="ai">${o.ic}</div>
       <div class="at"><b>${o.t}</b><br><span style="color:var(--muted)">${o.d}</span><br>
       <button class="b b-sm" style="margin-top:6px" onclick="${o.act}">${o.cta} →</button></div></div>`).join('')
       :'<div style="color:var(--muted);font-size:13px">Sem oportunidades no momento. 👍</div>'}
   </div>

   <div class="panel"><div class="head"><h3>🏷️ Combos promocionais</h3><div class="sp"></div>
       <button class="b b-sm" onclick="alavNovoCombo()">+ Novo combo</button></div>
     <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Pacotes com preço especial. Use "Copiar oferta" para mandar no WhatsApp.</div>
     ${cbs.length?cbs.map(c=>comboCard(c,false)).join(''):'<div style="color:var(--muted);font-size:13px;margin-bottom:8px">Nenhum combo criado ainda.</div>'}
     ${sug.length?`<div style="font-family:var(--display);color:var(--gold-2);margin:14px 0 6px">Sugestões automáticas</div>`+sug.map((c,i)=>comboCard(c,true,i)).join(''):''}
   </div>

   <div class="panel"><h3>🏅 Produtividade por mecânico</h3>
     <table class="tbl"><thead><tr><th>Mecânico</th><th>OS</th><th>Receita</th><th>Receita/OS</th></tr></thead>
     <tbody>${rank.map(([m,d])=>`<tr><td><b>${m}</b></td><td>${d.os}</td><td style="color:var(--gold-2)">${money(d.receita)}</td><td>${money(d.receita/d.os)}</td></tr>`).join('')}</tbody></table>
   </div>`;
}

function alavCriarSug(i){ const s=alavSugestoes()[i]; if(!s)return;
  const l=alavCombos(); l.push({id:uid('CB'),nome:s.nome,itens:s.itens,precoNormal:s.precoNormal,precoPromo:s.precoPromo,desc:s.desc,periodo:'Mês'});
  alavSaveCombos(l); toast('Combo salvo ✓'); renderAlavancagem(); }
function alavRemover(id){ confirmar("Excluir este combo?",()=>{alavSaveCombos(alavCombos().filter(x=>x.id!==id));closeModal();renderAlavancagem();}); }
function alavCopiar(id){ const c=alavCombos().find(x=>x.id===id); if(!c)return;
  const txt="🔧 "+c.nome+"\n"+(c.itens||[]).map(x=>"• "+x.nome).join("\n")+"\n\nDe "+money(c.precoNormal)+" por "+money(c.precoPromo)+"! Agende na oficina.";
  if(navigator.clipboard) navigator.clipboard.writeText(txt);
  toast('Oferta copiada!'); }
function alavNovoCombo(){
  const opts=`<optgroup label="Serviços">${WORK.servicos.map(s=>`<option value="s:${s.id}">${s.nome} — ${money(s.preco)}</option>`).join('')}</optgroup>
   <optgroup label="Peças">${WORK.pecas.map(p=>`<option value="p:${p.id}">${p.nome} — ${money(p.preco)}</option>`).join('')}</optgroup>`;
  modal("Novo combo promocional","Selecione os itens (Ctrl para vários)",`
    <label>Nome</label><input id="cb_nome" placeholder="Ex.: Combo Revisão Completa">
    <label>Itens</label><select id="cb_itens" multiple size="7">${opts}</select>
    <div class="frow"><div><label>Preço normal</label><input id="cb_normal" readonly></div>
    <div><label>Preço promocional</label><input id="cb_promo" type="number"></div></div>`,
   ()=>{const sel=Array.prototype.slice.call(document.getElementById('cb_itens').selectedOptions);
     if(sel.length<1){toast('Selecione itens');return;}
     const itens=sel.map(o=>{const[t,id]=o.value.split(':');const r=t==='s'?svc(id):prt(id);return {nome:r.nome,preco:r.preco||0};});
     const normal=itens.reduce((a,x)=>a+x.preco,0);
     const promo=+document.getElementById('cb_promo').value||Math.round(normal*0.85);
     if(!document.getElementById('cb_nome').value){toast('Dê um nome');return;}
     const l=alavCombos(); l.push({id:uid('CB'),nome:document.getElementById('cb_nome').value,itens,precoNormal:normal,precoPromo:promo,periodo:'Mês'});
     alavSaveCombos(l); closeModal(); renderAlavancagem();});
  // calcula preço normal ao selecionar
  setTimeout(()=>{const sel=document.getElementById('cb_itens'); if(sel)sel.onchange=function(){
    const items=Array.prototype.slice.call(sel.selectedOptions).map(o=>{const[t,id]=o.value.split(':');const r=t==='s'?svc(id):prt(id);return r.preco||0;});
    const n=items.reduce((a,x)=>a+x,0); const el=document.getElementById('cb_normal'); if(el)el.value=n.toFixed(2);
    const p=document.getElementById('cb_promo'); if(p&&!p.value)p.value=Math.round(n*0.85);};},60);
}
