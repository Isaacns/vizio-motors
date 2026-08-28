/* ============================================================
   Vizio Motors — app.js (lógica do sistema)
   Depende de dados.js (DADOS, STATUS_FLOW). Estado em memória
   (cópia de sessão). No go-live, persistência via Supabase.
   ============================================================ */
/* ===== emblema ===== */
const GEAR=(()=>{const n=12,rt=250,rr=214,tf=.36,rf=.62,s=2*Math.PI/n,P=(r,a)=>[300+r*Math.cos(a),300+r*Math.sin(a)];let p=[];
 for(let i=0;i<n;i++){const a=i*s-Math.PI/2;p.push(P(rr,a-s*rf/2),P(rt,a-s*tf/2),P(rt,a+s*tf/2),P(rr,a+s*rf/2));}
 return "M"+p.map(q=>q[0].toFixed(1)+" "+q[1].toFixed(1)).join(" L")+" Z";})();
const MED=327,MOFF=(600-MED)/2;
/* Sigla da marca para o núcleo da AURA: marca curta (ex.: "R3") aparece inteira;
   marca longa vira as iniciais (ex.: "Vizio Motors" -> "VM"). Camaleão-friendly. */
function brandSigla(){
  var nm=(window.BRAND_NAME||'Vizio Motors').trim(), t=nm.split(/\s+/);
  var ini=(t[0]&&t[0].length<=3)?t[0].toUpperCase()
         :t.map(function(w){return w[0]||'';}).slice(0,2).join('').toUpperCase();
  return (ini||'VM').slice(0,3);
}
/* AURA ORBI — logo redonda animada (pulseLogo + halo pulsante), CSS/SVG.
   Parametrizavel pelo Camaleao (usa os tokens de acento --gold e --accent2 e BRAND_NAME).
   LOGO EM IMAGEM por identidade: quando a marca tem imagem própria (BRAND_LOGO_IMG — ex.:
   Oficina R3), a AURA envolve a IMAGEM (halos pulsantes + respiração), em vez do emblema
   gerado com a sigla. Sem imagem (padrão VIZIO), mantém a AURA gerada. */
function emblemSVG(size){ size=+size||120;
  var img=window.BRAND_LOGO_IMG;
  if(img){
    return '<div class="aura aura-img" style="width:'+size+'px;height:'+size+'px">'+
      '<span class="halo"></span><span class="halo two"></span>'+
      '<span class="core img"><img src="'+esc(img)+'" alt="'+esc(window.BRAND_NAME||'')+'" '+
        'onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<b style=&quot;font-size:'+Math.round(size*0.34)+'px&quot;>'+esc(brandSigla())+'</b>\'"></span></div>';
  }
  return '<div class="aura" style="width:'+size+'px;height:'+size+'px">'+
    '<span class="halo"></span><span class="halo two"></span><span class="ring"></span>'+
    '<span class="core"><b style="font-size:'+Math.round(size*0.34)+'px">'+esc(brandSigla())+'</b></span></div>';
}
window.emblemSVG=emblemSVG;

/* Paleta categórica coerente com a MARCA (§ bug 2): gera N cores distintas a partir dos
   tokens --gold-2 (acento) e --accent2, girando o matiz em torno do acento e variando a
   leveza. Para a identidade R3 (ouro) sai um leque quente ouro→âmbar→bronze; para a VIZIO
   (azul) sai um leque de azuis/turquesas. Sempre acompanha o Camaleão. */
function _hexToRgb(h){ h=String(h||'').trim().replace('#',''); if(h.length===3)h=h.split('').map(c=>c+c).join('');
  var n=parseInt(h||'5b8cff',16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function _rgbToHsl(r,g,b){ r/=255;g/=255;b/=255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0,s=0,l=(mx+mn)/2;
  if(d){ s=l>0.5?d/(2-mx-mn):d/(mx+mn); h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4); h*=60; }
  return {h:h,s:s,l:l}; }
function _hslToHex(h,s,l){ h=((h%360)+360)%360; s=Math.max(0,Math.min(1,s)); l=Math.max(0,Math.min(1,l));
  var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join(''); }
function vmChartColors(n){ n=Math.max(1,n|0);
  var cs=getComputedStyle(document.documentElement);
  var a1=(cs.getPropertyValue('--gold-2').trim())||'#5b8cff';
  var a2=(cs.getPropertyValue('--accent2').trim())||'';
  var h1=_rgbToHsl(_hexToRgb(a1).r,_hexToRgb(a1).g,_hexToRgb(a1).b);
  var h2=a2?_rgbToHsl(_hexToRgb(a2).r,_hexToRgb(a2).g,_hexToRgb(a2).b):null;
  // amplitude do leque de matiz: pequena para acentos quentes (ouro), maior p/ frios (azul)
  var warm=(h1.h<70||h1.h>330), span=warm?46:120, base=h1.h-span/2;
  var out=[];
  for(var i=0;i<n;i++){ var t=n>1?i/(n-1):0.5;
    var hue=base+span*t + Math.sin(t*6.28)*6;
    var sat=Math.max(.42,Math.min(.86,h1.s*(0.9+0.25*Math.cos(t*3.14))));
    var lit=0.60 - 0.12*Math.cos(t*3.14);   // 0.48..0.72, legível no escuro
    out.push(_hslToHex(hue,sat,lit));
  }
  // garante que o acento da marca lidere a série
  out[0]=a1; if(h2&&n>2)out[Math.min(n-1,2)]=a2;
  return out;
}
window.vmChartColors=vmChartColors;

/* ===== estado ===== */
let WORK = JSON.parse(JSON.stringify(DADOS));
let CUR = "home";
const money = v => "R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const byId = (arr,id)=>arr.find(x=>x.id===id)||{};
const cli = id=>byId(WORK.clientes,id);
const veh = id=>byId(WORK.veiculos,id);
const svc = id=>byId(WORK.servicos,id);
const prt = id=>byId(WORK.pecas,id);
const osTotal = o => (o.itens||[]).reduce((s,i)=>s+(i.valor||0),0);
const nextNum = ()=> Math.max(1000,...WORK.os.map(o=>o.numero))+1;
const uid = p => p+"_"+Math.random().toString(36).slice(2,8);

/* Upload de foto (veículo/OS) — bucket vm-veiculos (RLS por org, caminho <org_id>/…).
   Em modo demo (sem Supabase) devolve um dataURL para a miniatura aparecer na sessão. */
window.vmUploadFoto=async function(file){
  if(!file) return '';
  if(!/^image\//.test(file.type)){ toast('Selecione uma imagem'); return ''; }
  if(file.size>5*1024*1024){ toast('Imagem muito grande (máx. 5 MB)'); return ''; }
  const SB=window.__SB, ORG=window.__ORG;
  if(SB&&ORG){
    const ext=((file.name.split('.').pop()||'jpg')+'').toLowerCase();
    const path=ORG+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
    const up=await SB.storage.from('vm-veiculos').upload(path,file,{upsert:true,contentType:file.type});
    if(up.error){ toast('Falha ao enviar foto: '+up.error.message); return ''; }
    return SB.storage.from('vm-veiculos').getPublicUrl(path).data.publicUrl;
  }
  return await new Promise(res=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=()=>res(''); r.readAsDataURL(file); });
};
/* Autopreenchimento de endereço por CEP (ViaCEP). Só preenche campos vazios;
   se estiver offline/bloqueado, falha em silêncio e o usuário digita à mão. */
window.vmBuscaCep=async function(cep){ cep=(cep||'').replace(/\D/g,''); if(cep.length!==8) return;
  try{ const r=await fetch('https://viacep.com.br/ws/'+cep+'/json/'); const d=await r.json();
    if(d&&!d.erro){ const set=(id,v)=>{const e=document.getElementById(id); if(e&&!e.value)e.value=v||'';};
      set('f_log',d.logradouro); set('f_bairro',d.bairro); set('f_cidade',d.localidade); set('f_uf',d.uf); }
  }catch(e){}
};

/* ===== login / nav ===== */
function entrar(e){e.preventDefault();
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('emblemSide').innerHTML=emblemSVG(44);
  go('home');
}
function sair(){location.hash='';location.reload();}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>{
  if(a.dataset.m){document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active');
    go(a.dataset.m,a.dataset.t);document.getElementById('side').classList.remove('open');}
}));
const TITLES={home:"Início",os:"Ordens de Serviço",agenda:"Agenda",clientes:"Clientes & Veículos",estoque:"Estoque Inteligente"};
function go(m,t){CUR=m;document.getElementById('q').value='';
  document.getElementById('pageTitle').textContent=TITLES[m]||t||"";
  ({home:renderHome,os:renderOS,agenda:renderAgenda,clientes:renderClientes,estoque:renderEstoque,stub:()=>renderStub(t)}[m]||renderHome)();
}
function onSearch(){const q=document.getElementById('q').value;
  if(CUR==='clientes')renderClientes(q);else if(CUR==='os')renderOS(q);else if(CUR==='estoque')renderEstoque(q);}

/* ===== HOME ===== */
function saudacao(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';}
function primeiroNome(n){return (n||'').trim().split(/\s+/)[0]||'';}
const HUES=['#5b8cff','#7fa3ff','#a9c1ff','#6ee2c0','#e6b566','#b7a6ff','#7fbfd6','#8894a6','#54d1a6'];
function renderHome(){
  const emExec=WORK.os.filter(o=>o.statusIdx<8);
  const concl=WORK.os.filter(o=>o.statusIdx>=7);
  const critico=WORK.pecas.filter(p=>p.estoque<p.minimo);
  const aprov=WORK.os.filter(o=>o.aprovado);
  const fat=aprov.reduce((s,o)=>s+osTotal(o),0);
  const ticket=aprov.length?fat/aprov.length:0;
  const prontas=WORK.os.filter(o=>o.statusIdx===8).length;
  /* KPIs com count-up: [rótulo, valor-alvo numérico, money?, dt-classe, dt-texto] */
  const kpis=[
    ['Faturamento (aprovado)',fat,1,'up','▲ OS aprovadas no período'],
    ['OS em execução',emExec.length,0,'up',WORK.os.filter(o=>o.statusIdx===2).length+' aguardando aprovação'],
    ['Prontas p/ retirada',prontas,0,'up','concluídas: '+concl.length],
    ['Clientes ativos',WORK.clientes.length,0,'up','▲ base cadastrada'],
    ['Estoque crítico',critico.length,0,critico.length?'down':'up','itens abaixo do mínimo'],
    ['Ticket médio',ticket,1,'up','▲ por OS aprovada'],
  ];
  const alertas=[
    ['📦', critico.length?`<b>${critico.length} peça(s)</b> abaixo do mínimo: ${critico.map(p=>esc(p.nome)).join(', ')} — sugerir compra.`:'Estoque saudável — nenhuma peça abaixo do mínimo.'],
    ['🔔','<b>17 clientes</b> com troca de óleo vencida — campanha de recuperação pronta para disparo.'],
    ['⭐','<b>João Pereira</b> está há 8 meses sem revisão e tem histórico de aceitar preventiva.'],
    ['📉','Margem do serviço <b>“Revisão 40k”</b> caiu <b>18%</b> — custo de peça subiu no fornecedor atual.'],
  ];
  /* Resumo do Dashboard Executivo embutido na Início — reaproveita dashData() (não duplica lógica) */
  const D=(typeof dashData==='function')?dashData():null;
  const nome=primeiroNome((window.rbacUsuarioAtual?rbacUsuarioAtual().nome:'')||'');
  const oficina=(WORK._cfg&&WORK._cfg.oficina)||window.BRAND_NAME||'sua oficina';
  let resumo='';
  if(D){
    const topServ=Object.entries(D.recServ).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const statusList=STATUS_FLOW.map((s,i)=>[s,D.porStatus[i],i]).filter(x=>x[1]>0);
    const rankMec=Object.entries(D.mec).sort((a,b)=>b[1]-a[1]).slice(0,5);
    resumo=`
     <div class="grid2">
       <div class="panel"><div class="head"><h3>💰 Receita por serviço</h3><div class="sp"></div>
         <button class="b b-ghost b-sm" onclick="abrirDash()">Dashboard →</button></div>
         <div class="hchart"><canvas id="homeChart"></canvas></div>
       </div>
       <div class="panel"><h3>📊 Resumo operacional</h3>
         <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">OS por status</div>
         ${statusList.map(x=>`<div class="hstat"><div class="sk"><span class="sd" style="background:${HUES[x[2]%HUES.length]}"></span><b>${esc(x[0])}</b></div><span class="sv">${x[1]}</span></div>`).join('')||'<div style="color:var(--muted);font-size:12px">Sem OS.</div>'}
         <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px">Receita por mecânico</div>
         ${rankMec.map((m,i)=>`<div class="hstat"><div class="sk"><span class="sd" style="background:${HUES[i%HUES.length]}"></span><b>${esc(m[0])}</b></div><span class="sv">${money(m[1])}</span></div>`).join('')||'<div style="color:var(--muted);font-size:12px">Sem dados.</div>'}
       </div>
     </div>`;
    window.__homeServPairs=topServ;
  }
  document.getElementById('view').innerHTML=`
   <div class="greet">
     <div class="g-ic">🔧</div>
     <div><h3>${saudacao()}${nome?', '+esc(nome):''} — a oficina está a todo vapor.</h3>
       <p>Panorama da ${esc(oficina)} · ${emExec.length} em serviço · ${prontas} prontas p/ retirada.</p></div>
   </div>
   <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="lbl">${k[0]}</div><div class="val">${k[2]?money(k[1]):(k[1]||0).toLocaleString('pt-BR')}</div><div class="dt ${k[3]}">${k[4]}</div></div>`).join('')}</div>
   <div class="grid2">
     <div class="panel"><div class="head"><h3>🚐 Veículos em execução</h3><div class="sp"></div><button class="b b-sm" onclick="go('os')">Ver todas</button></div>
       ${emExec.map(o=>{const v=veh(o.veiculoId),pct=Math.round(o.statusIdx/8*100);return `
        <div class="veh" onclick="openOS('${o.id}')"><div class="plate">${esc(v.placa)}</div>
          <div class="info"><div class="t">${esc(v.modelo)}</div><div class="s">OS #${o.numero} · ${esc(cli(o.clienteId).nome)}${o.responsavel?' · '+esc(primeiroNome(o.responsavel)):''}</div>
            <div class="bar"><i style="width:${pct}%"></i></div></div>
          <div class="stage">${STATUS_FLOW[o.statusIdx]}<br><span style="color:var(--dim);font-weight:400">${pct}%</span></div></div>`;}).join('')||'<div style="color:var(--muted);font-size:13px">Nenhum veículo em execução.</div>'}
     </div>
     <div class="panel"><h3>⚡ Motor Torque <span class="torque-badge">IA · RECOMENDA</span></h3>
       ${alertas.map(a=>`<div class="alert"><div class="ai">${a[0]}</div><div class="at">${a[1]}</div></div>`).join('')}
     </div>
   </div>
   ${resumo}`;
  /* KPIs: o count-up é do motion-vm.js (MutationObserver central em #view). */
  if(D) vmLiquidChart('homeChart', window.__homeServPairs);
}

/* Gráfico líquido (canvas) — barras que se enchem com onda. Reaproveitado da moldura Ateliê,
   em paleta Motors (lê os tokens --gold-*). Visual-only; para em prefers-reduced-motion. */
let _liqRaf=null,_liqPhase=0;
function vmLiquidChart(id,pairs){
  const cv=document.getElementById(id); if(!cv||!pairs||!pairs.length) return;
  if(_liqRaf)cancelAnimationFrame(_liqRaf);   /* rAF ÚNICO: cancela o loop líquido anterior (troca de tela) */
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const muted=css('--muted')||'#79838f', line=css('--line')||'rgba(255,255,255,.06)';
  const labels=pairs.map(p=>{const n=String(p[0]);return n.length>10?n.slice(0,10)+'…':n;});
  const vals=pairs.map(p=>p[1]);
  /* CADA BARRA COM SUA COR — paleta categórica derivada dos tokens da marca (Camaleão). */
  const cols=(typeof vmChartColors==='function')?vmChartColors(vals.length):vals.map(()=>css('--gold-2')||'#5b8cff');
  const hexa=(hex,a)=>{const c=(hex||'').replace('#','');if(c.length!==6)return hex;const n=parseInt(c,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
  const dark=(hex,f)=>{const c=(hex||'').replace('#','');if(c.length!==6)return hex;const n=parseInt(c,16);return `rgb(${Math.round((n>>16&255)*f)},${Math.round((n>>8&255)*f)},${Math.round((n&255)*f)})`;};
  const rr=(ctx,x,y,w,h,r)=>{r=Math.min(r,w/2,Math.abs(h)/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();};
  const max=Math.max(...vals)*1.15||1, fill=vals.map(()=>0);
  function frame(){
    /* CUR guard: um canvas de tela fechada/removida nunca continua animando.
       (Aba oculta não precisa de guard: o rAF já é suspenso pelo navegador — e o último
        quadro desenhado permanece; um guard aqui só impediria o 1º desenho.) */
    if(!document.body.contains(cv)){cancelAnimationFrame(_liqRaf);_liqRaf=null;return;}
    const dpr=Math.min(2,devicePixelRatio||1), w=cv.clientWidth, h=cv.clientHeight;
    if(cv.width!==w*dpr||cv.height!==h*dpr){cv.width=w*dpr;cv.height=h*dpr;}
    const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    _liqPhase+=reduce?0:0.06;
    const pad=26, gap=(w-pad*2)/vals.length, bw=gap*0.54;
    ctx.strokeStyle=line;ctx.lineWidth=1;
    for(let g=0;g<=3;g++){const y=pad+(h-pad*2-14)*g/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();}
    vals.forEach((val,i)=>{
      const col=cols[i%cols.length];               // cor própria da barra (paleta da marca)
      const target=val/max; fill[i]+=(target-fill[i])*(reduce?1:0.08);
      const x=pad+gap*i+(gap-bw)/2, base=h-pad-6, top=base-(h-pad*2-14)*fill[i];
      ctx.fillStyle=hexa(col,.09); rr(ctx,x,pad+8,bw,base-pad-2,6); ctx.fill();   // trilho da barra na própria cor
      ctx.save(); rr(ctx,x,top,bw,base-top,6); ctx.clip();
      for(let L=0;L<2;L++){ctx.beginPath();const amp=L?2.2:2.4,ph=_liqPhase+(L?1.6:0),wcol=L?hexa(dark(col,.62),.55):col;
        ctx.moveTo(x,base);for(let px=0;px<=bw;px++){const yy=top+Math.sin((px/bw*6.28)+ph)*amp;ctx.lineTo(x+px,yy);}
        ctx.lineTo(x+bw,base);ctx.closePath();ctx.fillStyle=wcol;ctx.fill();}
      ctx.restore();
      ctx.fillStyle=muted;ctx.font='10px Inter,sans-serif';ctx.textAlign='center';
      ctx.fillText(labels[i],x+bw/2,h-8);
    });
    _liqRaf=requestAnimationFrame(frame);
  }
  frame();
}

/* ===== ORDENS DE SERVIÇO — QUADRO DA OFICINA (cards) ===== */
/* Cada OS é um cartão: foto do veículo, mecânico responsável, mini-timeline das
   etapas (STATUS_FLOW real) e "Avançar →" inline (avança a etapa sem abrir a OS,
   reusando o mesmo fluxo). Chips por etapa + busca. Abrir a OS continua a 1 clique. */
window._osQuadroFiltro=window._osQuadroFiltro||'all';
const CAR_SIL='<svg class="car" viewBox="0 0 100 44" xmlns="http://www.w3.org/2000/svg"><path d="M6 32 h5 a6 6 0 0 1 12 0 h30 a6 6 0 0 1 12 0 h9 c3 0 5-2 5-5 v-2 c0-3-2-5-5-5.6 l-13-3 c-4-3-9-5-15-5 h-12 c-4 0-8 1.6-11 4.4 l-7 6.6 c-5 .6-8 2.4-8 6.2 v3 c0 1.4 1 2.6 2.4 2.6 z" fill="rgba(255,255,255,.20)" stroke="rgba(255,255,255,.38)" stroke-width="1"/><circle cx="23" cy="33" r="6" fill="#0a0d11" stroke="rgba(255,255,255,.5)" stroke-width="2"/><circle cx="65" cy="33" r="6" fill="#0a0d11" stroke="rgba(255,255,255,.5)" stroke-width="2"/></svg>';
function plateHue(s){let h=0;s=String(s||'x');for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360;}
function mechAv(nome){nome=(nome||'').trim();
  const ini=nome?nome.split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase():'?';
  const h=plateHue(nome||'x');
  return {ini,grad:`linear-gradient(135deg,hsl(${h},65%,62%),hsl(${(h+42)%360},68%,68%)`+')'};}
function osFotoThumb(o,v){
  const url=(o.fotos&&o.fotos[0])||v.foto_url||'';
  if(url) return `<div class="osphoto"><img src="${esc(url)}" alt="" loading="lazy"><span class="cam" title="Foto do veículo">📷</span></div>`;
  const H=plateHue(v.placa||o.id);
  return `<div class="osphoto"><span class="sky" style="background:linear-gradient(150deg,hsl(${H},30%,26%),hsl(${H},42%,10%))"></span><span class="gloss"></span>${CAR_SIL}<span class="cam" title="Sem foto — adicione na OS">📷</span></div>`;
}
function osTimeline(idx){return `<div class="ostl">`+STATUS_FLOW.map((s,i)=>{
  const cls=i<idx?'done':(i===idx?'cur':'');
  return `<div class="ostl-step ${cls}" title="${esc(s)}"><span class="ostl-nd"></span></div>`;}).join('')+`</div>`;}
function msgPronto(o,c,v){const link=location.origin+location.pathname+"#p="+o.token;
  return `Olá ${(c.nome||'').split(' ')[0]}! Seu ${(v.modelo||'veículo')} (placa ${v.placa||'—'}) está pronto na ${window.BRAND_NAME||'oficina'}. Acompanhe/retire por aqui: ${link}`;}
function osCard(o){const v=veh(o.veiculoId),c=cli(o.clienteId);
  const serv=(o.itens||[]).filter(i=>i.tipo==='servico').map(i=>svc(i.refId).nome).filter(Boolean)[0]||'—';
  const resp=(o.responsavel||'').trim(); const m=mechAv(resp);
  const last=o.statusIdx>=STATUS_FLOW.length-1; const pronto=o.statusIdx>=7;
  const adv=last
    ? `<button class="osadv done" disabled>✓ Entregue</button>`
    : `<button class="osadv" onclick="event.stopPropagation();osAvancar('${o.id}')" title="Avançar para a próxima etapa">Avançar →</button>`;
  const waPronto=(pronto&&window.waBtn)
    ? waBtn(c.tel,msgPronto(o,c,v),'📲 Avisar: pronto') : '';
  return `<article class="oscard" onclick="openOS('${o.id}')" title="Abrir OS #${o.numero}">
    <div class="osc-top">
      ${osFotoThumb(o,v)}
      <div class="osc-idn"><span class="plate">${esc(v.placa)||'—'}</span>
        <div class="osc-veh">${esc(v.modelo)||'Veículo'}</div>
        <div class="osc-cli">👤 ${esc(c.nome)||'—'}</div></div>
      <div class="osc-num"><div class="t">OS #${o.numero}</div><div class="v">${money(osTotal(o))}</div></div>
    </div>
    <div class="osc-meta"><span class="osc-svc">🔧 ${esc(serv)}</span><span class="osc-eta">🕒 ${fmtD(o.previsao)}</span></div>
    <div class="osc-mech">
      <span class="osc-av" style="background:${m.grad}">${esc(m.ini)}</span>
      <div class="osc-ml"><small>Mecânico responsável</small><b>${esc(resp)||'a delegar'}</b></div>
      <span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span>
    </div>
    ${osTimeline(o.statusIdx)}
    <div class="osc-act"><span class="osc-stg">Etapa: <b>${STATUS_FLOW[o.statusIdx]}</b></span>
      <span class="sp" style="flex:1"></span>${waPronto}${adv}</div>
  </article>`;
}
function renderOS(q){injectOSBoardCSS(); q=(q||'').toLowerCase();
  const F=window._osQuadroFiltro||'all';
  let list=WORK.os.slice().sort((a,b)=>b.numero-a.numero);
  if(q)list=list.filter(o=>{const v=veh(o.veiculoId),c=cli(o.clienteId);
    return (o.numero+'').includes(q)||(v.placa||'').toLowerCase().includes(q)||(c.nome||'').toLowerCase().includes(q);});
  const counts=STATUS_FLOW.map((_,i)=>WORK.os.filter(o=>o.statusIdx===i).length);
  const chips=[`<button class="oschip ${F==='all'?'on':''}" onclick="osSetFiltro('all')">Todas <span class="ct">${WORK.os.length}</span></button>`]
    .concat(STATUS_FLOW.map((s,i)=>counts[i]?`<button class="oschip ${F===String(i)?'on':''}" onclick="osSetFiltro('${i}')"><span class="cd s${i}"></span>${esc(s)} <span class="ct">${counts[i]}</span></button>`:'')).join('');
  const shown=(F==='all')?list:list.filter(o=>o.statusIdx===+F);
  document.getElementById('view').innerHTML=`
   <div class="osbhead">
     <div class="osbtxt"><h3>🔧 Veículos em serviço</h3>
       <p>Cada carro é um cartão. <b>Avance a etapa direto no quadro</b> — sem abrir a ordem.</p></div>
     <button class="b" onclick="novaOS()">+ Nova OS</button>
   </div>
   <div class="oschips">${chips}</div>
   <div class="osdeck">${shown.map(osCard).join('')}</div>
   ${shown.length?'':'<div class="ospvazio">Nenhuma OS nesta etapa'+(q?' para “'+esc(q)+'”':'')+'.</div>'}`;
}
window.osSetFiltro=function(f){window._osQuadroFiltro=f; renderOS((document.getElementById('q')||{}).value||'');};
/* Avança a etapa SEM abrir a OS (reusa STATUS_FLOW). Sincroniza como qualquer save (wrap no supabase-mode). */
window.osAvancar=function(id){const o=byId(WORK.os,id); if(!o) return;
  if(o.statusIdx<STATUS_FLOW.length-1){o.statusIdx++;}
  if(window.vmSync)window.vmSync();
  renderOS((document.getElementById('q')||{}).value||'');
  if(o.statusIdx>=7&&o.statusIdx<8) toast('OS #'+o.numero+' finalizada — avise o cliente no WhatsApp 📲');
  else toast('OS #'+o.numero+' → '+STATUS_FLOW[o.statusIdx]);
};
/* Fotos da OS (item 4): entram em o.fotos (jsonb). Sincroniza via vmSync (upload é async). */
window.osFotoAdd=async function(id){const o=byId(WORK.os,id); if(!o)return;
  const fi=document.getElementById('osfoto_in_'+id); const file=fi&&fi.files&&fi.files[0];
  if(!file){ toast('Escolha uma imagem'); return; }
  const url=await vmUploadFoto(file); if(!url)return;
  if(!Array.isArray(o.fotos))o.fotos=[]; o.fotos.push(url);
  if(window.vmSync)window.vmSync(); openOS(id); toast('Foto adicionada ✓');
};
window.osFotoRemover=function(id,i){const o=byId(WORK.os,id); if(!o)return;
  if(Array.isArray(o.fotos))o.fotos.splice(i,1);
  if(window.vmSync)window.vmSync(); openOS(id);
};
function injectOSBoardCSS(){ if(document.getElementById('osBoardCSS'))return;
  const s=document.createElement('style'); s.id='osBoardCSS';
  s.textContent=
   '.osbhead{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px;margin-bottom:16px}'+
   '.osbtxt h3{font-family:var(--display);font-weight:600;font-size:20px;margin:0}'+
   '.osbtxt p{color:var(--muted);font-size:13px;margin:5px 0 0}.osbtxt p b{color:var(--txt)}'+
   '.osbhead .b{margin-left:auto}'+
   '.oschips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}'+
   '.oschip{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--glass);color:var(--muted);font-family:var(--display);font-weight:600;font-size:12.5px;cursor:pointer;transition:.16s}'+
   '.oschip:hover{color:var(--txt);border-color:var(--gold-2)}'+
   '.oschip.on{color:#fff;background:linear-gradient(120deg,var(--gold-2),var(--gold-4));border-color:transparent;box-shadow:var(--shadow-card)}'+
   '.oschip .ct{font-variant-numeric:tabular-nums;font-size:11px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.08)}'+
   '.oschip.on .ct{background:rgba(255,255,255,.22)}'+
   '.oschip .cd{width:8px;height:8px;border-radius:50%;background:var(--gold-2)}'+
   '.osdeck{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}'+
   '.oscard{position:relative;border-radius:18px;overflow:hidden;background:var(--glass);backdrop-filter:blur(16px) saturate(1.1);-webkit-backdrop-filter:blur(16px) saturate(1.1);border:1px solid var(--line);box-shadow:var(--shadow-card);cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s;animation:vmRiseIn .4s ease-out both}'+
   '.oscard:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--gold-2) 32%,transparent)}'+
   '.osc-top{display:flex;gap:13px;padding:15px 15px 11px}'+
   '.osphoto{position:relative;width:90px;height:74px;border-radius:13px;overflow:hidden;flex:none;border:1px solid var(--line);background:#0a0d11}'+
   '.osphoto img{width:100%;height:100%;object-fit:cover;display:block}'+
   '.osphoto .sky{position:absolute;inset:0}.osphoto .gloss{position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.18),transparent 42%)}'+
   '.osphoto .car{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);width:72px;height:auto;filter:drop-shadow(0 3px 5px rgba(0,0,0,.4))}'+
   '.osphoto .cam{position:absolute;top:5px;right:5px;font-size:11px;background:rgba(8,10,13,.6);border-radius:6px;padding:1px 4px;line-height:1.2;backdrop-filter:blur(3px)}'+
   '.osc-idn{flex:1;min-width:0}'+
   '.osc-veh{font-family:var(--display);font-weight:600;font-size:15px;margin:7px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
   '.osc-cli{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
   '.osc-num{margin-left:auto;text-align:right;flex:none}'+
   '.osc-num .t{font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums}'+
   '.osc-num .v{font-family:var(--display);font-weight:600;font-size:16px;color:var(--gold-2);font-variant-numeric:tabular-nums;margin-top:3px}'+
   '.osc-meta{display:flex;align-items:center;gap:10px;padding:0 15px 12px;flex-wrap:wrap}'+
   '.osc-svc{font-size:12.5px;color:var(--txt);font-weight:500}.osc-eta{font-size:12px;color:var(--muted);margin-left:auto}'+
   '.osc-mech{display:flex;align-items:center;gap:9px;padding:11px 15px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(255,255,255,.015)}'+
   '.osc-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#0a0d11;font-weight:700;font-size:11px;flex:none;font-family:var(--display)}'+
   '.osc-ml{min-width:0}.osc-ml small{display:block;font-size:9.5px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em}'+
   '.osc-ml b{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:150px}'+
   '.osc-mech .badge{margin-left:auto}'+
   '.ostl{display:flex;align-items:center;gap:0;padding:14px 15px 4px}'+
   '.ostl-step{flex:1;display:flex;justify-content:center;position:relative}'+
   '.ostl-step .ostl-nd{width:12px;height:12px;border-radius:50%;border:2px solid var(--dim);background:var(--panel);z-index:1;transition:.3s}'+
   '.ostl-step::before{content:"";position:absolute;top:5px;left:-50%;width:100%;height:2px;background:var(--line);z-index:0}'+
   '.ostl-step:first-child::before{display:none}'+
   '.ostl-step.done .ostl-nd{border-color:var(--ok);background:var(--ok)}.ostl-step.done::before{background:var(--ok)}'+
   '.ostl-step.cur .ostl-nd{border-color:var(--gold-2);background:var(--gold-2);box-shadow:0 0 0 4px color-mix(in srgb,var(--gold-2) 22%,transparent);animation:pd 1.8s ease-in-out infinite}'+
   '.ostl-step.cur::before{background:linear-gradient(90deg,var(--ok),var(--gold-2))}'+
   '.osc-act{display:flex;align-items:center;gap:9px;padding:8px 15px 15px;flex-wrap:wrap}'+
   '.osc-stg{font-size:12px;color:var(--muted)}.osc-stg b{color:var(--txt)}'+
   '.osadv{height:36px;padding:0 15px;border-radius:10px;border:1px solid color-mix(in srgb,var(--gold-2) 45%,transparent);background:color-mix(in srgb,var(--gold-2) 14%,transparent);color:var(--gold-2);font-family:var(--display);font-weight:600;font-size:12.5px;cursor:pointer;transition:.16s}'+
   '.osadv:hover{background:var(--gold-2);color:#fff;border-color:var(--gold-2)}'+
   '.osadv.done{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 40%,transparent);background:color-mix(in srgb,var(--ok) 12%,transparent);cursor:default}'+
   '.ospvazio{text-align:center;color:var(--muted);padding:50px 20px;font-size:14px}'+
   '.osfotos{display:flex;flex-wrap:wrap;gap:8px}'+
   '.osfoto{position:relative;width:74px;height:60px;border-radius:10px;overflow:hidden;border:1px solid var(--line)}'+
   '.osfoto img{width:100%;height:100%;object-fit:cover;display:block}'+
   '.osfoto .rm{position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;border:none;background:rgba(8,10,13,.7);color:#fff;font-size:10px;cursor:pointer;line-height:1;display:grid;place-items:center}'+
   '@media(max-width:860px){.osdeck{grid-template-columns:1fr}}'+
   '@media(prefers-reduced-motion:reduce){.oscard,.ostl-step .ostl-nd{animation:none;transition:none}}';
  document.head.appendChild(s);
}
function fmtD(d){if(!d)return'—';const p=d.split('-');return `${p[2]}/${p[1]}`;}

function openOS(id){injectOSBoardCSS();const o=byId(WORK.os,id);const v=veh(o.veiculoId),c=cli(o.clienteId);
  document.getElementById('pageTitle').textContent="OS #"+o.numero;
  document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
  const link=location.origin+location.pathname+"#p="+o.token;
  document.getElementById('view').innerHTML=`
   <button class="b-ghost b b-sm" onclick="go('os')">← Voltar</button>
   <div class="osgrid" style="margin-top:14px">
    <div>
     <div class="panel">
       <div class="head"><h3>Acompanhamento</h3><div class="sp"></div>
         <button class="b b-ghost b-sm" onclick="stepOS('${o.id}',-1)">◀ Voltar etapa</button>
         <button class="b b-sm" onclick="stepOS('${o.id}',1)">Avançar etapa ▶</button></div>
       <div class="timeline">${STATUS_FLOW.map((s,i)=>`<div class="step ${i<o.statusIdx?'done':''} ${i===o.statusIdx?'cur':''}"><div class="dot"></div>${s}</div>`).join('')}</div>
     </div>
     <div class="panel"><h3>Itens (serviços & peças)</h3>
       <div id="itens">${itensHTML(o)}</div>
       <div style="margin-top:12px"><button class="b b-ghost b-sm" onclick="addItem('${o.id}')">+ Adicionar item</button></div>
       <div class="tot"><div>Total da OS</div><div class="v">${money(osTotal(o))}</div></div>
     </div>
     <div class="panel"><h3>Checklist de entrada</h3>
       ${(o.checklist||[]).map((ck,i)=>`<div class="chk ${ck.ok?'on':''}" onclick="toggleChk('${o.id}',${i})"><div class="box">${ck.ok?'✓':''}</div>${ck.item}</div>`).join('')||'<div style="color:var(--muted);font-size:13px">Sem itens.</div>'}
     </div>
    </div>
    <div>
     <div class="panel">
       <h3>Dados da OS</h3>
       <div class="info-line"><span class="k">Status</span><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></div>
       <div class="info-line"><span class="k">Cliente</span><span>${esc(c.nome)}</span></div>
       <div class="info-line"><span class="k">Veículo</span><span>${esc(v.modelo)}</span></div>
       <div class="info-line"><span class="k">Placa</span><span class="plate">${esc(v.placa)}</span></div>
       <div class="info-line"><span class="k">Entrada</span><span>${fmtD(o.entrada)}</span></div>
       <div class="info-line"><span class="k">Previsão</span><span>${fmtD(o.previsao)}</span></div>
       <div class="info-line"><span class="k">Responsável</span><span>${esc(o.responsavel)||'—'}</span></div>
       <div class="info-line"><span class="k">Orçamento</span><span style="color:${o.aprovado?'var(--ok)':'var(--warn)'}">${o.aprovado?'Aprovado':'Aguardando'}</span></div>
       <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
         <button class="b b-sm" onclick="toggleAprov('${o.id}')">${o.aprovado?'Marcar pendente':'Aprovar orçamento'}</button>
         <button class="b b-ghost b-sm" onclick="printOS('${o.id}')">🖨 Imprimir</button>
         <button class="b b-ghost b-sm" onclick="editOS('${o.id}')">Editar</button>
         <button class="b b-danger b-sm" onclick="delOS('${o.id}')">Excluir</button>
       </div>
     </div>
     <div class="panel">
       <h3>📲 Acompanhamento do cliente</h3>
       <div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Link público (sem login, só leitura) — o cliente vê o status e a linha do tempo da própria OS:</div>
       <input readonly value="${link}" onclick="this.select()" style="font-size:11.5px">
       <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
         <button class="b b-sm" onclick="copyLink('${link}')">Copiar link do cliente</button>
         ${window.waBtn?waBtn(c.tel,`Olá ${(c.nome||'').split(' ')[0]}! Acompanhe em tempo real o serviço do seu ${(v.modelo||'veículo')} (placa ${v.placa}) por este link: ${link}`,'Enviar no WhatsApp'):''}
         <button class="b b-ghost b-sm" onclick="abrirPortal('${o.token}')">Abrir portal</button></div>
       ${o.statusIdx>=7?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
         <div style="font-size:12.5px;color:var(--ok);margin-bottom:8px">✅ Serviço ${o.statusIdx>=8?'pronto para retirada':'finalizado'} — avise o cliente:</div>
         ${window.waBtn?waBtn(c.tel,msgPronto(o,c,v),'📲 Avisar cliente: pronto'):''}</div>`:''}
     </div>
     <div class="panel"><h3>📷 Fotos do veículo</h3>
       <div class="osfotos">${(o.fotos||[]).map((u,i)=>`<div class="osfoto"><img src="${esc(u)}" alt=""><button class="rm" onclick="osFotoRemover('${o.id}',${i})" title="Remover">✕</button></div>`).join('')||'<div style="color:var(--muted);font-size:12.5px">Nenhuma foto ainda — registre o estado de entrada do veículo.</div>'}</div>
       <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="osfoto_in_${o.id}" type="file" accept="image/*" style="font-size:12px;flex:1;min-width:140px">
         <button class="b b-sm" onclick="osFotoAdd('${o.id}')">+ Adicionar foto</button></div>
     </div>
     <div class="panel"><h3>Observações</h3><div style="font-size:13px;color:var(--txt);line-height:1.5">${esc(o.obs)||'—'}</div></div>
    </div>
   </div>`;
}
function itensHTML(o){return (o.itens||[]).map((it,i)=>{const ref=it.tipo==='servico'?svc(it.refId):prt(it.refId);
  return `<div class="itemrow"><div class="g">${it.tipo==='servico'?'🔧':'📦'} ${esc(ref.nome)||'—'} ${it.qtd>1?'× '+it.qtd:''}</div>
   <div class="money">${money(it.valor)}</div><button class="b b-danger b-sm" onclick="delItem('${o.id}',${i})">✕</button></div>`;}).join('')
   ||'<div style="color:var(--muted);font-size:13px">Nenhum item ainda.</div>';}
function stepOS(id,d){const o=byId(WORK.os,id);o.statusIdx=Math.max(0,Math.min(8,o.statusIdx+d));openOS(id);}
function toggleChk(id,i){const o=byId(WORK.os,id);o.checklist[i].ok=!o.checklist[i].ok;openOS(id);}
function toggleAprov(id){const o=byId(WORK.os,id);o.aprovado=!o.aprovado;openOS(id);}
function delItem(id,i){const o=byId(WORK.os,id);o.itens.splice(i,1);openOS(id);}
function copyLink(l){if(navigator.clipboard)navigator.clipboard.writeText(l);toast('Link copiado!');}
function addItem(id){const o=byId(WORK.os,id);
  const opts=`<optgroup label="Serviços">${WORK.servicos.map(s=>`<option value="servico:${s.id}">${esc(s.nome)} — ${money(s.preco)}</option>`).join('')}</optgroup>
   <optgroup label="Peças">${WORK.pecas.map(p=>`<option value="peca:${p.id}">${esc(p.nome)} — ${money(p.preco)}</option>`).join('')}</optgroup>`;
  modal("Adicionar item","OS #"+o.numero,`
    <label>Item</label><select id="f_item">${opts}</select>
    <label>Quantidade</label><input id="f_qtd" type="number" value="1" min="1">`,
   ()=>{const parts=document.getElementById('f_item').value.split(':');const tipo=parts[0],refId=parts[1];const qtd=+document.getElementById('f_qtd').value||1;
     const ref=tipo==='servico'?svc(refId):prt(refId);o.itens.push({tipo,refId,qtd,valor:(ref.preco||0)*qtd});closeModal();openOS(id);});
}
function novaOS(){
  modal("Nova Ordem de Serviço","Selecione cliente e veículo",`
    <label>Cliente</label><select id="f_cli" onchange="fillVeic()">${WORK.clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select>
    <label>Veículo</label><select id="f_vei"></select>
    <div class="frow"><div><label>Responsável</label><input id="f_resp" placeholder="Mecânico"></div>
    <div><label>Previsão</label><input id="f_prev" type="date"></div></div>
    <label>Observações</label><textarea id="f_obs" placeholder="Relato do cliente…"></textarea>`,
   ()=>{const o={id:uid('OS'),numero:nextNum(),clienteId:document.getElementById('f_cli').value,
     veiculoId:document.getElementById('f_vei').value,entrada:today(),previsao:document.getElementById('f_prev').value||'',
     responsavel:document.getElementById('f_resp').value,statusIdx:0,aprovado:false,token:'vm-'+Date.now().toString(36)+Math.random().toString(36).slice(2,12),
     checklist:[{item:'Pneus',ok:false},{item:'Nível de óleo',ok:false},{item:'Freios',ok:false},{item:'Bateria',ok:false}],
     itens:[],obs:document.getElementById('f_obs').value};
     WORK.os.push(o);closeModal();openOS(o.id);});
  fillVeic();
}
function fillVeic(){const c=document.getElementById('f_cli').value;const sel=document.getElementById('f_vei');
  const vs=WORK.veiculos.filter(v=>v.clienteId===c);
  sel.innerHTML=vs.map(v=>`<option value="${v.id}">${esc(v.placa)} — ${esc(v.modelo)}</option>`).join('')||'<option value="">Sem veículo cadastrado</option>';}
function editOS(id){const o=byId(WORK.os,id);
  modal("Editar OS","#"+o.numero,`
    <div class="frow"><div><label>Responsável</label><input id="f_resp" value="${esc(o.responsavel)}"></div>
    <div><label>Previsão</label><input id="f_prev" type="date" value="${o.previsao||''}"></div></div>
    <label>Observações</label><textarea id="f_obs">${esc(o.obs)}</textarea>`,
   ()=>{o.responsavel=document.getElementById('f_resp').value;o.previsao=document.getElementById('f_prev').value;
     o.obs=document.getElementById('f_obs').value;closeModal();openOS(id);});
}
function delOS(id){confirmar("Excluir esta OS?",()=>{WORK.os=WORK.os.filter(o=>o.id!==id);closeModal();go('os');});}
function printOS(id){const o=byId(WORK.os,id),c=cli(o.clienteId),v=veh(o.veiculoId);
  const linhas=(o.itens||[]).map(i=>{const r=i.tipo==='servico'?svc(i.refId):prt(i.refId);
    return `<tr><td>${esc(r.nome)}</td><td class="ct">${i.qtd}</td><td class="rt">${money(i.valor)}</td></tr>`;}).join('');
  const chk=(o.checklist||[]).map(x=>`<span style="display:inline-block;margin:2px 8px 2px 0">${x.ok?'☑':'☐'} ${x.item}</span>`).join('');
  const nome=(window.BRAND_NAME)||(document.getElementById('brandName')?document.getElementById('brandName').textContent:'Vizio Motors');
  const w=window.open('','_blank');
  w.document.write(`<html><head><meta charset="utf-8"><title>OS ${o.numero}</title><style>
   body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:32px;max-width:740px;margin:auto}
   .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #111;padding-bottom:10px}
   h1{font-size:20px;margin:0}.muted{color:#666;font-size:12px}
   table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ddd;padding:8px;font-size:13px}
   th{text-align:left;background:#f3f3f3}.ct{text-align:center}.rt{text-align:right}
   .tot{text-align:right;font-size:19px;font-weight:bold;margin-top:12px}
   .box{border:1px solid #ddd;border-radius:8px;padding:12px;margin-top:14px;font-size:13px}
   .sign{margin-top:70px;display:flex;justify-content:space-between}
   .sign div{border-top:1px solid #111;width:44%;text-align:center;padding-top:6px;font-size:12px}
   @media print{button{display:none}}
  </style></head><body>
   <div class="hd"><div><h1>${esc(nome)}</h1><div class="muted">Ordem de Serviço</div></div>
     <div class="rt"><h1>OS #${o.numero}</h1><div class="muted">Entrada: ${fmtFull(o.entrada||'')} · Prev.: ${fmtFull(o.previsao||'')}</div></div></div>
   <div class="box"><b>Cliente:</b> ${esc(c.nome)} — ${esc(c.tel)}<br>
     <b>Veículo:</b> ${esc(v.modelo)} — Placa <b>${esc(v.placa)}</b><br>
     <b>Responsável:</b> ${esc(o.responsavel)||'—'} · <b>Status:</b> ${STATUS_FLOW[o.statusIdx]} · <b>Orçamento:</b> ${o.aprovado?'Aprovado':'Pendente'}</div>
   <table><thead><tr><th>Item (serviço/peça)</th><th class="ct">Qtd</th><th class="rt">Valor</th></tr></thead>
     <tbody>${linhas||'<tr><td colspan="3">Sem itens</td></tr>'}</tbody></table>
   <div class="tot">Total: ${money(osTotal(o))}</div>
   ${chk?`<div class="box"><b>Checklist de entrada:</b><br>${chk}</div>`:''}
   ${o.obs?`<div class="box"><b>Observações:</b> ${esc(o.obs)}</div>`:''}
   <div class="sign"><div>Assinatura do cliente</div><div>Responsável técnico</div></div>
   <div style="text-align:center;margin-top:24px;color:#999;font-size:11px">Emitido por Vizio Motors · ${fmtFull(today())}</div>
   <script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();}

/* ===== CLIENTES & VEÍCULOS ===== */
function renderClientes(q){q=(q||'').toLowerCase();
  let list=WORK.clientes.filter(c=>!q||c.nome.toLowerCase().includes(q)||(c.tel||'').includes(q));
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>🚐 Clientes</h3><div class="sp"></div>
     <button class="b b-ghost b-sm" onclick="novoVeic()">+ Veículo</button>
     <button class="b" onclick="novoCli()">+ Cliente</button></div>
     <table class="tbl"><thead><tr><th>Cliente</th><th>Contato</th><th>Veículos</th><th>OS</th><th></th></tr></thead>
     <tbody>${list.map(c=>{const vs=WORK.veiculos.filter(v=>v.clienteId===c.id);const nos=WORK.os.filter(o=>o.clienteId===c.id).length;
       return `<tr><td onclick="openCli('${c.id}')"><b>${esc(c.nome)}</b></td><td onclick="openCli('${c.id}')">${esc(c.tel)}<br><span style="color:var(--muted);font-size:12px">${esc(c.email)}</span></td>
       <td onclick="openCli('${c.id}')">${vs.map(v=>`<span class="plate" style="margin:1px">${esc(v.placa)}</span>`).join(' ')||'—'}</td>
       <td onclick="openCli('${c.id}')">${nos}</td>
       <td class="acoes">${window.waBtn?waBtn(c.tel,`Olá ${(c.nome||'').split(' ')[0]}! Aqui é da ${window.BRAND_NAME||'nossa oficina'}. Como podemos ajudar com o seu veículo?`,'WhatsApp →'):''}
       <button class="b b-ghost b-sm" onclick="editCli('${c.id}')">Editar</button></td></tr>`;}).join('')}</tbody></table></div>`;
}
function openCli(id){const c=byId(WORK.clientes,id);const vs=WORK.veiculos.filter(v=>v.clienteId===id);
  const oss=WORK.os.filter(o=>o.clienteId===id).sort((a,b)=>b.numero-a.numero);
  document.getElementById('view').innerHTML=`
   <button class="b b-ghost b-sm" onclick="go('clientes')">← Voltar</button>
   <div class="osgrid" style="margin-top:14px">
     <div>
       <div class="panel"><div class="head"><h3>Veículos de ${esc(c.nome)}</h3><div class="sp"></div><button class="b b-sm" onclick="novoVeic('${id}')">+ Veículo</button></div>
         ${vs.map(v=>`<div class="veh"><div class="plate">${esc(v.placa)}</div><div class="info"><div class="t">${esc(v.modelo)}</div>
           <div class="s">${v.ano} · ${(v.km||0).toLocaleString('pt-BR')} km · ${esc(v.cor)} · ${esc(v.combustivel)}</div></div>
           <button class="b b-ghost b-sm" onclick="editVeic('${v.id}')">Editar</button></div>`).join('')||'<div style="color:var(--muted);font-size:13px">Sem veículos.</div>'}
       </div>
       <div class="panel"><h3>Histórico de OS</h3>
         <table class="tbl"><tbody>${oss.map(o=>`<tr onclick="openOS('${o.id}')"><td>#${o.numero}</td><td>${fmtD(o.entrada)}</td>
           <td><span class="badge s${o.statusIdx}">${STATUS_FLOW[o.statusIdx]}</span></td><td style="text-align:right;color:var(--gold-2)">${money(osTotal(o))}</td></tr>`).join('')||'<tr><td style="color:var(--muted)">Nenhuma OS.</td></tr>'}</tbody></table>
       </div>
     </div>
     <div class="panel"><h3>Ficha</h3>
       <div class="info-line"><span class="k">Telefone</span><span>${esc(c.tel)||'—'}</span></div>
       <div class="info-line"><span class="k">E-mail</span><span>${esc(c.email)||'—'}</span></div>
       <div class="info-line"><span class="k">Endereço</span><span style="max-width:200px;text-align:right">${esc(endCli(c))||'—'}</span></div>
       <div class="info-line"><span class="k">Aniversário</span><span>${c.nasc?fmtFull(c.nasc):'—'}</span></div>
       <div class="info-line"><span class="k">Observações</span><span style="max-width:180px;text-align:right">${esc(c.obs)||'—'}</span></div>
       <div style="margin-top:14px;display:flex;gap:8px"><button class="b b-sm" onclick="editCli('${id}')">Editar cliente</button>
         ${window.waBtn?waBtn(c.tel,`Olá ${(c.nome||'').split(' ')[0]}! Aqui é da ${window.BRAND_NAME||'nossa oficina'}. Como podemos ajudar com o seu veículo?`,'WhatsApp →'):''}</div>
     </div>
   </div>`;
}
function fmtFull(d){const p=d.split('-');return `${p[2]}/${p[1]}/${p[0]}`;}
function endCli(c){c=c||{};const l=[];const rua=[c.logradouro,c.numero].filter(Boolean).join(', ');
  if(rua)l.push(rua); if(c.complemento)l.push(c.complemento); if(c.bairro)l.push(c.bairro);
  const cid=[c.cidade,c.uf].filter(Boolean).join('/'); if(cid)l.push(cid); if(c.cep)l.push('CEP '+c.cep);
  return l.join(' · ');}
function novoCli(){formCli();}
function editCli(id){formCli(byId(WORK.clientes,id));}
function formCli(c){c=c||{};const ed=!!c.id;
  modal(ed?"Editar cliente":"Novo cliente","",`
    <label>Nome</label><input id="f_nome" value="${esc(c.nome)}">
    <div class="frow"><div><label>Telefone</label><input id="f_tel" value="${esc(c.tel)}"></div>
    <div><label>Aniversário</label><input id="f_nasc" type="date" value="${c.nasc||''}"></div></div>
    <label>E-mail</label><input id="f_email" value="${esc(c.email)}">
    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin:14px 0 2px">Endereço</div>
    <div class="frow"><div><label>CEP</label><input id="f_cep" value="${esc(c.cep)}" onblur="vmBuscaCep(this.value)" placeholder="00000-000"></div>
    <div><label>Número</label><input id="f_num" value="${esc(c.numero)}"></div></div>
    <label>Logradouro</label><input id="f_log" value="${esc(c.logradouro)}" placeholder="Rua / Av.">
    <label>Complemento</label><input id="f_comp" value="${esc(c.complemento)}" placeholder="Apto, bloco, referência">
    <div class="frow"><div><label>Bairro</label><input id="f_bairro" value="${esc(c.bairro)}"></div>
    <div><label>Cidade</label><input id="f_cidade" value="${esc(c.cidade)}"></div></div>
    <label>UF</label><input id="f_uf" value="${esc(c.uf)}" maxlength="2" style="max-width:90px;text-transform:uppercase">
    <label>Observações</label><textarea id="f_obs">${esc(c.obs)}</textarea>`,
   ()=>{const g=id=>{const e=document.getElementById(id);return e?e.value:'';};
     const o={nome:g('f_nome'),tel:g('f_tel'),nasc:g('f_nasc'),email:g('f_email'),obs:g('f_obs'),
       cep:g('f_cep'),logradouro:g('f_log'),numero:g('f_num'),complemento:g('f_comp'),
       bairro:g('f_bairro'),cidade:g('f_cidade'),uf:(g('f_uf')||'').toUpperCase()};
     if(!o.nome){toast('Informe o nome');return;}
     if(ed){Object.assign(c,o);}else{WORK.clientes.push({id:uid('C'),...o});}
     closeModal();go('clientes');});
}
function novoVeic(cliId){formVeic({clienteId:cliId});}
function editVeic(id){formVeic(byId(WORK.veiculos,id));}
function formVeic(v){v=v||{};const ed=!!v.id;
  modal(ed?"Editar veículo":"Novo veículo","",`
    <label>Cliente</label><select id="f_cli">${WORK.clientes.map(c=>`<option value="${c.id}" ${c.id===v.clienteId?'selected':''}>${esc(c.nome)}</option>`).join('')}</select>
    <div class="frow"><div><label>Placa</label><input id="f_placa" value="${esc(v.placa)}"></div>
    <div><label>Ano</label><input id="f_ano" type="number" value="${v.ano||''}"></div></div>
    <label>Modelo</label><input id="f_modelo" value="${esc(v.modelo)}" placeholder="Ex.: Fiat Toro 2.0">
    <div class="frow"><div><label>KM</label><input id="f_km" type="number" value="${v.km||0}"></div>
    <div><label>Cor</label><input id="f_cor" value="${esc(v.cor)}"></div></div>
    <label>Combustível</label><select id="f_comb"><option ${v.combustivel==='Diesel'?'selected':''}>Diesel</option><option ${v.combustivel==='Flex'?'selected':''}>Flex</option><option ${v.combustivel==='Gasolina'?'selected':''}>Gasolina</option></select>
    <label>Foto do veículo <i style="color:var(--muted);font-style:normal">(opcional)</i></label>
    <div class="fotoEdit"><div class="prev" id="vfoto_prev" style="border-radius:12px">${v.foto_url?`<img src="${esc(v.foto_url)}" alt="">`:'🚗'}</div>
      <input id="f_foto" type="file" accept="image/*" style="font-size:12px"></div>`,
   async ()=>{const fi=document.getElementById('f_foto');const file=fi&&fi.files&&fi.files[0];
     let foto_url=v.foto_url||'';
     if(file){const u=await vmUploadFoto(file); if(u)foto_url=u;}
     const o={clienteId:document.getElementById('f_cli').value,placa:document.getElementById('f_placa').value.toUpperCase(),
     ano:+document.getElementById('f_ano').value,modelo:document.getElementById('f_modelo').value,km:+document.getElementById('f_km').value,
     cor:document.getElementById('f_cor').value,combustivel:document.getElementById('f_comb').value,foto_url:foto_url};
     if(!o.placa){toast('Informe a placa');return;}
     if(ed){Object.assign(v,o);}else{WORK.veiculos.push({id:uid('V'),...o});}
     closeModal();CUR==='clientes'?openCli(o.clienteId):go('clientes');});
}

/* ===== ESTOQUE ===== */
function renderEstoque(q){q=(q||'').toLowerCase();
  let list=WORK.pecas.filter(p=>!q||p.nome.toLowerCase().includes(q));
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>📦 Estoque Inteligente</h3><div class="sp"></div>
     <span style="font-size:12px;color:var(--muted)">${WORK.pecas.filter(p=>p.estoque<p.minimo).length} abaixo do mínimo</span></div>
     <table class="tbl"><thead><tr><th>Peça</th><th>Fornecedor</th><th style="text-align:center">Estoque</th><th style="text-align:center">Mínimo</th><th style="text-align:right">Preço</th><th></th></tr></thead>
     <tbody>${list.map(p=>{const low=p.estoque<p.minimo;return `<tr><td><b>${esc(p.nome)}</b></td><td style="color:var(--muted)">${esc(p.fornecedor)}</td>
       <td style="text-align:center;color:${low?'var(--bad)':'var(--txt)'};font-weight:600">${p.estoque}</td>
       <td style="text-align:center;color:var(--muted)">${p.minimo}</td><td style="text-align:right;color:var(--gold-2)">${money(p.preco)}</td>
       <td style="text-align:right">${low?'<span class="badge s1">Repor</span>':'<span class="badge s7">OK</span>'}</td></tr>`;}).join('')}</tbody></table></div>`;
}

/* ===== AGENDA ===== */
function renderAgenda(){
  const dias={};WORK.agenda.slice().sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora)).forEach(a=>{(dias[a.data]=dias[a.data]||[]).push(a);});
  document.getElementById('view').innerHTML=`
   <div class="panel"><div class="head"><h3>🗓 Agenda</h3><div class="sp"></div><button class="b" onclick="novoAg()">+ Agendamento</button></div>
     ${Object.keys(dias).map(d=>`<div style="margin-bottom:18px"><div style="font-family:var(--display);color:var(--gold-2);font-size:15px;margin-bottom:8px">${fmtFull(d)}</div>
       ${dias[d].map(a=>{const v=veh(a.veiculoId);return `<div class="veh" style="cursor:pointer" onclick="editAg('${a.id}')"><div class="plate">${a.hora}</div>
         <div class="info"><div class="t">${esc(a.tipo)} · ${esc(cli(a.clienteId).nome)}</div><div class="s">${esc(v.placa)} ${esc(v.modelo)} — ${esc(a.obs)}</div></div>${agBadge(a)}
         <div style="display:flex;gap:6px" onclick="event.stopPropagation()"><button class="b b-ghost b-sm" title="Editar" onclick="editAg('${a.id}')">✏️</button><button class="b b-ghost b-sm" title="Excluir" onclick="delAg('${a.id}')">🗑</button></div></div>`;}).join('')}</div>`).join('')}
   </div>`;
}
function formAg(a){a=a||{};const ed=!!a.id;const TIPOS=['Revisão','Retorno','Diagnóstico','Orçamento'];
  modal(ed?"Editar agendamento":"Novo agendamento","",`
   <div class="frow"><div><label>Data</label><input id="a_data" type="date" value="${a.data||today()}"></div>
   <div><label>Hora</label><input id="a_hora" type="time" value="${a.hora||'09:00'}"></div></div>
   <label>Cliente</label><select id="a_cli" onchange="agVeic()">${WORK.clientes.map(c=>`<option value="${c.id}"${a.clienteId===c.id?' selected':''}>${esc(c.nome)}</option>`).join('')}</select>
   <label>Veículo</label><select id="a_vei"></select>
   <div class="frow"><div><label>Tipo</label><select id="a_tipo">${TIPOS.map(t=>`<option${a.tipo===t?' selected':''}>${t}</option>`).join('')}</select></div>
   <div><label>Obs</label><input id="a_obs" value="${esc(a.obs)}"></div></div>`,
  ()=>{const rec={data:document.getElementById('a_data').value,hora:document.getElementById('a_hora').value,
    clienteId:document.getElementById('a_cli').value,veiculoId:document.getElementById('a_vei').value,
    tipo:document.getElementById('a_tipo').value,obs:document.getElementById('a_obs').value};
    if(ed){Object.assign(a,rec);}else{WORK.agenda.push(Object.assign({id:uid('A')},rec));}
    closeModal();renderAgenda();});
  agVeic(); if(ed&&a.veiculoId){const sel=document.getElementById('a_vei');if(sel)sel.value=a.veiculoId;}
}
function novoAg(){formAg();}
function editAg(id){formAg(byId(WORK.agenda,id));}
function delAg(id){confirmar("Excluir este agendamento?",()=>{WORK.agenda=WORK.agenda.filter(a=>a.id!==id);closeModal();renderAgenda();});}
function agVeic(){const c=document.getElementById('a_cli').value,sel=document.getElementById('a_vei');
  const vs=WORK.veiculos.filter(v=>v.clienteId===c);sel.innerHTML=vs.map(v=>`<option value="${v.id}">${esc(v.placa)} — ${esc(v.modelo)}</option>`).join('');}

/* ===== alertas de agenda (5/10/15 min antes) ===== */
function agMins(a){try{const t=new Date((a.data||'')+'T'+(a.hora||'00:00')+':00');return (t-Date.now())/60000;}catch(e){return 99999;}}
function agBadge(a){const m=agMins(a); if(m>=0&&m<=15){return `<div class="stage" style="color:var(--warn)">⏰ em ${Math.max(0,Math.round(m))} min</div>`;} return '';}
const _agAlerted={};
function checkAgendaAlerts(){(WORK.agenda||[]).forEach(a=>{const m=agMins(a);[15,10,5].forEach(th=>{const key=a.id+'-'+th;
  if(m>0&&m<=th&&m>th-2&&!_agAlerted[key]){_agAlerted[key]=1;toast('⏰ '+(cli(a.clienteId).nome||'Cliente')+' — agendamento em ~'+th+' min');}});});}

function renderStub(t){document.getElementById('view').innerHTML=`
   <div class="panel" style="text-align:center;padding:60px 24px"><div style="font-family:var(--display);font-size:22px;color:var(--gold-2);margin-bottom:8px">${t||''}</div>
     <div style="color:var(--muted);max-width:460px;margin:0 auto;line-height:1.6">Módulo mapeado no kickoff do Vizio Motors. Entra na fase correspondente do plano de execução — a fundação viva já está pronta para recebê-lo.</div></div>`;}

/* ===== MODAL / TOAST ===== */
function modal(title,sub,body,onSave){document.getElementById('modal-root').innerHTML=`
   <div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">
     <h3>${title}</h3>${sub?`<div class="msub">${sub}</div>`:''}${body}
     <div class="mact"><button class="b b-ghost" onclick="closeModal()">Cancelar</button><button class="b" id="mSave">Salvar</button></div>
   </div></div>`;document.getElementById('mSave').onclick=onSave;}
function confirmar(msg,onYes){document.getElementById('modal-root').innerHTML=`
   <div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-width:380px">
     <h3>Confirmar</h3><div class="msub">${msg}</div>
     <div class="mact"><button class="b b-ghost" onclick="closeModal()">Cancelar</button><button class="b b-danger" id="mYes">Excluir</button></div></div></div>`;
   document.getElementById('mYes').onclick=onYes;}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
function toast(m){const t=document.createElement('div');t.textContent=m;
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99;background:var(--panel);border:1px solid var(--line);color:var(--gold-2);padding:11px 20px;border-radius:12px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.4)';
  document.body.appendChild(t);setTimeout(()=>t.remove(),1800);}
function today(){return new Date().toISOString().slice(0,10);}

/* ===== PORTAL DO CLIENTE (público, sem login) =====================================
   Fluxo: boas-vindas (marca da OFICINA) -> valida CPF/placa SERVER-SIDE -> acompanhamento.
   Fonte de dados abstraída em window.portalBrand(token) e window.portalValidar(token,ident):
   - demo (sem Supabase): implementações abaixo, leem WORK/DADOS;
   - live: supabase-mode.js sobrescreve ambas para a RPC segura get_portal_validado.
   Nada de OS/cliente é montado antes do identificador casar (defesa no servidor). */
const CAR_SIL_P='<svg class="car" viewBox="0 0 150 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 64c0-4 3-6 8-8l10-16c3-5 7-7 13-7h28c6 0 10 2 14 7l11 15c6 2 12 4 16 8v12a3 3 0 0 1-3 3h-9a9 9 0 0 1-18 0H48a9 9 0 0 1-18 0h-9a3 3 0 0 1-3-3z" fill="rgba(43,47,55,.6)" stroke="currentColor" stroke-width="1.5"/><path d="M44 40l7-11c2-3 4-4 8-4h24c4 0 6 1 8 4l7 11z" fill="rgba(0,0,0,.35)" stroke="currentColor" stroke-width="1.2" opacity=".8"/><circle cx="39" cy="64" r="8" fill="#0a0d11" stroke="currentColor" stroke-width="2"/><circle cx="105" cy="64" r="8" fill="#0a0d11" stroke="currentColor" stroke-width="2"/></svg>';
const _digits=s=>(s||'').replace(/\D/g,'');
function abrirPortal(token){location.hash='p='+token;renderPortal(token);}

/* Provedores DEMO (sobrescritos no modo live). Mesma normalização do servidor. */
window.portalBrand=window.portalBrand||async function(token){
  const o=WORK.os.find(x=>x.token===token); if(!o)return null;
  return {brand_nome:window.BRAND_NAME||'Vizio Motors'};
};
window.portalValidar=window.portalValidar||async function(token,ident){
  const o=WORK.os.find(x=>x.token===token); if(!o)return null;
  const c=cli(o.clienteId)||{}, v=veh(o.veiculoId)||{};
  const cpf=_digits(ident), placa=(ident||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const okPlaca=placa.length>=6 && (v.placa||'').toUpperCase().replace(/[^A-Z0-9]/g,'')===placa;
  const okCpf=cpf.length===11 && _digits(c.cpf)===cpf;
  if(!okPlaca&&!okCpf)return null;
  return {numero:o.numero,status_idx:o.statusIdx,aprovado:o.aprovado,previsao:o.previsao,
    entrada:o.entrada,responsavel:o.responsavel,obs:o.obs,itens:o.itens,
    placa:v.placa,modelo:v.modelo,foto_url:(o.fotos&&o.fotos[0])||v.foto_url||'',
    cliente_nome:c.nome,brand_nome:window.BRAND_NAME||'Vizio Motors',
    oficina_tel:(WORK._cfg&&WORK._cfg.tel)||''};
};

function _portalErrMsg(kind){
  if(kind==='blocked')return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if(kind==='notfound')return 'Link inválido. Solicite à oficina o link do seu atendimento.';
  if(kind==='empty')return 'Informe o CPF ou a placa do veículo.';
  return 'Este link é de <b>outro cliente/veículo</b>. Por favor, solicite à oficina o link correto do seu atendimento.';
}
function _showPortalErr(kind){const e=document.getElementById('perr');if(!e)return;
  e.innerHTML=_portalErrMsg(kind);e.classList.add('on');}

function renderPortal(token){
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='none';
  /* .wrap (que envolve login+app) mantém min-height:100% e empurrava o portal para baixo
     da dobra — o portal precisa abrir no topo. Oculta o wrapper inteiro. */
  const w=document.querySelector('.wrap'); if(w)w.style.display='none';
  const P=document.getElementById('portal');P.style.display='flex';
  clearInterval(window._ptimer);
  window._portalToken=token; window._portalIdent='';
  renderPortalWelcome();
  /* tematiza a tela com a identidade da OFICINA do token (só a marca, sem dados do cliente) */
  if(window.portalBrand) window.portalBrand(token).then(function(b){
    if(b===null){ _showPortalErr('notfound'); return; }
    _applyPortalBrand(b);
  }).catch(function(){});
}
function _applyPortalBrand(b){
  if(!b)return;
  if(typeof applyTheme==='function'){
    applyTheme({nome:b.brand_nome,accent:b.brand_cor||undefined,accent2:b.brand_cor2||undefined,
      radius:(b.brand_radius!=null?b.brand_radius:undefined),logo:b.brand_logo||undefined});
  } else { window.BRAND_NAME=b.brand_nome||window.BRAND_NAME; }
  const bn=document.getElementById('pbn'); if(bn)bn.textContent=(window.BRAND_NAME||'Vizio Motors');
  const em=document.getElementById('emblemP'); if(em)em.innerHTML=emblemSVG(104);
}

function renderPortalWelcome(){
  const nome=(window.BRAND_NAME||'Vizio Motors');
  document.getElementById('portal').innerHTML=`<div class="pwrap"><section class="pscreen on">
    <div class="pwelcome">
      <div class="pbrand-hd an">
        <div class="emblem" id="emblemP" style="width:104px;height:104px"></div>
        <div><div class="pbn" id="pbn">${esc(nome)}</div>
          <div class="ptag">Acompanhamento de serviço</div></div>
      </div>
      <div class="phello an" style="animation-delay:.08s">
        <h1>Acompanhe seu veículo</h1>
        <p>Digite seu <b>CPF</b> ou a <b>placa do veículo</b> para ver o andamento do serviço em tempo real.</p>
      </div>
      <div class="pidcard card-glass an" style="animation-delay:.16s">
        <label for="pidf">CPF ou placa</label>
        <input id="pidf" placeholder="000.000.000-00  ou  ABC-1D23" autocomplete="off" inputmode="text" maxlength="18">
        <button class="pgo" onclick="portalEntrar()">Acessar meu serviço</button>
        <div class="perr" id="perr"></div>
      </div>
      <div class="phint">🔒 Acesso seguro e exclusivo do seu atendimento.</div>
    </div>
    <div class="pfoot">Uma solução <b>Vizio Motors</b> · by VIZIO</div>
  </section></div>`;
  document.getElementById('emblemP').innerHTML=emblemSVG(104);
  const inp=document.getElementById('pidf');
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')portalEntrar();});
  inp.addEventListener('input',()=>{const e=document.getElementById('perr');if(e)e.classList.remove('on');});
  try{inp.focus();}catch(e){}
}

async function portalEntrar(){
  const token=window._portalToken;
  const raw=((document.getElementById('pidf')||{}).value||'').trim();
  if(!raw){ _showPortalErr('empty'); return; }
  const btn=document.querySelector('.pgo');
  if(btn){btn.disabled=true;btn.textContent='Verificando…';}
  let data=null;
  try{ data=await window.portalValidar(token,raw); }catch(e){ data=null; }
  if(btn){btn.disabled=false;btn.textContent='Acessar meu serviço';}
  if(data&&data.bloqueado){ _showPortalErr('blocked'); return; }
  if(!data){ _showPortalErr('mismatch'); return; }
  window._portalIdent=raw;
  renderPortalTrack(data,true);
  clearInterval(window._ptimer);
  window._ptimer=setInterval(async()=>{
    try{const d=await window.portalValidar(token,window._portalIdent);
      if(d&&!d.bloqueado) renderPortalTrack(d,false);}catch(e){}
  },15000);
}

function renderPortalTrack(d,animate){
  const N=STATUS_FLOW.length, idx=Math.max(0,Math.min(N-1,+d.status_idx||0));
  const pct=Math.round(idx/(N-1)*100), pronto=idx>=N-1;
  const nome=d.brand_nome||window.BRAND_NAME||'Vizio Motors';
  const first=(d.cliente_nome||'').trim().split(/\s+/)[0]||'';
  const foto=d.foto_url||'';
  const tel=_digits(d.oficina_tel);
  const etaTxt=pronto?'Disponível':(d.previsao||d.entrada?fmtFull(d.previsao||d.entrada):'A combinar');
  const statusSub=pronto?'Seu veículo está pronto para retirada 🎉':'Seu veículo está em atendimento na oficina';
  const waMsg=encodeURIComponent(`Olá! Sou cliente da ${nome}. Gostaria de falar sobre o meu ${d.modelo||'veículo'} (placa ${d.placa||'—'}), OS #${d.numero}.`);
  const cta=tel?`<div class="pcta">
      <a class="wa" target="_blank" rel="noopener" href="https://wa.me/55${tel}?text=${waMsg}">💬 Falar no WhatsApp</a>
      <a class="call" href="tel:+55${tel}">📞 Ligar para a oficina</a></div>`:'';
  const steps=STATUS_FLOW.map((s,i)=>{
    const cls=i<idx?'done':(i===idx?'cur':'');
    let sub='';
    if(i<idx)sub='Concluído';
    else if(i===idx)sub=(d.responsavel?'Responsável: '+esc(d.responsavel):'Etapa atual');
    else if(i===N-1)sub='Previsão: '+esc(etaTxt);
    return `<div class="pstep2" data-cls="${cls}"><div class="pdot">${i<idx?'✓':(i===idx?'●':(i+1))}</div>
      <div class="plbl"><b>${esc(s)}</b>${sub?`<span>${sub}</span>`:''}</div></div>`;
  }).join('');
  const photoInner=foto?`<img src="${esc(foto)}" alt="" loading="lazy"><span class="pshade"></span>`:CAR_SIL_P;
  document.getElementById('portal').innerHTML=`<div class="pwrap"><section class="pscreen on">
    <div class="pthead an"><div class="pmini" id="emblemPMini"></div>
      <div class="ptt"><b>${esc(nome)}</b><span>${first?('Olá, '+esc(first)+' — '):''}acompanhe seu serviço</span></div></div>
    <div class="phero card-glass an" style="animation-delay:.05s">
      <div class="pphoto">${photoInner}<span class="pplate">${esc(d.placa||'—')}</span></div>
      <div class="phbody">
        <div class="pvname">${esc(d.modelo||'Veículo')}</div>
        <div class="pvsub">OS #${d.numero}${d.aprovado?' · orçamento aprovado':''}</div>
        <div class="pstatusnow">
          <div class="pring"><div class="pu"></div><div class="co"></div></div>
          <div class="stt"><b>${esc(STATUS_FLOW[idx])}</b><span>${statusSub}</span></div></div>
        <div class="ptl" id="ptl"><div class="pfill" id="pfill"></div>${steps}</div>
        <div class="pinfo">
          <div class="pbox"><div class="k">Previsão de entrega</div><div class="v eta">${esc(etaTxt)}</div></div>
          <div class="pbox"><div class="k">Progresso</div><div class="v" id="ppct">${animate?'0%':pct+'%'}</div></div></div>
        ${d.obs?`<div class="pobs"><div class="k">Observações da oficina</div><p>${esc(d.obs)}</p></div>`:''}
        ${cta}
      </div>
    </div>
    <div class="pfoot">Uma solução <b>Vizio Motors</b> · by VIZIO</div>
  </section></div>`;
  document.getElementById('emblemPMini').innerHTML=emblemSVG(44);
  try{window.scrollTo(0,0);}catch(e){}
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fill=document.getElementById('pfill');
  const active=[...document.querySelectorAll('#ptl .pstep2')].filter(s=>s.dataset.cls);
  if(!animate||reduce){
    if(fill){fill.style.transition='none';fill.style.transform='scaleY('+(pct/100)+')';}
    active.forEach(s=>s.classList.add(s.dataset.cls));
    const el=document.getElementById('ppct'); if(el)el.textContent=pct+'%';
    return;
  }
  active.forEach((s,k)=>setTimeout(()=>s.classList.add(s.dataset.cls),120*k));
  setTimeout(()=>{ if(fill)fill.style.transform='scaleY('+(pct/100)+')'; },180);
  let p=0; const el=document.getElementById('ppct'), stepInc=Math.max(1,Math.round(pct/22));
  const t=setInterval(()=>{p+=stepInc; if(p>=pct){p=pct;clearInterval(t);} if(el)el.textContent=p+'%';},40);
}

/* ===== movimento ambiente ===== */
const glow=document.getElementById('cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.opacity=1;glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';});
window.addEventListener('pointerleave',()=>glow.style.opacity=0);
(function(){const bg=document.getElementById('bg');for(let i=0;i<14;i++){const s=document.createElement('div');s.className='spark';
  s.style.left=Math.random()*100+'%';s.style.animationDuration=(9+Math.random()*10)+'s';s.style.animationDelay=(-Math.random()*12)+'s';
  s.style.opacity=(.2+Math.random()*.4);s.style.width=s.style.height=(4+Math.random()*4)+'px';bg.appendChild(s);}})();

/* ===== boot ===== */
document.getElementById('emblemLogin').innerHTML=emblemSVG(120);
(function boot(){const h=location.hash;
  /* footer lê a versão única (§14.2) — nunca mais uma 2ª verdade fixa no HTML */
  const fv=document.getElementById('footVer'); if(fv)fv.textContent='v'+(window.APP_VERSION||'');
  if(h.indexOf('#p=')===0){renderPortal(h.slice(3));}
  setInterval(checkAgendaAlerts,30000);
})();
