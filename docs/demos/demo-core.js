/* Shared local plotting and controls for the analytical chemistry teaching models. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ChemDemo = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const colors = {teal:'#087b85', orange:'#bf501c', blue:'#205b9d', gray:'#596773', purple:'#79529e'};
  const mean = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : NaN;
  const sd = xs => {const m=mean(xs);return xs.length>1?Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1)):NaN;};
  function rng(seed) {let a=Number(seed)>>>0;return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  const normal = random => Math.sqrt(-2*Math.log(Math.max(Number.MIN_VALUE,random())))*Math.cos(2*Math.PI*random());
  function linearFit(xs,ys) {
    if(xs.length!==ys.length||xs.length<2||!xs.concat(ys).every(Number.isFinite)) throw new Error('A line needs finite paired values.');
    const n=xs.length,xMean=mean(xs),yMean=mean(ys),Sxx=xs.reduce((v,x)=>v+(x-xMean)**2,0);
    if(!(Sxx>0)) throw new Error('Calibration concentrations must vary.');
    const b=xs.reduce((v,x,i)=>v+(x-xMean)*(ys[i]-yMean),0)/Sxx,a=yMean-b*xMean;
    const residuals=xs.map((x,i)=>ys[i]-a-b*x),sse=residuals.reduce((v,e)=>v+e*e,0),syy=ys.reduce((v,y)=>v+(y-yMean)**2,0);
    return {a,b,n,xMean,Sxx,s:n>2?Math.sqrt(sse/(n-2)):NaN,residuals,r2:syy>0?1-sse/syy:NaN};
  }
  function fmt(x,digits=3) {
    if (!Number.isFinite(Number(x))) return 'not available';
    const n=Number(x);if(n!==0&&(Math.abs(n)<Math.pow(10,-digits)||Math.abs(n)>=1e6))return n.toExponential(Math.max(1,digits-1));
    return n.toLocaleString('en-GB',{maximumFractionDigits:digits,minimumFractionDigits:0});
  }
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId = id => document.getElementById(id);
  function init(config) {
    const notes = config.notes ? (config.notes.trim().startsWith("<") ? config.notes : "<p>" + escape(config.notes) + "</p>") : "<p>This is an idealised teaching model, not a validated measurement procedure.</p>";
    const target=byId('demo');if(!target)throw new Error('Demo mounting point missing.');
    document.title=config.title+' · Analytical Chemistry';
    target.innerHTML=`<header class="demo-header"><p class="eyebrow">Analytical Chemistry · interactive experiment</p><h1>${escape(config.title)}</h1><p class="demo-intro">${escape(config.intro||'')}</p></header>
      <section class="prediction" aria-labelledby="prediction-title"><h2 id="prediction-title">Predict before changing a control</h2><p>${escape(config.predict||'Predict how the measurement and reported result will change.')}</p></section>
      <div class="demo-layout"><section class="control-panel" aria-labelledby="controls-title"><h2 id="controls-title">Explore</h2><form id="controls">${config.controls||''}<div class="actions"><button type="reset" id="reset">Reset</button><button type="button" id="export">Export CSV</button></div></form><a class="mobile-jump" href="#experiment-results">See the result</a></section>
      <section class="demo-content" id="experiment-results" aria-label="Model results"><a class="mobile-jump" href="#controls-title">Back to controls</a>${config.body||'<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>'}</section></div>
      <section class="model-notes" aria-labelledby="model-title"><h2 id="model-title">Model and limits</h2>${notes}</section>
      <p class="r-transfer">Take the result into R: export the CSV, inspect its columns and units, and reproduce one plotted relationship or calculation. Explain whether the model supports the chemical claim.</p>`;
  }
  function bind(render) {
    const form=byId('controls');
    form.addEventListener('input',render);form.addEventListener('change',render);
    form.addEventListener('reset',()=>queueMicrotask(render));
    let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,100);});render();
  }
  function csv(filename,rows) {
    if(!rows.length)return;
    const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];
    const cell=value=>{if(value===undefined||value===null||typeof value==='number'&&!Number.isFinite(value))return '';const s=String(value);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    const text=[keys.map(cell).join(','),...rows.map(row=>keys.map(k=>cell(row[k])).join(','))].join('\r\n')+'\r\n';
    const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }
  let plotCounter=0;
  function plot(target,config) {
    const node=typeof target==='string'?byId(target):target;if(!node)throw new Error('Plot container missing: '+target);
    const W=Math.max(320,Math.round(node.clientWidth||760)),H=W<500?290:350,L=72,R=20,T=18,B=38;
    const x0=config.xDomain[0],x1=config.xDomain[1],y0=config.yDomain[0],y1=config.yDomain[1];
    if(![x0,x1,y0,y1].every(Number.isFinite)||x1<=x0||y1<=y0)throw new Error('Plot domains must be finite and increasing.');
    const X=x=>L+(x-x0)/(x1-x0)*(W-L-R),Y=y=>H-B-(y-y0)/(y1-y0)*(H-T-B);
    const clip='chem-clip-'+(++plotCounter),series=config.series||[],ticks=4;
    function tick(value,span){const step=span/ticks;const decimals=Math.max(0,Math.min(8,Math.ceil(-Math.log10(step))+1));if(value!==0&&(Math.abs(value)<1e-4||Math.abs(value)>=1e6))return value.toExponential(1);return Number(value.toFixed(decimals)).toString();}
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${escape(config.description||config.yLabel+' against '+config.xLabel)}"><title>${escape(config.description||config.yLabel+' against '+config.xLabel)}</title><desc>Horizontal axis: ${escape(config.xLabel)}. Vertical axis: ${escape(config.yLabel)}. Use left and right arrow keys to inspect plotted values; Shift makes a larger step, and Home or End selects a boundary.</desc><defs><clipPath id="${clip}"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/></clipPath></defs>`;
    for(let i=0;i<=ticks;i++) {
      const x=x0+(x1-x0)*i/ticks,y=y0+(y1-y0)*i/ticks;
      svg+=`<line class="plot-grid" x1="${X(x)}" y1="${T}" x2="${X(x)}" y2="${H-B}"/><line class="plot-grid" x1="${L}" y1="${Y(y)}" x2="${W-R}" y2="${Y(y)}"/><text class="plot-tick" x="${X(x)}" y="${H-B+24}" text-anchor="middle">${escape(tick(x,x1-x0))}</text><text class="plot-tick" x="${L-10}" y="${Y(y)+5}" text-anchor="end">${escape(tick(y,y1-y0))}</text>`;
    }
    svg+=`<path d="M${L} ${T} V${H-B} H${W-R}" class="plot-axis" fill="none"/>`;
    const references=[];
    svg+=`<g clip-path="url(#${clip})">`;
    for(const line of config.horizontal||[]) {svg+=`<line x1="${L}" x2="${W-R}" y1="${Y(line.y)}" y2="${Y(line.y)}" stroke="${line.color||colors.gray}" stroke-dasharray="6 4" stroke-width="1.5"/>`;if(line.label)references.push(`${line.label}: ${fmt(line.y,4)}`);}
    for(const line of config.vertical||[]) {svg+=`<line y1="${T}" y2="${H-B}" x1="${X(line.x)}" x2="${X(line.x)}" stroke="${line.color||colors.gray}" stroke-dasharray="6 4" stroke-width="1.5"/>`;if(line.label)references.push(`${line.label}: ${fmt(line.x,4)}`);}
    const inspect=[];
    series.forEach((s,index)=>{
      const color=s.color||Object.values(colors)[index%Object.values(colors).length],points=(s.points||[]).filter(p=>p.length>=2&&p.slice(0,2).every(Number.isFinite));
      points.forEach(p=>inspect.push({label:s.label||'Series '+(index+1),x:p[0],y:p[1]}));
      if(s.type==='points')points.forEach(p=>{svg+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4.5" fill="${color}" stroke="white" stroke-width="1"><title>${escape(s.label||'Observation')}: x=${fmt(p[0],5)}, y=${fmt(p[1],5)}</title></circle>`;});
      else if(s.type==='bars')points.forEach(p=>{const zero=Y(Math.max(y0,Math.min(y1,0))),y=Y(p[1]),w=Math.min(46,(W-L-R)/Math.max(1,points.length)*.65);svg+=`<rect x="${X(p[0])-w/2}" y="${Math.min(zero,y)}" width="${w}" height="${Math.abs(zero-y)}" fill="${color}"><title>${escape(s.label||'Value')}: x=${fmt(p[0],5)}, y=${fmt(p[1],5)}</title></rect>`;});
      else svg+=`<polyline points="${points.map(p=>X(p[0])+','+Y(p[1])).join(' ')}" stroke="${color}" stroke-width="2.3" fill="none"${s.dash?' stroke-dasharray="7 4"':''}/>`;
    });
    svg+='</g></svg>';
    const legend=series.filter(s=>s.label).map((s,i)=>`<span><i aria-hidden="true" style="--series-color:${s.color||Object.values(colors)[i%Object.values(colors).length]};${s.dash?'border-top-style:dashed':''}"></i>${escape(s.label)}</span>`).join('');
    node.innerHTML=`<div class="plot-y-label">${escape(config.yLabel)}</div>${svg}<div class="plot-x-label">${escape(config.xLabel)}</div>${legend?'<div class="plot-legend">'+legend+'</div>':''}${references.length?'<p class="plot-references">Dashed references: '+references.map(escape).join('; ')+'</p>':''}<p class="plot-inspector" aria-live="polite">Inspect: point or use arrow keys on the chart.</p>`;
    const graphic=node.querySelector('svg'),inspector=node.querySelector('.plot-inspector');let cursor=0;
    function show(point){if(point)inspector.textContent=`${point.label} · ${config.xLabel}: ${fmt(point.x,5)} · ${config.yLabel}: ${fmt(point.y,5)}`;}
    graphic.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(!inspect.length)return;const step=Math.max(1,Math.ceil(inspect.length/200))*(event.shiftKey?10:1);if(event.key==='Home')cursor=0;else if(event.key==='End')cursor=inspect.length-1;else cursor=(cursor+(event.key==='ArrowRight'?step:-step)+inspect.length)%inspect.length;show(inspect[cursor]);});
    const inspectPointer=event=>{if(!inspect.length)return;const rect=graphic.getBoundingClientRect(),px=(event.clientX-rect.left)*W/rect.width,py=(event.clientY-rect.top)*H/rect.height;let best=Infinity,point=null;for(const p of inspect){const dist=(X(p.x)-px)**2+(Y(p.y)-py)**2;if(dist<best){best=dist;point=p;}}show(point);};
    graphic.addEventListener('pointermove',inspectPointer);graphic.addEventListener('pointerdown',inspectPointer);
  }
  return {colors,mean,sd,rng,normal,linearFit,fmt,byId,init,bind,csv,plot,clamp:(x,lo,hi)=>Math.max(lo,Math.min(hi,x))};
});
