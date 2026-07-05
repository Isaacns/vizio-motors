/* ============================================================
   Vizio Motors — torque.js · MOTOR TORQUE (inteligência)
   Lê toda a operação (CRM, estoque, financeiro, OS, vendas) e
   devolve recomendações priorizadas por impacto (R$) e urgência,
   além de um "Torque Score" de saúde da oficina.
   Motor de regras — roda no próprio sistema, sem custo/LLM.
   Depende de: WORK, osTotal, money, go, e (quando presentes)
   crmDados(), estoqueAnalise(), finKPIs(), alavSugestoes().
   ============================================================ */
function _tqMoney(v){ return (typeof money==='function')?money(v):('R$ '+Math.round(v||0)); }

function torqueInsights(){
  var out=[]; var W=window.WORK||{}; var os=W.os||[];
  var aprov=os.filter(function(o){return o.aprovado;});
  var ticketMedio=aprov.length?(aprov.reduce(function(s,o){return s+osTotal(o);},0)/aprov.length):600;

  /* 1 · Recuperação de receita (CRM) */
  try{ if(typeof crmDados==='function'){ var D=crmDados();
    var oleo=D.filter(function(d){return d.oleo[0]==='Vencida';});
    var rev=D.filter(function(d){return d.rev[0]==='Vencida';});
    var venc={}; oleo.concat(rev).forEach(function(d){venc[d.c.id]=true;});
    var nVenc=Object.keys(venc).length;
    if(nVenc>0){ out.push({id:'rec',cat:'Recuperação',ic:'💛',urg:3,imp:oleo.length*350+rev.length*900,
      titulo:nVenc+' cliente(s) com manutenção vencida',
      desc:oleo.length+' com óleo vencido e '+rev.length+' com revisão vencida. Contato ativo recupera receita já madura.',
      cta:'Abrir CRM',act:'abrirCRM()'}); }
    var inativos=D.filter(function(d){return d.inativo;});
    if(inativos.length>0){ out.push({id:'inat',cat:'Recuperação',ic:'😴',urg:2,imp:Math.round(inativos.length*ticketMedio),
      titulo:inativos.length+' cliente(s) inativo(s)',
      desc:'Sem visita há mais de 6 meses. Uma campanha de retorno reativa a base com custo baixo.',
      cta:'Abrir CRM',act:'abrirCRM()'}); }
  } }catch(e){}

  /* 2 · Estoque preditivo */
  try{ if(typeof estoqueAnalise==='function'){ var R=estoqueAnalise();
    var faltando=R.filter(function(r){return r.compra>0;});
    if(faltando.length>0){ var custo=faltando.reduce(function(s,r){return s+r.compra*(r.p.custo||0);},0);
      var urgente=faltando.filter(function(r){return r.dias!==Infinity && r.dias<7;}).length;
      out.push({id:'estq',cat:'Estoque',ic:'📦',urg:urgente>0?3:2,imp:Math.round(custo),
        titulo:faltando.length+' peça(s) para repor',
        desc:(urgente>0?urgente+' com risco de ruptura em menos de 7 dias. ':'')+'Repor a tempo evita OS parada por falta de peça.',
        cta:'Abrir Estoque',act:'abrirEstoquePred()'}); }
    var paradas=R.filter(function(r){return r.consumo===0;});
    var capital=paradas.reduce(function(s,r){return s+(r.p.custo||0)*(r.p.estoque||0);},0);
    if(capital>500){ out.push({id:'parado',cat:'Estoque',ic:'🧊',urg:1,imp:Math.round(capital),
      titulo:_tqMoney(capital)+' em peças paradas',
      desc:paradas.length+' item(ns) sem giro. Um combo ou promoção libera esse capital.',
      cta:'Abrir Alavancagem',act:'abrirAlavancagem()'}); }
  } }catch(e){}

  /* 3 · Financeiro */
  try{ if(typeof finKPIs==='function'){ var k=finKPIs();
    if(k.aPagar>k.saldo){ out.push({id:'fluxo',cat:'Financeiro',ic:'⚠️',urg:3,imp:Math.round(k.aPagar-k.saldo),
      titulo:'Contas a pagar acima do caixa',
      desc:'A pagar '+_tqMoney(k.aPagar)+' vs caixa '+_tqMoney(k.saldo)+'. Antecipe recebíveis ('+_tqMoney(k.aReceber)+' a receber) para cobrir o gap.',
      cta:'Abrir Financeiro',act:'abrirFin()'}); }
    if(k.recMes>0 && k.margem<15){ out.push({id:'margem',cat:'Financeiro',ic:'📉',urg:2,imp:0,
      titulo:'Margem do mês em '+k.margem.toFixed(1)+'%',
      desc:'Abaixo do saudável (15%+). Revise preços, priorize serviços de maior margem e negocie custo de peças.',
      cta:'Abrir Financeiro',act:'abrirFin()'}); }
  } }catch(e){}

  /* 4 · Operação — orçamentos aguardando aprovação */
  var aguardando=os.filter(function(o){return !o.aprovado && (o.statusIdx||0)<=2;});
  if(aguardando.length>0){ var travado=aguardando.reduce(function(s,o){return s+osTotal(o);},0);
    out.push({id:'orc',cat:'Operação',ic:'📝',urg:3,imp:Math.round(travado),
      titulo:aguardando.length+' orçamento(s) aguardando aprovação',
      desc:_tqMoney(travado)+' parados esperando o "sim" do cliente. Um follow-up rápido destrava a receita.',
      cta:'Ver Ordens de Serviço',act:"(typeof go==='function')&&go('os')"}); }

  /* 5 · Vendas — combos sugeridos */
  try{ if(typeof alavSugestoes==='function'){ var sug=alavSugestoes();
    if(sug.length>0){ out.push({id:'combo',cat:'Vendas',ic:'🏷️',urg:1,imp:0,
      titulo:sug.length+' combo(s) sugerido(s) para subir o ticket',
      desc:'Pacotes prontos aumentam o valor médio por OS sem esforço extra de venda.',
      cta:'Abrir Alavancagem',act:'abrirAlavancagem()'}); } } }catch(e){}

  return out;
}

function torqueScore(ins){
  var score=100;
  ins.forEach(function(i){ score -= (i.urg>=3?12:(i.urg===2?7:3)); });
  return Math.max(5,Math.min(100,Math.round(score)));
}

function renderTorque(){
  var ins=torqueInsights().sort(function(a,b){return (b.urg-a.urg)||(b.imp-a.imp);});
  var score=torqueScore(ins);
  var emJogo=ins.reduce(function(s,i){return s+(i.imp||0);},0);
  var prioridade=ins.filter(function(i){return i.urg>=2;}).length;
  var col=score>=75?'var(--ok)':(score>=50?'var(--warn)':'var(--bad)');
  var C=2*Math.PI*52, off=C*(1-score/100);
  var gauge='<svg width="148" height="148" viewBox="0 0 120 120" role="img" aria-label="Torque Score '+score+'">'+
    '<circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="9"/>'+
    '<circle cx="60" cy="60" r="52" fill="none" stroke="'+col+'" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)"/>'+
    '<text x="60" y="57" text-anchor="middle" font-size="32" font-weight="300" fill="var(--platinum)" font-family="var(--display,sans-serif)">'+score+'</text>'+
    '<text x="60" y="76" text-anchor="middle" font-size="8.5" fill="var(--muted)" letter-spacing="2">TORQUE</text></svg>';
  var label=score>=75?'Oficina saudável':(score>=50?'Atenção em pontos-chave':'Requer ação imediata');
  var cards=ins.length?ins.map(function(i){ var uc=i.urg>=3?'var(--bad)':(i.urg===2?'var(--warn)':'var(--gold-2)');
    return '<div class="alert" style="border-left-color:'+uc+'"><div class="ai">'+i.ic+'</div><div class="at">'+
      '<div style="display:flex;align-items:center;gap:8px"><b>'+i.titulo+'</b>'+
        (i.imp>0?'<span class="badge s0" style="margin-left:auto">'+_tqMoney(i.imp)+'</span>':'')+'</div>'+
      '<span style="color:var(--muted)">'+i.desc+'</span><br>'+
      '<button class="b b-sm" style="margin-top:8px" onclick="'+i.act+'">'+i.cta+' →</button></div></div>';}).join('')
    :'<div style="color:var(--muted);font-size:13px">Nenhum alerta no momento. A operação está redonda. 🎉</div>';
  document.getElementById('view').innerHTML=
   '<div class="panel" style="display:flex;align-items:center;gap:26px;flex-wrap:wrap">'+
     '<div style="flex:none">'+gauge+'</div>'+
     '<div style="flex:1;min-width:210px">'+
       '<div style="font-family:var(--display);font-size:19px;margin-bottom:4px">Motor Torque <span class="torque-badge" style="color:'+col+'">'+label+'</span></div>'+
       '<div style="color:var(--muted);font-size:13px;margin-bottom:14px">Inteligência que lê sua operação e mostra onde agir primeiro — priorizado por impacto financeiro.</div>'+
       '<div class="kpis" style="margin:0">'+
         '<div class="kpi"><div class="lbl">Receita em jogo</div><div class="val">'+_tqMoney(emJogo)+'</div></div>'+
         '<div class="kpi"><div class="lbl">Ações prioritárias</div><div class="val">'+prioridade+'</div></div>'+
         '<div class="kpi"><div class="lbl">Insights ativos</div><div class="val">'+ins.length+'</div></div>'+
       '</div></div>'+
   '</div>'+
   '<div class="panel"><div class="head"><h3>⚙️ Recomendações priorizadas</h3><div class="sp"></div>'+
     '<button class="b b-ghost b-sm" onclick="relTorque_pdf()">📄 Relatório</button></div>'+cards+'</div>';
}

function abrirTorque(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent='Motor Torque · Inteligência';
  document.getElementById('side').classList.remove('open');
  var q=document.getElementById('q'); if(q)q.value='';
  renderTorque();
}
window.abrirTorque=abrirTorque;
window.torqueInsights=torqueInsights;

function relTorque_pdf(){ if(typeof relatorioPDF!=='function')return;
  var ins=torqueInsights().sort(function(a,b){return (b.urg-a.urg)||(b.imp-a.imp);});
  var score=torqueScore(ins);
  var kpis=[['Torque Score',String(score)+' / 100'],
    ['Receita em jogo',_tqMoney(ins.reduce(function(s,i){return s+(i.imp||0);},0))],
    ['Ações prioritárias',String(ins.filter(function(i){return i.urg>=2;}).length)]];
  var corpo=RP.kpis(kpis)+RP.sec('Recomendações priorizadas')+
    RP.table(['Prioridade','Categoria','Recomendação','Impacto'],
      ins.map(function(i){return [(i.urg>=3?'Alta':(i.urg===2?'Média':'Baixa')),i.cat,i.titulo,(i.imp>0?_tqMoney(i.imp):'—')];}));
  relatorioPDF({titulo:'Relatório Torque',subtitulo:'Inteligência operacional — recomendações priorizadas',corpo:corpo});
}
window.relTorque_pdf=relTorque_pdf;
