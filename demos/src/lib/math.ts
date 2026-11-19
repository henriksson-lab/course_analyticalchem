/** Numerical helpers retained from the reviewed chemistry models. No DOM state. */
import { rng as quantbioRng } from './ui';
export const mean = (xs: number[]): number => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : NaN;
export const sd = (xs: number[]): number => {const m=mean(xs);return xs.length>1?Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1)):NaN;};
export const rng = (seed: number): (()=>number) => quantbioRng(seed).unif;
export const normal = (random: ()=>number): number => Math.sqrt(-2*Math.log(Math.max(Number.MIN_VALUE,random())))*Math.cos(2*Math.PI*random());
export function linearFit(xs: number[],ys: number[]) {
 if(xs.length!==ys.length||xs.length<2||!xs.concat(ys).every(Number.isFinite))throw new Error('A line needs finite paired values.');
 const n=xs.length,xMean=mean(xs),yMean=mean(ys),Sxx=xs.reduce((v,x)=>v+(x-xMean)**2,0);
 if(!(Sxx>0))throw new Error('Calibration concentrations must vary.');
 const b=xs.reduce((v,x,i)=>v+(x-xMean)*(ys[i]-yMean),0)/Sxx,a=yMean-b*xMean;
 const residuals=xs.map((x,i)=>ys[i]-a-b*x),sse=residuals.reduce((v,e)=>v+e*e,0),syy=ys.reduce((v,y)=>v+(y-yMean)**2,0);
 return {a,b,n,xMean,Sxx,s:n>2?Math.sqrt(sse/(n-2)):NaN,residuals,r2:syy>0?1-sse/syy:NaN};
}

export const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
export const fmt=(x:number,d=3)=>!Number.isFinite(x)?'not available':x!==0&&(Math.abs(x)<10**(-d)||Math.abs(x)>=1e6)?x.toExponential(Math.max(1,d-1)):Number(x.toFixed(d)).toString();
