(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  const A = -97.42; const B = -59.16;
  function calculate({ logC = -3.7, activityRatio = 1, driftMv = 0, matched = false } = {}) {
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
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculate, interceptMv: A, slopeMvPerDecade: B };
  if (typeof document === 'undefined') return;
  D.init({ title: 'Electrodes: a good check can miss a matrix mismatch',
    intro: 'A fluoride electrode responds to activity. Explore a sample whose activity relationship differs from its standards, and compare that error with a shared potential drift detected by an independent check.',
    predict: 'Can the independent check pass while the sample concentration is biased? Change the activity-coefficient ratio before introducing any drift.',
    controls: `<label for="logc">True sample log₁₀[c / (1 mol/L)] <output id="logc-value"></output><input id="logc" type="range" min="-5" max="-3" step="0.02" value="-3.7"></label>
      <label for="activity">Sample / standard activity-coefficient ratio <output id="activity-value"></output><input id="activity" type="range" min="0.2" max="1.5" step="0.02" value="1"></label>
      <label for="drift">Shared potential drift (mV) <output id="drift-value"></output><input id="drift" type="range" min="-10" max="10" step="0.2" value="0"></label>
      <label for="matched"><input id="matched" type="checkbox"> Apply ideal matched ionic-strength treatment (ratio becomes 1)</label>`,
    body: '<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>',
    notes: 'Illustrative fluoride ISE at 25 °C with signed slope −59.16 mV per decade and a fixed cell intercept. The activity control is the ratio of sample and calibration activity coefficients; it is not an absolute activity. The matched-treatment switch idealises perfect matching. Drift is an additive cell-potential change shared by sample and an independent, matrix-matched check. Exercise check tolerance is ±2 mV. No interfering-ion selectivity model, speciation, junction model or uncertainty interval is simulated. The known true input is available only because this is a simulation.' });
  let latest;
  function render() {
    const logC = +D.byId('logc').value; const activityRatio = +D.byId('activity').value;
    const driftMv = +D.byId('drift').value; const matched = D.byId('matched').checked;
    D.byId('activity').disabled = matched;
    D.byId('logc-value').textContent = logC.toFixed(2);
    D.byId('activity-value').textContent = matched ? '1.00 (matched)' : activityRatio.toFixed(2);
    D.byId('drift-value').textContent = driftMv.toFixed(1);
    latest = calculate({ logC, activityRatio, driftMv, matched });
    const candidateLog = Math.log10(latest.candidateC);
    D.plot('chart', { xLabel: 'log₁₀[c / (1 mol/L)]', yLabel: 'Potential (mV)',
      xDomain: [Math.min(-5.1, candidateLog - .1), Math.max(-2.9, candidateLog + .1)], yDomain: [45, 255],
      series: [{ label: 'Calibration conditions', color: D.colors.teal, type: 'line', points: latest.rows.map(r => [r.log10_c_mol_l, r.calibration_mv]) },
        { label: 'Sample conditions', color: D.colors.orange, type: 'line', dash: true, points: latest.rows.map(r => [r.log10_c_mol_l, r.sample_condition_mv]) },
        { label: 'Known true sample', color: D.colors.orange, type: 'points', points: [[logC, latest.potentialMv]] },
        { label: 'Inverse estimate on old calibration', color: D.colors.purple, type: 'points', points: [[candidateLog, latest.potentialMv]] }],
      description: 'The same voltage maps to a different concentration when sample activity conditions or cell potential differ from the calibration.' });
    const decision = !latest.qcPass ? 'Withhold: independent drift check fails.' : !latest.inRange ? 'Withhold: inverse estimate is outside the calibration range.' : !latest.matrixMatched ? 'Reference and range checks pass, but withhold this known matrix-mismatched sample.' : 'Passes the stated exercise checks with matched activity conditions; full method validation is not established.';
    D.byId('readout').innerHTML = `<p><strong>Known true concentration:</strong> ${latest.trueC.toExponential(3)} mol/L · <strong>Measured potential:</strong> ${latest.potentialMv.toFixed(2)} mV</p>
      <p><strong>Candidate inverse estimate:</strong> ${latest.candidateC.toExponential(3)} mol/L · <strong>Bias:</strong> ${latest.biasPercent.toFixed(1)}%</p>
      <p><strong>Independent check error:</strong> ${driftMv.toFixed(1)} mV; tolerance ±2.0 mV. <strong>${decision}</strong></p>`;
    D.byId('interpretation').textContent = !latest.qcPass ?
      'The shared drift is visible in the check and blocks reporting. Do not simply correct all samples by the failed check error without investigating the cause.' : Math.abs(latest.gammaRatio - 1) > 1e-8 ?
        'The check shares calibration matrix conditions, so it can pass while this sample is biased. A passing independent check does not establish the sample’s activity/concentration relationship.' :
        Math.abs(driftMv) > 1e-10 ? 'The drift is small enough to pass the chosen ±2 mV check, but it still biases the inverse estimate. An acceptance window does not make a measurement exact. Voltage uncertainty and drift need to be considered in the measurement result.' : 'With matched conditions and no drift, inversion returns the known concentration. Because the fluoride response has a negative slope, decreasing potential increases the inferred concentration. A free-ion result is not automatically total fluorine.';
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('potentiometry-demo.csv', latest.rows.concat([{
    record_type: 'unknown', true_sample_mol_l: latest.trueC, potential_mv: latest.potentialMv,
    candidate_mol_l: latest.candidateC, reference_and_range_checks_pass: latest.checksPass, known_activity_conditions_match: latest.matrixMatched,
    reportable_under_stated_conditions: latest.reportable,
    reported_mol_l: latest.reportedC === null ? '' : latest.reportedC, sample_to_standard_activity_coefficient_ratio: latest.gammaRatio
  }])));
}());
