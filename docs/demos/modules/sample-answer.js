(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  function concentrationModel({concentration = 20, aliquotMl = 250, dilutionFactor = 2} = {}) {
    if (!([concentration, aliquotMl, dilutionFactor].every(Number.isFinite) && concentration >= 0 && aliquotMl > 0 && dilutionFactor >= 1)) throw new RangeError('Use nonnegative concentration, positive aliquot volume, and dilution factor at least one.');
    const massMg = concentration * aliquotMl / 1000;
    const finalMl = aliquotMl * dilutionFactor;
    return {concentration, aliquotMl, dilutionFactor, massMg, finalMl,
      finalConcentration: concentration / dilutionFactor,
      curve: Array.from({length: 91}, (_, i) => {const factor = 1 + i / 10; return [factor, concentration / factor];}),
      rows: [
        {stage: 'original_aliquot', concentration_mg_l: concentration, volume_ml: aliquotMl, analyte_mg: massMg},
        {stage: 'final_dilution', concentration_mg_l: concentration / dilutionFactor, volume_ml: finalMl, analyte_mg: massMg}
      ]};
  }
  function mount() {
    D.init({title: 'What changes when a solution is diluted?',
      intro: 'Take an aliquot from a homogeneous chloride solution, then add analyte-free solvent. Follow both concentration and analyte amount.',
      predict: 'Before moving a control: if the aliquot volume doubles but the dilution factor stays the same, which changes—final concentration, analyte amount, or both?',
      controls: `<label for="concentration">Original chloride concentration (mg/L)<input id="concentration" type="range" min="0" max="100" step="1" value="20"><output id="concentration-value" for="concentration"></output></label>
        <label for="aliquot">Aliquot volume (mL)<input id="aliquot" type="range" min="10" max="500" step="10" value="250"><output id="aliquot-value" for="aliquot"></output></label>
        <label for="dilution">Dilution factor: final volume / aliquot volume<input id="dilution" type="range" min="1" max="10" step="0.1" value="2"><output id="dilution-value" for="dilution"></output></label>
        <label for="quantity">What quantity will you report?<select id="quantity"><option value="concentration">Concentration in final solution</option><option value="amount">Amount in the aliquot</option><option value="original">Original-solution concentration</option></select></label>`,
      body: `<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>
        <details><summary>Try a contrasting experiment</summary><p>First change only aliquot volume. Then restore it and change only dilution factor. Explain why the two actions affect different quantities. Set original concentration to zero: a larger portion still contains zero chloride in this ideal model.</p></details>`,
      notes: 'Ideal mass balance: no chloride is lost, created, adsorbed or reacted; the solvent adds none, and the solution is homogeneous. The simulation defines concentration and volumes exactly and does not supply a measurement uncertainty. Export both stages, import the CSV in R, and verify analyte_mg = concentration_mg_l × volume_ml / 1000.'});
    let current;
    function render() {
      current = concentrationModel({concentration: +D.byId('concentration').value, aliquotMl: +D.byId('aliquot').value, dilutionFactor: +D.byId('dilution').value});
      D.byId('concentration-value').textContent = `${D.fmt(current.concentration, 1)} mg/L`;
      D.byId('aliquot-value').textContent = `${D.fmt(current.aliquotMl, 0)} mL`;
      D.byId('dilution-value').textContent = `${D.fmt(current.dilutionFactor, 1)} fold`;
      D.plot('chart', {xLabel: 'Dilution factor (final volume / aliquot volume)', yLabel: 'Final chloride concentration (mg/L)', xDomain: [1, 10], yDomain: [0, Math.max(1, current.concentration * 1.05)],
        series: [{label: 'Conserved-analyte dilution curve', color: D.colors.teal, points: current.curve, type: 'line'},
          {label: 'Selected preparation', color: D.colors.orange, points: [[current.dilutionFactor, current.finalConcentration]], type: 'points'}],
        description: 'Concentration falls inversely with dilution factor. Changing aliquot volume at fixed factor leaves this curve and selected concentration unchanged.'});
      const selected = D.byId('quantity').value;
      const answer = selected === 'amount' ? `${D.fmt(current.massMg, 3)} mg chloride in this aliquot` : selected === 'original' ? `${D.fmt(current.concentration, 2)} mg chloride/L original solution` : `${D.fmt(current.finalConcentration, 2)} mg chloride/L final solution`;
      D.byId('readout').innerHTML = `<p><strong>${answer}</strong></p><p>Aliquot: ${D.fmt(current.aliquotMl, 0)} mL → final total: ${D.fmt(current.finalMl, 0)} mL. Analyte amount: <strong>${D.fmt(current.massMg, 3)} mg at both stages</strong>.</p>`;
      D.byId('interpretation').textContent = `Taking more original solution changes the collected amount at fixed concentration. Adding solvent changes concentration while preserving that amount. To recover the original concentration, multiply ${D.fmt(current.finalConcentration, 2)} mg/L by ${D.fmt(current.dilutionFactor, 1)}. Name the stage and unit in your report.`;
    }
    D.bind(render);
    D.byId('export').addEventListener('click', () => D.csv('concentration-and-amount.csv', current.rows));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {concentrationModel};
  if (typeof document !== 'undefined') mount();
})();
