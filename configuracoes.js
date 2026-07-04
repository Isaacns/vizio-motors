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
  ["0.1.0","Fundação, identidade R3 e movimento vivo"]
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
  const cfg=(WORK._cfg)||{oficina:'R3 Centro Automotivo',especialidade:'Renault Master'};
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
     <div class="panel"><h3>🎨 Identidade / White-label <span class="torque-badge">EM BREVE</span></h3>
       <div style="font-size:13px;color:var(--muted);line-height:1.6">Como admin master, você poderá carregar a marca de cada oficina (logo, cores e nome) e o sistema veste a identidade daquele cliente — modo camaleão. Base já preparada no banco.</div>
     </div>
   </div>

   <div class="panel"><h3>👥 Usuários & Perfis (RBAC)</h3>
     <table class="tbl"><thead><tr><th>Perfil</th><th>Permissões</th></tr></thead>
     <tbody>${PERFIS_INFO.map(p=>`<tr><td><b>${p[0]}</b></td><td style="color:var(--muted)">${p[1]}</td></tr>`).join('')}</tbody></table>
     <div style="font-size:11.5px;color:#6d6552;margin-top:8px">Gestão de usuários por oficina entra com o painel do administrador master.</div>
   </div>

   <div class="grid2">
     <div class="panel"><h3>🔒 Segurança</h3>
       <div class="info-line"><span class="k">Isolamento por oficina (RLS)</span><span style="color:var(--ok)">Ativo</span></div>
       <div class="info-line"><span class="k">Registro de acesso</span><span style="color:var(--ok)">Ativo</span></div>
       <div class="info-line"><span class="k">Logout por inatividade</span><span>30 min</span></div>
       <div class="info-line" style="border:none"><span class="k">Tokens do portal</span><span style="color:var(--ok)">Aleatórios</span></div>
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

function editarOficina(){
  const cfg=(WORK._cfg)||(WORK._cfg={oficina:'R3 Centro Automotivo',especialidade:'Renault Master'});
  modal("Editar dados da oficina","",`
    <label>Nome da oficina</label><input id="of_nome" value="${cfg.oficina||''}">
    <label>Especialidade</label><input id="of_esp" value="${cfg.especialidade||''}">`,
   ()=>{cfg.oficina=document.getElementById('of_nome').value; cfg.especialidade=document.getElementById('of_esp').value;
     if(window.salvarOficinaMarca) window.salvarOficinaMarca(cfg);
     closeModal(); renderConfig();
     toast('Dados atualizados'+(window.VIZIO_LIVE?' (a marca completa entra no white-label)':''));});
}
