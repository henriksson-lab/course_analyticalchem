(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  function validateGrabCounts(rawValues) {
    const names = ['top', 'middle', 'bottom'];
    const invalid = rawValues.length !== 3 ? names : names.filter((_, i) => {
      const raw = rawValues[i];
      const value = typeof raw === 'number' ? raw : Number(raw);
      return raw === null || raw === undefined || String(raw).trim() === '' ||
        !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 20;
    });
    return invalid.length ? {valid: false, counts: null, invalid,
      message: `Enter a whole grab count from 0 to 20 for ${invalid.join(', ')}. No sampling result is calculated until those counts are valid.`} :
      {valid: true, counts: rawValues.map(Number), invalid: [], message: 'Whole-grab counts are used exactly as entered (0–20 per stratum).'};
  }
  function samplingModel({counts = [3, 3, 3], seed = 47} = {}) {
    if (counts.length !== 3 || counts.some(n => !Number.isInteger(n) || n < 0 || n > 20)) throw new RangeError('Three integer grab counts from zero to twenty are required.');
    const means = [8, 14, 25], names = ['top', 'middle', 'bottom'];
    const rng = D.rng(seed);
    // Generate every possible grab first so changing allocation preserves existing observations.
    const all = means.map(mu => Array.from({length: 20}, () => mu + 0.25 * D.normal(rng)));
    const rows = [];
    const selectedMeans = means.map((_, stratum) => {
      const values = all[stratum].slice(0, counts[stratum]);
      values.forEach((value, j) => rows.push({stratum: names[stratum], grab: j + 1, iron_mg_kg: value,
        population_stratum_mean_mg_kg: means[stratum], stratum_mass_fraction: 1 / 3}));
      return values.length ? D.mean(values) : null;
    });
    const observed = rows.map(r => r.iron_mg_kg);
    const naiveMean = observed.length ? D.mean(observed) : null;
    const expectedNaive = observed.length ? counts.reduce((s, n, i) => s + n * means[i], 0) / observed.length : null;
    const stratifiedMean = selectedMeans.every(v => v !== null) ? D.mean(selectedMeans) : null;
    return {counts, seed, means, names, selectedMeans, rows, naiveMean, expectedNaive, stratifiedMean,
      targetMean: D.mean(means), points: rows.map(r => [names.indexOf(r.stratum) + 1, r.iron_mg_kg])};
  }
  function extractionModel({distribution = 9, aqueousMl = 20, solventMl = 10, extractions = 2} = {}) {
    if (!([distribution, aqueousMl, solventMl, extractions].every(Number.isFinite) && distribution > 0 && aqueousMl > 0 && solventMl > 0 && Number.isInteger(extractions) && extractions >= 1)) throw new RangeError('Positive distribution and volumes, and a positive integer extraction count, are required.');
    const fraction = n => 1 - Math.pow(aqueousMl / (aqueousMl + distribution * solventMl / n), n);
    return {distribution, aqueousMl, solventMl, extractions, recovery: fraction(extractions),
      rows: Array.from({length: 8}, (_, j) => ({number_of_extractions: j + 1, aqueous_ml: aqueousMl,
        total_solvent_ml: solventMl, distribution_ratio: distribution, recovered_fraction: fraction(j + 1)}))};
  }
  function mount() {
    D.init({title: 'Which part of the sample reaches the result?',
      intro: 'Explore two different limitations: unrepresentative sampling and incomplete extraction. Both occur before a precise instrument can help.',
      predict: 'Would collecting many top-only grabs approach the bulk mean? In the second experiment, would dividing a fixed solvent volume into several fresh extractions change recovery?',
      controls: `<label for="experiment">Experiment<select id="experiment"><option value="sampling">Sampling a heterogeneous material</option><option value="extraction">Successive equilibrium extractions</option></select></label>
        <fieldset id="sampling-controls"><legend>Three strata of equal mass</legend><p id="count-validation" class="help" aria-live="polite"></p>
          <label for="top">Top grabs: population mean 8 mg/kg<input id="top" type="number" required aria-describedby="count-validation" min="0" max="20" step="1" value="3"></label>
          <label for="middle">Middle grabs: population mean 14 mg/kg<input id="middle" type="number" required aria-describedby="count-validation" min="0" max="20" step="1" value="3"></label>
          <label for="bottom">Bottom grabs: population mean 25 mg/kg<input id="bottom" type="number" required aria-describedby="count-validation" min="0" max="20" step="1" value="3"></label>
          <label for="seed">Sampling run<input id="seed" type="range" min="1" max="100" step="1" value="47"><output id="seed-value" for="seed"></output></label>
        </fieldset>
        <fieldset id="extraction-controls" hidden><legend>Same total solvent, fresh portions</legend>
          <label for="distribution">Distribution ratio D = c extracting / c aqueous<input id="distribution" type="range" min="0.5" max="20" step="0.5" value="9"><output id="distribution-value" for="distribution"></output></label>
          <label for="aqueous">Aqueous volume (mL)<input id="aqueous" type="range" min="5" max="100" step="5" value="20"><output id="aqueous-value" for="aqueous"></output></label>
          <label for="solvent">Total extracting solvent (mL)<input id="solvent" type="range" min="5" max="50" step="5" value="10"><output id="solvent-value" for="solvent"></output></label>
          <label for="extractions">Number of equal fresh extractions<input id="extractions" type="range" min="1" max="8" step="1" value="2"><output id="extractions-value" for="extractions"></output></label>
        </fieldset>`,
      body: `<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>`,
      notes: 'Sampling model: equal-mass strata with means 8, 14 and 25 mg Fe/kg; independent normal grab scatter SD 0.25 mg/kg is supplied, not estimated method uncertainty. The overall target is the mean across these equal masses. Extraction model: D is constant, aqueous volume does not change, immiscible phases equilibrate, each organic portion is fresh and removed completely, and no reaction or loss occurs. Export data and reproduce the relevant mean or recovery formula in R.'});
    let rows = [];
    function render() {
      const mode = D.byId('experiment').value;
      D.byId('sampling-controls').hidden = mode !== 'sampling';
      D.byId('extraction-controls').hidden = mode !== 'extraction';
      D.byId('sampling-controls').disabled = mode !== 'sampling';
      D.byId('extraction-controls').disabled = mode !== 'extraction';
      if (mode === 'sampling') {
        const names = ['top', 'middle', 'bottom'];
        const validation = validateGrabCounts(names.map(id => D.byId(id).value));
        D.byId('count-validation').textContent = validation.message;
        names.forEach(id => {
          const invalid = validation.invalid.includes(id);
          D.byId(id).setAttribute('aria-invalid', String(invalid));
          D.byId(id).setCustomValidity(invalid ? 'Enter a whole grab count from 0 to 20.' : '');
        });
        if (!validation.valid) {
          rows = [];
          D.byId('export').disabled = true;
          D.byId('chart').innerHTML = '<p>Enter valid whole-grab counts to draw a sampling experiment.</p>';
          D.byId('readout').textContent = 'No sampling estimate: one or more grab counts are incomplete or invalid.';
          D.byId('interpretation').textContent = 'Counts describe actual grabs. Fractional, missing, negative or over-limit entries are not silently rounded or replaced with a different experiment.';
          return;
        }
        const counts = validation.counts;
        const m = samplingModel({counts, seed: +D.byId('seed').value}); rows = m.rows;
        D.byId('seed-value').textContent = D.byId('seed').value;
        D.plot('chart', {xLabel: 'Stratum: 1 top, 2 middle, 3 bottom', yLabel: 'Iron (mg/kg)', xDomain: [0, 4], yDomain: [5, 28],
          series: [{label: 'Collected grabs', color: D.colors.teal, points: m.points, type: 'points'},
            {label: 'Population stratum means', color: D.colors.orange, points: m.means.map((v, i) => [i + 1, v]), type: 'points'}],
          horizontal: [{y: m.targetMean, label: 'Equal-mass bulk target 15.67', color: D.colors.gray}],
          description: 'Top, middle and bottom differ far more than repeated grabs within a stratum. The target bulk mean weights the three stratum masses equally.'});
        const fmt = v => v === null ? 'not estimable from this selection' : `${D.fmt(v, 3)} mg/kg`;
        D.byId('readout').innerHTML = `<p><strong>Naive average of all ${rows.length} grabs: ${fmt(m.naiveMean)}</strong></p><p>Equal-mass stratified estimate: ${fmt(m.stratifiedMean)}. Known simulation target: ${D.fmt(m.targetMean, 3)} mg/kg.</p>`;
        D.byId('interpretation').textContent = !rows.length ? 'No material has been collected. Zero grabs is missing evidence, not zero iron.' : m.stratifiedMean === null ? `At least one stratum is unsampled. The selected-grab average tends toward ${D.fmt(m.expectedNaive, 3)} mg/kg under repeated runs, not necessarily the bulk target. Repeating top-only sampling cannot supply information about the bottom.` : `With all strata represented, averaging their stratum means uses the supplied equal mass weights. An unequal number of grabs makes the unweighted all-grab average target a different allocation. Adding grabs reduces random scatter but does not correct an inappropriate weighting rule.`;
      } else {
        const m = extractionModel({distribution: +D.byId('distribution').value, aqueousMl: +D.byId('aqueous').value, solventMl: +D.byId('solvent').value, extractions: +D.byId('extractions').value}); rows = m.rows;
        for (const [id, value, unit] of [['distribution', m.distribution, ''], ['aqueous', m.aqueousMl, ' mL'], ['solvent', m.solventMl, ' mL'], ['extractions', m.extractions, '']]) D.byId(`${id}-value`).textContent = D.fmt(value, id === 'distribution' ? 1 : 0) + unit;
        D.plot('chart', {xLabel: 'Number of equal fresh extractions', yLabel: 'Recovered analyte (%)', xDomain: [1, 8], yDomain: [0, 100],
          series: [{label: 'Fixed total solvent volume', color: D.colors.teal, points: m.rows.map(r => [r.number_of_extractions, 100 * r.recovered_fraction]), type: 'line'},
            {label: 'Selected split', color: D.colors.orange, points: [[m.extractions, 100 * m.recovery]], type: 'points'}],
          description: 'At fixed total solvent, fresh successive equilibrium extractions can recover more than one extraction. The distribution ratio and phase volumes control the fraction.'});
        D.byId('readout').innerHTML = `<p><strong>${D.fmt(100 * m.recovery, 2)}% recovered</strong>; ${D.fmt(100 * (1 - m.recovery), 2)}% remains in the aqueous phase.</p><p>${m.extractions} fresh portions of ${D.fmt(m.solventMl / m.extractions, 2)} mL; total solvent remains ${D.fmt(m.solventMl, 0)} mL.</p>`;
        D.byId('interpretation').textContent = 'The analyte partitions again after each fresh solvent portion is added. The fraction remaining is [Va / (Va + D × Vtotal / n)]ⁿ. More detector readings of the recovered extract cannot recover the analyte left behind. This ideal model does not establish real native-analyte extraction recovery.';
      }
      D.byId('export').disabled = rows.length === 0;
    }
    D.bind(render);
    D.byId('export').addEventListener('click', () => D.csv(`${D.byId('experiment').value}-demo.csv`, rows));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {samplingModel, extractionModel, validateGrabCounts};
  if (typeof document !== 'undefined') mount();
})();
