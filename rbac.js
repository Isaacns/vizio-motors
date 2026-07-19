/* ============================================================
   Vizio Motors — rbac.js · Controle de Usuários & Acessos
   Padrão INPERSON/VIZIO: perfis com permissões por módulo,
   hierarquia (nível) e CRUD de usuários com atribuição de perfil.
   Persistência local (vm_rbac_v1); no go-live mapeia p/ Supabase.
   Depende de app.js (modal, closeModal, toast, confirmar, uid, byId).
   ============================================================ */
(function(){
"use strict";
var RKEY="vm_rbac_v1";
var MODULOS=[["os","Ordens de Serviço"],["agenda","Agenda"],["clientes","Clientes & Veículos"],
  ["estoque","Estoque"],["financeiro","Financeiro"],["nfe","Nota Fiscal"],["dashboard","Dashboard"],
  ["torque","Motor Torque"],["crm","CRM & Receita"],["alavancagem","Alavancagem"],
  ["ponto","Ponto & Equipe"],["bemestar","Bem-estar"],["config","Configurações"],["usuarios","Usuários & Acessos"]];
var ALLKEYS=MODULOS.map(function(m){return m[0];});

function perm(acesso,editar){ var o={}; ALLKEYS.forEach(function(k){o[k]={a:acesso.indexOf(k)>=0||acesso==='*',e:editar.indexOf(k)>=0||editar==='*'};}); return o; }
function defaults(){
  return {
    perfis:[
      {id:"admin",nome:"Administrador",nivel:1,fixo:true,desc:"Acesso total ao sistema e às configurações.",perm:perm('*','*')},
      {id:"gerente",nome:"Gerente",nivel:2,desc:"Operação, gestão e relatórios; sem configurações críticas.",
        perm:perm(['os','agenda','clientes','estoque','financeiro','nfe','dashboard','torque','crm','alavancagem','ponto','bemestar','config'],
                  ['os','agenda','clientes','estoque','financeiro','nfe','crm','alavancagem','ponto'])},
      {id:"financeiro",nome:"Financeiro",nivel:3,desc:"Financeiro, notas fiscais e relatórios.",
        perm:perm(['financeiro','nfe','dashboard','crm','clientes'],['financeiro','nfe'])},
      {id:"recepcao",nome:"Recepção",nivel:3,desc:"Ordens de serviço, agenda e clientes.",
        perm:perm(['os','agenda','clientes','dashboard'],['os','agenda','clientes'])},
      {id:"mecanico",nome:"Mecânico",nivel:4,desc:"Suas OS, checklist e status; controle de ponto.",
        perm:perm(['os','ponto','bemestar'],['os','ponto'])},
      {id:"estoque",nome:"Estoque",nivel:4,desc:"Estoque, compras e fornecedores.",
        perm:perm(['estoque','dashboard'],['estoque'])},
      {id:"visualizador",nome:"Visualizador",nivel:5,desc:"Somente leitura.",
        perm:perm(['os','agenda','clientes','estoque','financeiro','dashboard','crm'],[])}
    ],
    usuarios:[
      {id:"u_master",nome:"Isaac Nogueira",email:"isaacn.ti@outlook.com",perfil:"admin"}
    ]
  };
}
/* ---------------------------------------------------------------------------
   Persistência: Supabase (mt_perfis / mt_usuarios, isolados por org_id via RLS).
   O localStorage vira apenas ESPELHO local — mantém load() síncrono (rbacCan é
   chamado no meio da renderização) e faz o app funcionar em modo demo/offline.
   Fonte de verdade é o banco: hidrata no login e a cada gravação.
   --------------------------------------------------------------------------- */
var _hidratado=false;

function paraBanco(s,ORG){
  return {
    perfis: s.perfis.map(function(p){ return {org_id:ORG,id:p.id,nome:p.nome,nivel:p.nivel||3,
      fixo:!!p.fixo,descricao:p.desc||'',perm:p.perm||{}}; }),
    usuarios: s.usuarios.map(function(u){ return {org_id:ORG,id:u.id,nome:u.nome,email:u.email||null,
      perfil:u.perfil||'visualizador',foto:u.foto||null}; })
  };
}
function doBanco(perfis,usuarios){
  return {
    perfis: perfis.map(function(p){ return {id:p.id,nome:p.nome,nivel:p.nivel,fixo:p.fixo,
      desc:p.descricao||'',perm:p.perm||{}}; }),
    usuarios: usuarios.map(function(u){ return {id:u.id,nome:u.nome,email:u.email||'',
      perfil:u.perfil,foto:u.foto||''}; })
  };
}

/* Traz do banco para o espelho local. Chamado no login (aplicarPermissoes). */
window.rbacHidratar=async function(){
  var SB=window.__SB, ORG=window.__ORG; if(!SB||!ORG) return false;
  try{
    var rp=await SB.from('mt_perfis').select('*').eq('org_id',ORG).order('nivel');
    var ru=await SB.from('mt_usuarios').select('*').eq('org_id',ORG).order('nome');
    if(rp.error||ru.error){ console.warn('rbac hidratar',(rp.error||ru.error).message); return false; }
    if(!rp.data.length && !ru.data.length){
      /* org sem RBAC no banco ainda: sobe o que existe localmente (ou os padrões) */
      await window.rbacSincronizar(load()); return true;
    }
    var s=doBanco(rp.data, ru.data);
    if(!s.perfis.length) s.perfis=defaults().perfis;
    try{ localStorage.setItem(RKEY,JSON.stringify(s)); }catch(e){}
    _hidratado=true;
    if(window.rbacAplicarNav) window.rbacAplicarNav();
    if(window.renderUserChip) window.renderUserChip();
    /* se a tela de Usuários & Acessos estiver aberta, repinta com o dado do banco */
    if(document.getElementById('rbTabs')) renderRBAC();
    return true;
  }catch(e){ console.warn('rbac hidratar',e); return false; }
};

/* Empurra o estado local para o banco (upsert + remove o que sumiu). */
window.rbacSincronizar=async function(s){
  var SB=window.__SB, ORG=window.__ORG; if(!SB||!ORG) return;
  try{
    var d=paraBanco(s,ORG);
    var e1=(await SB.from('mt_perfis').upsert(d.perfis,{onConflict:'org_id,id'})).error;
    var e2=(await SB.from('mt_usuarios').upsert(d.usuarios,{onConflict:'org_id,id'})).error;
    if(e1||e2){ toast('Falha ao salvar acessos: '+((e1||e2).message)); return; }
    var idsP=d.perfis.map(function(p){return p.id;});
    var idsU=d.usuarios.map(function(u){return u.id;});
    if(idsP.length) await SB.from('mt_perfis').delete().eq('org_id',ORG).not('id','in','('+idsP.map(function(i){return '"'+i+'"';}).join(',')+')');
    if(idsU.length) await SB.from('mt_usuarios').delete().eq('org_id',ORG).not('id','in','('+idsU.map(function(i){return '"'+i+'"';}).join(',')+')');
    _hidratado=true;
  }catch(e){ console.warn('rbac sincronizar',e); }
};

function load(){ try{var s=JSON.parse(localStorage.getItem(RKEY)||"null"); if(s&&s.perfis&&s.usuarios){
  // garante módulos novos em perfis existentes
  s.perfis.forEach(function(p){ ALLKEYS.forEach(function(k){ if(!p.perm[k])p.perm[k]={a:false,e:false}; }); });
  /* Migração: a conta de piloto isaacmaster@vizio.local foi banida no Supabase e o
     login passou a usar o e-mail real. Sem isto o cadastro local ficaria órfão. */
  s.usuarios.forEach(function(u){ if((u.email||'').toLowerCase()==='isaacmaster@vizio.local'){ u.email='isaacn.ti@outlook.com'; } });
  return s; } }catch(e){} return defaults(); }
function save(s){ try{localStorage.setItem(RKEY,JSON.stringify(s));}catch(e){}
  /* menu e identificação no topo refletem a mudança na hora — sem exigir novo login */
  if(window.rbacAplicarNav) window.rbacAplicarNav();
  if(window.renderUserChip) window.renderUserChip();
  /* e o banco é a fonte de verdade: grava para valer, em todo dispositivo */
  if(window.rbacSincronizar) window.rbacSincronizar(s); }
function perfilById(s,id){ return s.perfis.filter(function(p){return p.id===id;})[0]||s.perfis[0]; }

/* Usuário logado: casa o e-mail da sessão (Supabase) com o cadastro de usuários.
   Sem sessão ou sem correspondência, cai no primeiro usuário (master do piloto). */
function usuarioAtual(s){
  var email=(window.__vmUserEmail||'').toLowerCase();
  if(email){
    var achado=s.usuarios.filter(function(u){return (u.email||'').toLowerCase()===email;})[0];
    if(achado) return achado;
    /* Sessão autenticada SEM cadastro correspondente não herda o primeiro usuário —
       isso daria admin a qualquer um que entrasse. Perfil mínimo até o dono cadastrar. */
    return {id:'_desconhecido',nome:email,email:email,perfil:'visualizador'};
  }
  /* Sem sessão (modo demo/piloto local): mantém o master. */
  return s.usuarios[0]||{perfil:'admin'};
}
window.rbacUsuarioAtual=function(){ return usuarioAtual(load()); };

/* ---------- Identificação do usuário no topo (§8.1) ---------- */
function iniciais(nome){ return (nome||'?').trim().split(/\s+/).map(function(x){return x[0];}).slice(0,2).join('').toUpperCase(); }
function avatarHTML(u){ return u&&u.foto ? '<img src="'+u.foto+'" alt="">' : iniciais(u&&u.nome); }
window.rbacIniciais=iniciais;

window.renderUserChip=function(){
  try{
    var s=load(), u=usuarioAtual(s), p=perfilById(s,u.perfil);
    var n=document.getElementById('uName'), r=document.getElementById('uRole'), a=document.getElementById('uAv');
    if(n) n.textContent=u.nome||u.email||'Usuário';
    if(r) r.textContent=p?p.nome:'';
    if(a) a.innerHTML=avatarHTML(u);
  }catch(e){}
};
/* Clicar no chip abre o próprio cadastro para edição. */
window.abrirMeuPerfil=function(){ var u=usuarioAtual(load()); if(u&&u.id&&u.id!=='_desconhecido') formUser(u);
  else toast('Seu usuário ainda não está cadastrado em Usuários & Acessos'); };

/* permissão do usuário logado */
window.rbacCan=function(mod,edit){ try{ var s=load(); var u=usuarioAtual(s); var p=perfilById(s,u.perfil);
  var pm=p.perm[mod]; if(!pm)return true; return edit?!!pm.e:!!pm.a; }catch(e){ return true; } };

/* §8 dos Padrões — o menu reflete a permissão. Esconde item sem acesso e o título do grupo
   que ficar vazio. Não substitui RLS: é conforto de UI; o bloqueio real é no backend. */
window.rbacAplicarNav=function(){
  try{
    document.querySelectorAll('a[data-perm]').forEach(function(a){
      a.style.display = window.rbacCan(a.getAttribute('data-perm')) ? '' : 'none';
    });
    document.querySelectorAll('nav[data-grp-nav]').forEach(function(nav){
      var visiveis=[].slice.call(nav.querySelectorAll('a')).filter(function(a){return a.style.display!=='none';});
      var titulo=nav.previousElementSibling;
      if(titulo&&titulo.hasAttribute('data-grp')) titulo.style.display = visiveis.length ? '' : 'none';
      nav.style.display = visiveis.length ? '' : 'none';
    });
  }catch(e){}
};

var _tab="perfis", _sel="admin";
function abrirRBAC(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent="Usuários & Acessos";
  document.getElementById('side').classList.remove('open');
  var q=document.getElementById('q'); if(q)q.value='';
  renderRBAC();
}
window.abrirRBAC=abrirRBAC;
function rbacTab(t){_tab=t;renderRBAC();}
window.rbacTab=rbacTab;

function pill(on,label){ return '<span style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;'+
  (on?'background:rgba(84,209,166,.15);color:var(--ok)':'background:rgba(255,255,255,.05);color:var(--muted)')+'">'+label+'</span>'; }

function renderRBAC(){
  var s=load();
  var tabs=[["perfis","🛡 Perfis & Permissões"],["usuarios","👥 Usuários"]];
  var nav='<div id="rbTabs" style="display:flex;gap:8px;margin-bottom:16px">'+tabs.map(function(t){
    return '<button class="b '+(_tab===t[0]?'':'b-ghost')+' b-sm" onclick="rbacTab(\''+t[0]+'\')">'+t[1]+'</button>';}).join('')+'</div>';
  document.getElementById('view').innerHTML=nav+(_tab==='usuarios'?viewUsuarios(s):viewPerfis(s));
}

function viewPerfis(s){
  if(!perfilById(s,_sel))_sel=s.perfis[0].id;
  var sel=perfilById(s,_sel);
  var chips=s.perfis.slice().sort(function(a,b){return a.nivel-b.nivel;}).map(function(p){
    return '<button class="b '+(p.id===_sel?'':'b-ghost')+' b-sm" onclick="rbacSel(\''+p.id+'\')" style="margin:0 6px 6px 0">'+
      '<span style="opacity:.6">N'+p.nivel+'</span> '+p.nome+'</button>';}).join('');
  var rows=MODULOS.map(function(m){var k=m[0],pm=sel.perm[k]||{a:false,e:false};
    return '<tr><td><b>'+m[1]+'</b></td>'+
      '<td style="text-align:center"><label class="rbSw"><input type="checkbox" '+(pm.a?'checked':'')+' '+(sel.fixo?'disabled':'')+' onchange="rbacToggle(\''+sel.id+'\',\''+k+'\',\'a\',this.checked)"><span></span></label></td>'+
      '<td style="text-align:center"><label class="rbSw"><input type="checkbox" '+(pm.e?'checked':'')+' '+(sel.fixo||!pm.a?'disabled':'')+' onchange="rbacToggle(\''+sel.id+'\',\''+k+'\',\'e\',this.checked)"><span></span></label></td></tr>';
  }).join('');
  return '<style>.rbSw{position:relative;display:inline-block;width:42px;height:24px}.rbSw input{display:none}'+
    '.rbSw span{position:absolute;inset:0;background:rgba(140,150,165,.4);border-radius:999px;transition:.2s;cursor:pointer}'+
    '.rbSw span:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}'+
    '.rbSw input:checked+span{background:var(--gold-2)}.rbSw input:checked+span:before{transform:translateX(18px)}'+
    '.rbSw input:disabled+span{opacity:.5;cursor:not-allowed}</style>'+
   '<div class="panel"><div class="head"><h3>🛡 Perfis</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="rbacNovoPerfil()">+ Novo perfil</button></div>'+
     '<div style="margin-bottom:6px">'+chips+'</div>'+
     '<div style="font-size:12.5px;color:var(--muted)">'+sel.desc+' · <b>Hierarquia:</b> nível '+sel.nivel+(sel.fixo?' · <span style="color:var(--gold-2)">perfil protegido</span>':'')+'</div>'+
     (sel.fixo?'':'<div style="margin-top:10px;display:flex;gap:8px"><button class="b b-ghost b-sm" onclick="rbacEditarPerfil(\''+sel.id+'\')">Renomear / nível</button><button class="b b-ghost b-sm" onclick="rbacDelPerfil(\''+sel.id+'\')">Excluir perfil</button></div>')+
   '</div>'+
   '<div class="panel"><h3>Permissões por módulo — '+sel.nome+'</h3>'+
     '<table class="tbl"><thead><tr><th>Módulo</th><th style="text-align:center">Acesso</th><th style="text-align:center">Pode editar</th></tr></thead><tbody>'+rows+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:8px">"Editar" só vale com "Acesso" ligado. O perfil Administrador é protegido (acesso total).</div>'+
   '</div>';
}
window.rbacSel=function(id){_sel=id;renderRBAC();};
window.rbacToggle=function(pid,mod,tipo,val){ var s=load(); var p=perfilById(s,pid); if(p.fixo)return;
  if(!p.perm[mod])p.perm[mod]={a:false,e:false};
  p.perm[mod][tipo]=!!val; if(tipo==='a'&&!val)p.perm[mod].e=false; save(s); renderRBAC(); };
window.rbacNovoPerfil=function(){
  modal("Novo perfil","",'<label>Nome do perfil</label><input id="rp_nome" placeholder="Ex.: Consultor">'+
    '<label>Nível de hierarquia (1 = mais alto)</label><input id="rp_nivel" type="number" min="1" max="9" value="3">',
   function(){ var nome=(document.getElementById('rp_nome').value||'').trim(); if(!nome){toast('Informe o nome');return;}
     var s=load(); s.perfis.push({id:'p_'+uid('r'),nome:nome,nivel:+document.getElementById('rp_nivel').value||3,
       desc:'Perfil personalizado.',perm:perm([],[])}); save(s); _sel=s.perfis[s.perfis.length-1].id; closeModal(); renderRBAC(); });
};
window.rbacEditarPerfil=function(id){ var s=load(); var p=perfilById(s,id); if(p.fixo)return;
  modal("Editar perfil","",'<label>Nome</label><input id="rp_nome" value="'+(p.nome||'').replace(/"/g,'&quot;')+'">'+
    '<label>Nível de hierarquia</label><input id="rp_nivel" type="number" min="1" max="9" value="'+p.nivel+'">'+
    '<label>Descrição</label><input id="rp_desc" value="'+(p.desc||'').replace(/"/g,'&quot;')+'">',
   function(){ p.nome=document.getElementById('rp_nome').value||p.nome; p.nivel=+document.getElementById('rp_nivel').value||p.nivel;
     p.desc=document.getElementById('rp_desc').value; save(s); closeModal(); renderRBAC(); });
};
window.rbacDelPerfil=function(id){ confirmar("Excluir este perfil?",function(){ var s=load(); if(perfilById(s,id).fixo)return;
  s.perfis=s.perfis.filter(function(p){return p.id!==id;});
  s.usuarios.forEach(function(u){if(u.perfil===id)u.perfil='visualizador';}); save(s); _sel='admin'; closeModal(); renderRBAC(); }); };

function viewUsuarios(s){
  var opts=function(cur){return s.perfis.map(function(p){return '<option value="'+p.id+'"'+(p.id===cur?' selected':'')+'>'+p.nome+'</option>';}).join('');};
  /* Linha inteira clicável abre a ficha do usuário (§ editabilidade: clicar no registro edita).
     Perfil e ações param a propagação para não abrirem o modal sem querer. */
  var rows=s.usuarios.map(function(u){ return '<tr style="cursor:pointer" onclick="rbacEditUser(\''+u.id+'\')" title="Abrir ficha do usuário">'+
    '<td style="width:46px"><div class="av" style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:linear-gradient(180deg,var(--gold-2),var(--gold-4));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11.5px;font-family:var(--display)">'+avatarHTML(u)+'</div></td>'+
    '<td><b>'+u.nome+'</b></td><td style="color:var(--muted)">'+(u.email||'—')+'</td>'+
    '<td onclick="event.stopPropagation()"><select onchange="rbacSetPerfil(\''+u.id+'\',this.value)" style="min-width:150px">'+opts(u.perfil)+'</select></td>'+
    '<td class="acoes" onclick="event.stopPropagation()"><button class="b b-ghost b-sm" onclick="rbacEditUser(\''+u.id+'\')">Editar</button> '+
      (u.id==='u_master'?'':'<button class="b b-ghost b-sm" onclick="rbacDelUser(\''+u.id+'\')">Excluir</button>')+'</td></tr>';}).join('');
  return '<div class="panel"><div class="head"><h3>👥 Usuários</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="rbacNovoUser()">+ Novo usuário</button></div>'+
     '<table class="tbl"><thead><tr><th></th><th>Nome</th><th>E-mail</th><th>Perfil</th><th class="acoes"></th></tr></thead><tbody>'+rows+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:8px">O convite/senha de novos usuários é gerado no go-live (Supabase Auth). Aqui você define nome, e-mail e perfil.</div>'+
   '</div>';
}
window.rbacSetPerfil=function(uid_,pid){ var s=load(); var u=s.usuarios.filter(function(x){return x.id===uid_;})[0]; if(u){u.perfil=pid;save(s);toast('Perfil atualizado');} };
/* Foto escolhida na tela de edição (só sobe ao salvar, para não deixar lixo no Storage). */
var _fotoNova=null;
window.ruFotoEscolher=function(input){
  var f=input&&input.files&&input.files[0]; if(!f) return;
  if(!/^image\//.test(f.type)){ toast('Selecione uma imagem'); input.value=''; return; }
  if(f.size>3*1024*1024){ toast('Imagem muito grande (máx. 3 MB)'); input.value=''; return; }
  _fotoNova=f;
  var rd=new FileReader();
  rd.onload=function(ev){ var p=document.getElementById('ru_prev'); if(p)p.innerHTML='<img src="'+ev.target.result+'" alt="">'; };
  rd.readAsDataURL(f);
};
window.ruFotoRemover=function(){ _fotoNova='REMOVER';
  var p=document.getElementById('ru_prev');
  if(p)p.textContent=iniciais((document.getElementById('ru_nome')||{}).value);
  var i=document.getElementById('ru_foto'); if(i)i.value=''; };

async function subirFoto(userId){
  var SB=window.__SB, ORG=window.__ORG;
  if(!_fotoNova) return undefined;                 // não mexeu na foto
  if(_fotoNova==='REMOVER') return '';             // limpou
  if(!SB||!ORG){ toast('Sem conexão para enviar a foto'); return undefined; }
  var ext=((_fotoNova.name.split('.').pop()||'png')+'').toLowerCase();
  var path=ORG+'/'+userId+'-'+Date.now()+'.'+ext;
  var up=await SB.storage.from('avatars').upload(path,_fotoNova,{upsert:true,contentType:_fotoNova.type});
  if(up.error){ toast('Falha ao enviar a foto: '+up.error.message); return undefined; }
  return SB.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

function formUser(u){ u=u||{}; var ed=!!u.id; var s=load(); _fotoNova=null;
  var prev=u.foto?'<img src="'+u.foto+'" alt="">':iniciais(u.nome);
  modal(ed?"Editar usuário":"Novo usuário","",
    '<div class="fotoEdit"><div class="prev" id="ru_prev">'+prev+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px">'+
        '<label style="margin:0;font-size:11px">Foto do usuário</label>'+
        '<input id="ru_foto" type="file" accept="image/*" onchange="ruFotoEscolher(this)" style="font-size:12px">'+
        '<button type="button" class="b b-ghost b-sm" onclick="ruFotoRemover()">Remover foto</button>'+
      '</div></div>'+
    '<label>Nome</label><input id="ru_nome" value="'+(u.nome||'').replace(/"/g,'&quot;')+'">'+
    '<label>E-mail</label><input id="ru_email" value="'+(u.email||'').replace(/"/g,'&quot;')+'" placeholder="nome@oficina.com">'+
    '<label>Perfil</label><select id="ru_perfil">'+s.perfis.map(function(p){return '<option value="'+p.id+'"'+(u.perfil===p.id?' selected':'')+'>'+p.nome+'</option>';}).join('')+'</select>',
   async function(){ var nome=(document.getElementById('ru_nome').value||'').trim(); if(!nome){toast('Informe o nome');return;}
     var id = ed ? u.id : ('u_'+uid('u'));
     var foto = await subirFoto(id);               // undefined = manter a atual
     var rec={nome:nome,email:document.getElementById('ru_email').value,perfil:document.getElementById('ru_perfil').value};
     if(foto!==undefined) rec.foto=foto;
     var s2=load(); if(ed){var t=s2.usuarios.filter(function(x){return x.id===u.id;})[0]; if(t)Object.assign(t,rec);}
     else{s2.usuarios.push(Object.assign({id:id},rec));} save(s2); _fotoNova=null; closeModal(); renderRBAC(); toast('Usuário salvo ✓'); });
}
/* Primeira pintura do chip: se o app abrir já autenticado, a sessão ainda não chegou
   quando este arquivo carrega — o aplicarPermissoes() repinta depois com o usuário certo. */
if(document.readyState!=='loading') setTimeout(function(){window.renderUserChip();},0);
else document.addEventListener('DOMContentLoaded',function(){window.renderUserChip();});

window.rbacNovoUser=function(){formUser();};
window.rbacEditUser=function(id){var s=load();formUser(s.usuarios.filter(function(x){return x.id===id;})[0]);};
window.rbacDelUser=function(id){ confirmar("Excluir este usuário?",function(){var s=load();s.usuarios=s.usuarios.filter(function(x){return x.id!==id;});save(s);closeModal();renderRBAC();}); };
})();
