/** Reviewed chemistry model, independent of DOM state. */
export interface ElectrodeOptions {logC?:number;activityRatio?:number;driftMv?:number;matched?:boolean;}
export const interceptMv = -97.42; export const slopeMvPerDecade = -59.16;
const A=interceptMv, B=slopeMvPerDecade;
export function calculate({ logC = -3.7, activityRatio = 1, driftMv = 0, matched = false }:ElectrodeOptions = {}) {
  const trueC = 10 ** logC;
  const gammaRatio = matched ? 1 : activityRatio;
  const potentialMv = A + B * Math.log10(trueC * gammaRatio) + driftMv;
  const candidateC = 10 ** ((potentialMv - A) / B);
  const qcPass = Math.abs(driftMv) <= 2;
  const inRange = candidateC >= 1e-5 && candidateC <= 1e-3;
  const checksPass = qcPass && inRange;
  const matrixMatched = Math.abs(gammaRatio - 1) < 1e-10;
  const reportable = checksPass && matrixMatched;
  const rows = Array.from({ length: 41 }, (_, i) => {
    const lc = -5 + i / 20;
    return { log10_c_mol_l: lc, fluoride_mol_l: 10 ** lc,
      calibration_mv: A + B * lc, sample_condition_mv: A + B * Math.log10(10 ** lc * gammaRatio) + driftMv,
      sample_to_standard_activity_coefficient_ratio: gammaRatio, drift_mv: driftMv };
  });
  return { trueC, gammaRatio, potentialMv, candidateC, qcPass, inRange, checksPass, matrixMatched, reportable,
    reportedC: reportable ? candidateC : null, biasPercent: 100 * (candidateC / trueC - 1), rows };
}
