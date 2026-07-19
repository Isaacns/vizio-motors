/* ============================================================
   Vizio Motors — supabase-mode.js
   Liga o front (WORK) ao Supabase quando há config em config.js.
   SEM config -> modo demonstração (nada é alterado).
   Realtime + auto-refresh do portal + cadastro self-service (multi-oficina).
   Carregar por último (após todos os módulos).
   ============================================================ */
(function(){
  const LIVE = !!(window.SB_URL && window.SB_KEY && window.SB_ORG && window.supabase);
  window.VIZIO_LIVE = LIVE;
  if(!LIVE){ console.log("Vizio Motors: modo DEMONSTRAÇÃO (sem Supabase configurado)."); return; }

  const SB  = window.supabase.createClient(window.SB_URL, window.SB_KEY);
  let   ORG = window.SB_ORG;                 // resolvida por usuário após login
  window.__SB = SB;

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
                from:r=>({desc:r.descricao,osId:r.os_id})},
    notas:     {tbl:"mt_nf",        key:"notas",     to:r=>({os_id:r.osId||null}), from:r=>({osId:r.os_id})},
    ponto:     {tbl:"mt_ponto",     key:"ponto"},
    bemestar:  {tbl:"mt_bemestar",  key:"bemestar"},
    metas:     {tbl:"mt_metas",     key:"metas"}
  };
  const DROP_DB   = ["org_id","created_at","updated_at","cliente_id","veiculo_id","status_idx","tempo_min","descricao","os_id"];
  const DROP_WORK = ["clienteId","veiculoId","statusIdx","tempoMin","desc","osId"];

  function toDB(name,row){ const m=MAP[name],o={};
    for(const k in row){ if(DROP_WORK.includes(k))continue; o[k]=row[k]; }
    Object.assign(o, m.to?m.to(row):{}); o.org_id=ORG; return o; }
  function fromDB(name,row){ const m=MAP[name],o={};
    for(const k in row){ if(DROP_DB.includes(k))continue; o[k]=row[k]; }
    Object.assign(o, m.from?m.from(row):{}); return o; }

  async function sbLogin(){
    const pass=(document.getElementById('pass')||{}).value||"";
    const digitado=(((document.getElementById('user')||{}).value)||"").trim();
    /* E-mail completo digitado vence sempre. Sem "@", mantém o atalho legado
       usuario -> usuario@vizio.local para não quebrar quem já usa assim. */
    const email = digitado.indexOf('@')>=0 ? digitado
                : (window.SB_EMAIL || (digitado||"admin")+"@vizio.local");
    const {error}=await SB.auth.signInWithPassword({email,password:pass});
    if(error){ toast("Login Supabase falhou: "+error.message); throw error; }
  }

  /* resolve a oficina (org) do usuário logado; provisiona se houver cadastro pendente */
  async function resolveOrg(){
    try{
      const {data}=await SB.from('mt_members').select('org_id').limit(1);
      if(data && data.length){ ORG=data[0].org_id; return; }
      const pend=localStorage.getItem('vm_pending_oficina');
      if(pend){ const o=JSON.parse(pend);
        const {data:nid,error}=await SB.rpc('mt_onboard',{p_nome:o.nome,p_esp:o.esp});
        if(!error && nid){ ORG=nid; localStorage.removeItem('vm_pending_oficina'); toast('Oficina criada ✓'); return; } }
    }catch(e){ console.warn('resolveOrg',e); }
    ORG = window.SB_ORG;  // fallback (piloto)
  }

  async function fetchAll(){
    for(const name in MAP){
      const {data,error}=await SB.from(MAP[name].tbl).select("*").eq("org_id",ORG);
      if(error){ console.warn("load "+name,error.message); continue; }
      WORK[name]=data.map(r=>fromDB(name,r));
    }
  }
  const LISTVIEWS={home:renderHome,os:renderOS,agenda:renderAgenda,clientes:renderClientes,estoque:renderEstoque};
  function refreshView(){
    if(document.getElementById('modal-root').innerHTML.trim())return;
    const t=document.getElementById('pageTitle').textContent;
    if(t==="Financeiro")return renderFinanceiro();
    if(t==="CRM & Recuperação")return renderCRM();
    if(t==="Dashboard Executivo")return renderDash();
    if(t==="Nota Fiscal (NFS-e)")return renderNFe();
    if(t==="Ponto & Equipe")return renderCorp();
    if(t==="Estoque Inteligente")return renderEstoquePred();
    const f=LISTVIEWS[CUR]; if(f)f();
  }
  /* carrega a identidade (white-label/camaleão) da oficina e a aplica */
  async function fetchBrand(){
    try{
      window.__ORG=ORG;
      const {data,error}=await SB.from('mt_orgs')
        .select('nome_exibicao,cor_primaria,cor_secundaria,radius,logo_url,tema').eq('id',ORG).single();
      if(error||!data){ if(typeof applyTheme==='function')applyTheme(); return; }
      let logo=data.logo_url;
      if(logo && !/^https?:|^data:|\//.test(logo)){ logo=logo; } // relativo servido pelo Pages
      if(typeof applyTheme==='function'){
        if(data.tema==='vizio' || (!data.cor_primaria && !data.logo_url)){ applyTheme(); }
        /* §6 — Brand Kit completo vem do tenant: secundária e raio inclusive. */
        else applyTheme({nome:data.nome_exibicao,accent:data.cor_primaria,accent2:data.cor_secundaria,
                         radius:(data.radius!=null?data.radius:null),logo:logo});
      }
    }catch(e){ console.warn('fetchBrand',e); if(typeof applyTheme==='function')applyTheme(); }
  }
  async function loadAll(){ await fetchAll(); await fetchBrand();
    if(typeof carregarPontoInovar==="function") await carregarPontoInovar();
    if(typeof go==="function") go(CUR||"home"); toast("Dados carregados ✓"); subscribeRealtime(); }

  let _t=null;
  function scheduleSync(){ clearTimeout(_t); _t=setTimeout(syncAll,500); }
  async function syncAll(){
    for(const name in MAP){ const rows=(WORK[name]||[]).map(r=>toDB(name,r));
      if(rows.length){ const {error}=await SB.from(MAP[name].tbl).upsert(rows); if(error)console.warn("sync "+name,error.message); } }
  }
  async function sbDelete(tbl,id){ const {error}=await SB.from(tbl).delete().eq("id",id); if(error)console.warn("del",error.message); }

  let _sub=false,_rt=null;
  function subscribeRealtime(){
    if(_sub)return; _sub=true;
    _rt=SB.channel("mt_live_"+ORG);
    ["mt_os","mt_financeiro","mt_clientes","mt_veiculos","mt_agenda","mt_pecas","mt_nf","mt_ponto","mt_bemestar","mt_metas"].forEach(tbl=>{
      _rt.on("postgres_changes",{event:"*",schema:"public",table:tbl,filter:"org_id=eq."+ORG}, ()=>debouncedReload());
    });
    _rt.subscribe();
  }
  let _rl=null;
  function debouncedReload(){ clearTimeout(_rl); _rl=setTimeout(async ()=>{ await fetchAll(); refreshView(); },700); }

  function wrap(name){ const o=window[name]; if(typeof o!=="function")return;
    window[name]=function(){ const r=o.apply(this,arguments); scheduleSync(); return r; }; }
  ["stepOS","toggleChk","toggleAprov","delItem","marcarPago","closeModal","gerarRecebiveis",
   "gerarCampanha","emitirNF","cancelarNF","registrarPonto","salvarBemestar","salvarMeta"].forEach(wrap);
  const _delOS=window.delOS; window.delOS=function(id){ sbDelete("mt_os",id); return _delOS(id); };
  const _delAg=window.delAg; if(_delAg)window.delAg=function(id){ sbDelete("mt_agenda",id); return _delAg(id); };
  const _delLanc=window.delLanc; if(_delLanc)window.delLanc=function(id){ sbDelete("mt_financeiro",id); return _delLanc(id); };
  const _delServico=window.delServico; if(_delServico)window.delServico=function(id){ sbDelete("mt_servicos",id); return _delServico(id); };
  /* §8 — quem está logado define o que o menu mostra. Guarda o e-mail da sessão para o
     rbacCan casar com o cadastro de usuários e aplica o gating logo após entrar. */
  async function aplicarPermissoes(){
    try{
      const {data}=await SB.auth.getUser();
      window.__vmUserEmail=(data&&data.user&&data.user.email)||"";
    }catch(_){ window.__vmUserEmail=""; }
    if(window.rbacAplicarNav) window.rbacAplicarNav();
    if(window.renderUserChip) window.renderUserChip();
  }
  window.aplicarPermissoes=aplicarPermissoes;

  const _entrar=window.entrar;
  window.entrar=async function(e){ if(e&&e.preventDefault)e.preventDefault();
    /* Nada de catch mudo: uma falha aqui deixava o usuário clicando em ENTRAR sem
       nenhuma resposta na tela. Falha silenciosa é pior que erro visível. */
    try{ await sbLogin(); }
    catch(err){ return; }                       // sbLogin já avisou o motivo por toast
    try{ await resolveOrg(); _entrar({preventDefault(){}}); await aplicarPermissoes(); await loadAll(); }
    catch(err){
      console.error('entrar:',err);
      toast('Entrou, mas houve falha ao carregar: '+((err&&err.message)||err)+' — recarregue a página');
    } };

  /* cadastro self-service: cria conta + provisiona oficina */
  window.criarOficina=async function(){
    const g=id=>((document.getElementById(id)||{}).value||"").trim();
    const nome=g('su_nome'),esp=g('su_esp'),email=g('su_email'),pass=g('su_pass');
    if(!nome||!email||!pass){ toast('Preencha oficina, e-mail e senha'); return; }
    if(pass.length<6){ toast('A senha precisa de ao menos 6 caracteres'); return; }
    const {error}=await SB.auth.signUp({email,password:pass});
    if(error){ toast('Cadastro: '+error.message); return; }
    localStorage.setItem('vm_pending_oficina',JSON.stringify({nome,esp}));
    const {error:e2}=await SB.auth.signInWithPassword({email,password:pass});
    if(e2){ toast('Conta criada! Confirme seu e-mail e faça login para ativar sua oficina.'); return; }
    await resolveOrg();
    _entrar({preventDefault(){}});
    await aplicarPermissoes();
    await loadAll();
  };

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
    if((WORK.os||[]).some(o=>o.token===token)) return _renderPortal(token);
    const ok=await portalFetch(token); if(!ok) return _renderPortal(token);
    _renderPortal(token);
    clearInterval(_ptimer);
    _ptimer=setInterval(async ()=>{ if(await portalFetch(token)) _renderPortal(token); }, 12000);
  };

  try{
    const h=document.querySelector('#login .hint'); if(h)h.textContent="Acesso real (Supabase) — use sua senha";
    const p=document.getElementById('pass'); if(p)p.value="";
    /* Só trava o campo quando há uma conta fixa configurada (piloto de conta única).
       Sem SB_EMAIL o campo fica livre — travá-lo vazio impediria qualquer login. */
    const u=document.getElementById('user');
    if(u){ if(window.SB_EMAIL){ u.value=window.SB_EMAIL; u.readOnly=true; } else { u.readOnly=false; } }
    const st=document.getElementById('signupToggle'); if(st)st.style.display="block";
  }catch(e){}
  console.log("Vizio Motors: modo SUPABASE (LIVE) + Realtime + self-service · org base "+ORG);
})();
