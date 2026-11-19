import {autoMount,htmlEl} from '../lib/ui';
import {layout,choose,action,plot,downloadCSV,fmt,colors,onResize} from '../lib/chemistry';
import {measurePreparation,type SampleId} from './math';

autoMount('defending-results',host=>{
 const view=layout(host),chart=htmlEl('div','ac-chart','',view.plots);
 const tableWrap=htmlEl('div','ac-history','',view.plots);tableWrap.style.overflowX='auto';tableWrap.tabIndex=0;tableWrap.setAttribute('aria-label','Recorded preparation history; scroll horizontally to inspect columns');
 const defaults={sample:'drink_B' as SampleId,aliquotMl:5,qcOK:true,resolved:true};
 let plan={...defaults},history=[measurePreparation({},1)];
 const sample=choose(view.controls,'planned-sample','Sample for next preparation',[{value:'drink_B',label:'Drink B'},{value:'drink_A',label:'Drink A'},{value:'drink_C',label:'Drink C'}],'drink_B',v=>{plan.sample=v as SampleId;render();});
 const aliquot=choose(view.controls,'planned-aliquot','Aliquot for next preparation',[{value:'5',label:'5.00 mL'},{value:'2',label:'2.00 mL'},{value:'10',label:'10.00 mL'}],'5',v=>{plan.aliquotMl=Number(v);render();});
 const qc=choose(view.controls,'planned-qc','QC condition for next measurement',[{value:'pass',label:'QC passes'},{value:'fail',label:'QC fails at 85% recovery'}],'pass',v=>{plan.qcOK=v==='pass';render();});
 const separation=choose(view.controls,'planned-separation','Separation for next measurement',[{value:'resolved',label:'Adequately resolved under this scenario'},{value:'overlap',label:'Known unresolved contributing peak'}],'resolved',v=>{plan.resolved=v==='resolved';render();});
 const planNote=htmlEl('p','qb-note','',view.controls);
 action(view.controls,'measure-new','Measure a new preparation',()=>{history.push(measurePreparation(plan,history.length+1));render();});
 action(view.controls,'reset','Reset',()=>{plan={...defaults};history=[measurePreparation({},1)];sample.value='drink_B';aliquot.value='5';qc.value='pass';separation.value='resolved';render();});
 action(view.controls,'export','Export history CSV',()=>downloadCSV('reporting-decisions.csv',history.map(r=>({preparation_id:'P'+r.preparation,sample_id:r.sample,aliquot_ml:r.aliquotMl,final_ml:r.finalMl,recorded_area:r.area,qc_recovery_percent:r.qcRecovery,resolved:r.resolved,candidate_final_mg_l:r.candidateFinalMgL,dilution_factor:r.dilutionFactor,candidate_original_mg_l:r.candidateOriginalMgL,reportable:r.reportable,reported_original_mg_l:r.reportedOriginalMgL,limited_standard_uncertainty_mg_l:r.uOriginalMgL,withheld_reason:r.reasons.join('; '),simulation_truth_original_mg_l:r.trueOriginalMgL}))));
 function render(){
  const current=history[history.length-1];
  const changed=plan.sample!==current.sample||plan.aliquotMl!==current.aliquotMl||plan.qcOK!==current.qcPass||plan.resolved!==current.resolved;
  planNote.textContent=changed?'Plan changed. The record below does not change until a new preparation is measured.':'The plan matches the latest record. Another measurement still creates a new record.';
  const visible=history.slice(-12),maxY=Math.max(450,...visible.map(r=>r.candidateOriginalMgL));
  plot(chart,{xLabel:'Recorded preparation number',yLabel:'Candidate original caffeine (mg/L)',xDomain:[Math.max(0,visible[0].preparation-.5),Math.max(2,current.preparation+.5)],yDomain:[0,maxY*1.1],series:[{label:'Eligible under stated evidence',color:colors.teal,points:visible.filter(r=>r.reportable).map(r=>[r.preparation,r.candidateOriginalMgL]),type:'points'},{label:'Withheld diagnostic candidate',color:colors.orange,points:visible.filter(r=>!r.reportable).map(r=>[r.preparation,r.candidateOriginalMgL]),type:'points'}],description:'Recorded preparations retain their own measured areas and volume factors. Orange candidates are diagnostic only; they are not reported concentrations.'});
  view.readout.textContent=`Recorded P${current.preparation}: ${current.sample}, ${fmt(current.aliquotMl,2)} mL to 50.00 mL\nArea: ${fmt(current.area,1)}\nCandidate final concentration: ${fmt(current.candidateFinalMgL,3)} mg/L\nRange: ${current.inRange?'PASS':'FAIL'}; QC: ${current.qcPass?'PASS':'FAIL'} (${fmt(current.qcRecovery,1)}%); separation: ${current.resolved?'PASS':'FAIL'}\nOriginal result: ${current.reportable?fmt(current.reportedOriginalMgL!,2)+' mg/L':'WITHHELD'}\n${current.reportable?'Limited standard uncertainty: '+fmt(current.uOriginalMgL!,2)+' mg/L':current.reasons.join('; ')}`;
  tableWrap.replaceChildren();const table=htmlEl('table','','',tableWrap);htmlEl('caption','','Recorded preparations; only the last twelve are displayed, all are exported.',table);const head=htmlEl('thead','','',table),hr=htmlEl('tr','','',head);
  for(const label of ['Preparation','Sample / aliquot','Area','Reported original mg/L','Decision'])htmlEl('th','',label,hr);
  const body=htmlEl('tbody','','',table);
  for(const r of visible){const row=htmlEl('tr','','',body);for(const v of [`P${r.preparation}`,`${r.sample} / ${fmt(r.aliquotMl,2)} mL`,fmt(r.area,1),r.reportable?fmt(r.reportedOriginalMgL!,2):'Withheld',r.reportable?'Conditional result':r.reasons.join('; ')])htmlEl('td','',v,row);}
  view.note.textContent='Ideal model: area=4+40c over 0–30 mg/L final; final volume 50 mL; independent QC must recover 95–105%. Drink truths are A=150, B=400 and C=120 mg/L. Known coelution contributes 80 area units before an 85% instrument factor in a failed QC condition. Controls specify evidence for a new measurement, not permission to erase a failed record. Supplied final-concentration standard uncertainty is 0.15 mg/L here; only dilution scaling is included.';
 }
 render();onResize(host,render);
});
