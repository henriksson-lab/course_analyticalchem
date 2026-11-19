import {autoMount,htmlEl} from '../lib/ui';
import {layout,range,toggle,action,plot,onResize,fmt,downloadCSV,colors} from '../lib/chemistry';
import {calculate} from './math';
autoMount('uv-visible',host=>{
 const ui=layout(host),response=htmlEl('div','','',ui.plots),residual=htmlEl('div','','',ui.plots);
 const state={concentrationMgL:2.4,pathCm:1,wavelengthNm:510,strayFraction:0,recalibrate:true};
 let latest=calculate(state);
 range(ui.controls,'concentration','Known final iron (mg Fe/L)',0,12,.1,2.4,v=>{state.concentrationMgL=v;render();});
 range(ui.controls,'path','Cell path (cm)',.5,2,.1,1,v=>{state.pathCm=v;render();});
 range(ui.controls,'wavelength','Wavelength (nm)',450,600,5,510,v=>{state.wavelengthNm=v;render();});
 range(ui.controls,'stray','Stray-light fraction',0,.02,.001,0,v=>{state.strayFraction=v;render();},v=>v.toFixed(3));
 toggle(ui.controls,'recalibrate','Recalibrate for cell and wavelength',true,v=>{state.recalibrate=v;render();});
 action(ui.controls,'reset','Reset',()=>{
 Object.assign(state,{concentrationMgL:2.4,pathCm:1,wavelengthNm:510,strayFraction:0,recalibrate:true});
 const initial:Record<string,string>={concentration:'2.4',path:'1',wavelength:'510',stray:'0'};
 for(const input of Array.from(ui.controls.querySelectorAll('input'))){if(input.type==='checkbox')input.checked=true;else input.value=initial[input.dataset.param||''];input.dispatchEvent(new Event('input'));input.dispatchEvent(new Event('change'));}render();
 });
 action(ui.controls,'export','Export CSV',()=>downloadCSV('uv-visible-demo.csv',[...latest.standards,{record_type:'unknown',concentration_mg_l:state.concentrationMgL,absorbance:latest.sampleAbsorbance,...state,candidate_mg_l:latest.candidateMgL,passes_exercise_checks:latest.reportable,reported_mg_l:latest.reportedMgL}]));
 function render(){
 latest=calculate(state);
 const ymax=Math.max(1,...latest.curve.map(p=>p.absorbance),latest.fit.a+12*latest.fit.b)*1.05;
 plot(response,{xLabel:'Final iron (mg Fe/L)',yLabel:'Absorbance',xDomain:[0,12],yDomain:[0,ymax],series:[{label:'Sample response',color:colors.orange,points:latest.curve.map(p=>[p.concentration_mg_l,p.absorbance])},{label:'Applied calibration',dash:true,points:[[0,latest.fit.a],[12,latest.fit.a+12*latest.fit.b]]},{label:'Prepared standards',type:'points',points:latest.standards.map(p=>[p.concentration_mg_l,p.absorbance])},{label:'Known sample',type:'points',color:colors.purple,points:[[state.concentrationMgL,latest.sampleAbsorbance]]}],vertical:[{x:4,label:'Highest standard'}]});
 const lim=Math.max(.006,latest.maxResidual*1.3);
 plot(residual,{xLabel:'Prepared standard (mg Fe/L)',yLabel:'Residual absorbance',xDomain:[0,4],yDomain:[-lim,lim],series:[{label:'Observed minus fitted',type:'points',color:colors.orange,points:latest.residuals.map(p=>[p.concentration_mg_l,p.residual_absorbance])}],horizontal:[{y:0,label:'Zero'}]});
 ui.readout.replaceChildren();
 htmlEl('p','',`Ideal A ${fmt(latest.idealAbsorbance,4)}; observed A ${fmt(latest.sampleAbsorbance,4)}; transmission ${fmt(latest.transmittedFraction*100,2)}%.`,ui.readout);
 htmlEl('p','',`Candidate ${fmt(latest.candidateMgL)} mg Fe/L final. Maximum standard residual ${fmt(latest.maxResidual,5)}.`,ui.readout);
 const reasons=[!latest.conditionsMatch?'calibration conditions differ':'',!latest.linearCheckPass?'residual exceeds exercise 0.005 check':'',!latest.inRange?'outside 0–4 mg Fe/L':''].filter(Boolean);
 htmlEl('strong','',reasons.length?`Withhold: ${reasons.join('; ')}.`:'Passes stated checks; full method validation is not established.',ui.readout);
 ui.note.textContent='Illustrative noise-free model: A = k(λ)lc with a Gaussian sensitivity envelope; stray light gives T = (10⁻ᴬ+s)/(1+s). No uncertainty, scattering, recovery or selectivity evidence is simulated. Residual threshold is supplied for this exercise.';
 }
 render();onResize(host,render);
});
