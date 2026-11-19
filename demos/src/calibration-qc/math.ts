/** Reviewed analytical model. Pure calculations; units and assumptions are defined in the exercise. */
import * as D from "../lib/math";
export interface CalibrationOptions { maxStandard?: number; curvature?: number; noise?: number; originalConcentration?: number; dilutionFactor?: number; driftPercent?: number; review?: string; seed?: number; }
export interface CalibrationRow { role: string; id: string; known_final_mg_l: number; response: number; dilution_factor: number; run?: number; saturation_coefficient_l_mg?: number; later_drift_percent?: number; straight_line_review?: string; sample_reportable_under_selected_review?: boolean; }

  export function calibrationModel({maxStandard = 4, curvature = 0, noise = 0.003, originalConcentration = 5, dilutionFactor = 2,
      driftPercent = 0, review = 'pending', seed = 31}: CalibrationOptions = {}) {
    if (!([maxStandard, curvature, noise, originalConcentration, dilutionFactor, driftPercent].every(Number.isFinite) && maxStandard > 0 && maxStandard <= 8 && curvature >= 0 && curvature <= 0.015 && noise >= 0 && originalConcentration >= 0 && dilutionFactor >= 1)) throw new RangeError('Invalid calibration controls.');
    const rng = D.rng(seed), baseResponse = (c: number) => 0.01 + 0.2 * c / (1 + curvature * c);
    const xs: number[] = [], ys: number[] = [], rows: CalibrationRow[] = [];
    for (let level = 0; level <= 5; level++) for (let rep = 1; rep <= 3; rep++) {
      const c = maxStandard * level / 5, y = baseResponse(c) + noise * D.normal(rng);
      xs.push(c); ys.push(y); rows.push({role: 'standard', id: `S${level}-${rep}`, known_final_mg_l: c, response: y, dilution_factor: 1});
    }
    const fit = D.linearFit(xs, ys), finalTrue = originalConcentration / dilutionFactor;
    const laterResponse = (c: number) => 0.01 + (baseResponse(c) - 0.01) * (1 + driftPercent / 100);
    const readings = Array.from({length: 3}, (_, i) => {const y = laterResponse(finalTrue) + noise * D.normal(rng);
      rows.push({role: 'unknown', id: `U${i + 1}`, known_final_mg_l: finalTrue, response: y, dilution_factor: dilutionFactor}); return y;});
    const qcTrue = maxStandard / 2;
    const qcReadings = Array.from({length: 3}, (_, i) => {const y = laterResponse(qcTrue) + noise * D.normal(rng);
      rows.push({role: 'independent_check', id: `QC${i + 1}`, known_final_mg_l: qcTrue, response: y, dilution_factor: 1}); return y;});
    const meanResponse = D.mean(readings), candidateFinal = (meanResponse - fit.a) / fit.b;
    const qcEstimated = (D.mean(qcReadings) - fit.a) / fit.b, qcRecovery = 100 * qcEstimated / qcTrue;
    const limits = [fit.a, fit.a + fit.b * maxStandard];
    const positiveSlope = fit.b > 0;
    const inRange = positiveSlope && readings.every(y => y >= limits[0] && y <= limits[1]);
    const qcPass = positiveSlope && qcRecovery >= 95 && qcRecovery <= 105;
    const modelAccepted = review === 'accepted';
    const reportable = positiveSlope && inRange && qcPass && modelAccepted;
    const reasons = [];
    if (!positiveSlope) reasons.push('nonpositive calibration slope');
    if (!inRange) reasons.push('sample outside the calibrated response range');
    if (!qcPass) reasons.push('independent QC fails the exercise 95–105% rule');
    if (!modelAccepted) reasons.push(review === 'rejected' ? 'residual review rejects the straight line' : 'residual review is pending');
    rows.forEach(r => {r.run = seed; r.saturation_coefficient_l_mg = curvature; r.later_drift_percent = r.role === 'standard' ? 0 : driftPercent;
      r.straight_line_review = review; r.sample_reportable_under_selected_review = reportable;});
    return {maxStandard, curvature, noise, originalConcentration, dilutionFactor, driftPercent, review, seed,
      xs, ys, fit, finalTrue, readings, meanResponse, candidateFinal, candidateOriginal: candidateFinal * dilutionFactor,
      qcTrue, qcEstimated, qcRecovery, qcPass, inRange, modelAccepted, reportable, reasons, rows};
  }
