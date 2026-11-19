import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,choose,action,plot,downloadCSV,fmt,colors,onResize} from '../lib/chemistry';
import {injectionModel} from './math';

autoMount('gc-hplc',host=>{
 const view=layout(host),chart=htmlEl('div','ac-chart','',view.plots);
 const defaults={injectionFactor:.8,recovery:1,timing:'after' as 'before'|'after',analyteResponse:1,coelutionArea:0};
 let state={...defaults},result=injectionModel(state),sweep=[result];
 const injection=range(view.controls,'injection-factor','Injection amount multiplier',.5,1.5,.05,.8,v=>{state.injectionFactor=v;render();},v=>fmt(v,2)+'×');
 const recovery=range(view.controls,'extraction-recovery','Native analyte extraction recovery',.4,1,.05,1,v=>{state.recovery=v;render();},v=>fmt(v*100,0)+'%');
 const timing=choose(view.controls,'standard-timing','Internal-standard addition',[{value:'after',label:'After extraction'},{value:'before',label:'Before extraction: equal recovery assumed'}],'after',v=>{state.timing=v as 'before'|'after';render();});
 const response=range(view.controls,'analyte-response','Analyte-only matrix response multiplier',.5,1.5,.05,1,v=>{state.analyteResponse=v;render();},v=>fmt(v,2)+'×');
 const overlap=range(view.controls,'coelution-area','Known coeluting area at unit injection',0,250,10,0,v=>{state.coelutionArea=v;render();},v=>fmt(v,0));
 action(view.controls,'reset','Reset',()=>{state={...defaults};injection.set(.8);recovery.set(1);timing.value='after';response.set(1);overlap.set(0);render();});
 action(view.controls,'export','Export CSV',()=>downloadCSV('internal-standard-experiment.csv',sweep.map(r=>({injection_multiplier:r.injectionFactor,native_recovery_fraction:r.recovery,internal_standard_added:r.timing,analyte_response_multiplier:r.analyteResponse,coelution_area_at_unit_injection:r.coelutionArea,caffeine_area:r.caffeineArea,internal_standard_area:r.standardArea,area_ratio:r.ratio,candidate_external_original_mg_l:r.externalOriginalMgL,candidate_ratio_original_mg_l:r.ratioOriginalMgL,compensation_model_matches_selected_effects:r.compensationValid,eligible_under_stated_model:r.reportable,reported_original_mg_l:r.reportedOriginalMgL,simulation_truth_original_mg_l:r.truthOriginalMgL}))));
 function render(){
  result=injectionModel(state);sweep=Array.from({length:51},(_,i)=>injectionModel({...state,injectionFactor:.5+.02*i}));
  plot(chart,{xLabel:'Injection amount multiplier',yLabel:'Candidate original caffeine (mg/L)',xDomain:[.5,1.5],yDomain:[0,1.1*Math.max(170,...sweep.flatMap(r=>[r.externalOriginalMgL,r.ratioOriginalMgL]))],series:[{label:'External area',color:colors.orange,points:sweep.map(r=>[r.injectionFactor,r.externalOriginalMgL])},{label:'Area ratio',color:colors.teal,points:sweep.map(r=>[r.injectionFactor,r.ratioOriginalMgL])},{label:'Selected external estimate',color:colors.orange,points:[[result.injectionFactor,result.externalOriginalMgL]],type:'points'},{label:'Selected ratio estimate',color:colors.teal,points:[[result.injectionFactor,result.ratioOriginalMgL]],type:'points'}],horizontal:[{y:150,label:'Known original simulation truth'}],description:'Area and area-ratio estimates are compared with a known 150 mg/L original caffeine concentration. Injection varies along the horizontal axis; other effects remain at the selected values.'});
  view.readout.textContent=`Areas: ${fmt(result.caffeineArea,2)} / ${fmt(result.standardArea,2)}\nArea ratio: ${fmt(result.ratio,5)}\nExternal candidate: ${fmt(result.externalOriginalMgL,2)} mg/L original\nRatio candidate: ${fmt(result.ratioOriginalMgL,2)} mg/L original\n${result.reportable?'Eligible under the selected ideal model':'Withhold the simple original-concentration estimate'}`;
  const notes:string[]=[];
  if(state.coelutionArea>0)notes.push('A ratio cannot separate a known coeluting contribution.');
  if(state.analyteResponse!==1)notes.push('The matrix changes analyte response without changing the internal standard.');
  if(state.recovery<1)notes.push(state.timing==='after'?'A late standard did not experience the earlier analyte loss.':'The early standard shares recovery exactly in this ideal model; real equivalence needs evidence.');
  if(!notes.length)notes.push('The ratio mostly cancels shared injection variation.');
  if(Math.abs(result.ratioOriginalMgL-result.truthOriginalMgL)>.001&&result.compensationValid&&state.coelutionArea===0)notes.push('The remaining small change comes from the constant area offset, which is not multiplied by injection or recovery.');
  notes.push('Simulated standards: area=3+50c and R=0.006+0.100c. Intended final caffeine is 15 mg/L; dilution factor is 10. Internal-standard concentration is 10 mg/L.');
  view.note.textContent=notes.join(' ');
 }
 render();onResize(host,render);
});
