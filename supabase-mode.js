/* ============================================================
   Vizio Motors — supabase-mode.js
   Liga o front (WORK) ao Supabase quando há config em config.js.
   SEM config -> modo demonstração (nada é alterado).
   Inclui Realtime (app ao vivo) + auto-refresh do portal.
   Carregar DEPOIS de app.js e financeiro.js.
   ============================================================ */
(function(){
  const LIVE = !!(window.SB_URL && window.SB_KEY && window.SB_ORG && window.supabase);
  window.VIZIO_LIVE = LIVE;
  if(!LIVE){ console.log("Vizio Motors: modo DEMONSTRAÇÃO (sem Supabase configurado)."); return; }

  const SB  = window.supabase.createClient(window.SB_URL, window.SB_KEY);
  const ORG = window.SB_ORG;
  window.__SB = SB;

  /* ---- mapeamento DB (snake) <-> WORK (camel) ---- */
  const MAP = {
    clientes:  {tbl:"mt_clientes",  key:"clientes"},
    veiculos:  {tbl:"mt_veiculos",  key:"veiculos",  to:r=>({cliente_id:r.clienteId}), from:r=>({clienteId:r.cliente_id})},
    servicos:  {tbl:"mt_servicos",  key:"servicos",  to:r=>({tempo_min:r.tempoMin}),   from:r=>({tempoMin:r.tempo_min})},
    pecas:     {tbl:"mt_pecas",     key:"pecas"},
    os:        {tbl:"mt_os",        key:"os",
                to:r=>({cliente_id:r.clienteId,veiculo_id:r.veiculoId,status_idx:r.statusIdx}),
                from:r=>({clienteId:r.cliente_id,veiculoId:r.veiculo_id,statusIdx:r.status_idx})},
    agenda:    {tbl:"mt_agenda",    key:"agenda",    to:r=>({cliente_id:r.clienteId,veiculo_id:r.veiculoId}),
                from:r=>({clienteId:r.cliente_id,veiculoId:r.veiculo_id})},
    financeiro:{tbl:"mt_financeiro",key:"financeiro",to:r=>({descricao:r.desc,os_id:r.osId||null}),
                from:r=>({desc:r.descricao,osId:r.os_id})}
  };
  const DROP_DB   = ["org_id","created_at","updated_at","cliente_id","veiculo_id","status_idx","tempo_min","descricao","os_id"];
  const DROP_WORK = ["clienteId","veiculoId","statusIdx","tempoMin","desc","osId"];

  function toDB(name,row){ const m=MAP[name],o={};
    for(const k in row){ if(DROP_WORK.includes(k))continue; o[k]=row[k]; }
    Object.assign(o, m.to?m.to(row):{}); o.org_id=ORG; return o; }
  function fromDB(name,row){ const m=MAP[name],o={};
    for(const k in row){ if(DROP_DB.includes(k))continue; o[k]=row[k]; }
    Object.assign(o, m.from?m.from(row):{}); return o; }

  /* ---- login ---- */
  async function sbLogin(){
    const pass=(document.getElementById('pass')||{}).value||"";
    const email=window.SB_EMAIL||((document.getElementById('user')||{}).value||"admin")+"@r3.local";
    const {error}=await SB.auth.signInWithPassword({email,password:pass});
    if(error){ toast("Login Supabase falhou: "+error.message); throw error; }
  }

  /* ---- carga ---- */
  async function fetchAll(){
    for(const name in MAP){
      const {data,error}=await SB.from(MAP[name].tbl).select("*").eq("org_id",ORG);
      if(error){ console.warn("load "+name,error.message); continue; }
      WORK[name]=data.map(r=>fromDB(name,r));
    }
  }
  const LISTVIEWS={home:renderHome,os:renderOS,agenda:renderAgenda,clientes:renderClientes,estoque:renderEstoque};
  function refreshView(){                 // re-renderiza só listas/painéis (não interrompe detalhe/modal)
    if(document.getElementById('modal-root').innerHTML.trim())return;   // modal aberto -> não mexe
    if(document.getElementById('pageTitle').textContent==="Financeiro") return renderFinanceiro();
    const f=LISTVIEWS[CUR]; if(f)f();
  }
  async function loadAll(){ await fetchAll(); if(typeof go==="function") go(CUR||"home"); toast("Dados carregados do Supabase ✓"); subscribeRealtime(); }

  /* ---- gravação (upsert de tudo, debounce) ---- */
  let _t=null;
  function scheduleSync(){ clearTimeout(_t); _t=setTimeout(syncAll,500); }
  async function syncAll(){
    for(const name in MAP){ const rows=(WORK[name]||[]).map(r=>toDB(name,r));
      if(rows.length){ const {error}=await SB.from(MAP[name].tbl).upsert(rows); if(error)console.warn("sync "+name,error.message); } }
  }
  async function sbDelete(tbl,id){ const {error}=await SB.from(tbl).delete().eq("id",id); if(error)console.warn("del",error.message); }

  /* ---- Realtime: app ao vivo entre dispositivos (seguro por RLS) ---- */
  let _sub=false,_rt=null;
  function subscribeRealtime(){
    if(_sub)return; _sub=true;
    _rt=SB.channel("mt_live_"+ORG);
    ["mt_os","mt_financeiro","mt_clientes","mt_veiculos","mt_agenda","mt_pecas"].forEach(tbl=>{
      _rt.on("postgres_changes",{event:"*",schema:"public",table:tbl,filter:"org_id=eq."+ORG}, ()=>debouncedReload());
    });
    _rt.subscribe();
  }
  let _rl=null;
  function debouncedReload(){ clearTimeout(_rl); _rl=setTimeout(async ()=>{ await fetchAll(); refreshView(); },700); }

  /* ---- monkeypatch das mutações (sem tocar app.js) ---- */
  function wrap(name){ const o=window[name]; if(typeof o!=="function")return;
    window[name]=function(){ const r=o.apply(this,arguments); scheduleSync(); return r; }; }
  ["stepOS","toggleChk","toggleAprov","delItem","marcarPago","closeModal","gerarRecebiveis"].forEach(wrap);
  const _delOS=window.delOS; window.delOS=function(id){ sbDelete("mt_os",id); return _delOS(id); };
  const _entrar=window.entrar;
  window.entrar=async function(e){ if(e&&e.preventDefault)e.preventDefault();
    try{ await sbLogin(); _entrar({preventDefault(){}}); await loadAll(); }catch(err){/* avisado */} };

  /* ---- portal público: RPC + auto-refresh (anda sozinho p/ o cliente) ---- */
  const _renderPortal=window.renderPortal;
  let _ptimer=null;
  async function portalFetch(token){
    const {data,error}=await SB.rpc("get_portal",{t:token});
    if(error||!data)return false;
    WORK.os=[{id:"_p",numero:data.numero,statusIdx:data.status_idx,aprovado:data.aprovado,
      previsao:data.previsao,entrada:data.entrada,responsavel:data.responsavel,obs:data.obs,
      itens:data.itens||[],veiculoId:"_pv",token}];
    WORK.veiculos=[{id:"_pv",placa:data.placa,modelo:data.modelo}];
    return true;
  }
  window.renderPortal=async function(token){
    if((WORK.os||[]).some(o=>o.token===token)) return _renderPortal(token);   // uso interno
    const ok=await portalFetch(token); if(!ok) return _renderPortal(token);
    _renderPortal(token);
    clearInterval(_ptimer);
    _ptimer=setInterval(async ()=>{ if(await portalFetch(token)) _renderPortal(token); }, 12000); // atualiza sozinho
  };

  // ajusta a tela de login para o modo real
  try{
    const h=document.querySelector('#login .hint'); if(h)h.textContent="Acesso real (Supabase) — use sua senha";
    const p=document.getElementById('pass'); if(p)p.value="";
    const u=document.getElementById('user'); if(u){u.value=window.SB_EMAIL||""; u.readOnly=true;}
  }catch(e){}

  console.log("Vizio Motors: modo SUPABASE (LIVE) + Realtime ativo · org "+ORG);
})();
