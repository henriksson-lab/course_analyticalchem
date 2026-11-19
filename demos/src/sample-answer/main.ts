import {autoMount, htmlEl} from '../lib/ui';
import {layout, range, choose, action, plot, downloadCSV, colors, fmt, onResize} from '../lib/chemistry';
import {concentrationModel} from './math';

function mount(host: HTMLElement): void {
  const ui = layout(host), chart = htmlEl('div', '', '', ui.plots);
  let state = {concentration: 20, aliquotMl: 250, dilutionFactor: 2}, quantity = 'concentration';
  const concentration = range(ui.controls, 'concentration', 'Original chloride (mg/L)', 0, 100, 1, 20,
    v => {state.concentration = v; render();});
  const aliquot = range(ui.controls, 'aliquot', 'Aliquot volume (mL)', 10, 500, 10, 250,
    v => {state.aliquotMl = v; render();});
  const dilution = range(ui.controls, 'dilution', 'Dilution factor (final / aliquot volume)', 1, 10, .1, 2,
    v => {state.dilutionFactor = v; render();});
  const selected = choose(ui.controls, 'quantity', 'Quantity to report', [
    {value: 'concentration', label: 'Final concentration'}, {value: 'amount', label: 'Aliquot analyte amount'},
    {value: 'original', label: 'Original concentration'}], quantity, v => {quantity = v; render();});
  action(ui.controls, 'reset', 'Reset', () => {
    state = {concentration: 20, aliquotMl: 250, dilutionFactor: 2}; quantity = 'concentration';
    concentration.set(20); aliquot.set(250); dilution.set(2); selected.value = quantity; render();
  });
  action(ui.controls, 'export', 'Export CSV', () => downloadCSV('concentration-and-amount.csv', concentrationModel(state).rows));
  function render(): void {
    const m = concentrationModel(state);
    plot(chart, {xLabel: 'Dilution factor (final volume / aliquot)', yLabel: 'Final chloride (mg/L)',
      xDomain: [1, 10], yDomain: [0, Math.max(1, m.concentration * 1.05)],
      series: [{label: 'Ideal conserved-analyte curve', color: colors.teal, points: m.curve},
        {label: 'Selected preparation', color: colors.orange, type: 'points', points: [[m.dilutionFactor, m.finalConcentration]]}],
      description: 'Concentration falls with dilution factor; changing aliquot volume at fixed factor changes amount but leaves concentration unchanged.'});
    const answer = quantity === 'amount' ? `${fmt(m.massMg)} mg chloride in this aliquot` :
      quantity === 'original' ? `${fmt(m.concentration, 2)} mg/L original` : `${fmt(m.finalConcentration, 2)} mg/L final`;
    ui.readout.innerHTML = `<strong>${answer}</strong><br>Aliquot ${fmt(m.aliquotMl, 0)} mL → ${fmt(m.finalMl, 0)} mL total.<br>Analyte amount at both stages: <strong>${fmt(m.massMg)} mg</strong>.`;
    ui.note.textContent = 'Homogeneous solution; analyte-free solvent; no loss or reaction. These exact model inputs do not supply a measurement uncertainty. Name the material stage and unit in every claim.';
  }
  render(); onResize(host, render);
}
autoMount('sample-answer', mount);
