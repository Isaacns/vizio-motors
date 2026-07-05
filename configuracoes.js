/* ============================================================
   Vizio Motors — configuracoes.js (Fase 3 · Plataforma)
   Módulo de Configurações: dados da oficina, usuários & perfis,
   segurança, controle de versão, sobre.
   Depende de app.js (WORK, money, toast, modal, closeModal, fmtFull, today).
   ============================================================ */
const APP_VERSION = "0.6.0";
const CHANGELOG = [
  ["0.6.0","Configurações, WhatsApp no cliente, alertas de agenda e dashboard reestruturado"],
  ["0.5.0","Módulos corporativos (ponto/bem-estar/alavancagem) e estoque preditivo"],
  ["0.4.0","CRM & Recuperação, Dashboard executivo e NF-e"],
  ["0.3.0","Financeiro (fluxo, receber/pagar, DRE)"],
  ["0.2.0","Ordem de Serviço, Clientes & Veículos, Agenda e Portal do Cliente"],
  ["0.1.0","Fundação, identidade VIZIO e movimento vivo"]
];
const PERFIS_INFO = [
  ["Administrador","Acesso total ao sistema e às configurações."],
  ["Gerente","Operação, gestão e relatórios; sem configurações críticas."],
  ["Financeiro","Financeiro, notas fiscais e relatórios."],
  ["Recepção","Ordens de serviço, agenda e clientes."],
  ["Mecânico","Suas OS, checklist e status; controle de ponto."],
  ["Estoque","Estoque, compras e fornecedores."],
  ["Visualizador","Somente leitura."]
];

function abrirConfig(){
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  document.getElementById('pageTitle').textContent="Configurações";
  document.getElementById('side').classList.remove('open');
  document.getElementById('q').value='';
  renderConfig();
}

function renderConfig(){
  const cfg=(WORK._cfg)||{oficina:'Oficina Demonstração',especialidade:'Multimarcas'};
  const live=!!window.VIZIO_LIVE;
  document.getElementById('view').innerHTML=`
   <div class="grid2">
     <div class="panel"><h3>🏢 Dados da oficina</h3>
       <div class="info-line"><span class="k">Nome</span><span id="cf_nome_v">${cfg.oficina||'—'}</span></div>
       <div class="info-line"><span class="k">Especialidade</span><span>${cfg.especialidade||'—'}</span></div>
       <div class="info-line"><span class="k">Plano</span><span style="color:var(--gold-2)">${live?'—':'Piloto'}</span></div>
       <div class="info-line" style="border:none"><span class="k">Backend</span><span>${live?'Supabase (ao vivo)':'Demonstração'}</span></div>
       <div style="margin-top:14px"><button class="b b-sm" onclick="editarOficina()">Editar dados</button></div>
     </div>
     <div class="panel"><h3>🦎 Identidade / White-label <span class="torque-badge" style="background:rgba(90,160,255,.14);color:var(--gold-2)">ATIVO</span></h3>
       <div style="font-size:13px;color:var(--muted);line-height:1.6">Como admin master, carregue a marca de cada oficina (logo, cor e nome) e o sistema veste a identidade daquele cliente — modo camaleão. Padrão: VIZIO.</div>
       <div style="margin-top:14px"><button class="b b-sm" onclick="abrirMarca()">Abrir identidade</button></div>
     </div>
   </div>

   <div class="panel"><div class="head"><h3>🛠️ Catálogo de serviços</h3><div class="sp"></div>
       <button class="b b-sm" onclick="novoServico()">+ Novo serviço</button></div>
     <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Serviços e preços usados nas Ordens de Serviço e nos combos.</div>
     <table class="tbl"><thead><tr><th>Serviço</th><th>Categoria</th><th style="text-align:center">Tempo</th><th style="text-align:right">Preço</th><th></th></tr></thead>
     <tbody>${(WORK.servicos||[]).map(s=>`<tr style="cursor:pointer" onclick="editServico('${s.id}')"><td><b>${s.nome}</b></td><td style="color:var(--muted)">${s.categoria||'—'}</td>
       <td style="text-align:center">${s.tempoMin?s.tempoMin+' min':'—'}</td><td style="text-align:right;color:var(--gold-2)">${money(s.preco)}</td>
       <td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()"><button class="b b-ghost b-sm" title="Editar" onclick="editServico('${s.id}')">✏️</button> <button class="b b-ghost b-sm" title="Excluir" onclick="delServico('${s.id}')">🗑</button></td></tr>`).join('')||'<tr><td colspan="5" style="color:var(--muted)">Nenhum serviço cadastrado.</td></tr>'}</tbody></table>
   </div>

   <div class="panel"><h3>👥 Usuários & Perfis (RBAC)</h3>
     <table class="tbl"><thead><tr><th>Perfil</th><th>Permissões</th></tr></thead>
     <tbody>${PERFIS_INFO.map(p=>`<tr><td><b>${p[0]}</b></td><td style="color:var(--muted)">${p[1]}</td></tr>`).join('')}</tbody></table>
     <div style="margin-top:12px"><button class="b b-sm" onclick="abrirRBAC()">Gerenciar usuários & acessos</button></div>
   </div>

   <div class="grid2">
     <div class="panel"><h3>🔒 Segurança</h3>
       <div class="info-line"><span class="k">Isolamento por oficina (RLS)</span><span style="color:var(--ok)">Ativo</span></div>
       <div class="info-line"><span class="k">Registro de acesso</span><span style="color:var(--ok)">Ativo</span></div>
       <div class="info-line"><span class="k">Logout por inatividade</span><span>30 min</span></div>
       <div class="info-line" style="border:none"><span class="k">Tokens do portal</span><span style="color:var(--ok)">Aleatórios</span></div>
       <div style="margin-top:12px"><button class="b b-sm" onclick="trocarSenha()">Alterar minha senha</button></div>
     </div>
     <div class="panel"><h3>🧩 Controle de versão</h3>
       <div style="margin-bottom:8px">Versão atual: <b style="color:var(--gold-2)">v${APP_VERSION}</b></div>
       ${CHANGELOG.map(c=>`<div class="info-line"><span class="k">v${c[0]}</span><span style="max-width:70%;text-align:right;font-size:12px">${c[1]}</span></div>`).join('')}
     </div>
   </div>

   <div class="panel" style="text-align:center;padding:24px">
     <div style="font-family:var(--display);color:var(--gold-2);font-size:18px">Vizio Motors</div>
     <div style="color:var(--muted);font-size:13px;margin-top:4px">Sua oficina virou sistema inteligente. — um produto VIZIO / INPERSON</div>
   </div>`;
}

function formServico(s){ s=s||{}; const ed=!!s.id;
  modal(ed?"Editar serviço":"Novo serviço","",`
    <label>Nome</label><input id="sv_nome" value="${(s.nome||'').replace(/"/g,'&quot;')}" placeholder="Ex.: Alinhamento e balanceamento">
    <div class="frow"><div><label>Preço (R$)</label><input id="sv_preco" type="number" step="0.01" value="${s.preco||0}"></div>
    <div><label>Tempo (min)</label><input id="sv_tempo" type="number" value="${s.tempoMin||0}"></div></div>
    <label>Categoria</label><input id="sv_cat" value="${(s.categoria||'').replace(/"/g,'&quot;')}" placeholder="Ex.: Freios, Motor, Revisão">`,
   ()=>{ if(!document.getElementById('sv_nome').value){toast('Informe o nome do serviço');return;}
     const rec={nome:document.getElementById('sv_nome').value,preco:+document.getElementById('sv_preco').value||0,
       tempoMin:+document.getElementById('sv_tempo').value||0,categoria:document.getElementById('sv_cat').value};
     if(!WORK.servicos)WORK.servicos=[];
     if(ed){Object.assign(s,rec);}else{WORK.servicos.push(Object.assign({id:uid('S')},rec));}
     closeModal(); renderConfig(); toast(ed?'Serviço atualizado ✓':'Serviço adicionado ✓'); });
}
function novoServico(){formServico();}
function editServico(id){formServico(byId(WORK.servicos,id));}
function delServico(id){confirmar("Excluir este serviço do catálogo?",()=>{WORK.servicos=(WORK.servicos||[]).filter(s=>s.id!==id);closeModal();renderConfig();});}
window.novoServico=novoServico; window.editServico=editServico; window.delServico=delServico;

function trocarSenha(){
  modal("Alterar minha senha","A nova senha vale para o seu login (Supabase Auth)",`
    <label>Nova senha</label><input id="ns1" type="password" placeholder="mínimo 8 caracteres" autocomplete="new-password">
    <label>Confirmar nova senha</label><input id="ns2" type="password" placeholder="repita a nova senha" autocomplete="new-password">
    <div style="font-size:11.5px;color:var(--muted);margin-top:8px">Use uma senha forte e única. Após salvar, ela substitui a anterior imediatamente.</div>`,
   async ()=>{
     const a=(document.getElementById('ns1')||{}).value||"", b=(document.getElementById('ns2')||{}).value||"";
     if(a.length<8){ toast('A senha precisa de ao menos 8 caracteres'); return; }
     if(a!==b){ toast('As senhas não coincidem'); return; }
     const SB=window.__SB;
     if(!SB){ toast('Disponível apenas no modo online (Supabase)'); return; }
     try{ const r=await SB.auth.updateUser({password:a});
       if(r.error){ toast('Erro: '+r.error.message); return; }
       closeModal(); toast('Senha alterada com sucesso ✓');
     }catch(e){ toast('Falha ao alterar a senha: '+e.message); }
   });
}
window.trocarSenha=trocarSenha;
function editarOficina(){
  const cfg=(WORK._cfg)||(WORK._cfg={oficina:'Oficina Demonstração',especialidade:'Multimarcas'});
  modal("Editar dados da oficina","",`
    <label>Nome da oficina</label><input id="of_nome" value="${cfg.oficina||''}">
    <label>Especialidade</label><input id="of_esp" value="${cfg.especialidade||''}">`,
   ()=>{cfg.oficina=document.getElementById('of_nome').value; cfg.especialidade=document.getElementById('of_esp').value;
     if(window.salvarOficinaMarca) window.salvarOficinaMarca(cfg);
     closeModal(); renderConfig();
     toast('Dados atualizados'+(window.VIZIO_LIVE?' (a marca completa entra no white-label)':''));});
}
