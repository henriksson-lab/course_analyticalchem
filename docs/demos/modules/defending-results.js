/* Evidence gates act on a recorded preparation, not on an edited old dilution factor. */
(function () {
  'use strict';
  const sampleTruth = {drink_A: 150, drink_B: 400, drink_C: 120};
  function assessRecord(record) {
    if (!(record.aliquotMl > 0) || !(record.finalMl > 0)) throw new RangeError('Preparation volumes must be positive.');
    const candidateFinalMgL = (record.area - 4) / 40;
    const dilutionFactor = record.finalMl / record.aliquotMl;
    const candidateOriginalMgL = candidateFinalMgL * dilutionFactor;
    const inRange = candidateFinalMgL >= 0 && candidateFinalMgL <= 30;
    const qcPass = record.qcRecovery >= 95 && record.qcRecovery <= 105;
    const reasons = [];
    if (!inRange) reasons.push('outside the 0–30 mg/L final calibration range');
    if (!qcPass) reasons.push('independent QC outside 95–105%');
    if (!record.resolved) reasons.push('known unresolved contributing peak');
    const reportable = reasons.length === 0;
    return {...record, candidateFinalMgL, dilutionFactor, candidateOriginalMgL,
      inRange, qcPass, reportable, reasons,
      reportedOriginalMgL: reportable ? candidateOriginalMgL : null,
      uOriginalMgL: reportable ? 0.15 * dilutionFactor : null};
  }
  function measurePreparation(plan = {}, sequence = 1) {
    const sample = plan.sample || 'drink_B';
    const aliquotMl = plan.aliquotMl === undefined ? 5 : Number(plan.aliquotMl);
    const finalMl = 50;
    const qcOK = plan.qcOK !== false, resolved = plan.resolved !== false;
    if (!(sample in sampleTruth) || !(aliquotMl > 0 && aliquotMl <= finalMl)) throw new RangeError('Choose a supplied sample and a positive aliquot within the final volume.');
    const trueOriginalMgL = sampleTruth[sample];
    const instrumentFactor = qcOK ? 1 : 0.85;
    const trueFinalMgL = trueOriginalMgL * aliquotMl / finalMl;
    const interferenceArea = resolved ? 0 : 80;
    const area = 4 + instrumentFactor * (40 * trueFinalMgL + interferenceArea);
    return assessRecord({preparation: sequence, sample, aliquotMl, finalMl, area,
      resolved, qcRecovery: 100 * instrumentFactor, trueOriginalMgL,
      uFinalConcentrationMgL: 0.15});
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {assessRecord, measurePreparation};
  if (typeof document === 'undefined') return;
  const D = window.ChemDemo;
  D.init({title: 'A plausible number is not always a reportable result',
    intro: 'Plan a new preparation, take a simulated measurement, and defend the reporting decision. Changing a planned aliquot does not rewrite a previously recorded signal.',
    predict: 'Drink B first exceeds the calibration range. Choose a smaller aliquot: should the old reading become valid immediately, or must you obtain a new measurement? Then test a failed QC or unresolved peak.',
    controls: `<label for="planned-sample">Sample for next preparation<select id="planned-sample"><option value="drink_B">Drink B</option><option value="drink_A">Drink A</option><option value="drink_C">Drink C</option></select></label>
      <label for="planned-aliquot">Aliquot for next preparation (mL)<select id="planned-aliquot"><option value="5">5.00 mL</option><option value="2">2.00 mL</option><option value="10">10.00 mL</option></select></label>
      <label for="planned-qc">QC condition for next measurement<select id="planned-qc"><option value="pass">Independent QC passes</option><option value="fail">Independent QC fails at 85% recovery</option></select></label>
      <label for="planned-separation">Separation for next measurement<select id="planned-separation"><option value="resolved">Adequately resolved under this scenario</option><option value="overlap">Known unresolved contribution</option></select></label>
      <button id="measure-new" type="button">Measure a new preparation</button><p id="plan-status" class="help" aria-live="polite"></p>`,
    body: `<div id="decision-readout" class="readout" aria-live="polite"></div><ol id="evidence-gates"></ol>
      <div id="decision-chart"></div><div class="table-wrap"><table><caption>Recorded preparations: changing a plan does not alter these records</caption><thead><tr><th>Preparation</th><th>Sample / aliquot</th><th>Recorded area</th><th>Original result (mg/L)</th><th>Decision</th></tr></thead><tbody id="history-rows"></tbody></table></div>
      <p id="decision-interpretation"></p>`,
    notes: '<p>The fixed ideal calibration is area = 4 + 40c for final caffeine from 0 to 30 mg/L. Final volume is always 50.00 mL. The simulation assigns drink truths of 150, 400 and 120 mg/L. QC failure changes instrument response by a factor 0.85; an unresolved component contributes an additional 80 area units before that factor. Controls represent outcomes for a <em>new</em> measurement, not permission to disregard an observed failure. A separately supplied final-concentration standard uncertainty of 0.15 mg/L is scaled by dilution only; sampling, volumes, recovery and identity validation are omitted. No full method validation is claimed.</p>'});
  let history = [measurePreparation({}, 1)];
  function currentPlan() {
    return {sample: D.byId('planned-sample').value, aliquotMl: Number(D.byId('planned-aliquot').value),
      qcOK: D.byId('planned-qc').value === 'pass', resolved: D.byId('planned-separation').value === 'resolved'};
  }
  function render() {
    const current = history[history.length - 1], plan = currentPlan();
    const changed = plan.sample !== current.sample || plan.aliquotMl !== current.aliquotMl ||
      plan.qcOK !== current.qcPass || plan.resolved !== current.resolved;
    D.byId('plan-status').textContent = changed
      ? 'Plan changed. The recorded signal and decision below stay unchanged until a new preparation is measured.'
      : 'The displayed plan matches the latest record. You can still take another explicitly new measurement.';
    D.byId('decision-readout').innerHTML = `<h2>Recorded preparation ${current.preparation}</h2><dl>
      <dt>Measured area and actual preparation</dt><dd>${D.fmt(current.area, 1)} area units; ${D.fmt(current.aliquotMl, 2)} mL of ${current.sample.replace('_', ' ')} made to 50.00 mL</dd>
      <dt>Algebraic candidate, final solution</dt><dd>${D.fmt(current.candidateFinalMgL, 3)} mg/L</dd>
      <dt>Reportable original concentration</dt><dd><strong>${current.reportable ? D.fmt(current.reportedOriginalMgL, 2) + ' mg/L' : 'Withheld'}</strong></dd>
      <dt>Limited standard uncertainty</dt><dd>${current.reportable ? D.fmt(current.uOriginalMgL, 2) + ' mg/L; dilution-scaled final estimate only' : 'No uncertainty is attached to a withheld concentration'}</dd></dl>`;
    const gates = [
      [current.inRange, 'Range', `${D.fmt(current.candidateFinalMgL, 3)} mg/L final; required 0–30 mg/L`],
      [current.qcPass, 'Independent QC', `${D.fmt(current.qcRecovery, 1)}% recovery; required 95–105%`],
      [current.resolved, 'Selectivity', current.resolved ? 'Adequate separation supplied for this scenario' : 'An unresolved component contributes to the area']];
    D.byId('evidence-gates').innerHTML = gates.map(g => `<li><strong>${g[0] ? 'Pass' : 'Fail'} — ${g[1]}:</strong> ${g[2]}</li>`).join('');
    const visible = history.slice(-12);
    const maxY = Math.max(450, ...visible.map(r => r.candidateOriginalMgL));
    D.plot('decision-chart', {xLabel: 'Recorded preparation number', yLabel: 'Candidate original caffeine (mg/L)',
      xDomain: [Math.max(0, visible[0].preparation - 0.5), Math.max(2, current.preparation + 0.5)], yDomain: [0, maxY * 1.1],
      series: [
        {label: 'Reportable under stated scenario', color: D.colors.teal, points: visible.filter(r => r.reportable).map(r => [r.preparation, r.candidateOriginalMgL]), type: 'points'},
        {label: 'Withheld candidate: not a reported result', color: D.colors.orange, points: visible.filter(r => !r.reportable).map(r => [r.preparation, r.candidateOriginalMgL]), type: 'points'}],
      description: 'Preparation history. Orange points are diagnostic algebraic candidates, not reported concentrations; accepted teal points satisfy the scenario range, QC and separation evidence.'});
    D.byId('history-rows').innerHTML = visible.map(r => `<tr><td>${r.preparation}</td><td>${r.sample.replace('_', ' ')} / ${D.fmt(r.aliquotMl, 2)} mL</td><td>${D.fmt(r.area, 1)}</td><td>${r.reportable ? D.fmt(r.reportedOriginalMgL, 2) : 'Withheld'}</td><td>${r.reportable ? 'Conditional result' : r.reasons.join('; ')}</td></tr>`).join('');
    D.byId('decision-interpretation').textContent = current.reportable
      ? 'This new preparation satisfies the supplied evidence gates. Its result remains conditional on the stated identity, preparation and uncertainty assumptions; it does not make an earlier out-of-range or failed measurement valid.'
      : 'Withhold the reported concentration because of ' + current.reasons.join(' and ') + '. Changing an input plan does not supply new evidence for the recorded signal.';
  }
  D.byId('measure-new').addEventListener('click', () => {
    history.push(measurePreparation(currentPlan(), history.length + 1)); render();
  });
  D.byId('controls').addEventListener('reset', () => {history = [measurePreparation({}, 1)];});
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('reporting-decisions.csv', history.map(r => ({
    preparation_id: 'P' + r.preparation, sample_id: r.sample, aliquot_ml: r.aliquotMl, final_ml: r.finalMl,
    recorded_area: r.area, qc_recovery_percent: r.qcRecovery, resolved: r.resolved,
    candidate_final_mg_l: r.candidateFinalMgL, dilution_factor: r.dilutionFactor,
    candidate_original_mg_l: r.candidateOriginalMgL, reportable: r.reportable,
    reported_original_mg_l: r.reportedOriginalMgL, limited_standard_uncertainty_mg_l: r.uOriginalMgL,
    withheld_reason: r.reasons.join('; '), simulation_truth_original_mg_l: r.trueOriginalMgL}))));
}());
