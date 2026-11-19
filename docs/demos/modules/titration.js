(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  const KW = 1e-14;
  function phAt(volumeMl, acidType = 'strong', baseMolL = 0.1, pKa = 4.76) {
    const initialMol = 0.1 * 0.025;
    const totalL = 0.025 + volumeMl / 1000;
    const sodium = baseMolL * volumeMl / 1000 / totalL;
    if (acidType === 'strong') {
      const excess = initialMol / totalL - sodium;
      const root = Math.hypot(excess, 2 * Math.sqrt(KW));
      const h = excess >= 0 ? (excess + root) / 2 : 2 * KW / (root - excess);
      return -Math.log10(h);
    }
    const totalAcid = initialMol / totalL;
    const ka = 10 ** (-pKa);
    let low = -16; let high = 0;
    for (let i = 0; i < 90; i += 1) {
      const mid = (low + high) / 2;
      const h = 10 ** mid;
      const balance = h + sodium - KW / h - totalAcid * ka / (ka + h);
      if (balance > 0) high = mid; else low = mid;
    }
    return -(low + high) / 2;
  }
  function calculate({ acidType = 'strong', baseMolL = 0.1, pKa = 4.76, addedMl = 25, endpointPh = 7 } = {}) {
    const equivalenceMl = 2.5 / baseMolL;
    const maxMl = Math.max(2 * equivalenceMl, addedMl);
    const curve = Array.from({ length: 401 }, (_, i) => {
      const volumeMl = i * maxMl / 400;
      return { volume_ml: volumeMl, ph: phAt(volumeMl, acidType, baseMolL, pKa), acid_type: acidType,
        acid_initial_mol_l: 0.1, acid_aliquot_ml: 25, base_mol_l: baseMolL, pka: acidType === 'weak' ? pKa : '' };
    });
    let endpointMl = null;
    if (endpointPh > phAt(0, acidType, baseMolL, pKa) && endpointPh < phAt(maxMl, acidType, baseMolL, pKa)) {
      let low = 0; let high = maxMl;
      for (let i = 0; i < 70; i += 1) {
        const mid = (low + high) / 2;
        if (phAt(mid, acidType, baseMolL, pKa) < endpointPh) low = mid; else high = mid;
      }
      endpointMl = (low + high) / 2;
    }
    const estimatedAcid = endpointMl === null ? null : baseMolL * endpointMl / 25;
    return { curve, equivalenceMl, maxMl, currentPh: phAt(addedMl, acidType, baseMolL, pKa),
      equivalencePh: phAt(equivalenceMl, acidType, baseMolL, pKa), endpointMl, estimatedAcid,
      biasPercent: estimatedAcid === null ? null : 100 * (estimatedAcid / 0.1 - 1) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { phAt, calculate };
  if (typeof document === 'undefined') return;
  D.init({ title: 'Titration: chemistry sets the curve',
    intro: 'Keep the acid amount fixed. Change acid strength, titrant concentration and the pH used to trigger an endpoint. Watch which changes move equivalence and which only change its pH.',
    predict: 'Will a weaker acid require less base? Will choosing pH 7 always locate equivalence? Predict both before changing the acid type.',
    controls: `<label for="acid">Acid model<select id="acid"><option value="strong">Strong monoprotic acid</option><option value="weak">Weak monoprotic acid</option></select></label>
      <label for="pka">Weak-acid pKa <output id="pka-value"></output><input id="pka" type="range" min="3" max="7" step="0.01" value="4.76"></label>
      <label for="base">Base concentration (mol/L) <output id="base-value"></output><input id="base" type="range" min="0.05" max="0.2" step="0.005" value="0.1"></label>
      <label for="added">Base added (mL) <output id="added-value"></output><input id="added" type="range" min="0" max="100" step="0.05" value="25"></label>
      <label for="trigger">Chosen endpoint trigger (pH) <output id="trigger-value"></output><input id="trigger" type="range" min="4" max="10" step="0.1" value="7"></label>`,
    body: '<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>',
    notes: 'Simulated ideal monoprotic acid/base equilibrium at 25 °C, Kw = 10⁻¹⁴, with ideal activities and quantitative reaction. Initial acid is 25.00 mL of 0.1000 mol/L. The weak-acid curve solves charge balance including water; it is not a Henderson–Hasselbalch approximation near equivalence. A selected pH trigger is an idealised endpoint rule, not an indicator transition range or a validated endpoint algorithm. No electrode noise, junction effects, mixing or volume uncertainty is simulated.' });
  let latest;
  function render() {
    const acidType = D.byId('acid').value; const baseMolL = +D.byId('base').value;
    const pKa = +D.byId('pka').value; const addedMl = +D.byId('added').value;
    const endpointPh = +D.byId('trigger').value;
    D.byId('pka').disabled = acidType === 'strong';
    D.byId('pka-value').textContent = pKa.toFixed(2);
    D.byId('base-value').textContent = baseMolL.toFixed(3);
    D.byId('added-value').textContent = addedMl.toFixed(2);
    D.byId('trigger-value').textContent = endpointPh.toFixed(1);
    latest = calculate({ acidType, baseMolL, pKa, addedMl, endpointPh });
    const strong = latest.curve.map(r => [r.volume_ml, phAt(r.volume_ml, 'strong', baseMolL)]);
    const series = [{ label: acidType === 'strong' ? 'Strong acid' : 'Selected weak acid', color: D.colors.teal,
      points: latest.curve.map(r => [r.volume_ml, r.ph]), type: 'line' }];
    if (acidType === 'weak') series.push({ label: 'Same amount of strong acid', color: D.colors.gray, points: strong, type: 'line', dash: true });
    series.push({ label: 'Current addition', color: D.colors.orange, points: [[addedMl, latest.currentPh]], type: 'points' });
    const vertical = [{ x: latest.equivalenceMl, label: 'Equivalence', color: D.colors.teal }];
    if (latest.endpointMl !== null) vertical.push({ x: latest.endpointMl, label: 'Chosen endpoint', color: D.colors.orange });
    D.plot('chart', { xLabel: 'Base added (mL)', yLabel: 'pH', xDomain: [0, Math.max(latest.maxMl, addedMl)], yDomain: [0, 14], series,
      vertical, horizontal: [{ y: endpointPh, label: 'Endpoint trigger', color: D.colors.orange }],
      description: 'The pH curve and marked endpoint distinguish stoichiometric equivalence from a chosen pH trigger.' });
    D.byId('readout').innerHTML = `<p><strong>Current pH:</strong> ${latest.currentPh.toFixed(3)} · <strong>Equivalence:</strong> ${latest.equivalenceMl.toFixed(3)} mL at pH ${latest.equivalencePh.toFixed(3)}</p>` +
      (latest.endpointMl === null ? '<p><strong>Endpoint unavailable:</strong> the selected trigger does not lie between the initial and final pH of this displayed titration.</p>' :
        `<p><strong>Chosen endpoint:</strong> ${latest.endpointMl.toFixed(3)} mL → inferred acid ${latest.estimatedAcid.toFixed(5)} mol/L; endpoint bias ${latest.biasPercent.toFixed(2)}% relative to the fixed 0.1000 mol/L.</p>`);
    D.byId('interpretation').textContent = acidType === 'strong' ?
      'Changing titrant concentration changes equivalence volume because the same 2.500 mmol acid requires a different volume of base. A strong-acid equivalence pH of 7 is conditional on this ideal model and temperature.' :
      'The weak acid contains the same 2.500 mmol as the strong acid, so its equivalence volume is unchanged at the same titrant concentration. Its conjugate base changes equivalence pH. The chosen endpoint can therefore estimate a different amount.';
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('titration-demo.csv', latest.curve));
}());
