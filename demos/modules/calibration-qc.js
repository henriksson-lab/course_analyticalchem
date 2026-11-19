(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  function calibrationModel({maxStandard = 4, curvature = 0, noise = 0.003, originalConcentration = 5, dilutionFactor = 2,
      driftPercent = 0, review = 'pending', seed = 31} = {}) {
    if (!([maxStandard, curvature, noise, originalConcentration, dilutionFactor, driftPercent].every(Number.isFinite) && maxStandard > 0 && maxStandard <= 8 && curvature >= 0 && curvature <= 0.015 && noise >= 0 && originalConcentration >= 0 && dilutionFactor >= 1)) throw new RangeError('Invalid calibration controls.');
    const rng = D.rng(seed), baseResponse = c => 0.01 + 0.2 * c / (1 + curvature * c);
    const xs = [], ys = [], rows = [];
    for (let level = 0; level <= 5; level++) for (let rep = 1; rep <= 3; rep++) {
      const c = maxStandard * level / 5, y = baseResponse(c) + noise * D.normal(rng);
      xs.push(c); ys.push(y); rows.push({role: 'standard', id: `S${level}-${rep}`, known_final_mg_l: c, response: y, dilution_factor: 1});
    }
    const fit = D.linearFit(xs, ys), finalTrue = originalConcentration / dilutionFactor;
    const laterResponse = c => 0.01 + (baseResponse(c) - 0.01) * (1 + driftPercent / 100);
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
  function mount() {
    D.init({title: 'When should a calibration stop you reporting?',
      intro: 'Fit a straight line, inspect its residuals, then challenge it with an unknown and an independent check measured later. All responses are simulated.',
      predict: 'Can a high R² coexist with a wrong sample estimate? Increase the saturation coefficient, then compare the fitted line and residual plot before deciding whether to accept the model.',
      controls: `<label for="max-standard">Largest standard concentration (mg/L final)<input id="max-standard" type="range" min="1" max="8" step="0.5" value="4"><output id="max-standard-value" for="max-standard"></output></label>
        <label for="curvature">Saturation coefficient q (L/mg)<input id="curvature" type="range" min="0" max="0.015" step="0.001" value="0"><output id="curvature-value" for="curvature"></output></label>
        <label for="noise">Independent response noise SD (response units)<input id="noise" type="range" min="0" max="0.03" step="0.001" value="0.003"><output id="noise-value" for="noise"></output></label>
        <label for="original">Original unknown concentration (mg/L; known in this simulation)<input id="original" type="range" min="0" max="20" step="0.5" value="5"><output id="original-value" for="original"></output></label>
        <label for="dilution">Unknown dilution factor<input id="dilution" type="range" min="1" max="10" step="0.5" value="2"><output id="dilution-value" for="dilution"></output></label>
        <label for="drift">Sensitivity change after calibration (%)<input id="drift" type="range" min="-20" max="20" step="1" value="0"><output id="drift-value" for="drift"></output></label>
        <label for="review">Your residual review<select id="review"><option value="pending">Not yet assessed</option><option value="accepted">Accept the straight line under this model</option><option value="rejected">Systematic pattern needs investigation</option></select></label>
        <label for="run">Simulation run<input id="run" type="range" min="1" max="100" step="1" value="31"><output id="run-value" for="run"></output></label>`,
      body: `<div id="calibration-chart"></div><div id="residual-chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>
        <details><summary>Try three different failures</summary><ol><li>Keep the response linear but make the unknown exceed range. Then create a new measurement by increasing its dilution factor.</li><li>Restore range and change later sensitivity. Does an old good calibration catch its own drift?</li><li>Restore drift, increase the saturation coefficient, and narrow the range. Explain why selecting a range requires evidence rather than deleting inconvenient standards.</li></ol></details>`,
      notes: 'Toy monotonic response model y = 0.010 + 0.200c / (1 + q c), with c in mg/L and q in L/mg, plus independent normal response noise. At q = 0 it is linear; positive q makes sensitivity decrease with concentration without the response folding backwards. Standards have three independent preparations at six known levels; unknown and independent check have three later readings with an optional sensitivity change. Standard concentrations are exact here; no preparation, matrix or full inverse uncertainty budget is supplied. The independent check is at half the largest standard and its 95–105% rule is supplied only for this exercise. Passing it cannot prove linearity or matrix compatibility. Residual acceptance is a user judgment, not an automated validation. Positive q activates a deliberately saturating nonlinear generating model; any accepted straight-line result remains conditional. Export and reproduce lm(response ~ known_final_mg_l) in R using standard rows only.'});
    let current;
    function render() {
      current = calibrationModel({maxStandard: +D.byId('max-standard').value, curvature: +D.byId('curvature').value,
        noise: +D.byId('noise').value, originalConcentration: +D.byId('original').value, dilutionFactor: +D.byId('dilution').value,
        driftPercent: +D.byId('drift').value, review: D.byId('review').value, seed: +D.byId('run').value});
      for (const [id, value, digits] of [['max-standard', current.maxStandard, 1], ['curvature', current.curvature, 3], ['noise', current.noise, 3], ['original', current.originalConcentration, 1], ['dilution', current.dilutionFactor, 1], ['drift', current.driftPercent, 0], ['run', current.seed, 0]]) D.byId(`${id}-value`).textContent = D.fmt(value, digits);
      const fit = current.fit, extent = Math.max(current.maxStandard, current.finalTrue, 1);
      const allY = [...current.ys, ...current.readings, 0];
      D.plot('calibration-chart', {xLabel: 'Known concentration in final solution (mg/L)', yLabel: 'Instrument response (arbitrary units)', xDomain: [0, extent * 1.05],
        yDomain: [Math.min(0, ...allY) - 0.02, Math.max(0.1, ...allY) * 1.08],
        series: [{label: 'Prepared calibration standards', color: D.colors.teal, points: current.xs.map((x, i) => [x, current.ys[i]]), type: 'points'},
          {label: 'Fitted line within standard range', color: D.colors.blue, points: [[0, fit.a], [current.maxStandard, fit.a + fit.b * current.maxStandard]], type: 'line'},
          {label: 'Later unknown at known simulation concentration', color: D.colors.orange, points: [[current.finalTrue, current.meanResponse]], type: 'points'}],
        description: 'Standards fit a line over their own range. The simulation places the unknown at its known generating concentration; in an actual unknown this x position is not known.'});
      const residualMax = Math.max(0.005, ...fit.residuals.map(Math.abs)) * 1.15;
      D.plot('residual-chart', {xLabel: 'Calibration concentration (mg/L)', yLabel: 'Observed minus fitted response', xDomain: [0, current.maxStandard], yDomain: [-residualMax, residualMax],
        series: [{label: 'Calibration residuals', color: D.colors.teal, points: current.xs.map((x, i) => [x, fit.residuals[i]]), type: 'points'}],
        horizontal: [{y: 0, label: 'Zero residual', color: D.colors.gray}],
        description: 'Residual patterns reveal straight-line model failure even when R squared is high. A residual review must accompany range and independent QC checks.'});
      const status = current.reportable ? 'Conditional estimate under your selected model review' : 'Withhold the sample result';
      D.byId('readout').innerHTML = `<p><strong>${status}</strong>.</p><p>Fit: a = ${D.fmt(fit.a, 4)}, b = ${D.fmt(fit.b, 4)}; R² = ${D.fmt(fit.r2, 5)}. Candidate original concentration: ${D.fmt(current.candidateOriginal, 3)} mg/L. This candidate is not automatically reportable.</p><p>Range: ${current.inRange ? 'passes' : 'fails'}. Independent QC recovery: ${D.fmt(current.qcRecovery, 1)}% (${current.qcPass ? 'passes' : 'fails'}). ${current.reportable ? 'Reported conditional value: ' + D.fmt(current.candidateOriginal, 3) + ' mg/L.' : current.reasons.join('; ') + '.'}</p>`;
      D.byId('interpretation').textContent = `${current.curvature > 0 ? 'A deliberately saturating, monotonic generating model is active. Examine systematic residual patterns: accepting a line does not make it chemically valid, even if R² and QC look satisfactory. ' : 'With the linear generating model, remaining residuals reflect the supplied random response noise. '}The true original value is ${D.fmt(current.originalConcentration, 2)} mg/L only because this is a simulation. A new dilution creates a new simulated reading; editing a factor on an old reading would not. The displayed point estimate has no complete measurement-uncertainty statement.`;
    }
    D.bind(render);
    D.byId('export').addEventListener('click', () => D.csv('calibration-range-and-qc.csv', current.rows));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {calibrationModel};
  if (typeof document !== 'undefined') mount();
})();
