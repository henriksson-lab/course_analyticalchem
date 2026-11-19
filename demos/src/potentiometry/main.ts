import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,toggle,action,plot,onResize,downloadCSV,colors} from '../lib/chemistry';
import {calculate} from './math';
function mount(host:HTMLElement):void {
 const {plots,controls,readout,note}=layout(host);const chart=htmlEl('div','','',plots);
 let logC=-3.7,activityRatio=1,driftMv=0,matched=false;
 const lc=range(controls,'logc','True log₁₀[c/(1 mol/L)]',-5,-3,.02,logC,v=>{logC=v;render();});
 const activity=range(controls,'activity','Sample / standard activity-coefficient ratio',.2,1.5,.02,activityRatio,v=>{activityRatio=v;render();});
 const drift=range(controls,'drift','Shared potential drift (mV)',-10,10,.2,driftMv,v=>{driftMv=v;render();},v=>v.toFixed(1)+' mV');
 const match=toggle(controls,'matched','Apply ideal matched ionic-strength treatment',matched,v=>{matched=v;render();});
 action(controls,'reset','Reset',()=>{logC=-3.7;activityRatio=1;driftMv=0;matched=false;lc.set(logC);activity.set(activityRatio);drift.set(driftMv);match.checked=matched;render();});
 action(controls,'export','Export CSV',()=>{const r=calculate({logC,activityRatio,driftMv,matched});downloadCSV('potentiometry-demo.csv',[...r.rows,{record_type:'unknown',true_sample_mol_l:r.trueC,potential_mv:r.potentialMv,candidate_mol_l:r.candidateC,reference_and_range_checks_pass:r.checksPass,known_activity_conditions_match:r.matrixMatched,reportable_under_stated_conditions:r.reportable,reported_mol_l:r.reportedC,sample_to_standard_activity_coefficient_ratio:r.gammaRatio}]);});
 function render():void {
  activity.input.disabled=matched;const r=calculate({logC,activityRatio,driftMv,matched});const inverseLog=Math.log10(r.candidateC);
  plot(chart,{xLabel:'log₁₀[c/(1 mol/L)]',yLabel:'Potential (mV)',xDomain:[Math.min(-5.1,inverseLog-.1),Math.max(-2.9,inverseLog+.1)],yDomain:[45,255],series:[{label:'Calibration conditions',color:colors.teal,points:r.rows.map(v=>[v.log10_c_mol_l,v.calibration_mv])},{label:'Sample conditions',color:colors.orange,dash:true,points:r.rows.map(v=>[v.log10_c_mol_l,v.sample_condition_mv])},{label:'Known true input',color:colors.orange,type:'points',points:[[logC,r.potentialMv]]},{label:'Candidate inverse on old calibration',color:colors.purple,type:'points',points:[[inverseLog,r.potentialMv]]}],description:'The same measured potential gives a biased inverse concentration when activity conditions or shared cell drift differ from calibration.'});
  const decision=!r.qcPass?'Withhold: independent drift check fails.':!r.inRange?'Withhold: inverse estimate is outside range.':!r.matrixMatched?'Reference and range checks pass, but withhold this known matrix mismatch.':'Passes stated exercise checks; full validation is not established.';
  readout.innerHTML=`<p>Known true: <strong>${r.trueC.toExponential(3)} mol/L</strong>; potential ${r.potentialMv.toFixed(2)} mV.</p><p>Candidate: ${r.candidateC.toExponential(3)} mol/L; bias ${r.biasPercent.toFixed(1)}%.</p><p>Independent check error ${driftMv.toFixed(1)} mV; tolerance ±2.0 mV. <strong>${decision}</strong></p>`;
  note.textContent=!r.qcPass?'The shared drift is visible in the independent check. Investigate and establish satisfactory calibration and checks before remeasurement. This does not identify the physical cause.':!r.matrixMatched?'A matrix-matched reference can pass while another sample has a different activity/concentration relation. The known simulation mismatch blocks that sample claim.':Math.abs(driftMv)>1e-10?'A drift inside the chosen tolerance still biases concentration. Passing a check is not evidence of zero uncertainty.':'Ideal fluoride response at 25 °C, slope −59.16 mV/decade. Activity ratio is sample relative to standards; ideal matching forces it to one. No interfering-ion or junction model is included; free fluoride is not total fluorine.';
 }
 render();onResize(host,render);
}
autoMount('potentiometry',mount);
