import {autoMount, htmlEl} from '../lib/ui';
import {layout, range, choose, action, plot, downloadCSV, colors, fmt, onResize} from '../lib/chemistry';
import {samplingModel, extractionModel} from './math';

function mount(host: HTMLElement): void {
  const ui = layout(host), chart = htmlEl('div', '', '', ui.plots);
  let experiment = 'sampling', counts = [3, 3, 3], seed = 47;
  let extraction = {distribution: 9, aqueousMl: 20, solventMl: 10, extractions: 2};
  const experimentInput = choose(ui.controls, 'experiment', 'Experiment', [
    {value: 'sampling', label: 'Representative sampling'}, {value: 'extraction', label: 'Successive extraction'}],
    experiment, value => {experiment = value; render();});
  const samplingPanel = htmlEl('div', 'ac-control-group', '', ui.controls);
  const countControls = ['Top grabs: 8 mg/kg', 'Middle grabs: 14 mg/kg', 'Bottom grabs: 25 mg/kg'].map((label, i) =>
    range(samplingPanel, ['top', 'middle', 'bottom'][i], label, 0, 20, 1, 3,
      value => {counts[i] = value; render();}, v => fmt(v, 0)));
  const run = range(samplingPanel, 'seed', 'Sampling run', 1, 100, 1, seed, value => {seed = value; render();});
  const extractionPanel = htmlEl('div', 'ac-control-group', '', ui.controls);
  const distribution = range(extractionPanel, 'distribution', 'Distribution ratio D', .5, 20, .5, 9,
    value => {extraction.distribution = value; render();});
  const aqueous = range(extractionPanel, 'aqueous', 'Aqueous volume (mL)', 5, 100, 5, 20,
    value => {extraction.aqueousMl = value; render();});
  const solvent = range(extractionPanel, 'solvent', 'Total solvent (mL)', 5, 50, 5, 10,
    value => {extraction.solventMl = value; render();});
  const extractions = range(extractionPanel, 'extractions', 'Equal fresh extractions', 1, 8, 1, 2,
    value => {extraction.extractions = value; render();});
  action(ui.controls, 'reset', 'Reset', () => {
    experiment = 'sampling'; experimentInput.value = experiment; counts = [3, 3, 3]; seed = 47;
    countControls.forEach(control => control.set(3)); run.set(47);
    extraction = {distribution: 9, aqueousMl: 20, solventMl: 10, extractions: 2};
    distribution.set(9); aqueous.set(20); solvent.set(10); extractions.set(2); render();
  });
  const exportButton = action(ui.controls, 'export', 'Export CSV', () => downloadCSV(
    `${experiment}-demo.csv`, experiment === 'sampling' ? samplingModel({counts, seed}).rows : extractionModel(extraction).rows));
  function render(): void {
    samplingPanel.hidden = experiment !== 'sampling'; extractionPanel.hidden = experiment !== 'extraction';
    if (experiment === 'sampling') {
      const m = samplingModel({counts, seed}); exportButton.disabled = !m.rows.length;
      plot(chart, {xLabel: 'Stratum: 1 top; 2 middle; 3 bottom', yLabel: 'Iron (mg/kg)', xDomain: [0, 4], yDomain: [5, 28],
        series: [{label: 'Collected grabs', color: colors.teal, type: 'points', points: m.points},
          {label: 'Known stratum means', color: colors.orange, type: 'points', points: m.means.map((v, i) => [i + 1, v] as const)}],
        horizontal: [{y: m.targetMean, label: 'Equal-mass bulk target', color: colors.gray}],
        description: 'Three equal-mass strata have different iron concentrations. Unequal sampling allocation changes the target of the naive average.'});
      const show = (value: number | null): string => value === null ? 'not estimable' : `${fmt(value)} mg/kg`;
      ui.readout.innerHTML = `${m.rows.length} whole grabs.<br>All-grab mean: <strong>${show(m.naiveMean)}</strong>.<br>Equal-stratum mean: <strong>${show(m.stratifiedMean)}</strong>.<br>Known bulk target: ${fmt(m.targetMean)} mg/kg.`;
      ui.note.textContent = m.stratifiedMean === null ? 'At least one stratum is unsampled. More top-only grabs cannot reveal the bottom. Missing evidence is not zero iron.' : 'Equal stratum masses justify equal mass weights, not automatically equal weight for every grab. Independent normal grab scatter SD is 0.25 mg/kg in this toy model.';
    } else {
      const m = extractionModel(extraction); exportButton.disabled = false;
      plot(chart, {xLabel: 'Number of equal fresh extractions', yLabel: 'Recovered analyte (%)', xDomain: [1, 8], yDomain: [0, 100],
        series: [{label: 'Fixed total solvent', color: colors.teal, points: m.rows.map(row => [row.number_of_extractions, row.recovered_fraction * 100] as const)},
          {label: 'Selected split', color: colors.orange, type: 'points', points: [[m.extractions, m.recovery * 100]]}],
        description: 'Fresh successive equilibrium extractions can recover more analyte than a single extraction with the same total solvent.'});
      ui.readout.innerHTML = `<strong>${fmt(m.recovery * 100, 2)}% recovered</strong>.<br>${m.extractions} portions of ${fmt(m.solventMl / m.extractions, 2)} mL; total solvent ${fmt(m.solventMl, 0)} mL.`;
      ui.note.textContent = 'Ideal immiscible equilibrium phases; constant D and aqueous volume; complete separation; no reaction or transfer loss. More detector readings cannot recover the analyte left behind.';
    }
  }
  render(); onResize(host, render);
}
autoMount('sampling-preparation', mount);
