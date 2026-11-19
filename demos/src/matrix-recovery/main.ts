import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,toggle,action,plot,onResize,downloadCSV,colors} from '../lib/chemistry';
import {calculate} from './math';
function mount(host:HTMLElement):void {
 const {plots,controls,readout,note}=layout(host);const chart=htmlEl('div','','',plots);
 let originalMgL=5,sensitivityRatio=.75,recoveryFraction=1,additiveSignal=0,correctBackground=false;
 const original=range(controls,'truth','Known original analyte (mg/L)',0,10,.1,originalMgL,v=>{originalMgL=v;render();});
 const sensitivity=range(controls,'sensitivity','Matrix / external sensitivity ratio',.25,1.5,.05,sensitivityRatio,v=>{sensitivityRatio=v;render();});
 const recovery=range(controls,'recovery','Native recovery before additions (%)',20,100,5,100,v=>{recoveryFraction=v/100;render();},v=>v.toFixed(0)+'%');
 const background=range(controls,'background','Additive interfering signal',0,.3,.01,additiveSignal,v=>{additiveSignal=v;render();});
 const correction=toggle(controls,'correction','Apply independent background correction (ideal)',correctBackground,v=>{correctBackground=v;render();});
 action(controls,'reset','Reset',()=>{originalMgL=5;sensitivityRatio=.75;recoveryFraction=1;additiveSignal=0;correctBackground=false;original.set(5);sensitivity.set(.75);recovery.set(100);background.set(0);correction.checked=false;render();});
 action(controls,'export','Export CSV',()=>downloadCSV('matrix-recovery-demo.csv',calculate({originalMgL,sensitivityRatio,recoveryFraction,additiveSignal,correctBackground}).points));
 function render():void {
  const r=calculate({originalMgL,sensitivityRatio,recoveryFraction,additiveSignal,correctBackground});const xmin=Math.min(-.5,r.xIntercept*1.15),ymax=Math.max(.3,...r.points.map(v=>v.raw_signal))*1.15;
  plot(chart,{xLabel:'Added analyte in final flask (mg/L)',yLabel:'Signal (arbitrary units)',xDomain:[xmin,2.2],yDomain:[-.12*ymax,ymax],series:[{label:'Applied standard-addition fit',color:colors.teal,points:[[xmin,r.fit.a+r.fit.b*xmin],[2.2,r.fit.a+r.fit.b*2.2]]},{label:correctBackground?'Independently background-corrected flasks':'Measured flasks',color:colors.teal,type:'points',points:r.points.map(v=>[v.added_mg_l_final,v.fitted_signal])},...(correctBackground&&additiveSignal>0?[{label:'Raw signals before correction',color:colors.orange,type:'points' as const,points:r.points.map(v=>[v.added_mg_l_final,v.raw_signal] as [number,number])}]:[])],horizontal:[{y:0,label:'Zero signal',color:colors.gray}],vertical:[{x:r.xIntercept,label:'x-intercept (mg/L final)',color:colors.orange}],description:'A straight standard-addition series can compensate sensitivity suppression but its intercept also responds to prior native loss and additive interference.'});
  readout.innerHTML=`<p>Known original: <strong>${originalMgL.toFixed(3)} mg/L</strong>; surviving native analyte ${r.expectedRecoveredOriginal.toFixed(3)} mg/L on original basis.</p><p>External estimate ${r.externalMgL.toFixed(3)} mg/L; standard addition <strong>${r.standardAdditionMgL.toFixed(3)} mg/L original</strong>.</p><p>x-intercept ${r.xIntercept.toFixed(3)} mg/L final × −25/10; incremental late-spike recovery ${r.spikeRecoveryPercent.toFixed(1)}%.</p><p>Error against known original: ${r.saBiasMgL.toFixed(3)} mg/L${r.saBiasPercent===null?' (relative error undefined at zero truth)':' ('+r.saBiasPercent.toFixed(1)+'%)'}.</p>`;
  const words=[];if(sensitivityRatio!==1)words.push('Native recovered and added analyte share a slope, so standard addition compensates this multiplicative sensitivity change.');if(recoveryFraction<1)words.push('The added analyte bypasses the earlier native loss: a late spike cannot validate extraction recovery.');if(additiveSignal>0)words.push(correctBackground?'An ideal independent background measurement removes the additive term; standard addition alone did not establish it.':'An uncorrected additive signal raises the intercept and is misread as native analyte despite an exact straight line.');
  note.textContent=(words.join(' ')||'With matched sensitivity, no interference and complete native recovery, both methods recover the known input in this ideal model.')+' All flasks contain 10.00 mL sample made to 25.00 mL. This noise-free model gives no complete uncertainty or method validation.';
 }
 render();onResize(host,render);
}
autoMount('matrix-recovery',mount);
