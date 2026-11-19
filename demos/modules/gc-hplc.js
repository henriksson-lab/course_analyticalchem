/* A ratio compensates only for effects shared by analyte and internal standard. */
(function () {
  'use strict';
  function injectionModel(options = {}) {
    const injectionFactor = options.injectionFactor === undefined ? 0.8 : Number(options.injectionFactor);
    const recovery = options.recovery === undefined ? 1 : Number(options.recovery);
    const timing = options.timing === undefined ? 'after' : options.timing;
    const analyteResponse = options.analyteResponse === undefined ? 1 : Number(options.analyteResponse);
    const coelutionArea = options.coelutionArea === undefined ? 0 : Number(options.coelutionArea);
    if (!(injectionFactor > 0) || !(recovery > 0 && recovery <= 1) || !(analyteResponse > 0) || !(coelutionArea >= 0) || !['before', 'after'].includes(timing)) {
      throw new RangeError('Positive injection/response, recovery in (0,1], and known addition timing are required.');
    }
    const intendedFinalMgL = 15, dilutionFactor = 10;
    const standardRecovery = timing === 'before' ? recovery : 1;
    const caffeineArea = 3 + injectionFactor * (50 * intendedFinalMgL * recovery * analyteResponse + coelutionArea);
    const standardArea = 500 * injectionFactor * standardRecovery;
    const ratio = caffeineArea / standardArea;
    const externalFinalMgL = (caffeineArea - 3) / 50;
    const ratioFinalMgL = (ratio - 0.006) / 0.100;
    const inRange = ratioFinalMgL >= 0 && ratioFinalMgL <= 40;
    const compensationValid = analyteResponse === 1 && (recovery === 1 || timing === 'before');
    const reportable = inRange && coelutionArea === 0 && compensationValid;
    return {injectionFactor, recovery, timing, analyteResponse, coelutionArea,
      intendedFinalMgL, dilutionFactor, caffeineArea, standardArea, ratio,
      externalFinalMgL, ratioFinalMgL, externalOriginalMgL: externalFinalMgL * dilutionFactor,
      ratioOriginalMgL: ratioFinalMgL * dilutionFactor, truthOriginalMgL: intendedFinalMgL * dilutionFactor,
      inRange, compensationValid, reportable, reportedOriginalMgL: reportable ? ratioFinalMgL * dilutionFactor : null};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {injectionModel};
  if (typeof document === 'undefined') return;
  const D = window.ChemDemo;
  D.init({title: 'What can an internal standard actually cancel?',
    intro: 'Make repeated injections smaller or larger, then add effects that the analyte and internal standard do not share. Compare external-area and area-ratio estimates against known simulation truth.',
    predict: 'First change only injection size. Then lower extraction recovery with the internal standard added after extraction. Which error should a ratio remove, and which should remain?',
    controls: `<label for="injection-factor">Injection amount multiplier<input id="injection-factor" type="range" min="0.5" max="1.5" step="0.05" value="0.8"><output id="injection-value"></output></label>
      <label for="extraction-recovery">Native analyte extraction recovery<input id="extraction-recovery" type="range" min="0.4" max="1" step="0.05" value="1"><output id="recovery-value"></output></label>
      <label for="standard-timing">Internal-standard addition<select id="standard-timing"><option value="after">After extraction</option><option value="before">Before extraction: equal recovery assumed</option></select></label>
      <label for="analyte-response">Analyte-only matrix response multiplier<input id="analyte-response" type="range" min="0.5" max="1.5" step="0.05" value="1"><output id="response-value"></output></label>
      <label for="coelution-area">Known coeluting contribution at unit injection (area units)<input id="coelution-area" type="range" min="0" max="250" step="10" value="0"><output id="coelution-value"></output></label>`,
    body: `<div id="injection-chart"></div><div id="injection-readout" class="readout" aria-live="polite"></div><p id="injection-interpretation"></p>
      <p><strong>Fixed model:</strong> intended final caffeine is 15 mg/L; original-to-final factor is 10. Internal standard is added at an intended 10 mg/L. The plot varies only injection amount while holding the other selected conditions fixed.</p>`,
    notes: '<p>All areas are simulated. External standards obey area = 3 + 50c; matched ratio calibration is R = 0.006 + 0.100c. The constant analyte-area offset does not scale with injection, so ratios nearly rather than perfectly cancel injection changes. Early internal standard is assumed to have exactly the same extraction recovery as native analyte; this equivalence must be tested in real methods. An analyte-only matrix effect leaves the standard unchanged. Known coelution or selected differential response/untracked recovery makes the simple original-concentration interpretation invalid and the reportable output is withheld.</p>'});
  let result, sweep;
  function settings() {
    return {injectionFactor: Number(D.byId('injection-factor').value),
      recovery: Number(D.byId('extraction-recovery').value), timing: D.byId('standard-timing').value,
      analyteResponse: Number(D.byId('analyte-response').value), coelutionArea: Number(D.byId('coelution-area').value)};
  }
  function render() {
    const values = settings(); result = injectionModel(values);
    D.byId('injection-value').textContent = `${D.fmt(result.injectionFactor, 2)}×`;
    D.byId('recovery-value').textContent = `${D.fmt(100 * result.recovery, 0)}%`;
    D.byId('response-value').textContent = `${D.fmt(result.analyteResponse, 2)}×`;
    D.byId('coelution-value').textContent = `${D.fmt(result.coelutionArea, 0)} area units`;
    sweep = Array.from({length: 51}, (_, i) => injectionModel({...values, injectionFactor: 0.5 + i * 0.02}));
    const maxY = Math.max(170, ...sweep.flatMap(r => [r.externalOriginalMgL, r.ratioOriginalMgL]));
    D.plot('injection-chart', {xLabel: 'Injection amount multiplier', yLabel: 'Candidate original caffeine (mg/L)',
      xDomain: [0.5, 1.5], yDomain: [0, maxY * 1.1],
      series: [
        {label: 'External-area estimate', color: D.colors.orange, points: sweep.map(r => [r.injectionFactor, r.externalOriginalMgL]), type: 'line'},
        {label: 'Area-ratio estimate', color: D.colors.teal, points: sweep.map(r => [r.injectionFactor, r.ratioOriginalMgL]), type: 'line'},
        {label: 'Selected injection: external', color: D.colors.orange, points: [[result.injectionFactor, result.externalOriginalMgL]], type: 'points'},
        {label: 'Selected injection: ratio', color: D.colors.teal, points: [[result.injectionFactor, result.ratioOriginalMgL]], type: 'points'}],
      horizontal: [{y: 150, label: 'Known original model truth', color: D.colors.gray}],
      description: 'External and internal-standard ratio estimates across injection multipliers. The intended original concentration is fixed at 150 mg/L.'});
    D.byId('injection-readout').innerHTML = `<dl><dt>Selected caffeine / internal-standard areas</dt><dd>${D.fmt(result.caffeineArea, 2)} / ${D.fmt(result.standardArea, 2)}</dd>
      <dt>Selected area ratio</dt><dd>${D.fmt(result.ratio, 5)}</dd>
      <dt>External candidate, original basis</dt><dd>${D.fmt(result.externalOriginalMgL, 2)} mg/L</dd>
      <dt>Ratio candidate, original basis</dt><dd><strong>${D.fmt(result.ratioOriginalMgL, 2)} mg/L</strong></dd>
      <dt>Reporting decision</dt><dd>${result.reportable ? 'Candidate eligible under the stated model; investigate any unvalidated recovery or matrix assumptions.' : 'Withhold the simple caffeine result: ' + (!result.inRange ? 'outside the calibration range.' : result.coelutionArea > 0 ? 'known coelution contributes to the area.' : 'a selected loss or differential response is not compensated by this ratio model.')}</dd></dl>`;
    const explanations = [];
    if (result.coelutionArea > 0) explanations.push('A ratio cannot separate the coeluting contribution from caffeine.');
    if (result.analyteResponse !== 1) explanations.push('The matrix changes analyte response without changing the internal standard, so the effect does not cancel.');
    if (result.recovery < 1) explanations.push(result.timing === 'after'
      ? 'The standard was added after extraction: it did not experience the earlier analyte loss.'
      : 'The early standard shares recovery exactly in this ideal model; real equivalence needs evidence.');
    if (explanations.length === 0) explanations.push('The ratio mostly cancels this shared injection effect.');
    if (Math.abs(result.ratioOriginalMgL - result.truthOriginalMgL) > 0.001 && result.compensationValid && result.coelutionArea === 0) explanations.push('The small remaining ratio bias comes from the constant analyte-area offset, which does not scale with injection or recovery.');
    D.byId('injection-interpretation').textContent = explanations.join(' ');
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('internal-standard-experiment.csv', sweep.map(r => ({
    injection_multiplier: r.injectionFactor, native_recovery_fraction: r.recovery,
    internal_standard_added: r.timing, analyte_response_multiplier: r.analyteResponse,
    coelution_area_at_unit_injection: r.coelutionArea, caffeine_area: r.caffeineArea,
    internal_standard_area: r.standardArea, area_ratio: r.ratio,
    candidate_external_original_mg_l: r.externalOriginalMgL, candidate_ratio_original_mg_l: r.ratioOriginalMgL,
    compensation_model_matches_selected_effects: r.compensationValid, eligible_under_stated_model: r.reportable, reported_original_mg_l: r.reportedOriginalMgL,
    simulation_truth_original_mg_l: r.truthOriginalMgL}))));
}());
