/** Chemistry-specific plot/export helpers, built on quantbio's unchanged UI. */
import {htmlEl,svgEl,slider,checkbox,button,scale,type Slider} from './ui';
export const colors={teal:'#1f77b4',orange:'#e6550d',blue:'#205b9d',gray:'#666',purple:'#79529e'};
export const fmt=(x:number,d=3):string=>!Number.isFinite(x)?'not available':x!==0&&(Math.abs(x)<10**(-d)||Math.abs(x)>=1e6)?x.toExponential(Math.max(1,d-1)):Number(x.toFixed(d)).toString();
export function layout(host:HTMLElement){
 const plots=htmlEl('div','ac-plots','',host),panel=htmlEl('div','qb-panel','',host);
 const controls=htmlEl('div','ac-controls','',panel),readout=htmlEl('div','qb-readout','',panel);
 readout.setAttribute('aria-live','polite');const note=htmlEl('p','qb-note','',panel);
 return {plots,controls,readout,note,panel};
}
export function range(parent:Element,key:string,label:string,min:number,max:number,step:number,value:number,onInput:(v:number)=>void,format?:(v:number)=>string):Slider {
 const s=slider(parent,label,min,max,step,value,onInput,format);s.input.dataset.param=key;return s;
}
export function choose(parent:Element,key:string,label:string,options:readonly {value:string;label:string}[],initial:string,onChange:(v:string)=>void):HTMLSelectElement {
 const lab=htmlEl('label','ac-select','',parent);htmlEl('span','',label,lab);
 const select=htmlEl('select','','',lab);select.dataset.param=key;
 for(const o of options){const el=htmlEl('option','',o.label,select);el.value=o.value;}select.value=initial;
 select.addEventListener('change',()=>{onChange(select.value);select.blur();});return select;
}
export function toggle(parent:Element,key:string,label:string,value:boolean,onChange:(v:boolean)=>void):HTMLInputElement {
 const input=checkbox(parent,label,value,onChange);input.dataset.param=key;return input;
}
export function action(parent:Element,key:string,label:string,onClick:()=>void):HTMLButtonElement {
 const b=button(parent,label,onClick);b.dataset.action=key;return b;
}
export function downloadCSV(filename:string,rows:readonly object[]):void {
 if(!rows.length)return;const records=rows as Record<string,unknown>[];
 const keys=[...new Set(records.flatMap(r=>Object.keys(r)))];
 const cell=(v:unknown):string=>{if(v===null||v===undefined||typeof v==='number'&&!Number.isFinite(v))return '';const s=String(v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 const text=[keys.join(','),...records.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n')+'\r\n';
 const a=htmlEl('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=filename;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
export interface Series {label:string;color?:string;points:readonly (readonly [number,number])[];type?:'line'|'points';dash?:boolean;}
export interface PlotConfig {xLabel:string;yLabel:string;xDomain:[number,number];yDomain:[number,number];series:Series[];horizontal?:{y:number;label:string;color?:string}[];vertical?:{x:number;label:string;color?:string}[];description?:string;}
let uid=0;
export function plot(host:HTMLElement,c:PlotConfig):void {
 host.replaceChildren();const W=Math.max(320,Math.round(host.clientWidth||560)),H=W<420?280:320,L=63,R=18,T=15,B=33;
 const [x0,x1]=c.xDomain,[y0,y1]=c.yDomain;
 if(![x0,x1,y0,y1].every(Number.isFinite)||!(x1>x0&&y1>y0))throw new Error('Invalid plot domain');
 htmlEl('p','ac-axis-label',c.yLabel,host);
 const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,class:'qb-plot',role:'img',tabindex:0,'aria-label':c.description||`${c.yLabel} against ${c.xLabel}`},host);
 svgEl('title',{},svg).textContent=c.description||`${c.yLabel} against ${c.xLabel}`;
 svgEl('desc',{},svg).textContent=`Horizontal: ${c.xLabel}. Vertical: ${c.yLabel}. Left and right arrows inspect values; Home and End jump to boundaries.`;
 const sx=scale(x0,x1,L,W-R),sy=scale(y0,y1,H-B,T);
 const tick=(v:number,span:number)=>{const places=Math.max(0,Math.min(8,Math.ceil(-Math.log10(span/4))+1));return v!==0&&(Math.abs(v)<1e-4||Math.abs(v)>=1e6)?v.toExponential(1):Number(v.toFixed(places)).toString();};
 for(let i=0;i<=4;i++){
  const x=x0+(x1-x0)*i/4,y=y0+(y1-y0)*i/4;
  svgEl('line',{x1:sx(x),x2:sx(x),y1:T,y2:H-B,class:'grid'},svg);svgEl('line',{x1:L,x2:W-R,y1:sy(y),y2:sy(y),class:'grid'},svg);
  svgEl('text',{x:sx(x),y:H-B+22,'text-anchor':'middle','font-size':13},svg).textContent=tick(x,x1-x0);
  svgEl('text',{x:L-8,y:sy(y)+4,'text-anchor':'end','font-size':13},svg).textContent=tick(y,y1-y0);
 }
 svgEl('path',{d:`M${L} ${T} V${H-B} H${W-R}`,fill:'none',class:'axis','stroke-width':1.3},svg);
 const id=`ac-clip-${++uid}-${Math.random().toString(36).slice(2,8)}`;
 const cp=svgEl('clipPath',{id},svgEl('defs',{},svg));svgEl('rect',{x:L,y:T,width:W-L-R,height:H-T-B},cp);
 const layer=svgEl('g',{'clip-path':`url(#${id})`},svg),references:string[]=[];
 for(const l of c.horizontal||[]){svgEl('line',{x1:L,x2:W-R,y1:sy(l.y),y2:sy(l.y),stroke:l.color||colors.gray,'stroke-dasharray':'5 4'},layer);references.push(`${l.label}: ${fmt(l.y,4)}`);}
 for(const l of c.vertical||[]){svgEl('line',{y1:T,y2:H-B,x1:sx(l.x),x2:sx(l.x),stroke:l.color||colors.gray,'stroke-dasharray':'5 4'},layer);references.push(`${l.label}: ${fmt(l.x,4)}`);}
 const values:{label:string;x:number;y:number}[]=[];
 for(const [index,s] of c.series.entries()){
  const color=s.color||Object.values(colors)[index%5],points=s.points.filter(p=>p.every(Number.isFinite));
  for(const p of points)values.push({label:s.label,x:p[0],y:p[1]});
  if(s.type==='points')for(const p of points){const mark=svgEl('circle',{cx:sx(p[0]),cy:sy(p[1]),r:4.5,fill:color,stroke:'#fff','stroke-width':1},layer);svgEl('title',{},mark).textContent=`${s.label}: ${fmt(p[0],5)}, ${fmt(p[1],5)}`;}
  else svgEl('polyline',{points:points.map(p=>`${sx(p[0])},${sy(p[1])}`).join(' '),stroke:color,'stroke-width':2.2,fill:'none',...(s.dash?{'stroke-dasharray':'6 4'}:{})},layer);
 }
 htmlEl('p','ac-x-label',c.xLabel,host);
 const legend=htmlEl('div','ac-legend','',host);
 for(const [i,s] of c.series.entries()){const item=htmlEl('span','','',legend);const key=htmlEl('i','','',item);key.style.borderTopColor=s.color||Object.values(colors)[i%5];if(s.dash)key.style.borderTopStyle='dashed';item.append(s.label);}
 if(references.length)htmlEl('p','qb-note',`Dashed references: ${references.join('; ')}`,host);
 const inspect=htmlEl('p','qb-note ac-inspect','Point at the chart or focus it and use arrow keys to inspect values.',host);inspect.setAttribute('aria-live','polite');let cursor=0;
 const show=(v:typeof values[number]|undefined)=>{if(v)inspect.textContent=`${v.label} · ${c.xLabel}: ${fmt(v.x,5)} · ${c.yLabel}: ${fmt(v.y,5)}`;};
 svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||!values.length)return;e.preventDefault();const step=Math.max(1,Math.ceil(values.length/200))*(e.shiftKey?10:1);cursor=e.key==='Home'?0:e.key==='End'?values.length-1:(cursor+(e.key==='ArrowRight'?step:-step)+values.length)%values.length;show(values[cursor]);});
 const pointer=(e:PointerEvent)=>{const rect=svg.getBoundingClientRect(),x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;let best=Infinity,chosen;for(const v of values){const d=(sx(v.x)-x)**2+(sy(v.y)-y)**2;if(d<best){best=d;chosen=v;}}show(chosen);};
 svg.addEventListener('pointermove',pointer);svg.addEventListener('pointerdown',pointer);
}
export function onResize(host:HTMLElement,render:()=>void):void {let width=host.clientWidth;const observer=new ResizeObserver(()=>{if(host.clientWidth!==width){width=host.clientWidth;render();}});observer.observe(host);}
