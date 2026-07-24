/* ============================================================
   Vizio Motors — relatorio.js
   Gerador de relatório PDF premium (papel timbrado VIZIO).
   Abre uma janela de impressão estilizada → o usuário salva
   como PDF. Marca dinâmica (camaleão): usa BRAND_NAME/BRAND_LOGO.
   API: relatorioPDF({titulo, subtitulo, corpo, rodape})
        RP.kpis([[label,valor]...]) · RP.sec(titulo) · RP.table(head,rows)
   ============================================================ */
window.RP = {
  kpis:function(arr){ return '<div class="rp-kpis">'+arr.map(function(k){
    return '<div class="rp-kpi"><div class="l">'+esc(k[0])+'</div><div class="v">'+esc(k[1])+'</div></div>';}).join('')+'</div>'; },
  sec:function(t){ return '<h3 class="rp-sec">'+esc(t)+'</h3>'; },
  table:function(head,rows){ if(!rows||!rows.length)return '<div class="rp-empty">Sem registros.</div>';
    return '<table><thead><tr>'+head.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+
      '</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>'; }
};

function relatorioPDF(opts){
  opts=opts||{};
  var brand=esc(window.BRAND_NAME||'Vizio Motors');
  /* Relatório é impresso em papel branco: a logo tem de ser a ESCURA (§5). */
  var rawLogo=(window.BRAND_LOGO&&window.__brandCustom)?window.BRAND_LOGO:'vizio-symbol-dark.png';
  var logo; try{ logo=(/^https?:|^data:/.test(rawLogo))?rawLogo:new URL(rawLogo,document.baseURI).href; }catch(e){ logo=rawLogo; }
  var accent='#3f6fe0';
  try{ var a=getComputedStyle(document.documentElement).getPropertyValue('--gold-3').trim(); if(a)accent=a; }catch(e){}
  var now=new Date().toLocaleString('pt-BR');
  var w=window.open('','_blank','width=920,height=1040');
  if(!w){ if(window.toast)toast('Permita pop-ups para gerar o relatório PDF'); return; }
  var css=
   "*{box-sizing:border-box}"+
   "body{font-family:'Century Gothic','Questrial',system-ui,Arial,sans-serif;color:#0f1826;margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}"+
   ".rp{max-width:820px;margin:0 auto;padding:38px 44px}"+
   ".rp-head{display:flex;align-items:center;gap:15px;border-bottom:2px solid "+accent+";padding-bottom:15px}"+
   ".rp-head img{width:46px;height:46px;object-fit:contain}"+
   ".rp-brand{font-size:19px;font-weight:700;letter-spacing:.5px;line-height:1.1}"+
   ".rp-brand small{display:block;font-size:9.5px;letter-spacing:3px;color:#6a7686;text-transform:uppercase;font-weight:400;margin-top:3px}"+
   ".rp-meta{margin-left:auto;text-align:right;font-size:11px;color:#6a7686;line-height:1.5}"+
   ".rp-title{font-size:17px;font-weight:700;margin:20px 0 2px}"+
   ".rp-sub{color:#6a7686;font-size:12px;margin-bottom:6px}"+
   "h3.rp-sec{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:"+accent+";border-bottom:1px solid #e6eaf0;padding-bottom:6px;margin:24px 0 10px}"+
   "table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:6px}"+
   "th{text-align:left;color:#6a7686;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;border-bottom:1.5px solid #e6eaf0}"+
   "td{padding:8px 10px;border-bottom:1px solid #f0f2f6}"+
   "tr:last-child td{border-bottom:none}"+
   ".rp-kpis{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}"+
   ".rp-kpi{flex:1;min-width:128px;border:1px solid #e6eaf0;border-radius:12px;padding:13px 15px}"+
   ".rp-kpi .l{font-size:9.5px;text-transform:uppercase;letter-spacing:1px;color:#6a7686}"+
   ".rp-kpi .v{font-size:22px;font-weight:700;margin-top:6px;color:#0f1826}"+
   ".rp-empty{color:#93a0b2;font-size:12px;padding:6px 0}"+
   ".rp-foot{margin-top:28px;border-top:1px solid #e6eaf0;padding-top:12px;font-size:10px;color:#93a0b2;text-align:center;letter-spacing:.3px}"+
   "@page{margin:15mm}@media print{.rp{padding:0}.rp-noprint{display:none}}";
  var doc=
   "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>"+esc(opts.titulo||'Relatório')+" — "+brand+"</title><style>"+css+"</style></head><body><div class='rp'>"+
   "<div class='rp-head'><img src='"+esc(logo)+"' alt=''><div class='rp-brand'>"+brand+"<small>por INPERSON</small></div>"+
   "<div class='rp-meta'>"+esc(opts.titulo||'Relatório')+"<br>Emitido em "+now+"</div></div>"+
   "<div class='rp-title'>"+esc(opts.titulo||'Relatório')+"</div>"+
   (opts.subtitulo?"<div class='rp-sub'>"+esc(opts.subtitulo)+"</div>":"")+
   (opts.corpo||"")+
   "<div class='rp-foot'>"+(opts.rodape?esc(opts.rodape)+" · ":"")+brand+" — sua oficina virou sistema inteligente · um produto INPERSON</div>"+
   "</div><script>window.onload=function(){setTimeout(function(){window.focus();window.print();},350);}<\/script></body></html>";
  w.document.open(); w.document.write(doc); w.document.close();
}
window.relatorioPDF=relatorioPDF;
