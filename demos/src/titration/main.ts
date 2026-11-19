import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,choose,action,plot,onResize,downloadCSV,colors} from '../lib/chemistry';
import {calculate,phAt,type AcidType} from './math';
function mount(host:HTMLElement):void {
 const {plots,controls,readout,note}=layout(host);const chart=htmlEl('div','','',plots);
 let acidType:AcidType='strong',baseMolL=.1,pKa=4.76,addedMl=25,endpointPh=7;
 const acid=choose(controls,'acid','Acid model',[{value:'strong',label:'Strong monoprotic acid'},{value:'weak',label:'Weak monoprotic acid'}],'strong',v=>{acidType=v as AcidType;render();});
 const pk=range(controls,'pka','Weak-acid pKa',3,7,.01,pKa,v=>{pKa=v;render();});
 const base=range(controls,'base','Standardised base (mol/L)',.05,.2,.005,baseMolL,v=>{baseMolL=v;render();},v=>v.toFixed(3)+' mol/L');
 const added=range(controls,'added','Base added (mL)',0,100,.05,addedMl,v=>{addedMl=v;render();},v=>v.toFixed(2)+' mL');
 const trigger=range(controls,'trigger','Chosen endpoint trigger (pH)',4,10,.1,endpointPh,v=>{endpointPh=v;render();});
 action(controls,'reset','Reset',()=>{acidType='strong';baseMolL=.1;pKa=4.76;addedMl=25;endpointPh=7;acid.value='strong';pk.set(pKa);base.set(baseMolL);added.set(addedMl);trigger.set(endpointPh);render();});
 action(controls,'export','Export CSV',()=>downloadCSV('titration-demo.csv',calculate({acidType,baseMolL,pKa,addedMl,endpointPh}).curve));
 function render():void {
  pk.input.disabled=acidType==='strong';const r=calculate({acidType,baseMolL,pKa,addedMl,endpointPh});
  const series=[{label:acidType==='strong'?'Strong acid':'Selected weak acid',color:colors.teal,type:'line' as const,points:r.curve.map(v=>[v.volume_ml,v.ph] as [number,number])}];
  if(acidType==='weak')series.push({label:'Same amount of strong acid',color:colors.gray,type:'line',points:r.curve.map(v=>[v.volume_ml,phAt(v.volume_ml,'strong',baseMolL)] as [number,number])});
  const vertical=[{x:r.equivalenceMl,label:'Equivalence (mL)',color:colors.teal}];
  if(r.endpointMl!==null)vertical.push({x:r.endpointMl,label:'Chosen endpoint (mL)',color:colors.orange});
  plot(chart,{xLabel:'Base added (mL)',yLabel:'pH',xDomain:[0,r.maxMl],yDomain:[0,14],series:[...series,{label:'Current addition',color:colors.orange,type:'points',points:[[addedMl,r.currentPh]]}],vertical,horizontal:[{y:endpointPh,label:'Endpoint trigger (pH)',color:colors.orange}],description:'Acid-base pH curves distinguish stoichiometric equivalence from a selected endpoint pH.'});
  note.textContent='Initial acid is fixed at 25.00 mL of 0.1000 mol/L (2.500 mmol). Ideal 25 °C monoprotic equilibrium includes water autoionisation. The chosen pH is an endpoint trigger, not a validated indicator range; no mixing, electrode or volume uncertainty is simulated.';
  readout.innerHTML=`<p>Initial acid: <strong>2.500 mmol in 25.00 mL</strong>. Current pH ${r.currentPh.toFixed(3)}.</p><p>Equivalence: <strong>${r.equivalenceMl.toFixed(3)} mL</strong>, pH ${r.equivalencePh.toFixed(3)}.</p>`+(r.endpointMl===null?'<p>The selected trigger is outside this titration’s pH interval. No usable endpoint estimate is assigned.</p>':`<p>Chosen endpoint: ${r.endpointMl.toFixed(3)} mL → ${r.estimatedAcid!.toFixed(5)} mol/L acid; bias ${r.biasPercent!.toFixed(2)}% against the known 0.1000 mol/L.</p>`);
  note.textContent='Ideal monoprotic equilibrium at 25 °C, Kw=10⁻¹⁴ and ideal activities. The weak curve solves charge balance including water. Acid strength changes pH; amount and titrant concentration set equivalence volume. A pH trigger is not a validated indicator transition or noisy endpoint algorithm.';
 }
 render();onResize(host,render);
}
autoMount('titration',mount);
