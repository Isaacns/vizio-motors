/* ===========================================================================
 * Vizio Motors by VIZIO — "Como usar a tela" (ajuda contextual) — v1
 * Botão "?" no topo abre um guia da TELA ATUAL: o que é, passo a passo e uma dica.
 * Conteúdo honesto (só o que a tela faz de fato). Padrão do Inovar (app-ajuda.js),
 * adaptado à moldura escura do Motors (tokens de acento --gold, --panel, --line).
 * Casado por window.vmAjudaAtual(), que lê o #pageTitle.
 * =========================================================================== */
(function(){
"use strict";
var esc = window.esc || function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };

/* chave = texto do #pageTitle -> {o:"o que é", p:[passos], d:"dica"} */
var AJUDA={
  "Início":{o:"Panorama da oficina: saudação, indicadores do dia, veículos em execução, as recomendações do Motor Torque e um resumo do painel (receita por serviço, OS por status e receita por mecânico).",
    p:["Leia os KPIs do topo para o retrato rápido do dia.","Clique num veículo em execução para abrir a OS.","Use <b>Dashboard →</b> para aprofundar nos números."],
    d:"É a sua tela inicial — o resto abre pelo menu à esquerda."},
  "Ordens de Serviço":{o:"O Quadro da Oficina: cada veículo em serviço é um cartão com foto, mecânico responsável, mini-linha do tempo e a etapa atual.",
    p:["Use os <b>chips</b> no topo para filtrar por etapa e a <b>busca</b> por placa, cliente ou nº da OS.","Clique em <b>Avançar →</b> para mover a etapa sem abrir a ordem.","Clique no cartão para abrir a OS completa (itens, checklist, fotos, portal).","<b>+ Nova OS</b> cria uma ordem escolhendo cliente e veículo."],
    d:"Quando a OS chega em Finalizado/Pronto, aparece o botão para avisar o cliente no WhatsApp."},
  "Serviços":{o:"Catálogo inteligente + inteligência: o que a oficina vende (preço, tempo, peças, garantia, mecânicos habilitados), o desempenho por serviço e a delegação de OS e tarefas.",
    p:["Filtre o catálogo pelas <b>categorias</b>.","Clique num cartão de serviço para editar preço, peças, garantia e quem faz.","No painel à direita, veja receita, volume e o <b>tempo real × estimado</b>.","Nas tabelas de baixo, escolha o <b>mecânico responsável</b> por cada OS e tarefa."],
    d:"O tempo real vem do Quadro de tarefas vinculado à OS — quanto mais você usa o quadro, melhor a medição."},
  "Agenda":{o:"A pauta da semana por dia e período (manhã/tarde/noite) e, abaixo, o Quadro de tarefas da oficina (Pendente → Em andamento → Concluída) com o tempo de cada etapa cronometrado.",
    p:["Navegue pelas semanas com ‹ / Hoje / ›.","Clique em <b>+</b> num dia para agendar; arraste um item para outro dia/período.","No quadro, arraste a tarefa entre as colunas (ou use ‹ / Avançar →).","Clique em ⏱ para ver o histórico e o tempo em cada etapa."],
    d:"No celular, use os botões ↔ e ‹ › em vez de arrastar."},
  "Clientes & Veículos":{o:"Cadastro de clientes (com endereço completo) e seus veículos — um cliente pode ter vários veículos.",
    p:["<b>+ Cliente</b> cadastra nome, contato, endereço (digite o <b>CEP</b> para autopreencher) e observações.","<b>+ Veículo</b> vincula um carro ao cliente, com <b>foto</b> opcional.","Clique num cliente para ver a ficha, os veículos e o histórico de OS.","Use o botão verde para falar com o cliente no WhatsApp."],
    d:"A foto do veículo aparece como miniatura no Quadro da Oficina."},
  "Estoque Inteligente":{o:"Controle de peças com alerta de reposição: mostra quem está abaixo do mínimo para sugerir compra.",
    p:["Busque uma peça pelo nome.","Veja em vermelho o que está abaixo do mínimo (Repor).","Use o Motor Torque na Início para a sugestão de compra."]},
  "Financeiro":{o:"Fluxo financeiro da oficina: receber, pagar e a visão de DRE.",
    p:["Lance receitas e despesas.","Acompanhe o que entra e o que sai no período."]},
  "CRM & Recuperação":{o:"Relacionamento e recuperação de clientes: quem está há tempo sem voltar e campanhas de retorno.",
    p:["Veja os clientes para recuperar.","Chame no WhatsApp direto da lista."]},
  "Dashboard Executivo":{o:"Cockpit de indicadores: faturamento, OS abertas/concluídas, ticket, receita por serviço/mecânico e mais — tudo clicável para o detalhe.",
    p:["Clique em qualquer indicador para o drill-down.","Use <b>Gerar relatório</b> para o PDF executivo."]},
  "Nota Fiscal (NFS-e)":{o:"Emissão de nota de serviço (NFS-e) a partir da OS.",
    p:["Escolha a OS e emita a nota.","Acompanhe o status das notas."],
    d:"Pelo Emissor Nacional — sem gateway, sem custo."},
  "Ponto & Equipe":{o:"Saldo de horas da equipe a partir da planilha do relógio de ponto.",
    p:["Importe o Excel do ponto.","Veja horas, extras e saldo por colaborador."]},
  "Bem-estar":{o:"Bem-estar e pausas da equipe: apoio ao ritmo do dia.",
    p:["Use como lembrete de pausas e organização."]},
  "Usuários & Acessos":{o:"Cadastro de usuários e perfis com permissões por módulo (Acesso / Editar).",
    p:["<b>+ Novo usuário</b> define nome, e-mail e perfil.","Em <b>Perfis</b>, ligue/desligue Acesso e Editar por módulo.","O menu de cada usuário reflete o que o perfil libera."],
    d:"O Administrador é protegido (acesso total)."},
  "Configurações":{o:"Dados da oficina, catálogo de serviços, usuários/perfis, segurança e o histórico de versões.",
    p:["Edite os dados da oficina e o catálogo.","Abra <b>Usuários & Acessos</b> para o RBAC.","Veja em Controle de versão o que mudou a cada release."]},
  "Identidade da oficina":{o:"White-label (modo Camaleão): veste o sistema com a marca da oficina — logo, cores e nome. Padrão: VIZIO.",
    p:["Suba a logo: as cores são extraídas automaticamente.","Ajuste cor primária, secundária e o raio dos cantos.","<b>Salvar identidade</b> aplica a marca; <b>Restaurar VIZIO</b> volta ao padrão."],
    d:"Painel de operadora — normalmente só o super-admin vê."}
};
var OS_DETALHE={o:"Ficha completa da Ordem de Serviço: acompanhamento por etapas, itens (serviços e peças), checklist, fotos do veículo e o link/portal do cliente.",
  p:["Use <b>Avançar/Voltar etapa</b> para mover o status.","<b>+ Adicionar item</b> inclui serviços e peças (puxa o preço do catálogo).","Em <b>Fotos do veículo</b>, registre o estado de entrada.","Copie o link do portal ou envie no WhatsApp; ao finalizar, avise o cliente que está pronto."]};
var GEN={o:"Esta tela faz parte do sistema da oficina.",
  p:["Passe pelos cartões e números para entender cada indicador.","Clique nos itens para ver detalhes ou editar."],
  d:"Dúvida? O botão ? no topo abre a ajuda da tela em que você está."};

function injectCSS(){
  if(document.getElementById("vmajuda-css"))return;
  var c=
  ".vmajd-ovl{position:fixed;inset:0;background:rgba(6,8,9,.62);backdrop-filter:blur(4px);z-index:1200;display:flex;align-items:flex-start;justify-content:center;padding:8vh 16px 16px;overflow:auto}"+
  ".vmajd-modal{background:var(--panel);border:1px solid var(--line);border-radius:18px;max-width:520px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,.55);overflow:hidden}"+
  ".vmajd-hd{background:linear-gradient(120deg,var(--gold-2),var(--gold-5));color:#fff;padding:15px 18px;display:flex;align-items:center;gap:10px}"+
  ".vmajd-hd .ic{font-size:1.25rem}.vmajd-hd b{font-family:var(--display);font-size:1rem;font-weight:600;flex:1}"+
  ".vmajd-hd button{background:transparent;border:0;color:#fff;font-size:1.3rem;cursor:pointer;line-height:1;opacity:.9}"+
  ".vmajd-bd{padding:16px 18px}"+
  ".vmajd-o{font-size:.9rem;color:var(--txt);line-height:1.5;margin:0 0 12px}"+
  ".vmajd-sec{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold-2);margin:12px 0 6px}"+
  ".vmajd-steps{list-style:none;margin:0;padding:0;counter-reset:s}"+
  ".vmajd-steps li{position:relative;padding:7px 0 7px 30px;font-size:.85rem;line-height:1.45;color:var(--txt);border-bottom:1px solid var(--line);counter-increment:s}"+
  ".vmajd-steps li:last-child{border-bottom:0}"+
  ".vmajd-steps li::before{content:counter(s);position:absolute;left:0;top:6px;width:20px;height:20px;border-radius:50%;background:var(--gold-2);color:#fff;font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center}"+
  ".vmajd-dica{margin-top:12px;font-size:.8rem;color:var(--gold-2);background:color-mix(in srgb,var(--gold-2) 10%,transparent);border:1px solid color-mix(in srgb,var(--gold-2) 26%,transparent);border-radius:10px;padding:9px 12px;line-height:1.45}"+
  ".vmajd-ft{padding:10px 18px 16px;text-align:right}"+
  ".vmajd-ft button{background:linear-gradient(180deg,var(--gold-2),var(--gold-4));color:#fff;border:0;border-radius:10px;padding:10px 20px;font-family:var(--display);font-weight:600;cursor:pointer;font-size:.86rem}";
  var s=document.createElement("style");s.id="vmajuda-css";s.textContent=c;document.head.appendChild(s);
}
function fechar(){var o=document.getElementById("vmajd-ovl");if(o)o.remove();}
window.vmAjudaFechar=fechar;

function abrir(a,titulo){
  injectCSS(); fechar();
  var passos=(a.p||[]).map(function(x){return '<li>'+x+'</li>';}).join("");
  var ovl=document.createElement("div");ovl.className="vmajd-ovl";ovl.id="vmajd-ovl";
  ovl.innerHTML='<div class="vmajd-modal" role="dialog" aria-label="Como usar a tela">'+
    '<div class="vmajd-hd"><span class="ic">💡</span><b>Como usar · '+esc(titulo)+'</b><button title="Fechar" onclick="vmAjudaFechar()">×</button></div>'+
    '<div class="vmajd-bd"><p class="vmajd-o">'+a.o+'</p>'+
      (passos?'<div class="vmajd-sec">Passo a passo</div><ol class="vmajd-steps">'+passos+'</ol>':"")+
      (a.d?'<div class="vmajd-dica">💡 '+a.d+'</div>':"")+
    '</div>'+
    '<div class="vmajd-ft"><button onclick="vmAjudaFechar()">Entendi</button></div>'+
  '</div>';
  ovl.addEventListener("click",function(e){if(e.target===ovl)fechar();});
  document.body.appendChild(ovl);
}

/* Abre a ajuda da tela atual (lida do #pageTitle). */
window.vmAjudaAtual=function(){
  var t=((document.getElementById('pageTitle')||{}).textContent||'').trim();
  if(/^OS\s*#/.test(t)) return abrir(OS_DETALHE, t);
  abrir(AJUDA[t]||GEN, t||'Esta tela');
};
})();
