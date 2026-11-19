(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  function uncertaintyModel({n = 10, readingSd = 0.2, sharedU = 0.1, bias = 0.3, corrected = false, seed = 17} = {}) {
    if (!([n, readingSd, sharedU, bias].every(Number.isFinite) && Number.isInteger(n) && n >= 1 && n <= 100 && readingSd >= 0 && sharedU >= 0 && Number.isFinite(bias))) throw new RangeError('Invalid repeat count or uncertainty input.');
    const reference = 10, rng = D.rng(seed), sharedOffset = sharedU * D.normal(rng);
    // A single common offset is retained as more readings of this preparation are added.
    const readingErrors = Array.from({length: 100}, () => readingSd * D.normal(rng));
    const raw = readingErrors.slice(0, n).map(e => reference + bias + sharedOffset + e);
    const correction = corrected ? bias : 0;
    const values = raw.map(v => v - correction);
    const combinedU = Math.sqrt(readingSd ** 2 / n + sharedU ** 2);
    const curves = Array.from({length: 100}, (_, i) => ({n: i + 1,
      reading_u_mg_l: readingSd / Math.sqrt(i + 1),
      combined_u_mg_l: Math.sqrt(readingSd ** 2 / (i + 1) + sharedU ** 2)}));
    const rows = values.map((value, i) => ({reading_id: i + 1, reported_reading_mg_l: value,
      raw_reading_mg_l: raw[i], reference_mg_l: reference, known_bias_mg_l: bias,
      applied_correction_mg_l: correction, reading_sd_model_mg_l: readingSd,
      shared_standard_uncertainty_mg_l: sharedU, n_readings: n,
      mean_standard_uncertainty_model_mg_l: combinedU, simulation_run: seed}));
    return {n, readingSd, sharedU, bias, corrected, reference, sharedOffset, raw, values,
      rawMean: D.mean(raw), mean: D.mean(values), observedSd: n > 1 ? D.sd(values) : null,
      combinedU, readingU: readingSd / Math.sqrt(n), curves, rows};
  }
  function mount() {
    D.init({title: 'What does repeating a measurement improve?',
      intro: 'Read one prepared reference solution repeatedly. Separate independent reading noise, a known bias, and a common uncertain offset shared by all readings.',
      predict: 'If you increase the number of readings from 1 to 100, which effects shrink? Predict the uncertainty floor before changing the controls.',
      controls: `<label for="n">Readings of this prepared solution<input id="n" type="range" min="1" max="100" step="1" value="10"><output id="n-value" for="n"></output></label>
        <label for="reading-sd">Independent reading SD (mg/L)<input id="reading-sd" type="range" min="0" max="1" step="0.01" value="0.2"><output id="reading-sd-value" for="reading-sd"></output></label>
        <label for="shared-u">Shared standard uncertainty (mg/L)<input id="shared-u" type="range" min="0" max="0.5" step="0.01" value="0.1"><output id="shared-u-value" for="shared-u"></output></label>
        <label for="bias">Known systematic bias (mg/L)<input id="bias" type="range" min="-0.5" max="0.5" step="0.01" value="0.3"><output id="bias-value" for="bias"></output></label>
        <label for="correct"><input id="correct" type="checkbox"> Apply the supplied known-bias correction</label>
        <label for="run">New preparation/run<input id="run" type="range" min="1" max="100" step="1" value="17"><output id="run-value" for="run"></output></label>`,
      body: `<div id="readings-chart"></div><div id="readout" aria-live="polite"></div><div id="uncertainty-chart"></div><p id="interpretation"></p>
        <details><summary>Separate the graph from the physical claim</summary><p>The dotted reference is known only because this is a reference-solution simulation. In an actual unknown, the true value and realised common offset are not available to subtract. A small observed SD does not reveal the shared component.</p></details>`,
      notes: 'Illustrative normal-error model: every preparation has one random common offset with supplied SD sharedU, while readings have independent supplied SD readingSd. The known bias is a deliberately specified fixed effect; its correction is assumed exact in this demonstration. A real correction can need its own uncertainty. Combined standard uncertainty is sqrt(readingSd²/n + sharedU²), not a 95% interval or a full method uncertainty. Changing n keeps existing readings and the same common offset; changing the run produces a new common offset. Export the readings and compare sd() with the supplied uncertainty of their mean in R.'});
    let current;
    function render() {
      current = uncertaintyModel({n: +D.byId('n').value, readingSd: +D.byId('reading-sd').value, sharedU: +D.byId('shared-u').value,
        bias: +D.byId('bias').value, corrected: D.byId('correct').checked, seed: +D.byId('run').value});
      for (const [id, value, digits] of [['n', current.n, 0], ['reading-sd', current.readingSd, 2], ['shared-u', current.sharedU, 2], ['bias', current.bias, 2], ['run', +D.byId('run').value, 0]]) D.byId(`${id}-value`).textContent = D.fmt(value, digits);
      const minY = Math.min(8, ...current.values) - 0.1, maxY = Math.max(12, ...current.values) + 0.1;
      D.plot('readings-chart', {xLabel: 'Reading number within one preparation', yLabel: 'Concentration reading (mg/L)', xDomain: [0, Math.max(5, current.n + 1)], yDomain: [minY, maxY],
        series: [{label: current.corrected ? 'Bias-corrected readings' : 'Raw readings', color: D.colors.teal, points: current.values.map((v, i) => [i + 1, v]), type: 'points'}],
        horizontal: [{y: 10, label: 'Reference 10.00 mg/L', color: D.colors.gray}, {y: current.mean, label: 'Current mean', color: D.colors.orange}],
        description: 'Repeated readings fluctuate around a preparation-specific mean. The common offset persists as more readings are added; the known bias is removed only when correction is selected.'});
      D.plot('uncertainty-chart', {xLabel: 'Number of readings of this preparation', yLabel: 'Standard uncertainty of mean (mg/L)', xDomain: [1, 100], yDomain: [0, Math.max(0.05, Math.sqrt(current.readingSd ** 2 + current.sharedU ** 2) * 1.08)],
        series: [{label: 'Reading contribution only', color: D.colors.teal, points: current.curves.map(r => [r.n, r.reading_u_mg_l]), type: 'line', dash: true},
          {label: 'Reading plus shared component', color: D.colors.orange, points: current.curves.map(r => [r.n, r.combined_u_mg_l]), type: 'line'},
          {label: 'Selected repeat count', color: D.colors.blue, points: [[current.n, current.combinedU]], type: 'points'}],
        horizontal: [{y: current.sharedU, label: 'Shared-component floor', color: D.colors.gray}],
        description: 'Independent reading noise decreases as one over square root of n, while a common uncertainty component does not. A known uncorrected bias is not included as if it were random uncertainty.'});
      D.byId('readout').innerHTML = `<p><strong>Mean ${D.fmt(current.mean, 3)} mg/L; model standard uncertainty ${D.fmt(current.combinedU, 3)} mg/L</strong>.</p><p>Observed reading SD: ${current.observedSd === null ? 'requires at least two readings' : `${D.fmt(current.observedSd, 3)} mg/L`}. Reading contribution to mean: ${D.fmt(current.readingU, 3)} mg/L. Known-bias correction ${current.corrected ? 'applied' : 'not applied'}.</p>`;
      D.byId('interpretation').textContent = `${current.corrected ? 'The supplied exact bias correction removes the fixed effect, but it does not remove the common uncertain offset.' : 'The known uncorrected bias remains a problem to investigate or correct; a smaller error bar does not correct it.'} More readings suppress independent noise. Their SD cannot estimate a common preparation effect. The uncertainty curve therefore does not include the known bias as if it were random noise, and its value is not a 95% half-width.`;
    }
    D.bind(render);
    D.byId('export').addEventListener('click', () => D.csv('repeat-readings-and-uncertainty.csv', current.rows));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {uncertaintyModel};
  if (typeof document !== 'undefined') mount();
})();
