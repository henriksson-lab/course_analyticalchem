import {autoMount, htmlEl} from '../lib/ui';
import {layout, range, toggle, action, plot, downloadCSV, colors, fmt, onResize} from '../lib/chemistry';
import {uncertaintyModel} from './math';

function mount(host: HTMLElement): void {
  const ui = layout(host), readings = htmlEl('div', '', '', ui.plots), uncertainty = htmlEl('div', '', '', ui.plots);
  let state = {n: 10, readingSd: .2, sharedU: .1, bias: .3, corrected: false, seed: 17};
  const count = range(ui.controls, 'n', 'Readings of one prepared solution', 1, 100, 1, 10,
    v => {state.n = v; render();});
  const readingSd = range(ui.controls, 'reading-sd', 'Independent reading SD (mg/L)', 0, 1, .01, .2,
    v => {state.readingSd = v; render();});
  const shared = range(ui.controls, 'shared-u', 'Shared standard uncertainty (mg/L)', 0, .5, .01, .1,
    v => {state.sharedU = v; render();});
  const bias = range(ui.controls, 'bias', 'Known fixed bias (mg/L)', -.5, .5, .01, .3,
    v => {state.bias = v; render();});
  const correction = toggle(ui.controls, 'correct', 'Apply the supplied exact bias correction', false,
    v => {state.corrected = v; render();});
  const run = range(ui.controls, 'run', 'New preparation / run', 1, 100, 1, 17,
    v => {state.seed = v; render();});
  action(ui.controls, 'reset', 'Reset', () => {
    state = {n: 10, readingSd: .2, sharedU: .1, bias: .3, corrected: false, seed: 17};
    count.set(10); readingSd.set(.2); shared.set(.1); bias.set(.3); correction.checked = false; run.set(17); render();
  });
  action(ui.controls, 'export', 'Export CSV', () => downloadCSV('repeat-readings-and-uncertainty.csv', uncertaintyModel(state).rows));
  function render(): void {
    const m = uncertaintyModel(state);
    plot(readings, {xLabel: 'Reading number in one preparation', yLabel: 'Concentration reading (mg/L)',
      xDomain: [0, Math.max(5, m.n + 1)], yDomain: [Math.min(8, ...m.values) - .1, Math.max(12, ...m.values) + .1],
      series: [{label: m.corrected ? 'Bias-corrected readings' : 'Raw readings', color: colors.teal, type: 'points', points: m.values.map((v, i) => [i + 1, v] as const)}],
      horizontal: [{y: 10, label: 'Known reference', color: colors.gray}, {y: m.mean, label: 'Current mean', color: colors.orange}],
      description: 'Repeated readings retain a shared preparation offset as n grows. A known bias changes only when the supplied correction is applied.'});
    plot(uncertainty, {xLabel: 'Number of readings of the same preparation', yLabel: 'Standard uncertainty of mean (mg/L)',
      xDomain: [1, 100], yDomain: [0, Math.max(.05, Math.hypot(m.readingSd, m.sharedU) * 1.08)],
      series: [{label: 'Reading contribution', color: colors.teal, dash: true, points: m.curves.map(r => [r.n, r.reading_u_mg_l] as const)},
        {label: 'Reading + shared component', color: colors.orange, points: m.curves.map(r => [r.n, r.combined_u_mg_l] as const)},
        {label: 'Selected repeat count', color: colors.blue, type: 'points', points: [[m.n, m.combinedU]]}],
      horizontal: [{y: m.sharedU, label: 'Shared-component floor', color: colors.gray}],
      description: 'Independent reading noise decreases with square root of n; the common uncertainty component does not.'});
    ui.readout.innerHTML = `Mean: <strong>${fmt(m.mean)} mg/L</strong>.<br>Model standard uncertainty of mean: <strong>${fmt(m.combinedU)} mg/L</strong>.<br>Observed reading SD: ${m.observedSd === null ? 'requires two readings' : fmt(m.observedSd) + ' mg/L'}.`;
    ui.note.textContent = `${m.corrected ? 'The supplied exact correction removes the known bias; a real correction can have uncertainty.' : 'The known uncorrected bias remains a problem; smaller error bars do not correct it.'} Shared normal offsets vary between preparations but stay fixed within a run. The plotted u is not a 95% interval or full method uncertainty.`;
  }
  render(); onResize(host, render);
}
autoMount('error-uncertainty', mount);
