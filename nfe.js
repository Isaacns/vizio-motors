/* ============================================================
   Vizio Motors — nfe.js · NFS-e (Caminho A · Emissor Nacional)
   Padrão INPERSON: nota de SERVIÇO (NFS-e) emitida no Portal
   Nacional da NFS-e (nfse.gov.br), GRÁTIS, sem gateway. Como MEI,
   o ISS é recolhido no DAS. O sistema prepara os dados de cada OS
   e guarda o número da nota para controle.
   Depende de app.js (WORK, money, cli, veh, byId, osTotal, modal,
   closeModal, confirmar, toast, today, fmtFull, uid, svc, prt).
   ============================================================ */
var EMISSOR_NACIONAL="https://www.nfse.gov.br/EmissorNacional";

function nfList(){ if(!WORK.notas)WORK.notas=[]; return WORK.notas; }
function fiscalCfg(){ if(!WORK.fiscal)WORK.fiscal={regime:"MEI",cnpj:"",im:"",lc116:"14.01",municipio:""}; return WORK.fiscal; }

function abrirNFe(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent="Nota Fiscal (NFS-e)";
  document.getElementById('side').classList.remove('open');
  var q=document.getElementById('q'); if(q)q.value='';
  renderNFe();
}

function discriminacao(o){
  var itens=(o.itens||[]).filter(function(i){return i.tipo==='servico';})
    .map(function(i){var r=svc(i.refId);return (r.nome||'Serviço')+(i.qtd>1?' × '+i.qtd:'');});
  if(!itens.length)itens=['Serviços de manutenção automotiva'];
  return 'Serviços de manutenção automotiva (OS #'+o.numero+'): '+itens.join('; ')+'.';
}
function valorServicos(o){ return (o.itens||[]).filter(function(i){return i.tipo==='servico';})
  .reduce(function(s,i){return s+(i.valor||0);},0) || osTotal(o); }

function renderNFe(){
  var notas=nfList().slice().sort(function(a,b){return (''+b.data+b.numero).localeCompare(''+a.data+a.numero);});
  var val=notas.reduce(function(s,n){return s+(n.valor||0);},0);
  var f=fiscalCfg();
  var semNota=WORK.os.filter(function(o){return o.aprovado && !nfList().some(function(n){return n.osId===o.id;});});
  var kpis=[['Notas registradas',notas.length],['Valor em NFS-e',money(val)],['OS a emitir',semNota.length],['Regime',f.regime||'MEI']];

  document.getElementById('view').innerHTML=
   '<div style="max-width:1080px">'+
   '<div class="kpis">'+kpis.map(function(k){return '<div class="kpi"><div class="lbl">'+k[0]+'</div><div class="val">'+k[1]+'</div></div>';}).join('')+'</div>'+

   '<div class="panel"><div class="head"><h3>🏛️ Emissão via Emissor Nacional <span class="torque-badge" style="background:rgba(84,209,166,.14);color:var(--ok)">GRÁTIS</span></h3></div>'+
     '<div style="font-size:13px;color:var(--muted);line-height:1.6">Como <b>MEI</b>, sua nota de serviço (NFS-e) é emitida no <b>Portal Nacional da NFS-e</b>, sem custo e sem gateway. O ISS é recolhido no <b>DAS</b>. O sistema prepara os dados de cada OS; você emite no portal e registra aqui o número da nota para controle.</div>'+
     '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">'+
       '<a class="b b-sm" style="text-decoration:none" target="_blank" rel="noopener" href="'+EMISSOR_NACIONAL+'">Abrir Emissor Nacional ↗</a>'+
       '<button class="b b-ghost b-sm" onclick="editarFiscal()">Identidade fiscal</button></div>'+
   '</div>'+

   '<div class="panel"><h3>🧾 Identidade fiscal</h3>'+
     '<div class="info-line"><span class="k">Regime</span><span>'+(f.regime||'MEI')+'</span></div>'+
     '<div class="info-line"><span class="k">CNPJ</span><span>'+(f.cnpj||'<span style="color:var(--dim)">a preencher</span>')+'</span></div>'+
     '<div class="info-line"><span class="k">Inscrição Municipal</span><span>'+(f.im||'<span style="color:var(--dim)">se exigida pelo município</span>')+'</span></div>'+
     '<div class="info-line" style="border:none"><span class="k">Item LC 116/03</span><span>'+(f.lc116||'14.01')+' — manutenção de veículos</span></div>'+
   '</div>'+

   '<div class="panel"><h3>📋 OS aprovadas prontas para emitir</h3>'+
     (semNota.length?semNota.map(function(o){var v=veh(o.veiculoId);return '<div class="veh"><div class="plate">'+esc(v.placa)+'</div>'+
       '<div class="info"><div class="t">OS #'+o.numero+' · '+esc(cli(o.clienteId).nome)+'</div>'+
       '<div class="s">'+money(valorServicos(o))+' em serviços · '+esc(v.modelo)+'</div></div>'+
       '<button class="b b-sm" onclick="prepararNFSe(\''+o.id+'\')">Preparar dados</button></div>';}).join('')
       :'<div style="color:var(--muted);font-size:13px">Todas as OS aprovadas já têm nota registrada.</div>')+
   '</div>'+

   '<div class="panel"><div class="head"><h3>🗂️ Notas registradas</h3><div class="sp"></div>'+
       '<button class="b b-sm" onclick="prepararNFSe()">+ Registrar nota</button></div>'+
     (notas.length?'<table class="tbl"><thead><tr><th>Nº NFS-e</th><th>Tomador</th><th>Data</th><th>Valor</th><th></th></tr></thead>'+
       '<tbody>'+notas.map(function(n){return '<tr style="cursor:pointer" onclick="editarNota(\''+n.id+'\')"><td><b>'+(esc(n.numero)||'—')+'</b></td>'+
         '<td>'+esc(n.cliente)+'</td><td>'+fmtFull(n.data)+'</td><td style="color:var(--gold-2)">'+money(n.valor)+'</td>'+
         '<td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()"><button class="b b-ghost b-sm" onclick="verMinuta(\''+n.id+'\')">Minuta</button> '+
           '<button class="b b-ghost b-sm" onclick="editarNota(\''+n.id+'\')">✏️</button> '+
           '<button class="b b-ghost b-sm" onclick="excluirNota(\''+n.id+'\')">🗑</button></td></tr>';}).join('')+'</tbody></table>'
       :'<div style="color:var(--muted);font-size:13px">Nenhuma nota registrada. Prepare os dados de uma OS acima e registre o número emitido no portal.</div>')+
   '</div>'+
   '<div style="font-size:11.5px;color:var(--dim);text-align:center;margin-top:6px">NFS-e pelo Emissor Nacional (gratuito). Sem gateway, sem custo. Um padrão INPERSON.</div>'+
   '</div>';
}

/* prepara os dados da OS + registra o número emitido no portal */
function prepararNFSe(osId){
  var aprovadas=WORK.os.filter(function(o){return o.aprovado;});
  if(!aprovadas.length){ toast("Nenhuma OS aprovada."); return; }
  var opts=aprovadas.map(function(o){return '<option value="'+o.id+'"'+(o.id===osId?' selected':'')+'>OS #'+o.numero+' — '+esc(cli(o.clienteId).nome)+' — '+money(valorServicos(o))+'</option>';}).join('');
  modal("Preparar NFS-e","Copie os dados para o Emissor Nacional e registre o número",
    '<label>Ordem de Serviço</label><select id="nf_os" onchange="nfPrev()">'+opts+'</select>'+
    '<label style="margin-top:10px">Discriminação dos serviços</label><textarea id="nf_disc" rows="3" style="font-size:12.5px"></textarea>'+
    '<div class="frow"><div><label>Valor do serviço (R$)</label><input id="nf_valor" type="number" step="0.01"></div>'+
    '<div><label>Data</label><input id="nf_data" type="date" value="'+today()+'"></div></div>'+
    '<label>Nº da NFS-e (após emitir no portal)</label><input id="nf_num" placeholder="registre aqui o número emitido">'+
    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">'+
      '<button type="button" class="b b-ghost b-sm" onclick="nfCopiar()">📋 Copiar dados</button>'+
      '<a class="b b-ghost b-sm" style="text-decoration:none" target="_blank" rel="noopener" href="'+EMISSOR_NACIONAL+'">Abrir Emissor Nacional ↗</a></div>',
   function(){
     var o=byId(WORK.os,document.getElementById('nf_os').value);
     var n={id:uid('NF'),osId:o.id,cliente:cli(o.clienteId).nome||'',
       valor:+document.getElementById('nf_valor').value||valorServicos(o),
       discriminacao:document.getElementById('nf_disc').value,
       numero:document.getElementById('nf_num').value.trim(),
       data:document.getElementById('nf_data').value||today(),status:'registrada'};
     nfList().push(n); closeModal(); renderNFe();
     toast(n.numero?('NFS-e nº '+n.numero+' registrada ✓'):'Dados salvos — registre o número quando emitir');
   });
  setTimeout(nfPrev,40);
}
function nfPrev(){ var o=byId(WORK.os,(document.getElementById('nf_os')||{}).value); if(!o)return;
  var d=document.getElementById('nf_disc'); if(d)d.value=discriminacao(o);
  var v=document.getElementById('nf_valor'); if(v)v.value=valorServicos(o); }
function nfCopiar(){ var o=byId(WORK.os,(document.getElementById('nf_os')||{}).value)||{};
  var txt='Tomador: '+(cli(o.clienteId).nome||'')+'\nDiscriminação: '+(document.getElementById('nf_disc').value||'')+'\nValor: '+money(+document.getElementById('nf_valor').value||0)+'\nItem LC116: '+(fiscalCfg().lc116||'14.01');
  if(navigator.clipboard)navigator.clipboard.writeText(txt); toast('Dados copiados — cole no Emissor Nacional'); }

function editarNota(id){ var n=byId(nfList(),id); if(!n)return;
  modal("Editar nota","",
    '<label>Nº da NFS-e</label><input id="en_num" value="'+esc(n.numero)+'">'+
    '<div class="frow"><div><label>Valor (R$)</label><input id="en_valor" type="number" step="0.01" value="'+(n.valor||0)+'"></div>'+
    '<div><label>Data</label><input id="en_data" type="date" value="'+(n.data||today())+'"></div></div>'+
    '<label>Discriminação</label><textarea id="en_disc" rows="3">'+esc(n.discriminacao)+'</textarea>',
   function(){ n.numero=document.getElementById('en_num').value.trim(); n.valor=+document.getElementById('en_valor').value||n.valor;
     n.data=document.getElementById('en_data').value||n.data; n.discriminacao=document.getElementById('en_disc').value;
     closeModal(); renderNFe(); toast('Nota atualizada ✓'); });
}
function excluirNota(id){ confirmar("Excluir esta nota do controle?",function(){ WORK.notas=nfList().filter(function(x){return x.id!==id;}); closeModal(); renderNFe(); }); }

/* minuta da NFS-e (documento de controle para impressão) */
function verMinuta(id){ var n=byId(nfList(),id); var o=byId(WORK.os,n.osId)||{}; var v=veh(o.veiculoId)||{}; var f=fiscalCfg();
  modal("Minuta NFS-e"+(n.numero?(" nº "+esc(n.numero)):""),"Documento de controle — não substitui a nota oficial",
    '<div class="info-line"><span class="k">Prestador</span><span>'+(window.BRAND_NAME||'Vizio Motors')+' · '+(f.regime||'MEI')+'</span></div>'+
    '<div class="info-line"><span class="k">Tomador</span><span>'+esc(n.cliente)+'</span></div>'+
    '<div class="info-line"><span class="k">Veículo</span><span>'+esc(v.placa)+' '+esc(v.modelo)+'</span></div>'+
    '<div class="info-line"><span class="k">Item LC 116/03</span><span>'+(f.lc116||'14.01')+'</span></div>'+
    '<div class="info-line"><span class="k">Emissão</span><span>'+fmtFull(n.data)+'</span></div>'+
    '<div style="margin:12px 0 4px;font-weight:600;color:var(--gold-2)">Discriminação</div>'+
    '<div style="font-size:12.5px;color:var(--txt)">'+esc(n.discriminacao||discriminacao(o))+'</div>'+
    '<div class="tot"><div>Valor do serviço</div><div class="v">'+money(n.valor)+'</div></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:8px">ISS recolhido no DAS (MEI). Nota oficial emitida no Emissor Nacional (nfse.gov.br).</div>',
   function(){closeModal();});
  var b=document.getElementById('mSave'); if(b)b.textContent="Fechar";
}

function editarFiscal(){ var f=fiscalCfg();
  modal("Identidade fiscal","Dados usados na preparação da NFS-e",
    '<div class="frow"><div><label>Regime</label><select id="fi_reg"><option'+(f.regime==='MEI'?' selected':'')+'>MEI</option><option'+(f.regime==='ME'?' selected':'')+'>ME</option><option'+(f.regime==='Simples'?' selected':'')+'>Simples Nacional</option></select></div>'+
    '<div><label>Item LC 116/03</label><input id="fi_lc" value="'+(f.lc116||'14.01')+'"></div></div>'+
    '<div class="frow"><div><label>CNPJ</label><input id="fi_cnpj" value="'+(f.cnpj||'')+'" placeholder="00.000.000/0001-00"></div>'+
    '<div><label>Inscrição Municipal</label><input id="fi_im" value="'+(f.im||'')+'"></div></div>'+
    '<label>Município</label><input id="fi_mun" value="'+(f.municipio||'')+'" placeholder="Salvador/BA">',
   function(){ f.regime=document.getElementById('fi_reg').value; f.lc116=document.getElementById('fi_lc').value||'14.01';
     f.cnpj=document.getElementById('fi_cnpj').value; f.im=document.getElementById('fi_im').value; f.municipio=document.getElementById('fi_mun').value;
     closeModal(); renderNFe(); toast('Identidade fiscal salva ✓'); });
}
window.abrirNFe=abrirNFe; window.prepararNFSe=prepararNFSe; window.nfPrev=nfPrev; window.nfCopiar=nfCopiar;
window.editarNota=editarNota; window.excluirNota=excluirNota; window.verMinuta=verMinuta; window.editarFiscal=editarFiscal;
