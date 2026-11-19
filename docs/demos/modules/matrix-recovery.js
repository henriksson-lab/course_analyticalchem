(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  function calculate({ originalMgL = 5, sensitivityRatio = .75, recoveryFraction = 1, additiveSignal = 0, correctBackground = false } = {}) {
    const sampleMl = 10; const finalMl = 25; const fraction = sampleMl / finalMl;
    const sensitivity = .2 * sensitivityRatio;
    const nativeFinal = originalMgL * recoveryFraction * fraction;
    const points = [0, .5, 1, 1.5, 2].map(added => {
      const raw = sensitivity * (nativeFinal + added) + additiveSignal;
      return { added_mg_l_final: added, raw_signal: raw,
        fitted_signal: raw - (correctBackground ? additiveSignal : 0), sample_ml: sampleMl, final_ml: finalMl,
        original_truth_mg_l: originalMgL, recovered_fraction: recoveryFraction, sensitivity_ratio: sensitivityRatio,
        additive_signal: additiveSignal, independent_background_correction: correctBackground };
    });
    const fit = D.linearFit(points.map(r => r.added_mg_l_final), points.map(r => r.fitted_signal));
    const xIntercept = -fit.a / fit.b;
    const standardAdditionMgL = -xIntercept / fraction;
    const externalMgL = points[0].fitted_signal / .2 / fraction;
    const spikeRecoveryPercent = 100 * (points[2].fitted_signal - points[0].fitted_signal) / (.2 * 1);
    return { points, fit, xIntercept, standardAdditionMgL, externalMgL, spikeRecoveryPercent, nativeFinal,
      expectedRecoveredOriginal: originalMgL * recoveryFraction,
      saBiasMgL: standardAdditionMgL - originalMgL,
      saBiasPercent: originalMgL === 0 ? null : 100 * (standardAdditionMgL / originalMgL - 1) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculate };
  if (typeof document === 'undefined') return;
  D.init({ title: 'Matrix effects: what standard addition can and cannot repair',
    intro: 'Hold the final volume and sample fraction fixed. Independently change sensitivity, loss before spiking and an additive interference to see why a straight standard-addition line can still give the wrong original result.',
    predict: 'Can post-extraction spike recovery be 100% while the native result is biased? Can standard addition fix suppression but fail to fix an additive signal?',
    controls: `<label for="truth">Known original analyte (mg/L) <output id="truth-value"></output><input id="truth" type="range" min="0" max="10" step="0.1" value="5"></label>
      <label for="sensitivity">Matrix / external sensitivity ratio <output id="sensitivity-value"></output><input id="sensitivity" type="range" min="0.25" max="1.5" step="0.05" value="0.75"></label>
      <label for="recovery">Native recovery before additions (%) <output id="recovery-value"></output><input id="recovery" type="range" min="20" max="100" step="5" value="100"></label>
      <label for="background">Additive interfering signal <output id="background-value"></output><input id="background" type="range" min="0" max="0.3" step="0.01" value="0"></label>
      <label for="correction"><input id="correction" type="checkbox"> Apply independently established background correction (ideal)</label>`,
    body: '<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p>',
    notes: 'Noise-free conceptual model. Every flask contains 10.00 mL of the same post-extraction sample made to 25.00 mL; added concentration refers to that final volume. External sensitivity is 0.200 response units per mg/L. Added analyte enters after the simulated native-recovery loss. Native recovered analyte and added analyte have the same final response sensitivity. Additive interference is constant across flasks. The background-correction switch assumes a perfect independent determination of this interference; an ordinary reagent blank would not necessarily reveal a sample-specific additive signal. No uncertainty interval or general validation criterion is simulated. The known original concentration and loss are available only because this is a simulation.' });
  let latest;
  function render() {
    const originalMgL = +D.byId('truth').value; const sensitivityRatio = +D.byId('sensitivity').value;
    const recoveryFraction = +D.byId('recovery').value / 100; const additiveSignal = +D.byId('background').value;
    const correctBackground = D.byId('correction').checked;
    D.byId('truth-value').textContent = originalMgL.toFixed(2);
    D.byId('sensitivity-value').textContent = sensitivityRatio.toFixed(2);
    D.byId('recovery-value').textContent = (100 * recoveryFraction).toFixed(0);
    D.byId('background-value').textContent = additiveSignal.toFixed(3);
    latest = calculate({ originalMgL, sensitivityRatio, recoveryFraction, additiveSignal, correctBackground });
    const xmin = Math.min(-.5, latest.xIntercept * 1.15);
    const ymax = Math.max(.3, ...latest.points.map(r => r.raw_signal)) * 1.15;
    const line = [[xmin, latest.fit.a + latest.fit.b * xmin], [2.2, latest.fit.a + latest.fit.b * 2.2]];
    const series = [{ label: 'Applied standard-addition fit', color: D.colors.teal, type: 'line', points: line },
      { label: correctBackground ? 'Independently background-corrected flasks' : 'Measured flasks (uncorrected interference remains)', color: D.colors.teal, type: 'points',
        points: latest.points.map(r => [r.added_mg_l_final, r.fitted_signal]) }];
    if (correctBackground && additiveSignal > 0) series.push({ label: 'Raw flask signals before correction', color: D.colors.orange,
      type: 'points', points: latest.points.map(r => [r.added_mg_l_final, r.raw_signal]) });
    D.plot('chart', { xLabel: 'Added analyte in final flask (mg/L)', yLabel: 'Signal (arbitrary units)',
      xDomain: [xmin, 2.2], yDomain: [-.12 * ymax, ymax], series,
      horizontal: [{ y: 0, label: 'Zero signal', color: D.colors.gray }],
      vertical: [{ x: latest.xIntercept, label: 'Fitted x-intercept', color: D.colors.orange }],
      description: 'The negative intercept changes with native recovery and an uncorrected additive signal, even though every series fits an exact straight line.' });
    D.byId('readout').innerHTML = `<p><strong>Known original:</strong> ${originalMgL.toFixed(3)} mg/L · <strong>Recovered native concentration (original-sample basis):</strong> ${latest.expectedRecoveredOriginal.toFixed(3)} mg/L on original-sample basis</p>
      <p><strong>External-calibration estimate:</strong> ${latest.externalMgL.toFixed(3)} mg/L · <strong>Standard-addition estimate:</strong> ${latest.standardAdditionMgL.toFixed(3)} mg/L original</p>
      <p><strong>Fitted x-intercept:</strong> ${latest.xIntercept.toFixed(3)} mg/L final; multiply its magnitude by 25/10. <strong>Incremental post-extraction spike recovery:</strong> ${latest.spikeRecoveryPercent.toFixed(1)}%</p>
      <p><strong>Standard-addition error relative to known original:</strong> ${latest.saBiasMgL.toFixed(3)} mg/L${latest.saBiasPercent === null ? ' (relative error is undefined at zero original concentration)' : ' (' + latest.saBiasPercent.toFixed(1) + '%)'}</p>`;
    const explanation = [];
    if (sensitivityRatio !== 1) explanation.push('Standard addition compensates this multiplicative sensitivity change because native recovered and added analyte share the same slope.');
    if (recoveryFraction < 1) explanation.push('The additions happen after the native loss. They cannot restore analyte lost earlier, even if incremental spike recovery is 100%.');
    if (additiveSignal > 0 && !correctBackground) explanation.push('The constant interfering signal raises the intercept and is misread as native analyte. A perfect straight line does not diagnose that error.');
    if (additiveSignal > 0 && correctBackground) explanation.push('Here an ideal independent background determination removes the additive term. That evidence is an extra assumption, not something standard addition establishes itself.');
    if (!explanation.length) explanation.push('With complete native recovery, no interfering signal and matched sensitivity, both methods recover the known input in this ideal model. Real data would still need uncertainty and validation.');
    D.byId('interpretation').textContent = explanation.join(' ');
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('matrix-recovery-demo.csv', latest.points));
}());
