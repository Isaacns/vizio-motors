/* ============================================================
   Vizio Motors — configuracoes.js (Fase 3 · Plataforma)
   Módulo de Configurações: dados da oficina, usuários & perfis,
   segurança, controle de versão, sobre.
   Depende de app.js (WORK, money, toast, modal, closeModal, fmtFull, today).
   ============================================================ */
/* Fonte única: window.APP_VERSION vem do index.html (§14.2). Nunca redeclarar com const/let
   aqui — todos os .js compartilham o mesmo escopo de script e a colisão derruba este arquivo
   inteiro. (Bug real, 19/07/2026: quebrou o módulo Configurações por completo.) */
const APP_VERSION = window.APP_VERSION || "0.6.0";
const CHANGELOG = [
  ["1.0.100","Correções: (1) Agenda — removido o traço que aparecia sobre o nome do serviço nos cartões concluídos (texto agora limpo e legível). (2) Quadro de tarefas — o cronômetro da demonstração voltou a mostrar tempos plausíveis (o relógio da oficina real continua exato). (3) Busca do topo — na tela Início a busca passou a funcionar: digite cliente, veículo, placa ou número de OS e o sistema leva direto ao resultado."],
  ["1.0.99","Instância dedicada por domínio: quando o sistema é aberto no endereço próprio de uma oficina (ex.: r3.viziostudio.com.br), ele já veste a identidade daquela oficina desde a tela de entrada e aponta para a conta dela — sem seletor de marca. No endereço padrão do Vizio Motors nada muda. Base para entregar cada cliente no seu próprio site com o mesmo sistema"],
  ["1.0.98","Acabamento premium e identidade da oficina: o Motor de Identidade (Camaleão) agora troca TUDO ao vestir uma marca — logo em imagem própria (a Oficina R3 já entra com o emblema real dourado, com a AURA respirando ao redor), cores, nome e o acento dos gráficos — e PERMANECE até você reverter (botão “Restaurar VIZIO”). Cada gráfico ganhou cores próprias por barra, coerentes com a marca, com o movimento líquido do padrão VIZIO — sem travar. Correções: o topo fixo não encobre mais o conteúdo ao rolar (títulos sempre visíveis) e o logo carrega de forma confiável"],
  ["1.0.97","Novo Portal do Cliente: a página pública de acompanhamento foi reconstruída com a identidade da própria oficina (logo redonda animada e cores da marca). O cliente entra com o CPF ou a placa — validados de forma segura no servidor — e vê o status do serviço em destaque, uma linha do tempo animada das etapas, a previsão de entrega, as observações da oficina e botões para falar no WhatsApp ou ligar. Link de outro cliente/veículo é recusado sem expor dados de terceiros"],
  ["1.0.96","Quadro da Oficina: as Ordens de Serviço viraram um quadro de cartões com foto do veículo, mecânico responsável e mini-linha do tempo — avance a etapa com um clique sem abrir a OS. Serviços virou um catálogo inteligente (peças, garantia, mecânicos habilitados) com painel de desempenho. Cadastro de cliente com endereço completo (busca por CEP), fotos do veículo/OS, logo redonda animada (AURA), guia “Como usar” em cada tela e aviso de “serviço pronto” pelo WhatsApp"],
  ["1.0.95","Sistema com a nova moldura (menu e topo flutuantes), Início com resumo do painel (receita por serviço, status e mecânicos), novo módulo Serviços para delegar cada OS/tarefa ao mecânico responsável, botão “Avançar →” no quadro, link de acompanhamento do cliente por WhatsApp e o app agora é instalável no celular"],
  ["1.0.94","Quadro de tarefas da oficina na Agenda: organize o serviço em Pendente → Em andamento → Concluída arrastando os cartões, com o tempo de cada etapa cronometrado e guardado no histórico"],
  ["1.0.93","Gráficos vivos: as barras do dashboard e do financeiro ganham uma superfície líquida que ondula suavemente, como se estivessem se enchendo — um toque sutil, sem pesar (respeita quem prefere menos animação)"],
  ["1.0.92","Sistema com movimento vivo: os números principais contam até o valor, os cards entram com um leve deslize e o mouse ganha realces suaves — sem pesar (respeita quem prefere menos animação)"],
  ["1.0.91","Mais segurança: todos os campos de cadastro passaram a ser protegidos contra conteúdo malicioso, inclusive no portal do cliente e nos relatórios em PDF"],
  ["1.0.90","Arrastar-e-soltar da Agenda corrigido: mover uma atividade entre dias e períodos ficou preciso de verdade"],
  ["1.0.89","Agenda do dono: título livre, categorias, cliente/veículo opcionais e concluir/reabrir atividades"],
  ["1.0.87","Push de atualização em arquivo próprio, com aviso amigável na tela quando há versão nova (inclusive no login)"],
  ["1.0.85","Push de atualização conforme o playbook §14 e guarda de HTTPS com loopback"],
  ["1.0.84","RBAC no banco (perfis e usuários multiempresa com RLS) e ícone na aba"],
  ["1.0.83","Usuário no topo com foto, ficha ao clicar no registro e upload de avatar"],
  ["1.0.82","Login por e-mail real (fim do usuário fixo no código)"],
  ["1.0.80","Nomenclatura canônica das logos por tema"],
  ["1.0.78","Brand Kit completo no tenant e importação de ponto persistente"],
  ["1.0.77","Menu por permissão (RBAC aplicado à navegação)"],
  ["1.0.76","VersionGate (push de atualização), botão WhatsApp padrão e régua de botões"],
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
  /* White-label "camaleão" (branding de terceiros) é ajuste da operadora INPERSON/dev.
     O admin do CLIENTE não vê este painel (item 7 do redesign). */
  const sa=window.vmIsSuperAdmin?window.vmIsSuperAdmin():true;
  const idPanel = sa ? `<div class="panel"><h3>🦎 Identidade / White-label <span class="torque-badge" style="background:rgba(90,160,255,.14);color:var(--gold-2)">SUPER-ADMIN</span></h3>
       <div style="font-size:13px;color:var(--muted);line-height:1.6">Como operadora (INPERSON), carregue a marca de cada oficina (logo, cor e nome) e o sistema veste a identidade daquele cliente — modo camaleão. Padrão: VIZIO.</div>
       <div style="margin-top:14px"><button class="b b-sm" onclick="abrirMarca()">Abrir identidade</button></div>
     </div>` : '';
  document.getElementById('view').innerHTML=`
   <div class="${sa?'grid2':''}">
     <div class="panel"><h3>🏢 Dados da oficina</h3>
       <div class="info-line"><span class="k">Nome</span><span id="cf_nome_v">${esc(cfg.oficina)||'—'}</span></div>
       <div class="info-line"><span class="k">Especialidade</span><span>${esc(cfg.especialidade)||'—'}</span></div>
       <div class="info-line"><span class="k">Plano</span><span style="color:var(--gold-2)">${live?'—':'Piloto'}</span></div>
       <div class="info-line" style="border:none"><span class="k">Backend</span><span>${live?'Supabase (ao vivo)':'Demonstração'}</span></div>
       <div style="margin-top:14px"><button class="b b-sm" onclick="editarOficina()">Editar dados</button></div>
     </div>
     ${idPanel}
   </div>

   <div class="panel"><div class="head"><h3>🛠️ Catálogo de serviços</h3><div class="sp"></div>
       <button class="b b-sm" onclick="novoServico()">+ Novo serviço</button></div>
     <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Serviços e preços usados nas Ordens de Serviço e nos combos.</div>
     <table class="tbl"><thead><tr><th>Serviço</th><th>Categoria</th><th style="text-align:center">Tempo</th><th style="text-align:right">Preço</th><th></th></tr></thead>
     <tbody>${(WORK.servicos||[]).map(s=>`<tr style="cursor:pointer" onclick="editServico('${s.id}')"><td><b>${esc(s.nome)}</b></td><td style="color:var(--muted)">${esc(s.categoria)||'—'}</td>
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
     <div style="color:var(--muted);font-size:13px;margin-top:4px">Sua oficina virou sistema inteligente. — by VIZIO</div>
   </div>`;
}

function formServico(s){ s=s||{}; const ed=!!s.id;
  const eq=(window.equipeMotors?window.equipeMotors():[]);
  const sel=Array.isArray(s.mecanicos)?s.mecanicos:[];
  const checks=eq.length?eq.map(function(n){return '<label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;margin:0 10px 6px 0"><input type="checkbox" class="sv_mec" value="'+esc(n)+'"'+(sel.indexOf(n)>=0?' checked':'')+' style="width:auto"> '+esc(n)+'</label>';}).join('')
    :'<span style="color:var(--muted);font-size:12px">Cadastre a equipe em Usuários & Acessos.</span>';
  modal(ed?"Editar serviço":"Novo serviço","",`
    <label>Nome</label><input id="sv_nome" value="${esc(s.nome)}" placeholder="Ex.: Alinhamento e balanceamento">
    <div class="frow"><div><label>Preço base (R$)</label><input id="sv_preco" type="number" step="0.01" value="${s.preco||0}"></div>
    <div><label>Tempo estimado (min)</label><input id="sv_tempo" type="number" value="${s.tempoMin||0}"></div></div>
    <label>Categoria</label><input id="sv_cat" value="${esc(s.categoria)}" placeholder="Ex.: Freios, Motor, Revisão">
    <label>Peças utilizadas <i style="color:var(--muted);font-style:normal">(opcional)</i></label><input id="sv_pecas" value="${esc(s.pecas)}" placeholder="Ex.: pastilhas · sensor de desgaste">
    <label>Garantia <i style="color:var(--muted);font-style:normal">(opcional)</i></label><input id="sv_gar" value="${esc(s.garantia)}" placeholder="Ex.: 6 meses / 10.000 km">
    <label>Mecânicos habilitados</label><div style="margin-top:4px">${checks}</div>`,
   ()=>{ if(!document.getElementById('sv_nome').value){toast('Informe o nome do serviço');return;}
     const mecs=[].slice.call(document.querySelectorAll('.sv_mec:checked')).map(function(x){return x.value;});
     const rec={nome:document.getElementById('sv_nome').value,preco:+document.getElementById('sv_preco').value||0,
       tempoMin:+document.getElementById('sv_tempo').value||0,categoria:document.getElementById('sv_cat').value,
       pecas:document.getElementById('sv_pecas').value,garantia:document.getElementById('sv_gar').value,mecanicos:mecs};
     if(!WORK.servicos)WORK.servicos=[];
     if(ed){Object.assign(s,rec);}else{WORK.servicos.push(Object.assign({id:uid('S')},rec));}
     closeModal(); _afterServ(); toast(ed?'Serviço atualizado ✓':'Serviço adicionado ✓'); });
}
/* O catálogo aparece tanto em Configurações quanto no módulo Serviços — re-renderiza o que estiver aberto. */
function _afterServ(){ var t=(document.getElementById('pageTitle')||{}).textContent;
  if(t==='Serviços'&&window.renderServicos) return renderServicos(); renderConfig(); }
function novoServico(){formServico();}
function editServico(id){formServico(byId(WORK.servicos,id));}
function delServico(id){confirmar("Excluir este serviço do catálogo?",()=>{WORK.servicos=(WORK.servicos||[]).filter(s=>s.id!==id);closeModal();_afterServ();});}
window.novoServico=novoServico; window.editServico=editServico; window.delServico=delServico;

function trocarSenha(){
  modal("Alterar minha senha","A nova senha vale para o seu login (Supabase Auth)",`
    <label>Nova senha</label>
    <div style="position:relative"><input id="ns1" type="password" placeholder="mínimo 8 caracteres" autocomplete="new-password" style="padding-right:44px">
      <button type="button" class="pw-eye" onclick="var p=document.getElementById('ns1');p.type=(p.type==='password'?'text':'password');this.textContent=(p.type==='password'?'👁':'🙈')" aria-label="Mostrar/ocultar senha">👁</button></div>
    <label>Confirmar nova senha</label>
    <div style="position:relative"><input id="ns2" type="password" placeholder="repita a nova senha" autocomplete="new-password" style="padding-right:44px">
      <button type="button" class="pw-eye" onclick="var p=document.getElementById('ns2');p.type=(p.type==='password'?'text':'password');this.textContent=(p.type==='password'?'👁':'🙈')" aria-label="Mostrar/ocultar senha">👁</button></div>
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
    <label>Nome da oficina</label><input id="of_nome" value="${esc(cfg.oficina)}">
    <label>Especialidade</label><input id="of_esp" value="${esc(cfg.especialidade)}">`,
   ()=>{cfg.oficina=document.getElementById('of_nome').value; cfg.especialidade=document.getElementById('of_esp').value;
     if(window.salvarOficinaMarca) window.salvarOficinaMarca(cfg);
     closeModal(); renderConfig();
     toast('Dados atualizados'+(window.VIZIO_LIVE?' (a marca completa entra no white-label)':''));});
}
