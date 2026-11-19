/* Idealised line-overlap experiment; no reference line assignments or real validation. */
(function () {
  'use strict';
  function atomicModel(options = {}) {
    const distance = options.distance === undefined ? 0.012 : Number(options.distance);
    const interferenceHeight = options.interferenceHeight === undefined ? 300 : Number(options.interferenceHeight);
    const blank = options.blank === undefined ? 0.010 : Number(options.blank);
    const dilution = 2;
    const nativeDigest = 0.800;
    const isolated = Boolean(options.isolated);
    const subtractBlank = options.subtractBlank !== false;
    if (!(distance > 0) || !(interferenceHeight >= 0) || !(blank >= 0)) throw new RangeError('Positive distance and nonnegative signals are required.');
    const peakSigma = 0.006;
    const concentrationMeasured = (nativeDigest + blank) / dilution;
    const targetHeight = 1000 * concentrationMeasured;
    const overlapAtTarget = isolated ? 0 : interferenceHeight * Math.exp(-0.5 * (distance / peakSigma) ** 2);
    const countsAtTarget = 8 + targetHeight + overlapAtTarget;
    const apparentMeasured = (countsAtTarget - 8) / 1000;
    const apparentDigest = apparentMeasured * dilution - (subtractBlank ? blank : 0);
    const apparentMgKg = apparentDigest * 0.050 / 0.000250;
    const truthMgKg = nativeDigest * 0.050 / 0.000250;
    const rows = [];
    for (let i = 0; i <= 200; i += 1) {
      const offset = -0.05 + i * 0.0005;
      const target = targetHeight * Math.exp(-0.5 * (offset / peakSigma) ** 2);
      const interfering = isolated ? 0 : interferenceHeight * Math.exp(-0.5 * ((offset - distance) / peakSigma) ** 2);
      rows.push({offset_nm: offset, target_plus_background_counts: 8 + target,
        interfering_counts: interfering, total_counts: 8 + target + interfering});
    }
    return {distance, interferenceHeight, blank, isolated, subtractBlank, dilution,
      nativeDigest, concentrationMeasured, countsAtTarget, overlapAtTarget, apparentMeasured,
      apparentDigest, apparentMgKg, truthMgKg, biasMgKg: apparentMgKg - truthMgKg, rows};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {atomicModel};
  if (typeof document === 'undefined') return;
  const D = window.ChemDemo;
  D.init({
    title: 'When another line becomes apparent copper',
    intro: 'Compare a known simulated copper contribution with the concentration inferred from one selected wavelength. Then carry the result back to dry plant mass.',
    predict: 'Move the interfering line further away without changing its height. Will the apparent dry-mass result change? Can subtracting the method blank remove this sample-specific overlap?',
    controls: `<label for="line-distance">Distance from target line (nm)<input id="line-distance" type="range" min="0.002" max="0.045" step="0.001" value="0.012"><output id="distance-value"></output></label>
      <label for="interference-height">Interferer peak height (counts)<input id="interference-height" type="range" min="0" max="800" step="20" value="300"><output id="height-value"></output></label>
      <label for="digest-blank">Method-blank digest concentration (mg/L)<input id="digest-blank" type="range" min="0" max="0.1" step="0.005" value="0.01"><output id="blank-value"></output></label>
      <label for="line-mode">Selected measurement line<select id="line-mode"><option value="primary">Primary line with possible overlap</option><option value="isolated">Isolated comparison line: ideal model</option></select></label>
      <label><input id="subtract-blank" type="checkbox" checked> Subtract the undiluted method blank on the digest basis</label>`,
    body: `<div id="atomic-spectrum"></div><div id="atomic-readout" class="readout" aria-live="polite"></div><p id="atomic-interpretation"></p>
      <p><strong>Fixed preparation:</strong> 0.2500 g dry material → 50.00 mL digest → twofold further dilution. Calibration: counts = 8 + 1000 × measured copper (mg/L).</p>`,
    notes: 'All profiles are simulated Gaussian lines on an offset axis, not authentic spectra. The comparison line is idealised to have the same calibrated sensitivity and no interference. Native digest copper is fixed at 0.800 mg/L; the method blank contributes before the sample is diluted but is measured separately without further dilution. The simulation exposes its true contributions; an instrument does not automatically know them. Elemental detection does not identify the original copper species. No full uncertainty or recovery validation is included.'
  });
  let result;
  function render() {
    result = atomicModel({distance: D.byId('line-distance').value,
      interferenceHeight: D.byId('interference-height').value, blank: D.byId('digest-blank').value,
      isolated: D.byId('line-mode').value === 'isolated', subtractBlank: D.byId('subtract-blank').checked});
    D.byId('distance-value').textContent = `${D.fmt(result.distance, 3)} nm`;
    D.byId('height-value').textContent = `${D.fmt(result.interferenceHeight, 0)} counts`;
    D.byId('blank-value').textContent = `${D.fmt(result.blank, 3)} mg/L`;
    D.plot('atomic-spectrum', {xLabel: 'Wavelength offset from target (nm)', yLabel: 'Emission response (counts)',
      xDomain: [-0.05, 0.05], yDomain: [0, Math.max(...result.rows.map(r => r.total_counts)) * 1.12],
      series: [
        {label: 'Target + instrument background', color: D.colors.teal, points: result.rows.map(r => [r.offset_nm, r.target_plus_background_counts]), type: 'line'},
        {label: 'Interferent contribution: simulation truth', color: D.colors.orange, points: result.rows.map(r => [r.offset_nm, r.interfering_counts]), type: 'line', dash: true},
        {label: 'Combined response', color: D.colors.purple, points: result.rows.map(r => [r.offset_nm, r.total_counts]), type: 'line'}],
      vertical: [{x: 0, label: 'Selected wavelength', color: D.colors.gray}],
      description: 'Simulated target and interfering emission profiles. The combined response at zero offset is interpreted using the copper calibration.'});
    D.byId('atomic-readout').innerHTML = `<dl><dt>Introduced-solution apparent copper</dt><dd>${D.fmt(result.apparentMeasured, 4)} mg/L</dd>
      <dt>${result.subtractBlank ? 'Apparent blank-corrected digest' : 'Apparent digest without blank subtraction'}</dt><dd>${D.fmt(result.apparentDigest, 4)} mg/L</dd>
      <dt>Apparent original dry-mass result</dt><dd><strong>${D.fmt(result.apparentMgKg, 2)} mg Cu/kg</strong></dd>
      <dt>Known model truth</dt><dd>${D.fmt(result.truthMgKg, 2)} mg Cu/kg</dd></dl>`;
    const overlap = result.overlapAtTarget > 0.05;
    D.byId('atomic-interpretation').textContent = overlap
      ? `The simulated interferent adds ${D.fmt(result.overlapAtTarget, 2)} counts at the selected wavelength. The method blank cannot remove a sample-specific spectral contribution. The apparent bias is ${D.fmt(result.biasMgKg, 2)} mg/kg${result.subtractBlank ? '.' : '; omission of blank subtraction also contributes.'}`
      : result.subtractBlank
        ? 'The isolated or well-separated line returns the known model result. Undo the sample dilution first, then subtract the undiluted method blank on the digest concentration basis.'
        : 'Little spectral overlap remains, but omitting the method blank still biases the dry-mass result high. The blank did not undergo the sample’s further dilution.';
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('atomic-line-experiment.csv', result.rows.map(r => ({...r,
    distance_nm: result.distance, interference_peak_counts: result.interferenceHeight, method_blank_digest_mg_l: result.blank,
    isolated_line: result.isolated, subtract_blank: result.subtractBlank,
    diagnostic_apparent_original_mg_kg: result.apparentMgKg, simulation_truth_mg_kg: result.truthMgKg,
    estimate_status: 'Diagnostic simulation estimate; method validation not established'}))));
}());
