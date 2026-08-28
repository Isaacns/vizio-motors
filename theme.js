/* ============================================================
   Vizio Motors — theme.js (White-label / Camaleão)
   Aplica a identidade de cada oficina (cor de acento, logo, nome).
   Padrão = VIZIO. Cada oficina veste a própria marca no login.
   applyTheme() é chamado pelo supabase-mode após carregar a org.
   Depende de app.js (emblemSVG, toast). Storage: bucket 'brand'.
   ============================================================ */
/* §5 dos Padrões — o sufixo descreve a COR DA LOGO, não o tema:
   vizio-symbol-light.png = logo CLARA  -> usar no tema ESCURO
   vizio-symbol-dark.png  = logo ESCURA -> usar no tema CLARO
   (`vizio-symbol.png` é o nome legado; mantido no repositório para não quebrar
    quem ainda estiver rodando JS antigo em cache — Lei de Postel, §14.4.) */
const VIZIO_BRAND={nome:"Vizio Motors",accent:"#5aa0ff",logo:"vizio-symbol-light.png"};
/* Identidade Oficina R3 (preto + ouro) — assets reais em assets/r3-emblem.svg.
   É a identidade ATIVA da oficina demonstração (org a1a1a1a1…0001) e a semente do
   modo demo. Reversível pela tela Identidade (Restaurar VIZIO). */
const VM_R3_BRAND={nome:"Oficina R3",accent:"#E6B325",accent2:"#C6892B",radius:14,
                   logo:"assets/r3-emblem.svg",tema:"custom"};
window.VM_R3_BRAND=VM_R3_BRAND;

/* ============================================================
   HOST_BRAND_LOCK — trava de identidade por HOSTNAME (fonte única)
   ------------------------------------------------------------
   O MESMO código de 02_Sistema é publicado em vários domínios. Quando ele é
   servido de um DOMÍNIO DEDICADO de cliente, a identidade é FIXA: veste a marca
   do cliente no boot (antes do login), aponta a org de produção do cliente e
   NÃO mostra o seletor de marca nem "Restaurar VIZIO" — sem fork de código.
   • motors.viziostudio.com.br e localhost NÃO estão no mapa → comportamento
     ATUAL 100% preservado (marca VIZIO/demo, tela Identidade disponível ao super-admin).
   • Adicionar um cliente dedicado = só uma linha aqui (marca + org de produção).
   A org resolvida no login (mt_members) continua valendo; o `org` do lock é o
   alvo/fallback (pré-login e usuário sem membership), e o `brand` veste a tela
   de entrada antes de o fetchBrand confirmar pela org no Supabase.
   ============================================================ */
const HOST_BRAND_LOCK = {
  "r3.viziostudio.com.br": {
    /* identidade R3 preto+ouro (mesmo preset do Camaleão), nome de produção */
    brand: Object.assign({}, VM_R3_BRAND, {nome:"R3 Centro Automotivo"}),
    org:   "f64ba3f3-045e-49bd-97c9-6c739b3940ab",  // org de PRODUÇÃO da R3 (mt_orgs)
    oficina: "R3 Centro Automotivo"
  }
};
function vmHostLock(){ try{ return HOST_BRAND_LOCK[location.hostname] || null; }catch(e){ return null; } }
window.vmHostLock=vmHostLock;
/* logo VIZIO por tema: clara (traços claros) no escuro; navy no fundo branco */
function vizioLogo(){ return document.documentElement.classList.contains('theme-light')?'vizio-symbol-dark.png':'vizio-symbol-light.png'; }
function _emSize(id){ return id==='emblemSide'?44:id==='emblemP'?104:120; }
function reRenderEmblems(){ ['emblemLogin','emblemSide','emblemP'].forEach(function(id){
  var e=document.getElementById(id);
  if(e&&typeof emblemSVG==='function'&&(e.innerHTML||'').trim()){ e.innerHTML=emblemSVG(_emSize(id)); }}); }

function shade(hex,pct){
  hex=(hex||'#5aa0ff').replace('#','');
  if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  let r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
  const f=pct/100, adj=v=> pct>=0 ? Math.round(v+(255-v)*f) : Math.round(v*(1+f));
  return '#'+[adj(r),adj(g),adj(b)].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
}
function hexRgba(hex,a){ hex=(hex||'#5aa0ff').replace('#','');
  if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  return 'rgba('+parseInt(hex.slice(0,2),16)+','+parseInt(hex.slice(2,4),16)+','+parseInt(hex.slice(4,6),16)+','+a+')'; }

function applyTheme(b){
  b=b||VIZIO_BRAND;
  const acc=b.accent||b.cor_primaria||VIZIO_BRAND.accent;
  const rs=document.documentElement.style;
  rs.setProperty('--gold-1',shade(acc,45));
  rs.setProperty('--gold-2',acc);
  rs.setProperty('--gold-3',shade(acc,-6));
  rs.setProperty('--gold-4',shade(acc,-30));
  rs.setProperty('--gold-5',shade(acc,-48));
  var bk=(typeof _bkLoad==='function')?_bkLoad():null;
  var acc2=b.accent2||b.cor_secundaria||(bk&&bk.accent2); rs.setProperty('--accent2', acc2||shade(acc,28));
  var rad=(b.radius!=null&&b.radius!=='')?b.radius:(bk?bk.radius:null); if(rad!=null)rs.setProperty('--radius', rad+'px');
  window.__brandKit={accent:acc,accent2:acc2||shade(acc,28),radius:rad};
  var custom=(b&&(b.logo||b.logo_url));
  /* O símbolo VIZIO padrão (vizio-symbol*) NÃO conta como logo próprio: a marca VIZIO
     mantém a AURA gerada (emblema com sigla). Só uma imagem de marca própria (R3, upload
     do cliente) veste a AURA com a imagem. */
  var isDefaultSym=!custom||/vizio-symbol/.test(String(custom));
  window.__brandCustom=!!custom && !isDefaultSym;
  window.BRAND_LOGO=custom||vizioLogo();
  /* LOGO EM IMAGEM por identidade (§ bug 3): a imagem só aparece no emblema/AURA quando é
     uma marca própria; senão fica vazio e emblemSVG desenha a AURA gerada. */
  window.BRAND_LOGO_IMG=window.__brandCustom?window.BRAND_LOGO:'';
  window.BRAND_NAME=b.nome||b.nome_exibicao||VIZIO_BRAND.nome;
  ['emblemLogin','emblemSide','emblemP'].forEach(function(id){
    var e=document.getElementById(id);
    if(e&&typeof emblemSVG==='function'&&(e.innerHTML||'').trim()){
      e.innerHTML=emblemSVG(_emSize(id));
    }});
  var bn=document.querySelector('.brand-name'); if(bn)bn.textContent=(window.BRAND_NAME||'Vizio Motors').toUpperCase();
  var nm=document.querySelector('.side .logo-row .nm'); if(nm)nm.textContent=window.BRAND_NAME||'Vizio Motors';
}
window.applyTheme=applyTheme;

/* ---------- extração automática de cores da logo ---------- */
function _rgbHue(r,g,b){ r/=255;g/=255;b/=255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0;
  if(d===0)h=0; else if(mx===r)h=((g-b)/d)%6; else if(mx===g)h=(b-r)/d+2; else h=(r-g)/d+4;
  h*=60; if(h<0)h+=360; return h; }
function _toHex(o){ return '#'+[o.r,o.g,o.b].map(function(v){return Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0');}).join(''); }
function brandExtract(img){
  try{
    var W=Math.min(140,img.naturalWidth||140), H=Math.min(140,img.naturalHeight||140);
    var c=document.createElement('canvas'); c.width=W; c.height=H;
    var ctx=c.getContext('2d'); ctx.drawImage(img,0,0,W,H);
    var d=ctx.getImageData(0,0,W,H).data, bk={};
    for(var i=0;i<d.length;i+=4){ var r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
      if(a<128)continue;
      var mx=Math.max(r,g,b),mn=Math.min(r,g,b); var sat=mx===0?0:(mx-mn)/mx; var lum=(mx+mn)/2;
      if(sat<0.2||lum<26||lum>244)continue;                 // ignora branco/preto/cinza
      var key=Math.round(_rgbHue(r,g,b)/22)*22;              // bucket por matiz
      if(!bk[key])bk[key]={n:0,r:0,g:0,b:0,s:0}; var o=bk[key];
      o.n++; o.r+=r; o.g+=g; o.b+=b; o.s+=sat;
    }
    var arr=Object.keys(bk).map(function(k){var o=bk[k];return {key:+k,n:o.n,score:o.n*(o.s/o.n),r:Math.round(o.r/o.n),g:Math.round(o.g/o.n),b:Math.round(o.b/o.n)};});
    arr.sort(function(x,y){return y.score-x.score;});
    if(!arr.length)return null;
    var primary=_toHex(arr[0]);
    var secondary=null;
    for(var j=1;j<arr.length;j++){ if(Math.abs(arr[j].key-arr[0].key)>=44){ secondary=_toHex(arr[j]); break; } }
    if(!secondary)secondary=shade(primary,28);
    return {primary:primary,secondary:secondary};
  }catch(e){ return null; }
}
window.brandExtract=brandExtract;
function _bkLoad(){ try{return JSON.parse(localStorage.getItem('vm_brandkit')||'null');}catch(e){return null;} }
function _bkSave(o){ try{localStorage.setItem('vm_brandkit',JSON.stringify(o));}catch(e){} }
window._bkLoad=_bkLoad;
/* Persistência TOTAL da identidade (§4 do passe): a marca inteira — nome, cores, raio e
   logo em imagem — fica no localStorage para PERMANECER até ser revertida (o nível da org
   no Supabase é a outra metade, aplicada no login por fetchBrand). Boot reaplica antes do
   login para a tela de entrada já vestir a identidade ativa. */
function _brandFullSave(b){ try{ if(b) localStorage.setItem('vm_brand_full',JSON.stringify(b));
  else localStorage.removeItem('vm_brand_full'); }catch(e){} }
function _brandFullLoad(){ try{ return JSON.parse(localStorage.getItem('vm_brand_full')||'null'); }catch(e){ return null; } }
window._brandFullSave=_brandFullSave; window._brandFullLoad=_brandFullLoad;
/* Aplica a identidade R3 (preto+ouro) a TODO o sistema e persiste. */
function aplicarR3(){ applyTheme(VM_R3_BRAND); _bkSave({accent:VM_R3_BRAND.accent,accent2:VM_R3_BRAND.accent2,radius:VM_R3_BRAND.radius,org:window.__ORG||'demo'});
  _brandFullSave(VM_R3_BRAND); if(typeof vmRefreshCharts==='function')vmRefreshCharts(); }
window.aplicarR3=aplicarR3;
/* Re-renderiza a view atual quando ela tem gráficos, para o acento categórico acompanhar a marca. */
function vmRefreshCharts(){ var t=(document.getElementById('pageTitle')||{}).textContent;
  if(t==='Dashboard Executivo'&&typeof renderDash==='function')renderDash();
  else if(t==='Financeiro'&&typeof renderFinanceiro==='function')renderFinanceiro();
  else if(t==='Serviços'&&typeof renderServicos==='function')renderServicos();
  else if((t==='Início'||t==='')&&typeof renderHome==='function')renderHome(); }
window.vmRefreshCharts=vmRefreshCharts;

/* ---------- tela de Identidade / White-label (admin master) ---------- */
function abrirMarca(){
  /* Host dedicado: identidade travada — nem abre a tela de marca. */
  if(window.__brandLocked){ if(typeof toast==='function')toast('Identidade fixa neste domínio.'); return; }
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent="Identidade da oficina";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderMarca();
}
window.abrirMarca=abrirMarca;

function renderMarca(){
  var nome=window.BRAND_NAME||"Vizio Motors";
  var css=getComputedStyle(document.documentElement);
  var accent=(css.getPropertyValue('--gold-2').trim())||"#5aa0ff";
  var accent2=(css.getPropertyValue('--accent2').trim())||shade(accent,28);
  var radius=parseInt(css.getPropertyValue('--radius'))||18;
  var logo=window.BRAND_LOGO||vizioLogo();
  window._mkPreview=function(){ applyTheme({nome:document.getElementById('mk_nome').value,
    accent:document.getElementById('mk_accent').value, accent2:document.getElementById('mk_accent2').value,
    radius:+document.getElementById('mk_radius').value, logo:window.BRAND_LOGO}); };
  document.getElementById('view').innerHTML='<div style="max-width:900px">'+
   '<div class="panel"><div class="head"><h3>🦎 Identidade da oficina (Brand Kit)</h3></div>'+
     '<div style="font-size:13px;color:var(--muted);margin-bottom:14px">Suba a logo do cliente e o sistema <b>extrai as cores automaticamente</b> e se adapta. Depois é só ajustar o que quiser. Padrão: VIZIO.</div>'+
     '<label>Logo (PNG/SVG, fundo transparente)</label><input id="mk_logo" type="file" accept="image/*">'+
     '<div class="frow" style="margin-top:12px">'+
       '<div><label>Nome de exibição</label><input id="mk_nome" value="'+nome.replace(/"/g,"&quot;")+'"></div>'+
       '<div><label>Cantos (raio)</label><select id="mk_radius" onchange="_mkPreview()"><option value="6"'+(radius<=8?" selected":"")+'>Reto (tech)</option><option value="14"'+(radius>8&&radius<=15?" selected":"")+'>Médio</option><option value="20"'+(radius>15?" selected":"")+'>Arredondado (premium)</option></select></div>'+
     '</div>'+
     '<div class="frow" style="margin-top:6px">'+
       '<div><label>Cor primária</label><input id="mk_accent" type="color" value="'+(accent.charAt(0)==="#"?accent:"#5aa0ff")+'" oninput="_mkPreview()" style="height:44px;padding:4px"></div>'+
       '<div><label>Cor secundária</label><input id="mk_accent2" type="color" value="'+(accent2.charAt(0)==="#"?accent2:"#8fb0ff")+'" oninput="_mkPreview()" style="height:44px;padding:4px"></div>'+
     '</div>'+
     '<div style="display:flex;gap:14px;align-items:center;margin-top:16px">'+
       '<div style="width:88px;height:88px;border:1px solid var(--line);border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)"><img id="mk_prev" src="'+logo+'" style="max-width:70px;max-height:70px"></div>'+
       '<div style="font-size:12px;color:var(--muted)" id="mk_hint">Prévia da logo. Ao subir uma logo, as cores são extraídas e aplicadas ao vivo.</div>'+
     '</div>'+
     '<div class="mact" style="justify-content:space-between;margin-top:20px;flex-wrap:wrap;gap:10px">'+
       '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="b b-ghost" onclick="resetMarca()">Restaurar VIZIO</button>'+
       '<button class="b b-ghost" onclick="aplicarR3();renderMarca()" title="Aplicar a identidade preto+ouro da Oficina R3">🛠 Aplicar Oficina R3</button></div>'+
       '<button class="b" onclick="salvarMarca()">Salvar identidade</button></div>'+
   '</div></div>';
  var f=document.getElementById('mk_logo');
  if(f)f.onchange=function(){ var file=f.files&&f.files[0]; if(!file)return;
    var url=URL.createObjectURL(file); window.BRAND_LOGO=url;
    var prev=document.getElementById('mk_prev'); if(prev)prev.src=url;
    var ex=new Image(); ex.onload=function(){ var br=brandExtract(ex);
      if(br){ document.getElementById('mk_accent').value=br.primary; document.getElementById('mk_accent2').value=br.secondary;
        var h=document.getElementById('mk_hint'); if(h)h.textContent='Cores extraídas da logo ✓ — ajuste se quiser.'; }
      window._mkPreview();
    }; ex.onerror=function(){ window._mkPreview(); }; ex.src=url;
  };
}
window.renderMarca=renderMarca;

function resetMarca(){
  if(window.__brandLocked){ if(typeof toast==='function')toast('Identidade fixa neste domínio.'); return; }
  applyTheme(VIZIO_BRAND);
  if(window.__SB&&window.__ORG){ window.__SB.from('mt_orgs').update({cor_primaria:null,cor_secundaria:null,radius:null,logo_url:null,tema:'vizio'}).eq('id',window.__ORG); }
  _bkSave({accent:VIZIO_BRAND.accent,org:window.__ORG||'demo'}); _brandFullSave(null);
  if(typeof vmRefreshCharts==='function')vmRefreshCharts();
  toast('Identidade padrão VIZIO restaurada'); renderMarca(); }
window.resetMarca=resetMarca;

async function salvarMarca(){
  var nome=(document.getElementById('mk_nome')||{}).value||"Vizio Motors";
  var accent=(document.getElementById('mk_accent')||{}).value||"#5aa0ff";
  var accent2=(document.getElementById('mk_accent2')||{}).value||shade(accent,28);
  var radius=+(document.getElementById('mk_radius')||{}).value||18;
  var logo_url=window.BRAND_LOGO||vizioLogo();
  var SB=window.__SB, ORG=window.__ORG;
  var f=document.getElementById('mk_logo'); var file=f&&f.files&&f.files[0];
  if(file&&SB&&ORG){
    var path=ORG+'-'+Date.now()+'.'+((file.name.split('.').pop()||'png').toLowerCase());
    var up=await SB.storage.from('brand').upload(path,file,{upsert:true,contentType:file.type});
    if(!up.error){ logo_url=SB.storage.from('brand').getPublicUrl(path).data.publicUrl; }
    else { toast('Falha no upload da logo: '+up.error.message); }
  }
  if(SB&&ORG){
    /* §6 — Brand Kit inteiro no tenant: secundária e raio também. Antes viviam só no
       localStorage, então trocar de máquina perdia metade da identidade da marca. */
    var r=await SB.from('mt_orgs').update({nome_exibicao:nome,cor_primaria:accent,cor_secundaria:accent2,
      radius:radius,logo_url:logo_url,tema:'custom'}).eq('id',ORG);
    if(r.error){ toast('Erro ao salvar: '+r.error.message); return; } }
  _bkSave({accent:accent,accent2:accent2,radius:radius,org:ORG||'demo'});   // cache local (resposta imediata)
  var brand={nome:nome,accent:accent,accent2:accent2,radius:radius,logo:logo_url,tema:'custom'};
  applyTheme(brand);
  _brandFullSave(brand);                 // §4 — persiste a identidade inteira até ser revertida
  if(typeof vmRefreshCharts==='function')vmRefreshCharts();
  toast('Identidade da oficina aplicada ✓');
  renderMarca();
}
window.salvarMarca=salvarMarca;
window.salvarOficinaMarca=function(cfg){ if(cfg&&cfg.oficina)applyTheme({nome:cfg.oficina,accent:window.getComputedStyle?getComputedStyle(document.documentElement).getPropertyValue('--gold-2').trim():'#5aa0ff',logo:window.BRAND_LOGO}); };

/* ---------- tema claro/escuro (VIZIO dark ↔ VIZIO light) ---------- */
function _themeGlyph(lit){ var t=document.getElementById('themeToggle'); if(t)t.textContent=lit?'☀':'◐'; }
function toggleTheme(){
  var lit=document.documentElement.classList.toggle('theme-light');
  try{ localStorage.setItem('vm_theme', lit?'light':'dark'); }catch(e){}
  _themeGlyph(lit);
  // troca a logo VIZIO conforme o tema (a menos que haja marca de cliente carregada)
  if(!window.__brandCustom){ window.BRAND_LOGO=vizioLogo(); reRenderEmblems(); }
  // re-renderiza a view atual p/ atualizar cores dos gráficos
  var t=(document.getElementById('pageTitle')||{}).textContent;
  if(t==='Dashboard Executivo'&&typeof renderDash==='function')renderDash();
  else if(t==='Financeiro'&&typeof renderFinanceiro==='function')renderFinanceiro();
}
window.toggleTheme=toggleTheme;
(function initTheme(){ try{ var lit=localStorage.getItem('vm_theme')==='light';
  if(lit)document.documentElement.classList.add('theme-light'); _themeGlyph(lit);
  /* HOST_BRAND_LOCK — domínio dedicado: identidade FIXA no boot e org de produção
     apontada ANTES do supabase-mode ler window.SB_ORG (config.js já rodou; supabase-mode
     roda depois deste arquivo). Ignora a persistência local (a marca não é escolha do host). */
  var lock=vmHostLock();
  if(lock){
    window.__brandLocked=true;
    if(lock.org) window.SB_ORG=lock.org;   // alvo/fallback da org resolvida
    applyTheme(lock.brand);
    return;
  }
  /* §4 — reaplica a identidade PERSISTIDA (localStorage) já no boot, antes do login,
     para a tela de entrada vestir a marca ativa. No LIVE, fetchBrand confirma pela org. */
  var saved=_brandFullLoad();
  if(saved){ applyTheme(saved); }
  else if(!window.__brandCustom){ window.BRAND_LOGO=vizioLogo(); reRenderEmblems(); }
}catch(e){} })();
