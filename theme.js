/* ============================================================
   Vizio Motors — theme.js (White-label / Camaleão)
   Aplica a identidade de cada oficina (cor de acento, logo, nome).
   Padrão = VIZIO. Cada oficina veste a própria marca no login.
   applyTheme() é chamado pelo supabase-mode após carregar a org.
   Depende de app.js (emblemSVG, toast). Storage: bucket 'brand'.
   ============================================================ */
const VIZIO_BRAND={nome:"Vizio Motors",accent:"#5aa0ff",logo:"vizio-symbol.png"};

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
  window.BRAND_LOGO=b.logo||b.logo_url||VIZIO_BRAND.logo;
  window.BRAND_NAME=b.nome||b.nome_exibicao||VIZIO_BRAND.nome;
  ['emblemLogin','emblemSide','emblemP'].forEach(function(id){
    var e=document.getElementById(id);
    if(e&&typeof emblemSVG==='function'&&(e.innerHTML||'').trim()){
      e.innerHTML=emblemSVG();
      var c=e.firstElementChild; if(c)c.style.maxWidth=(id==='emblemSide'?'44px':id==='emblemP'?'76px':'120px');
    }});
  var bn=document.querySelector('.brand-name'); if(bn)bn.textContent=(window.BRAND_NAME||'Vizio Motors').toUpperCase();
  var nm=document.querySelector('.side .logo-row .nm'); if(nm)nm.textContent=window.BRAND_NAME||'Vizio Motors';
}
window.applyTheme=applyTheme;

/* ---------- tela de Identidade / White-label (admin master) ---------- */
function abrirMarca(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent="Identidade da oficina";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderMarca();
}
window.abrirMarca=abrirMarca;

function renderMarca(){
  var nome=window.BRAND_NAME||"Vizio Motors";
  var accent=getComputedStyle(document.documentElement).getPropertyValue('--gold-2').trim()||"#5aa0ff";
  var logo=window.BRAND_LOGO||"vizio-symbol.png";
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>🦎 Identidade da oficina (white-label)</h3></div>'+
     '<div style="font-size:13px;color:var(--muted);margin-bottom:14px">Como admin master, defina a marca desta oficina — o sistema veste a identidade dela (cor, logo e nome). Padrão: VIZIO.</div>'+
     '<div class="frow">'+
       '<div><label>Nome de exibição</label><input id="mk_nome" value="'+nome.replace(/"/g,"&quot;")+'"></div>'+
       '<div><label>Cor de acento</label><input id="mk_accent" type="color" value="'+(accent.startsWith("#")?accent:"#5aa0ff")+'" oninput="applyTheme({nome:document.getElementById(\'mk_nome\').value,accent:this.value,logo:window.BRAND_LOGO})" style="height:44px;padding:4px"></div>'+
     '</div>'+
     '<label>Logo (PNG/SVG com fundo transparente)</label><input id="mk_logo" type="file" accept="image/*">'+
     '<div style="display:flex;gap:14px;align-items:center;margin-top:16px">'+
       '<div style="width:88px;height:88px;border:1px solid var(--line);border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)"><img id="mk_prev" src="'+logo+'" style="max-width:70px;max-height:70px"></div>'+
       '<div style="font-size:12px;color:var(--muted)">Prévia da logo. O acento é aplicado ao vivo enquanto você escolhe a cor.</div>'+
     '</div>'+
     '<div class="mact" style="justify-content:space-between;margin-top:20px"><button class="b b-ghost" onclick="resetMarca()">Restaurar VIZIO</button>'+
       '<button class="b" onclick="salvarMarca()">Salvar identidade</button></div>'+
   '</div>';
  var f=document.getElementById('mk_logo');
  if(f)f.onchange=function(){ var file=f.files&&f.files[0]; if(!file)return;
    var url=URL.createObjectURL(file); var img=document.getElementById('mk_prev'); if(img)img.src=url; };
}
window.renderMarca=renderMarca;

function resetMarca(){ applyTheme(VIZIO_BRAND);
  if(window.__SB&&window.__ORG){ window.__SB.from('mt_orgs').update({cor_primaria:null,logo_url:null,tema:'vizio'}).eq('id',window.__ORG); }
  toast('Identidade padrão VIZIO restaurada'); renderMarca(); }
window.resetMarca=resetMarca;

async function salvarMarca(){
  var nome=(document.getElementById('mk_nome')||{}).value||"Vizio Motors";
  var accent=(document.getElementById('mk_accent')||{}).value||"#5aa0ff";
  var logo_url=window.BRAND_LOGO||"vizio-symbol.png";
  var SB=window.__SB, ORG=window.__ORG;
  var f=document.getElementById('mk_logo'); var file=f&&f.files&&f.files[0];
  if(file&&SB&&ORG){
    var path=ORG+'-'+Date.now()+'.'+((file.name.split('.').pop()||'png').toLowerCase());
    var up=await SB.storage.from('brand').upload(path,file,{upsert:true,contentType:file.type});
    if(!up.error){ logo_url=SB.storage.from('brand').getPublicUrl(path).data.publicUrl; }
    else { toast('Falha no upload da logo: '+up.error.message); }
  }
  if(SB&&ORG){ var r=await SB.from('mt_orgs').update({nome_exibicao:nome,cor_primaria:accent,logo_url:logo_url,tema:'custom'}).eq('id',ORG);
    if(r.error){ toast('Erro ao salvar: '+r.error.message); return; } }
  applyTheme({nome:nome,accent:accent,logo:logo_url});
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
  // re-renderiza a view atual p/ atualizar cores dos gráficos
  var t=(document.getElementById('pageTitle')||{}).textContent;
  if(t==='Dashboard Executivo'&&typeof renderDash==='function')renderDash();
  else if(t==='Financeiro'&&typeof renderFinanceiro==='function')renderFinanceiro();
}
window.toggleTheme=toggleTheme;
(function initTheme(){ try{ var lit=localStorage.getItem('vm_theme')==='light';
  if(lit)document.documentElement.classList.add('theme-light'); _themeGlyph(lit);
}catch(e){} })();
