import {autoMount, htmlEl} from '../lib/ui';
import {layout, range, choose, action, plot, downloadCSV, colors, fmt, onResize} from '../lib/chemistry';
import {calibrationModel} from './math';

function mount(host: HTMLElement): void {
  const ui = layout(host), calibration = htmlEl('div', '', '', ui.plots), residuals = htmlEl('div', '', '', ui.plots);
  let state = {maxStandard: 4, curvature: 0, noise: .003, originalConcentration: 5, dilutionFactor: 2, driftPercent: 0, review: 'pending', seed: 31};
  const maxStandard = range(ui.controls, 'max-standard', 'Largest standard (mg/L final)', 1, 8, .5, 4,
    v => {state.maxStandard = v; render();});
  const saturation = range(ui.controls, 'curvature', 'Saturation coefficient q (L/mg)', 0, .015, .001, 0,
    v => {state.curvature = v; render();}, v => fmt(v, 3));
  const noise = range(ui.controls, 'noise', 'Independent response-noise SD (response units)', 0, .03, .001, .003,
    v => {state.noise = v; render();}, v => fmt(v, 3));
  const original = range(ui.controls, 'original', 'Known simulation original (mg/L)', 0, 20, .5, 5,
    v => {state.originalConcentration = v; render();});
  const dilution = range(ui.controls, 'dilution', 'New measurement dilution factor', 1, 10, .5, 2,
    v => {state.dilutionFactor = v; render();});
  const drift = range(ui.controls, 'drift', 'Later sensitivity change (%)', -20, 20, 1, 0,
    v => {state.driftPercent = v; render();});
  const review = choose(ui.controls, 'review', 'Your residual review', [
    {value: 'pending', label: 'Not assessed'}, {value: 'accepted', label: 'Accept this straight-line approximation'},
    {value: 'rejected', label: 'Systematic pattern needs investigation'}], 'pending', v => {state.review = v; render();});
  const run = range(ui.controls, 'run', 'Simulation run', 1, 100, 1, 31, v => {state.seed = v; render();});
  action(ui.controls, 'reset', 'Reset', () => {
    state = {maxStandard: 4, curvature: 0, noise: .003, originalConcentration: 5, dilutionFactor: 2, driftPercent: 0, review: 'pending', seed: 31};
    maxStandard.set(4); saturation.set(0); noise.set(.003); original.set(5); dilution.set(2); drift.set(0); review.value = 'pending'; run.set(31); render();
  });
  action(ui.controls, 'export', 'Export CSV', () => downloadCSV('calibration-range-and-qc.csv', calibrationModel(state).rows));
  function render(): void {
    const m = calibrationModel(state), fit = m.fit, extent = Math.max(m.maxStandard, m.finalTrue, 1), allY = [...m.ys, ...m.readings, 0];
    plot(calibration, {xLabel: 'Known concentration in final solution (mg/L)', yLabel: 'Response (arbitrary units)',
      xDomain: [0, extent * 1.05], yDomain: [Math.min(0, ...allY) - .02, Math.max(.1, ...allY) * 1.08],
      series: [{label: 'Prepared standards', color: colors.teal, type: 'points', points: m.xs.map((x, i) => [x, m.ys[i]] as const)},
        {label: 'Fitted line within standard range', color: colors.blue, points: [[0, fit.a], [m.maxStandard, fit.a + fit.b * m.maxStandard]]},
        {label: 'Later unknown at known true x', color: colors.orange, type: 'points', points: [[m.finalTrue, m.meanResponse]]}],
      description: 'Prepared standards fit a line only over their range. The unknown is placed at its true concentration because this is a simulation.'});
    const residualMax = Math.max(.005, ...fit.residuals.map(Math.abs)) * 1.15;
    plot(residuals, {xLabel: 'Prepared standard concentration (mg/L)', yLabel: 'Observed minus fitted response',
      xDomain: [0, m.maxStandard], yDomain: [-residualMax, residualMax],
      series: [{label: 'Standard residuals', color: colors.teal, type: 'points', points: m.xs.map((x, i) => [x, fit.residuals[i]] as const)}],
      horizontal: [{y: 0, label: 'Zero residual', color: colors.gray}],
      description: 'Systematic residuals can reveal model curvature despite a high R squared.'});
    ui.readout.innerHTML = `<strong>${m.reportable ? 'Conditional candidate under your model review' : 'Withhold the sample result'}</strong>.<br>a=${fmt(fit.a, 4)}, b=${fmt(fit.b, 4)}, R²=${fmt(fit.r2, 5)}.<br>Candidate original: ${fmt(m.candidateOriginal)} mg/L.<br>Range ${m.inRange ? 'passes' : 'fails'}; independent QC ${fmt(m.qcRecovery, 1)}% (${m.qcPass ? 'passes' : 'fails'}).${m.reasons.length ? '<br>' + m.reasons.join('; ') + '.' : ''}`;
    ui.note.textContent = `${m.curvature ? 'Monotonic saturation is deliberately active: accepting a line does not prove it valid.' : 'The underlying response is linear; residuals reflect the supplied reading noise.'} Toy y=0.010+0.200c/(1+qc), known standards, three preparations per level; later sample and check can share drift. QC 95–105% is only the exercise rule. Changing dilution creates a new simulated measurement. No complete uncertainty budget is supplied.`;
  }
  render(); onResize(host, render);
}
autoMount('calibration-qc', mount);
