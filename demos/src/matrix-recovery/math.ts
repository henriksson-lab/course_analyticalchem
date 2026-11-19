/** Reviewed chemistry model, independent of DOM state. */
import {linearFit} from '../lib/math';
export interface MatrixOptions {originalMgL?:number;sensitivityRatio?:number;recoveryFraction?:number;additiveSignal?:number;correctBackground?:boolean;}
export function calculate({ originalMgL = 5, sensitivityRatio = .75, recoveryFraction = 1, additiveSignal = 0, correctBackground = false }:MatrixOptions = {}) {
  const sampleMl = 10; const finalMl = 25; const fraction = sampleMl / finalMl;
  const sensitivity = .2 * sensitivityRatio;
  const nativeFinal = originalMgL * recoveryFraction * fraction;
  const points = [0, .5, 1, 1.5, 2].map(added => {
    const raw = sensitivity * (nativeFinal + added) + additiveSignal;
    return { added_mg_l_final: added, raw_signal: raw,
      fitted_signal: raw - (correctBackground ? additiveSignal : 0), sample_ml: sampleMl, final_ml: finalMl,
      original_truth_mg_l: originalMgL, recovered_fraction: recoveryFraction, sensitivity_ratio: sensitivityRatio,
      additive_signal: additiveSignal, independent_background_correction: correctBackground };
  });
  const fit = linearFit(points.map(r => r.added_mg_l_final), points.map(r => r.fitted_signal));
  const xIntercept = -fit.a / fit.b;
  const standardAdditionMgL = -xIntercept / fraction;
  const externalMgL = points[0].fitted_signal / .2 / fraction;
  const spikeRecoveryPercent = 100 * (points[2].fitted_signal - points[0].fitted_signal) / (.2 * 1);
  return { points, fit, xIntercept, standardAdditionMgL, externalMgL, spikeRecoveryPercent, nativeFinal,
    expectedRecoveredOriginal: originalMgL * recoveryFraction,
    saBiasMgL: standardAdditionMgL - originalMgL,
    saBiasPercent: originalMgL === 0 ? null : 100 * (standardAdditionMgL / originalMgL - 1) };
}
