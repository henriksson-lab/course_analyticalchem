import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,choose,toggle,action,plot,onResize,downloadCSV,colors} from '../lib/chemistry';
import {atomicModel} from './math';
function mount(host:HTMLElement):void {
 const {plots,controls,readout,note}=layout(host);const chart=htmlEl('div','','',plots);
 let distance=.012,interferenceHeight=300,blank=.010,isolated=false,subtractBlank=true;
 const dist=range(controls,'line-distance','Distance from target line (nm)',.002,.045,.001,distance,v=>{distance=v;render();},v=>v.toFixed(3)+' nm');
 const height=range(controls,'interference-height','Interferer peak height (counts)',0,800,20,interferenceHeight,v=>{interferenceHeight=v;render();},v=>v.toFixed(0)+' counts');
 const bg=range(controls,'digest-blank','Method-blank digest (mg/L)',0,.1,.005,blank,v=>{blank=v;render();});
 const line=choose(controls,'line-mode','Selected measurement line',[{value:'primary',label:'Primary line with possible overlap'},{value:'isolated',label:'Isolated comparison line (ideal)'}],'primary',v=>{isolated=v==='isolated';render();});
 const subtract=toggle(controls,'subtract-blank','Subtract the undiluted method blank on digest basis',subtractBlank,v=>{subtractBlank=v;render();});
 action(controls,'reset','Reset',()=>{distance=.012;interferenceHeight=300;blank=.010;isolated=false;subtractBlank=true;dist.set(distance);height.set(interferenceHeight);bg.set(blank);line.value='primary';subtract.checked=true;render();});
 action(controls,'export','Export CSV',()=>{const r=atomicModel({distance,interferenceHeight,blank,isolated,subtractBlank});downloadCSV('atomic-line-experiment.csv',r.rows.map(v=>({...v,distance_nm:r.distance,interference_peak_counts:r.interferenceHeight,method_blank_digest_mg_l:r.blank,isolated_line:r.isolated,subtract_blank:r.subtractBlank,diagnostic_apparent_original_mg_kg:r.apparentMgKg,simulation_truth_mg_kg:r.truthMgKg,estimate_status:'Diagnostic simulation estimate; method validation not established'})));});
 function render():void {
  const r=atomicModel({distance,interferenceHeight,blank,isolated,subtractBlank});
  plot(chart,{xLabel:'Wavelength offset from target (nm)',yLabel:'Emission response (counts)',xDomain:[-.05,.05],yDomain:[0,Math.max(...r.rows.map(v=>v.total_counts))*1.12],series:[{label:'Target + instrument background',color:colors.teal,points:r.rows.map(v=>[v.offset_nm,v.target_plus_background_counts])},{label:'Interferent: known simulation contribution',color:colors.orange,dash:true,points:r.rows.map(v=>[v.offset_nm,v.interfering_counts])},{label:'Combined response',color:colors.purple,points:r.rows.map(v=>[v.offset_nm,v.total_counts])}],vertical:[{x:0,label:'Selected wavelength (offset nm)',color:colors.gray}],description:'Simulated target and neighbouring emission lines overlap at the selected wavelength and inflate a diagnostic copper estimate.'});
  readout.innerHTML=`<p>Preparation: <strong>0.2500 g dry → 50.00 mL digest → twofold dilution</strong>.</p><p>Apparent measured copper ${r.apparentMeasured.toFixed(4)} mg/L; ${subtractBlank?'blank-corrected':'uncorrected'} digest ${r.apparentDigest.toFixed(4)} mg/L.</p><p>Diagnostic apparent result <strong>${r.apparentMgKg.toFixed(2)} mg Cu/kg</strong>; known model truth ${r.truthMgKg.toFixed(2)} mg/kg.</p>`;
  note.textContent=(r.overlapAtTarget>.05?`The interferent adds ${r.overlapAtTarget.toFixed(2)} counts at the selected wavelength. A method blank cannot remove this sample-specific overlap. `:subtractBlank?'The isolated or well-separated line returns the known model value. ':'Little overlap remains, but omitting the blank still biases the result. ')+'Undo sample dilution, then subtract the undiluted blank on digest concentration basis. Calibration is counts=8+1000c. Lines and the equal-sensitivity isolated comparison are idealisations, not authentic reference spectra, species identification or recovery validation.';
 }
 render();onResize(host,render);
}
autoMount('atomic-methods',mount);
