/* Gaussian component areas are conserved while spacing and band width change. */
(function () {
  'use strict';
  function gaussianArea(x, center, sigma, area) {
    return area / (sigma * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * ((x - center) / sigma) ** 2);
  }
  function separationModel(options = {}) {
    const spacing = options.spacing === undefined ? 1 : Number(options.spacing);
    const widthFactor = options.widthFactor === undefined ? 1 : Number(options.widthFactor);
    const areaB = options.areaB === undefined ? 150 : Number(options.areaB);
    if (!(spacing > 0) || !(widthFactor > 0) || !(areaB > 0)) throw new RangeError('Spacing, width and area must be positive.');
    const areaA = 100, t0 = 1, tA = 3, tB = tA + spacing;
    const widthA = 0.4 * widthFactor, widthB = 0.5 * widthFactor;
    const sigmaA = widthA / 4, sigmaB = widthB / 4;
    const resolution = 2 * spacing / (widthA + widthB);
    const kA = (tA - t0) / t0, kB = (tB - t0) / t0;
    const windowLow = tA - widthA / 2, windowHigh = tA + widthA / 2;
    const rows = [];
    for (let i = 0; i <= 1600; i += 1) {
      const time = i * 0.005;
      const a = gaussianArea(time, tA, sigmaA, areaA);
      const b = gaussianArea(time, tB, sigmaB, areaB);
      rows.push({time_min: time, component_a: a, component_b: b, combined_above_baseline: a + b});
    }
    // Integrate a fixed definition of A's window, including the B contribution.
    let aWindow = 0, bWindow = 0;
    const step = (windowHigh - windowLow) / 1000;
    for (let i = 0; i <= 1000; i += 1) {
      const x = windowLow + i * step, w = i === 0 || i === 1000 ? 0.5 : 1;
      aWindow += w * gaussianArea(x, tA, sigmaA, areaA) * step;
      bWindow += w * gaussianArea(x, tB, sigmaB, areaB) * step;
    }
    return {spacing, widthFactor, areaA, areaB, t0, tA, tB, widthA, widthB, kA, kB,
      alpha: kB / kA, resolution, windowLow, windowHigh, aWindow, bWindow,
      combinedWindow: aWindow + bWindow,
      contaminationPercent: 100 * bWindow / (aWindow + bWindow), rows};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {separationModel, gaussianArea};
  if (typeof document === 'undefined') return;
  const D = window.ChemDemo;
  D.init({title: 'Spacing, width and the meaning of a peak area',
    intro: 'Change a two-component chromatogram without changing component A’s amount. Look at resolution and what enters a fixed integration window around A.',
    predict: 'Double the band widths at fixed retention times. Predict the change in resolution, peak height and total component area. Then make B much larger: does the same resolution imply the same contamination?',
    controls: `<label for="peak-spacing">B minus A retention time (min)<input id="peak-spacing" type="range" min="0.15" max="2" step="0.05" value="1"><output id="spacing-value"></output></label>
      <label for="width-factor">Band-width multiplier<input id="width-factor" type="range" min="0.5" max="3" step="0.1" value="1"><output id="width-value"></output></label>
      <label for="area-b">Component B area (response·min)<input id="area-b" type="range" min="50" max="500" step="10" value="150"><output id="area-value"></output></label>
      <label><input id="show-components" type="checkbox" checked> Reveal component curves: simulation truth</label>`,
    body: `<div id="separation-chart"></div><div id="separation-readout" class="readout" aria-live="polite"></div><p id="separation-interpretation"></p>
      <p>The dashed bounds are A’s ±2σ window. This captures about 95.45% of isolated A, not all of its area. The combined area also includes any B inside that window.</p>`,
    notes: 'Both components are ideal Gaussian peaks, with baseline widths defined as 4σ. A area stays 100 response·min; B area is controlled separately. Signals are baseline-subtracted and noiseless. A is at 3 min, the unretained marker at 1 min. Window contamination is known only because the simulation exposes the individual components. Real separation adequacy depends on peak shape, relative amount, detector selectivity and required accuracy; no single resolution threshold establishes purity.'});
  let result;
  function render() {
    result = separationModel({spacing: D.byId('peak-spacing').value,
      widthFactor: D.byId('width-factor').value, areaB: D.byId('area-b').value});
    D.byId('spacing-value').textContent = `${D.fmt(result.spacing, 2)} min`;
    D.byId('width-value').textContent = `${D.fmt(result.widthFactor, 1)}×`;
    D.byId('area-value').textContent = `${D.fmt(result.areaB, 0)} response·min`;
    const series = [{label: 'Combined response', color: D.colors.purple,
      points: result.rows.map(r => [r.time_min, r.combined_above_baseline]), type: 'line'}];
    if (D.byId('show-components').checked) series.push(
      {label: 'A: area 100', color: D.colors.teal, points: result.rows.map(r => [r.time_min, r.component_a]), type: 'line', dash: true},
      {label: `B: area ${D.fmt(result.areaB, 0)}`, color: D.colors.orange, points: result.rows.map(r => [r.time_min, r.component_b]), type: 'line', dash: true});
    D.plot('separation-chart', {xLabel: 'Time (min)', yLabel: 'Baseline-subtracted response',
      xDomain: [0, 8], yDomain: [0, Math.max(...result.rows.map(r => r.combined_above_baseline)) * 1.12], series,
      vertical: [{x: result.windowLow, label: 'A window start', color: D.colors.gray},
        {x: result.windowHigh, label: 'A window end', color: D.colors.gray}],
      description: 'Simulated two-peak chromatogram. Spacing and widths change while the complete component areas remain fixed at their stated values.'});
    D.byId('separation-readout').innerHTML = `<dl><dt>Resolution, using baseline widths</dt><dd><strong>${D.fmt(result.resolution, 3)}</strong></dd>
      <dt>Retention factors and selectivity</dt><dd>kA = ${D.fmt(result.kA, 2)}; kB = ${D.fmt(result.kB, 2)}; α = ${D.fmt(result.alpha, 3)}</dd>
      <dt>Area in A’s selected window</dt><dd>${D.fmt(result.combinedWindow, 2)} response·min: ${D.fmt(result.aWindow, 2)} from A + ${D.fmt(result.bWindow, 2)} from B</dd>
      <dt>B fraction of that combined window</dt><dd>${D.fmt(result.contaminationPercent, 2)}%</dd></dl>`;
    D.byId('separation-interpretation').textContent = `A’s full area remains 100 response·min. Its width is ${D.fmt(result.widthA, 2)} min and B’s ${D.fmt(result.widthB, 2)} min. Broadening can lower peak height without reducing amount. A calculated resolution is evidence about this peak model, not proof that a measured peak is pure.`;
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('separation-experiment.csv', result.rows.map(r => ({...r,
    area_a: result.areaA, area_b: result.areaB, baseline_width_a_min: result.widthA,
    baseline_width_b_min: result.widthB, retention_a_min: result.tA, retention_b_min: result.tB,
    resolution: result.resolution, selected_window_low_min: result.windowLow,
    selected_window_high_min: result.windowHigh}))));
}());
