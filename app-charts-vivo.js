/* ===========================================================================
 * Inovar Formaturas by VIZIO — Gráficos vivos (§20) para Chart.js — v2
 * (1) "Enche ao carregar": animação nativa — barras sobem em cascata, rosca/pizza
 *     crescem. (2) Onda líquida CONTÍNUA por cima, via canvas de OVERLAY (não
 *     re-roda o Chart): sheen ondulado nas barras + brilho giratório nas roscas/
 *     pizzas. O loop varre Chart.instances direto (não depende de hook do Chart).
 *     Sutil (amp ~2px). Respeita reduced-motion, pausa em aba oculta, só anima o
 *     que está visível, e a onda acompanha o preenchimento das barras.
 * =========================================================================== */
(function(){
"use strict";
if(!window.Chart) return;
var REDUCE = !!(window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches);

/* ---- (1) enche ao carregar (nativo) ---- */
if(REDUCE){ Chart.defaults.animation=false; }
else{
  Chart.defaults.animation={ duration:900, easing:"easeOutQuart",
    delay:function(ctx){ return (ctx&&ctx.type==="data"&&ctx.mode==="default"&&typeof ctx.dataIndex==="number")?ctx.dataIndex*55:0; } };
  try{ if(Chart.overrides&&Chart.overrides.doughnut) Chart.overrides.doughnut.animation=Object.assign({},Chart.overrides.doughnut.animation,{animateScale:true,animateRotate:true,duration:1000}); }catch(_){}
  try{ if(Chart.overrides&&Chart.overrides.pie) Chart.overrides.pie.animation=Object.assign({},Chart.overrides.pie.animation,{animateScale:true,animateRotate:true,duration:1000}); }catch(_){}
}
// cantos arredondados em TODAS as barras (Chart.js), mesmo onde o config não define
try{ if(Chart.defaults.elements&&Chart.defaults.elements.bar){ Chart.defaults.elements.bar.borderRadius=6; } }catch(_){}
if(REDUCE) return; // sem onda contínua no modo reduzido

/* ---- helpers ---- */
function rr(c,x,y,w,h,r){ r=Math.max(0,Math.min(r,w/2,h/2)); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function accent(){ var s=getComputedStyle(document.documentElement), v;
  ["--gold-2","--orange","--acento","--accent","--primary","--brand","--cor-acento"].some(function(k){ var x=s.getPropertyValue(k); if(x&&x.trim()){v=x.trim();return true;} return false; });
  return v||"#5b8cff"; }
function hexA(hex,a){ var h=String(hex||"").trim().replace("#","");
  if(h.length===3)h=h.split("").map(function(c){return c+c;}).join("");
  var r=parseInt(h.slice(0,2),16)||0,g=parseInt(h.slice(2,4),16)||0,b=parseInt(h.slice(4,6),16)||0;
  return "rgba("+r+","+g+","+b+","+a+")"; }
function toRGB(col){
  col=String(col||"").trim();
  if(col.charAt(0)==="#"){ var h=col.slice(1); if(h.length===3)h=h.split("").map(function(c){return c+c;}).join("");
    return {r:parseInt(h.slice(0,2),16)||0,g:parseInt(h.slice(2,4),16)||0,b:parseInt(h.slice(4,6),16)||0}; }
  var m=col.match(/rgba?\(([^)]+)\)/i);
  if(m){ var p=m[1].split(",").map(function(x){return parseFloat(x);}); return {r:p[0]||0,g:p[1]||0,b:p[2]||0}; }
  return null;
}
function shade(rgb,f){ return {r:Math.max(0,Math.min(255,Math.round(rgb.r*f))),g:Math.max(0,Math.min(255,Math.round(rgb.g*f))),b:Math.max(0,Math.min(255,Math.round(rgb.b*f)))}; }
function rgbaOf(rgb,a){ return "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+a+")"; }
function corDe(el, ds, k){
  var col=null; try{ col=el&&el.options&&el.options.backgroundColor; }catch(_){}
  if(typeof col!=="string"){ var bg=ds&&ds.backgroundColor; col=Array.isArray(bg)?bg[k]:bg; }
  return (typeof col==="string")?col:accent();
}
function bgOf(node){ // cor de fundo SÓLIDA atrás do gráfico (sobe até achar opaca). null = sem fundo sólido.
  var n=node;
  while(n && n.nodeType===1){
    var col=""; try{ col=getComputedStyle(n).backgroundColor; }catch(_){}
    if(col && col!=="rgba(0, 0, 0, 0)" && col!=="transparent"){
      var m=col.match(/rgba?\(([^)]+)\)/i);
      if(m){ var p=m[1].split(",").map(function(x){return parseFloat(x);}); if(p.length<4 || p[3]>=0.92) return "rgb("+(p[0]|0)+","+(p[1]|0)+","+(p[2]|0)+")"; }
    }
    if(n===document.body||n===document.documentElement)break;
    n=n.parentNode;
  }
  return null; // sem fundo sólido -> usa o fallback (onda sutil, independente de fundo)
}

var phase=0, raf=0, playing=false, _last=0;
/* Throttle do overlay: a onda é sutil; 30 fps basta e corta pela metade o custo de
   composição sobre as superfícies glass (o "travamento" vinha de rAF a 60 fps varrendo
   6 gráficos com leitura de layout a cada quadro). A GEOMETRIA das barras é recapturada
   só a cada ~180 ms (muda devagar); a onda é redesenhada em cada quadro com os retângulos
   já em cache — desacopla o caro (layout) do barato (canvas). */
var FRAME_MS=32, CAP_MS=180;

function overlayFor(chart){
  var cv=chart.canvas, parent=cv&&cv.parentNode; if(!parent)return null;
  var rec=cv.__vivo;
  if(!rec){
    if(getComputedStyle(parent).position==="static") parent.style.position="relative";
    var over=document.createElement("canvas");
    over.style.cssText="position:absolute;pointer-events:none;z-index:2";
    parent.appendChild(over);
    rec={chart:chart, canvas:cv, over:over, octx:over.getContext("2d"), kind:null, bars:[], arcs:[]};
    cv.__vivo=rec;
  }
  var w=cv.clientWidth||0, h=cv.clientHeight||0, dpr=Math.min(window.devicePixelRatio||1,2);
  if(!w||!h)return rec;
  var o=rec.over;
  o.style.left=cv.offsetLeft+"px"; o.style.top=cv.offsetTop+"px"; o.style.width=w+"px"; o.style.height=h+"px";
  if(o.width!==Math.round(w*dpr)){ o.width=Math.round(w*dpr); o.height=Math.round(h*dpr); }
  rec._w=w; rec._h=h; rec._dpr=dpr;
  return rec;
}

function capture(chart, rec){
  rec.bars=[]; rec.arcs=[]; rec.kind=null;
  var dss=(chart.data&&chart.data.datasets)||[];
  for(var di=0; di<dss.length; di++){
    var meta; try{ meta=chart.getDatasetMeta(di); }catch(_){ continue; }
    if(!meta||meta.hidden) continue;
    var type=meta.type||(chart.config&&chart.config.type), data=meta.data||[];
    for(var k=0;k<data.length;k++){
      var el=data[k]; if(!el)continue;
      if(type==="bar"){
        rec.kind="bar";
        var horiz=!!el.horizontal, left,top,right,bottom;
        if(horiz){ top=el.y-el.height/2; bottom=el.y+el.height/2; left=Math.min(el.x,el.base); right=Math.max(el.x,el.base); }
        else{ left=el.x-el.width/2; right=el.x+el.width/2; top=Math.min(el.y,el.base); bottom=Math.max(el.y,el.base); }
        var brd=(el.options&&el.options.borderRadius); if(brd&&typeof brd==="object")brd=(brd.topLeft||brd.topRight||brd.bottomLeft||brd.bottomRight||0); if(typeof brd!=="number")brd=6;
        if(isFinite(left)&&right-left>0.8 && bottom-top>0.8) rec.bars.push({left:left,top:top,right:right,bottom:bottom,horiz:horiz,color:corDe(el,dss[di],k),radius:brd});
      } else if(type==="doughnut"||type==="pie"){
        rec.kind="pie";
        var p=el.getProps?el.getProps(["x","y","innerRadius","outerRadius","startAngle","endAngle"],true):el;
        if(isFinite(p.x)&&p.outerRadius>0) rec.arcs.push({x:p.x,y:p.y,ir:p.innerRadius||0,or:p.outerRadius||0,a0:p.startAngle,a1:p.endAngle,color:corDe(el,dss[di],k)});
      }
    }
  }
}

function drawBar(rec){
  // OPÇÃO 3 (padrão) — "topo recortado": cobre o topo (V) / fim (H) da barra com a
  // cor do FUNDO numa linha ONDULADA -> a borda da barra vira a superfície do líquido.
  // Fundo não-sólido (degradê/imagem): FALLBACK p/ onda sutil na mesma cor da barra.
  var c=rec.octx, amp=3.2, s;
  if(rec.bg===undefined) rec.bg=bgOf(rec.canvas);
  var bg=rec.bg;
  for(var i=0;i<rec.bars.length;i++){
    var b=rec.bars[i], bw=b.right-b.left, bh=b.bottom-b.top;
    c.save(); rr(c,b.left,b.top,bw,bh,b.radius||6); c.clip();
    if(bg){ // recorte com a cor do fundo
      c.fillStyle=bg; c.beginPath();
      if(!b.horiz){ var steps=Math.max(10,Math.round(bw/4));
        c.moveTo(b.left-3,b.top-8); c.lineTo(b.right+3,b.top-8);
        for(s=steps;s>=0;s--){ var px=b.left+bw*s/steps; var py=b.top+amp+Math.sin(phase+px/15)*amp; c.lineTo(px,py); }
      } else { var steps2=Math.max(10,Math.round(bh/4));
        c.moveTo(b.right+8,b.top-3); c.lineTo(b.right+8,b.bottom+3);
        for(s=steps2;s>=0;s--){ var py2=b.top+bh*s/steps2; var px2=b.right-amp+Math.sin(phase+py2/15)*amp; c.lineTo(px2,py2); }
      }
      c.closePath(); c.fill();
    } else { // FALLBACK: onda sutil na MESMA cor da barra (independe do fundo)
      var rgb=toRGB(b.color)||{r:255,g:90,b:0};
      var layers=[[0, rgbaOf(shade(rgb,0.86),0.5), 3.2],[Math.PI*0.9, rgbaOf(shade(rgb,0.80),0.28), 2.6]];
      for(var L=0;L<layers.length;L++){
        var off=layers[L][0], fill=layers[L][1], a2=layers[L][2];
        c.beginPath();
        if(!b.horiz){ var band=Math.min(18,bh), st=Math.max(8,Math.round(bw/5)); c.moveTo(b.left,b.top+band);
          for(s=0;s<=st;s++){ var px3=b.left+bw*s/st; var py3=b.top+Math.sin(phase+off+px3/17)*a2; c.lineTo(px3,py3); } c.lineTo(b.right,b.top+band);
        } else { var band2=Math.min(18,bw), st2=Math.max(8,Math.round(bh/5)); c.moveTo(b.right-band2,b.top);
          for(s=0;s<=st2;s++){ var py4=b.top+bh*s/st2; var px4=b.right+Math.sin(phase+off+py4/17)*a2; c.lineTo(px4,py4); } c.lineTo(b.right-band2,b.bottom);
        }
        c.closePath(); c.fillStyle=fill; c.fill();
      }
    }
    c.restore();
  }
}
function drawPie(rec){ /* rosca/pizza: sem efeito contínuo (só o crescer-ao-carregar nativo) */ }
function draw(rec){
  var c=rec.octx; if(!c||!rec._w||!rec._h)return;
  c.setTransform(rec._dpr,0,0,rec._dpr,0,0); c.clearRect(0,0,rec._w,rec._h);
  if(rec.kind==="bar") drawBar(rec);
  else if(rec.kind==="pie") drawPie(rec);
}
function inView(o){
  var r=o.getBoundingClientRect();
  return r.width>0 && r.height>0 && r.bottom>0 && r.right>0 && r.top<(window.innerHeight||0) && r.left<(window.innerWidth||0);
}

function frame(force){
  phase+=0.08;
  var now=(window.performance&&performance.now)?performance.now():Date.now();
  var insts=[]; try{ var m=Chart.instances||{}; for(var k in m){ if(m[k]&&m[k].canvas)insts.push(m[k]); } }catch(_){}
  for(var i=0;i<insts.length;i++){
    var rec=overlayFor(insts[i]); if(!rec)continue;
    if(force||inView(rec.over)){
      if(force || !rec._capAt || (now-rec._capAt)>CAP_MS){ capture(insts[i],rec); rec._capAt=now; }
      draw(rec);
    }
    else if(rec.octx&&rec._w){ rec.octx.setTransform(rec._dpr,0,0,rec._dpr,0,0); rec.octx.clearRect(0,0,rec._w,rec._h); rec._capAt=0; }
  }
}
function loop(ts){ if(playing) raf=requestAnimationFrame(loop);
  ts=ts||((window.performance&&performance.now)?performance.now():Date.now());
  if(ts-_last<FRAME_MS) return;      /* gate ~30 fps */
  _last=ts; frame(false);
}
function start(){ if(playing||REDUCE)return; playing=true; raf=requestAnimationFrame(loop); }
function stop(){ playing=false; cancelAnimationFrame(raf); }

document.addEventListener("visibilitychange",function(){ if(document.hidden)stop(); else start(); });
if(document.readyState!=="loading") start(); else document.addEventListener("DOMContentLoaded",start);
window.__vivoCharts={ start:start, stop:stop, tick:frame, get n(){ try{var m=Chart.instances||{},n=0;for(var k in m)n++;return n;}catch(_){return -1;} } };
})();
