import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,toggle,action,plot,downloadCSV,fmt,colors,onResize,type Series} from '../lib/chemistry';
import {separationModel} from './math';

autoMount('separations',host=>{
 const view=layout(host);
 const chart=htmlEl('div','ac-chart','',view.plots);
 let state={spacing:1,widthFactor:1,areaB:150,showComponents:true};
 let result=separationModel(state);
 const spacing=range(view.controls,'peak-spacing','B minus A retention time (min)',.15,2,.05,1,v=>{state.spacing=v;render();},v=>fmt(v,2)+' min');
 const width=range(view.controls,'width-factor','Band-width multiplier',.5,3,.1,1,v=>{state.widthFactor=v;render();},v=>fmt(v,1)+'×');
 const area=range(view.controls,'area-b','Component B area (response·min)',50,500,10,150,v=>{state.areaB=v;render();},v=>fmt(v,0));
 const reveal=toggle(view.controls,'show-components','Reveal the individual components (simulation truth)',true,v=>{state.showComponents=v;render();});
 action(view.controls,'reset','Reset',()=>{state={spacing:1,widthFactor:1,areaB:150,showComponents:true};spacing.set(1);width.set(1);area.set(150);reveal.checked=true;render();});
 action(view.controls,'export','Export CSV',()=>downloadCSV('separation-experiment.csv',result.rows.map(r=>({...r,area_a:result.areaA,area_b:result.areaB,baseline_width_a_min:result.widthA,baseline_width_b_min:result.widthB,retention_a_min:result.tA,retention_b_min:result.tB,resolution:result.resolution,selected_window_low_min:result.windowLow,selected_window_high_min:result.windowHigh}))));
 function render(){
  result=separationModel(state);
  const series:Series[]=[{label:'Combined response',color:colors.purple,points:result.rows.map(r=>[r.time_min,r.combined_above_baseline]),type:'line'}];
  if(state.showComponents)series.push({label:'A: area 100',color:colors.teal,points:result.rows.map(r=>[r.time_min,r.component_a]),dash:true},{label:'B: area '+fmt(result.areaB,0),color:colors.orange,points:result.rows.map(r=>[r.time_min,r.component_b]),dash:true});
  plot(chart,{xLabel:'Time (min)',yLabel:'Baseline-subtracted response',xDomain:[0,8],yDomain:[0,Math.max(...result.rows.map(r=>r.combined_above_baseline))*1.12],series,vertical:[{x:result.windowLow,label:'A window start'},{x:result.windowHigh,label:'A window end'}],description:'Gaussian component areas stay fixed while spacing, width and the interfering amount change. Dashed references enclose A’s ±2σ window.'});
  view.readout.textContent=`Rs = ${fmt(result.resolution,3)}\nkA = ${fmt(result.kA,2)}; kB = ${fmt(result.kB,2)}; α = ${fmt(result.alpha,3)}\nArea inside A window = ${fmt(result.combinedWindow,2)} response·min\nA contribution = ${fmt(result.aWindow,2)}; B contribution = ${fmt(result.bWindow,2)}\nB is ${fmt(result.contaminationPercent,2)}% of that combined window`;
  view.note.textContent='A full area remains 100 response·min. Its ±2σ window captures about 95.45% of isolated A, plus any B inside it. Baseline widths are 4σ. Gaussian components and their separate areas are simulation truth; a real detector does not automatically reveal them. No universal resolution threshold establishes purity.';
 }
 render();onResize(host,render);
});
